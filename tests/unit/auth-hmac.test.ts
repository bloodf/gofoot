import { describe, expect, it } from 'vitest'
import { mintSessionToken, verifySessionToken, hashToken } from '../../server/lib/auth'
import { chainLink, GENESIS_HASH, hmacHex, safeEqualHex, sha256Hex } from '../../server/lib/hmac'

const SECRET = 'unit-test-secret-at-least-16'

describe('session token', () => {
  it('mints and verifies a round-trip token', () => {
    const { token, sessionId, tokenHash, payload } = mintSessionToken(SECRET)
    expect(sessionId).toBeTruthy()
    expect(payload.sid).toBe(sessionId)
    expect(tokenHash).toBe(hashToken(token))

    const verified = verifySessionToken(SECRET, token)
    expect(verified.sid).toBe(sessionId)
  })

  it('rejects tampered tokens', () => {
    const { token } = mintSessionToken(SECRET)
    const bad = token.slice(0, -4) + 'xxxx'
    expect(() => verifySessionToken(SECRET, bad)).toThrow()
  })

  it('rejects wrong secret', () => {
    const { token } = mintSessionToken(SECRET)
    expect(() => verifySessionToken('other-secret-xxxxxx', token)).toThrow()
  })
})

describe('hmac chain', () => {
  it('builds deterministic chain links', () => {
    const payload = JSON.stringify({ type: 'session.created' })
    const a = chainLink(SECRET, GENESIS_HASH, payload)
    const b = chainLink(SECRET, GENESIS_HASH, payload)
    expect(a.payloadHash).toBe(b.payloadHash)
    expect(a.hmac).toBe(b.hmac)
    expect(a.payloadHash).toBe(sha256Hex(payload))
    expect(safeEqualHex(a.hmac, hmacHex(SECRET, `${GENESIS_HASH}:${a.payloadHash}`))).toBe(true)
  })
})
