import { createHmac, createHash, timingSafeEqual } from 'node:crypto'

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex')
}

export function hmacHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export function hmacSignBase64url(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export function safeEqualUtf8(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8')
    const bb = Buffer.from(b, 'utf8')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

/** Audit chain link: hash(prev_hash + payload_hash) then HMAC. */
export function chainLink(
  secret: string,
  prevHash: string,
  payloadJson: string,
): { payloadHash: string; hmac: string } {
  const payloadHash = sha256Hex(payloadJson)
  const material = `${prevHash}:${payloadHash}`
  const hmac = hmacHex(secret, material)
  return { payloadHash, hmac }
}

export const GENESIS_HASH = '0'.repeat(64)
