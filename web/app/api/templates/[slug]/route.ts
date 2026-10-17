// POST /api/templates/[slug] — PAID ($0.10 via x402, enforced by proxy.ts)
// Body: { market: "<slug|id>", outcome?: 0, ...template params }
// PayBox `use_service` sends the body only on the paid re-fetch (never on the 402 probe) — fine.
//
// Returns JSON (so it reads well in chat) with the Python inline, plus a filename.
// If the agent passes ?format=py, returns text/x-python so a human can `curl -o` it.

import { NextResponse } from 'next/server'
import { getMarket } from '@/lib/polymarket'
import { mintSignalToken } from '@/lib/tokens'
import { TEMPLATES, generate, type TemplateSlug } from '@/lib/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.echomarkets.xyz'

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const meta = TEMPLATES.find(t => t.slug === slug)
  if (!meta) return NextResponse.json({ error: `unknown template: ${slug}` }, { status: 404 })

  let body: Record<string, string | number | undefined> = {}
  try { body = await req.json() } catch { /* empty body allowed; market may come from query */ }
  const url = new URL(req.url)
  const marketRef = String(body.market ?? url.searchParams.get('market') ?? '')
  if (!marketRef) return NextResponse.json({ error: 'market is required' }, { status: 400 })
  const outcomeIndex = Number(body.outcome ?? url.searchParams.get('outcome') ?? 0)

  try {
    const market = await getMarket(marketRef)
    if (!market.tokenIds[outcomeIndex]) return NextResponse.json({ error: 'outcome index out of range', outcomes: market.outcomes }, { status: 400 })

    const signalToken = mintSignalToken(market.slug, slug)
    const py = generate({ slug: slug as TemplateSlug, market, outcomeIndex, signalToken, baseUrl: BASE_URL, params: body })
    const filename = `${slug}-${market.slug.slice(0, 32)}.py`

    if (url.searchParams.get('format') === 'py') {
      return new Response(py, { headers: { 'content-type': 'text/x-python; charset=utf-8', 'content-disposition': `attachment; filename="${filename}"` } })
    }
    return NextResponse.json({
      service: 'echomarkets',
      type: 'template',
      template: meta.slug,
      market: { slug: market.slug, question: market.question, outcome: market.outcomes[outcomeIndex] },
      filename,
      signal_token_expires_in_hours: 24,
      run: `dawn strategy launch ${filename} --name ${slug}-demo --budget 20`,
      run_live: `dawn strategy launch ${filename} --name ${slug}-live --budget 20 --live`,
      budget_note: '--budget is required by Dawn: a server-enforced cap on cumulative buys for the run (paper or live)',
      python: py,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 })
  }
}

// GET on a slug is free metadata (middleware matches POST + GET, so GET will also be paywalled unless you
// restrict the middleware matcher by method — x402-next matches paths, not methods. Simplest: keep GET here
// returning a pointer, and accept that it costs $0.10 too, or drop GET entirely.)
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const meta = TEMPLATES.find(t => t.slug === slug)
  return meta ? NextResponse.json(meta) : NextResponse.json({ error: 'unknown template' }, { status: 404 })
}
