// GET /api/signal/[market]?outcome=0 — FREE route, bearer-token gated
// Called from inside the generated Dawn strategy with plain urllib.
// Not in proxy.ts on purpose: no x402 happens in the Dawn process.

import { NextResponse } from 'next/server'
import { buildSignal } from '@/lib/signal'
import { bearerFrom, verifySignalToken } from '@/lib/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: Promise<{ market: string }> }) {
  const { market } = await ctx.params
  const claims = verifySignalToken(bearerFrom(req), market)
  if (!claims) {
    return NextResponse.json(
      { error: 'missing or expired signal token', how: 'buy a template at POST /api/templates/{slug} (x402, $0.10) to receive a 24h token' },
      { status: 401, headers: { 'www-authenticate': 'Bearer realm="echomarkets"' } },
    )
  }
  const outcome = Number(new URL(req.url).searchParams.get('outcome') ?? 0)
  try {
    return NextResponse.json(await buildSignal(market, outcome))
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 })
  }
}
