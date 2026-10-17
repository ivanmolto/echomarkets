import { Address } from 'viem'
import { paymentMiddleware, Resource, Network } from 'x402-next'
import { facilitator as cdpFacilitator } from '@coinbase/x402'
import { NextRequest } from 'next/server'

// Prices are locked to the plugin's proposeX402 maxAmount (atomic USDC, 6 decimals):
//   brief    = 20000  = $0.02
//   template = 100000 = $0.10
// Change both or neither (see docs/plan.md).
const BRIEF_PRICE = '$0.02'
const TEMPLATE_PRICE = '$0.10'

const address = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as Address
const network = (process.env.NEXT_PUBLIC_NETWORK ?? 'solana-devnet') as Network

// Mainnet settles through the CDP facilitator, which signs each verify/settle call with
// CDP_API_KEY_ID / CDP_API_KEY_SECRET (read from env by @coinbase/x402).
// Devnet uses the public x402.org facilitator (testnet-only, no keys).
const facilitator = network === 'solana'
  ? cdpFacilitator
  : { url: (process.env.NEXT_PUBLIC_FACILITATOR_URL ?? 'https://x402.org/facilitator') as Resource }

const x402PaymentMiddleware = paymentMiddleware(
  address,
  {
    'GET /api/brief/*': {
      price: BRIEF_PRICE,
      network,
      config: {
        description: 'EchoMarkets brief: odds, liquidity, movement and resolution for one Polymarket market',
        mimeType: 'application/json',
      },
    },
    'POST /api/templates/*': {
      price: TEMPLATE_PRICE,
      network,
      config: {
        description: 'EchoMarkets Dawn strategy template with 24h signal access',
        mimeType: 'application/json',
      },
    },
  },
  facilitator,
)

export const proxy = (req: NextRequest) => {
  const delegate = x402PaymentMiddleware as unknown as (
    request: NextRequest,
  ) => ReturnType<typeof x402PaymentMiddleware>
  return delegate(req)
}

// Only the paid routes. The landing, /api/templates (index) and /api/signal stay free.
export const config = {
  matcher: ['/api/brief/:market', '/api/templates/:slug'],
}
