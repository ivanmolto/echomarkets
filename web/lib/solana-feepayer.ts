// lib/solana-feepayer.ts — read the fee payer out of a serialized Solana transaction.
//
// Why: the Coinbase x402 facilitator rotates between several fee-payer keys on every
// /supported call. x402-next asks /supported again when verifying a payment, so the fee
// payer it hands to verify() often differs from the one the client built the transaction
// against, and the facilitator rejects the payment as invalid_payload. Pinning verification
// to the fee payer that is actually inside the paid transaction removes the race.
//
// No dependencies: wire format is compact-u16 signature count, 64-byte signatures, then the
// message (optional 0x80|version byte, 3-byte header, compact-u16 account count, 32-byte
// static account keys). The fee payer is always the first static account key.

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

export function base58Encode(bytes: Uint8Array): string {
  const ZERO = BigInt(0), EIGHT = BigInt(8), FIFTY_EIGHT = BigInt(58)
  let n = ZERO
  for (const b of bytes) n = (n << EIGHT) | BigInt(b)
  let out = ''
  while (n > ZERO) {
    out = B58[Number(n % FIFTY_EIGHT)] + out
    n /= FIFTY_EIGHT
  }
  for (const b of bytes) {
    if (b !== 0) break
    out = '1' + out
  }
  return out
}

function readCompactU16(bytes: Uint8Array, offset: number): { value: number; next: number } {
  let value = 0
  let shift = 0
  let i = offset
  for (;;) {
    const byte = bytes[i]
    if (byte === undefined) throw new Error('truncated compact-u16')
    value |= (byte & 0x7f) << shift
    i++
    if ((byte & 0x80) === 0) break
    shift += 7
    if (shift > 14) throw new Error('compact-u16 too long')
  }
  return { value, next: i }
}

/** Fee payer (base58) of a base64-serialized legacy or versioned Solana transaction. */
export function feePayerFromSerializedTx(base64Tx: string): string {
  const bytes = new Uint8Array(Buffer.from(base64Tx, 'base64'))
  const sigs = readCompactU16(bytes, 0)
  let off = sigs.next + sigs.value * 64
  if ((bytes[off] ?? 0) & 0x80) off += 1 // versioned message prefix
  off += 3 // header: numRequiredSignatures, numReadonlySigned, numReadonlyUnsigned
  const accounts = readCompactU16(bytes, off)
  if (accounts.value < 1) throw new Error('no static accounts')
  const start = accounts.next
  const key = bytes.slice(start, start + 32)
  if (key.length !== 32) throw new Error('truncated account key')
  return base58Encode(key)
}

/**
 * Fee payer from an x402 "exact" SVM payment payload (the decoded X-PAYMENT header), or null
 * if the payload does not carry a transaction or it cannot be parsed.
 */
export function feePayerFromPaymentPayload(payload: unknown): string | null {
  try {
    const tx = (payload as { payload?: { transaction?: unknown } })?.payload?.transaction
    if (typeof tx !== 'string' || tx.length < 100) return null
    return feePayerFromSerializedTx(tx)
  } catch {
    return null
  }
}
