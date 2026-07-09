import { randomBytes, randomUUID } from 'node:crypto'
import { hmacSignBase64url, safeEqualUtf8, sha256Hex } from './hmac'

export interface SessionTokenPayload {
  sid: string
  iat: number
}

/**
 * Token format: base64url(JSON payload).signature
 * Payload is public; authenticity is HMAC. DB stores only token_hash.
 */
export function mintSessionToken(secret: string): {
  token: string
  sessionId: string
  tokenHash: string
  payload: SessionTokenPayload
} {
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_HMAC_SECRET must be at least 16 characters')
  }

  const sessionId = randomUUID()
  const payload: SessionTokenPayload = {
    sid: sessionId,
    iat: Math.floor(Date.now() / 1000),
  }
  // 256-bit entropy binder inside payload (extra random)
  const entropy = randomBytes(32).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, n: entropy }), 'utf8').toString(
    'base64url',
  )
  const sig = hmacSignBase64url(secret, body)
  const token = `${body}.${sig}`
  const tokenHash = sha256Hex(token)

  return { token, sessionId, tokenHash, payload }
}

export function verifySessionToken(
  secret: string,
  token: string,
): SessionTokenPayload & { n: string } {
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new Error('Invalid token format')
  }
  const [body, sig] = parts
  if (!body || !sig) {
    throw new Error('Invalid token format')
  }
  const expected = hmacSignBase64url(secret, body)
  if (!safeEqualUtf8(sig, expected)) {
    throw new Error('Invalid token signature')
  }
  let parsed: SessionTokenPayload & { n?: string }
  try {
    parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionTokenPayload & {
      n?: string
    }
  } catch {
    throw new Error('Invalid token payload')
  }
  if (!parsed.sid || typeof parsed.iat !== 'number' || !parsed.n) {
    throw new Error('Invalid token claims')
  }
  return parsed as SessionTokenPayload & { n: string }
}

export function hashToken(token: string): string {
  return sha256Hex(token)
}
