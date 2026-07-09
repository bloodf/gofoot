import { randomUUID } from 'node:crypto'
import { mintSessionToken } from '../../lib/auth'
import { ensureMigrated, getDb } from '../../lib/db'
import { chainLink, GENESIS_HASH } from '../../lib/hmac'
import { appendAudit } from '../../lib/rls'
import { clientKey, rateLimit } from '../../lib/rate-limit'

export default defineEventHandler(async (event) => {
  const rl = rateLimit(`session:create:${clientKey(event)}`, {
    limit: 10,
    windowMs: 60_000,
  })
  if (!rl.ok) {
    throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded' })
  }

  const config = useRuntimeConfig()
  const secret = config.sessionHmacSecret
  if (!secret || secret.length < 16) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SESSION_HMAC_SECRET not configured',
    })
  }

  await ensureMigrated()
  const db = getDb()

  const { token, sessionId, tokenHash } = mintSessionToken(secret)
  const now = Date.now()

  await db.execute({
    sql: `INSERT INTO sessions (id, token_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?)`,
    args: [sessionId, tokenHash, now, now],
  })

  const payloadJson = JSON.stringify({ type: 'session.created', sessionId })
  const { payloadHash, hmac } = chainLink(secret, GENESIS_HASH, payloadJson)

  await appendAudit(db, {
    id: randomUUID(),
    sessionId,
    seq: 1,
    eventType: 'session.created',
    payloadJson,
    prevHash: GENESIS_HASH,
    payloadHash,
    hmac,
    createdAt: now,
  })

  // Career bootstraps lazily on first authenticated API (hub/squad/…)

  setHeader(event, 'Cache-Control', 'no-store')
  return { token }
})
