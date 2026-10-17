// lib/tokens.ts — HMAC-signed bearer tokens for /api/signal
//
// Minted by the PAID /api/templates/[slug] call and embedded in the generated Dawn .py.
// Format: base64url(payload) + "." + base64url(hmac)
// payload = { m: marketSlug, exp: unixSeconds, t: templateSlug }
//
// Why not x402 in the Dawn process: the Dawn SDK has no signer for third-party 402s.
// PayBox pays once; the strategy only ever does an authenticated GET.

import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.SIGNAL_SECRET
if (!SECRET) throw new Error('SIGNAL_SECRET is not set')

export type SignalClaims = { m: string; exp: number; t: string }

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')
const sign = (p: string) => createHmac('sha256', SECRET).update(p).digest()

export function mintSignalToken(market: string, template: string, ttlSeconds = 24 * 3600): string {
  const claims: SignalClaims = { m: market, exp: Math.floor(Date.now() / 1000) + ttlSeconds, t: template }
  const payload = b64u(JSON.stringify(claims))
  return `${payload}.${b64u(sign(payload))}`
}

export function verifySignalToken(token: string | null, market: string): SignalClaims | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  let claims: SignalClaims
  try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) } catch { return null }
  if (claims.exp < Math.floor(Date.now() / 1000)) return null
  if (claims.m !== market) return null
  return claims
}

export function bearerFrom(req: Request): string | null {
  const h = req.headers.get('authorization') ?? ''
  return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : null
}
