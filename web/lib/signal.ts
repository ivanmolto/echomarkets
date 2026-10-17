// lib/signal.ts — brief + signal computation over Polymarket data
//
// Deliberately simple and honest: a liquidity/spread/price heuristic, not a model.
// The point of the hackathon is the payment + template loop; swap the heuristic later.

import { getBook, getMarket, type Market, type Book } from './polymarket'

export type Brief = {
  market: { id: string; slug: string; question: string; endDate: string | null; active: boolean; closed: boolean }
  outcomes: { name: string; tokenId: string; price: number; book: Book }[]
  liquidityUsd: number
  volume24hUsd: number
  resolution: string // first ~600 chars of the description, which is where Polymarket states the criteria
  notes: string[]
  asOf: string
}

export type Signal = {
  market: string
  outcome: string
  tokenId: string
  direction: 'buy' | 'hold' | 'avoid'
  confidence: number // 0..1
  price: number
  reasoning: string[]
  asOf: string
}

export async function buildBrief(slugOrId: string): Promise<Brief> {
  const m = await getMarket(slugOrId)
  const books = await Promise.all(m.tokenIds.map(getBook))
  const notes: string[] = []
  if (m.closed) notes.push('Market is closed.')
  if (m.liquidity < 5_000) notes.push('Thin liquidity (< $5k): expect slippage on anything above a few dollars.')
  const widest = Math.max(...books.map(b => b.spread ?? 0))
  if (widest > 0.05) notes.push(`Wide spread on at least one outcome (${(widest * 100).toFixed(1)}¢).`)
  if (m.endDate) {
    const hrs = (new Date(m.endDate).getTime() - Date.now()) / 36e5
    if (hrs > 0 && hrs < 48) notes.push(`Resolves in ~${Math.round(hrs)}h — sleep through irrelevant hours.`)
  }
  return {
    market: { id: m.id, slug: m.slug, question: m.question, endDate: m.endDate, active: m.active, closed: m.closed },
    outcomes: m.outcomes.map((name, i) => ({ name, tokenId: m.tokenIds[i], price: m.outcomePrices[i], book: books[i] })),
    liquidityUsd: m.liquidity,
    volume24hUsd: m.volume24h,
    resolution: m.description.slice(0, 600),
    notes,
    asOf: new Date().toISOString(),
  }
}

/**
 * Signal for a single outcome. Heuristic:
 *  - avoid if closed, spread > 5¢, or liquidity < $2k
 *  - buy if price is in the 0.15–0.85 band (room to move), spread tight, and the book is bid-heavy
 *  - otherwise hold
 * Confidence is a bounded score from those three factors.
 */
export async function buildSignal(slugOrId: string, outcomeIndex = 0): Promise<Signal> {
  const m: Market = await getMarket(slugOrId)
  const tokenId = m.tokenIds[outcomeIndex]
  if (!tokenId) throw new Error('outcome index out of range')
  const book = await getBook(tokenId)
  const price = book.mid ?? m.outcomePrices[outcomeIndex]
  const reasoning: string[] = []
  let direction: Signal['direction'] = 'hold'
  let score = 0.5

  if (m.closed) { direction = 'avoid'; reasoning.push('market closed'); score = 0 }
  else {
    if ((book.spread ?? 1) > 0.05) { direction = 'avoid'; reasoning.push('spread > 5¢'); score -= 0.3 }
    else { reasoning.push(`tight spread ${((book.spread ?? 0) * 100).toFixed(1)}¢`); score += 0.15 }

    if (m.liquidity < 2_000) { direction = 'avoid'; reasoning.push('liquidity < $2k'); score -= 0.3 }
    else { reasoning.push(`liquidity $${Math.round(m.liquidity).toLocaleString()}`); score += 0.1 }

    const bidHeavy = book.bidDepthUsd > book.askDepthUsd * 1.2
    if (bidHeavy) { reasoning.push('order book bid-heavy'); score += 0.15 }
    else reasoning.push('order book balanced or ask-heavy')

    const inBand = price >= 0.15 && price <= 0.85
    if (!inBand) reasoning.push(`price ${price.toFixed(2)} near the edge — limited upside`)
    else score += 0.1

    if (direction !== 'avoid' && inBand && bidHeavy && (book.spread ?? 1) <= 0.03) direction = 'buy'
  }

  return {
    market: m.slug,
    outcome: m.outcomes[outcomeIndex],
    tokenId,
    direction,
    confidence: Math.max(0, Math.min(1, Number(score.toFixed(2)))),
    price,
    reasoning,
    asOf: new Date().toISOString(),
  }
}
