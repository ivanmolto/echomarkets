import { NextResponse, type NextRequest } from 'next/server'
import { facilitator as cdpFacilitator } from '@coinbase/x402'
import { useFacilitator } from 'x402/verify'
import { exact } from 'x402/schemes'
import { findMatchingPaymentRequirements, processPriceToAtomicAmount, safeBase64Encode, toJsonSafe } from 'x402/shared'
import type { FacilitatorConfig, Network, PaymentPayload, PaymentRequirements, Resource } from 'x402/types'
import { feePayerFromPaymentPayload } from '@/lib/solana-feepayer'

// Prices are locked to the plugin's proposeX402 maxAmount (atomic USDC, 6 decimals):
//   brief    = 20000  = $0.02
//   template = 100000 = $0.10
// Change both or neither (see docs/plan.md).
const ROUTES: Array<{ method: string; prefix: string; price: string; description: string }> = [
  { method: 'GET', prefix: '/api/brief/', price: '$0.02', description: 'EchoMarkets brief: odds, liquidity, movement and resolution for one Polymarket market' },
  { method: 'POST', prefix: '/api/templates/', price: '$0.10', description: 'EchoMarkets Dawn strategy template with 24h signal access' },
]

const payTo = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as string
const network = (process.env.NEXT_PUBLIC_NETWORK ?? 'solana-devnet') as Network
const X402_VERSION = 1

// Mainnet settles through the CDP facilitator, which signs each verify/settle call with
// CDP_API_KEY_ID / CDP_API_KEY_SECRET (read from env by @coinbase/x402).
// Devnet uses the public x402.org facilitator (testnet-only, no keys).
const facilitatorConfig: FacilitatorConfig = network === 'solana'
  ? cdpFacilitator
  : { url: (process.env.NEXT_PUBLIC_FACILITATOR_URL ?? 'https://x402.org/facilitator') as Resource }

const { verify, settle, supported } = useFacilitator(facilitatorConfig)

// This replaces x402-next's paymentMiddleware for one reason: that middleware asks the
// facilitator's /supported endpoint for a fee payer on *every* request, and the Coinbase
// facilitator rotates between several keys. The 402 the payer builds against and the
// verify() call seconds later then disagree, and the facilitator rejects the payment as
// invalid_payload. Here the unpaid 402 still advertises whatever /supported returns, but a
// paid request is verified and settled against the fee payer inside the payer's own
// transaction, so both sides always agree. The facilitator still refuses any fee payer it
// does not control, so this accepts nothing it would not have accepted before.
async function advertisedFeePayer(): Promise<string> {
  const pinned = process.env.X402_SOLANA_FEE_PAYER
  if (pinned) return pinned
  const kinds = await supported()
  for (const kind of kinds.kinds) {
    if (kind.network === network && kind.scheme === 'exact') {
      const fp = (kind.extra as { feePayer?: string } | undefined)?.feePayer
      if (fp) return fp
    }
  }
  throw new Error(`The facilitator did not provide a fee payer for network: ${network}.`)
}

function requirementsFor(route: typeof ROUTES[number], resource: string, feePayer: string): PaymentRequirements {
  const atomic = processPriceToAtomicAmount(route.price, network)
  if ('error' in atomic) throw new Error(atomic.error)
  return {
    scheme: 'exact',
    network,
    maxAmountRequired: atomic.maxAmountRequired,
    resource: resource as Resource,
    description: route.description,
    mimeType: 'application/json',
    payTo,
    maxTimeoutSeconds: 60,
    asset: atomic.asset.address,
    outputSchema: { input: { type: 'http', method: route.method, discoverable: true } },
    extra: { feePayer },
  }
}

function paymentRequired(error: string, accepts: PaymentRequirements[], extra: Record<string, unknown> = {}) {
  return new NextResponse(JSON.stringify({ x402Version: X402_VERSION, error, accepts: toJsonSafe(accepts), ...extra }), {
    status: 402,
    headers: { 'content-type': 'application/json' },
  })
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const method = req.method.toUpperCase()
  const route = ROUTES.find(r => r.method === method && pathname.startsWith(r.prefix) && pathname.length > r.prefix.length)
  if (!route) return NextResponse.next()

  const resource = `${req.nextUrl.protocol}//${req.nextUrl.host}${pathname}`
  const header = req.headers.get('X-PAYMENT')

  if (!header) {
    const accepts = [requirementsFor(route, resource, await advertisedFeePayer())]
    return paymentRequired('X-PAYMENT header is required', accepts)
  }

  let payment: PaymentPayload
  try {
    payment = exact.evm.decodePayment(header) // scheme-agnostic base64 JSON decode
    payment.x402Version = X402_VERSION
  } catch (e) {
    const accepts = [requirementsFor(route, resource, await advertisedFeePayer())]
    return paymentRequired(e instanceof Error ? e.message : 'Invalid payment', accepts)
  }

  // Verify against the fee payer the payer actually used; fall back to /supported if unreadable.
  const feePayer = feePayerFromPaymentPayload(payment) ?? await advertisedFeePayer()
  const accepts = [requirementsFor(route, resource, feePayer)]
  const selected = findMatchingPaymentRequirements(accepts, payment)
  if (!selected) return paymentRequired('Unable to find matching payment requirements', accepts)

  try {
    const result = await verify(payment, selected)
    if (!result.isValid) return paymentRequired(result.invalidReason ?? 'Payment verification failed', accepts, { payer: result.payer })
  } catch (e) {
    return paymentRequired(e instanceof Error ? e.message : 'Payment verification failed', accepts)
  }

  const response = NextResponse.next()
  // Settle before handing the request on: a failed settlement must not serve the paid body.
  try {
    const settlement = await settle(payment, selected)
    if (!settlement.success) return paymentRequired(settlement.errorReason ?? 'Failed to settle payment', accepts)
    response.headers.set('X-PAYMENT-RESPONSE', safeBase64Encode(JSON.stringify({
      success: true, transaction: settlement.transaction, network: settlement.network, payer: settlement.payer,
    })))
  } catch (e) {
    return paymentRequired(e instanceof Error ? e.message : 'Failed to settle payment', accepts)
  }
  return response
}

// Only the paid routes. The landing, /api/templates (index) and /api/signal stay free.
export const config = {
  matcher: ['/api/brief/:market', '/api/templates/:slug'],
}
