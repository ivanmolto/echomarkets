// GET /api/brief/[market] — PAID ($0.02 via x402, enforced by proxy.ts)
// Called by PayBox `use_service`. Returns JSON the agent can read aloud.

import { NextResponse } from 'next/server'
import { buildBrief } from '@/lib/signal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ market: string }> }) {
  const { market } = await ctx.params
  try {
    const brief = await buildBrief(market)
    return NextResponse.json({
      service: 'echomarkets',
      type: 'brief',
      ...brief,
      next: {
        templates: '/api/templates',
        buy_template: `/api/templates/signal-follow  (POST, body: {"market":"${brief.market.slug}","outcome":0})`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 })
  }
}
