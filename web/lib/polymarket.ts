// lib/polymarket.ts — thin client over Polymarket's public APIs (no keys)
//   Gamma: market metadata   https://gamma-api.polymarket.com
//   CLOB:  prices / books    https://clob.polymarket.com

const GAMMA = 'https://gamma-api.polymarket.com'
const CLOB = 'https://clob.polymarket.com'

export type Market = {
  id: string
  slug: string
  question: string
  description: string
  endDate: string | null
  liquidity: number
  volume24h: number
  outcomes: string[]
  outcomePrices: number[]
  tokenIds: string[] // CLOB token ids, same order as outcomes
  active: boolean
  closed: boolean
}

export type Book = {
  bestBid: number | null
  bestAsk: number | null
  mid: number | null
  spread: number | null
  bidDepthUsd: number
  askDepthUsd: number
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: 'application/json' }, next: { revalidate: 15 } })
  if (!r.ok) throw new Error(`${url} -> ${r.status}`)
  return r.json() as Promise<T>
}

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    try { return (JSON.parse(v) as unknown[]).map(String) } catch { return [] }
  }
  return []
}

/** Accepts a Polymarket market slug (from the URL) or a numeric market id. */
export async function getMarket(slugOrId: string): Promise<Market> {
  const q = /^\d+$/.test(slugOrId) ? `id=${slugOrId}` : `slug=${encodeURIComponent(slugOrId)}`
  const rows = await getJson<Record<string, unknown>[]>(`${GAMMA}/markets?${q}`)
  const m = rows[0]
  if (!m) throw new Error(`market not found: ${slugOrId}`)
  return {
    id: String(m.id),
    slug: String(m.slug),
    question: String(m.question ?? ''),
    description: String(m.description ?? ''),
    endDate: (m.endDate as string) ?? null,
    liquidity: Number(m.liquidityNum ?? m.liquidity ?? 0),
    volume24h: Number(m.volume24hr ?? 0),
    outcomes: parseJsonArray(m.outcomes),
    outcomePrices: parseJsonArray(m.outcomePrices).map(Number),
    tokenIds: parseJsonArray(m.clobTokenIds),
    active: Boolean(m.active),
    closed: Boolean(m.closed),
  }
}

export async function getBook(tokenId: string): Promise<Book> {
  type Lvl = { price: string; size: string }
  const b = await getJson<{ bids: Lvl[]; asks: Lvl[] }>(`${CLOB}/book?token_id=${tokenId}`)
  const bids = (b.bids ?? []).map(l => ({ p: Number(l.price), s: Number(l.size) })).sort((a, c) => c.p - a.p)
  const asks = (b.asks ?? []).map(l => ({ p: Number(l.price), s: Number(l.size) })).sort((a, c) => a.p - c.p)
  const bestBid = bids[0]?.p ?? null
  const bestAsk = asks[0]?.p ?? null
  const mid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null
  return {
    bestBid,
    bestAsk,
    mid,
    spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null,
    bidDepthUsd: bids.reduce((acc, l) => acc + l.p * l.s, 0),
    askDepthUsd: asks.reduce((acc, l) => acc + l.p * l.s, 0),
  }
}

/** Search markets by text (Gamma). Used by the templates index to resolve a human query to a slug. */
export async function searchMarkets(query: string, limit = 5): Promise<Pick<Market, 'id' | 'slug' | 'question'>[]> {
  const rows = await getJson<Record<string, unknown>[]>(
    `${GAMMA}/markets?active=true&closed=false&limit=${limit}&_q=${encodeURIComponent(query)}`,
  )
  return rows.map(m => ({ id: String(m.id), slug: String(m.slug), question: String(m.question ?? '') }))
}
