// GET /api/templates — FREE index. Lets an agent (or a human) see what's for sale and how to buy it.
// Must stay OUT of proxy.ts.

import { NextResponse } from 'next/server'
import { TEMPLATES } from '@/lib/templates'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    service: 'echomarkets',
    templates: TEMPLATES.map(t => ({
      ...t,
      buy: {
        method: 'POST',
        url: `/api/templates/${t.slug}`,
        payment: `x402 · $${t.priceUsd} USDC`,
        body: { market: '<polymarket slug or id>', outcome: 0, ...Object.fromEntries(Object.keys(t.params).filter(k => k !== 'market' && k !== 'outcome').map(k => [k, '<optional>'])) },
      },
    })),
    run: 'dawn strategy launch <file>.py --name <run> [--budget 20] [--live]',
    note: 'Paper mode is the default and needs no funds. Each template embeds a 24h signal token for GET /api/signal/{market}.',
  })
}
