import { hashToken, verifySessionToken } from '../../lib/auth'
import { ensureMigrated, getDb } from '../../lib/db'
import { clientKey, rateLimit } from '../../lib/rate-limit'

interface Body {
  token?: string
}

export default defineEventHandler(async (event) => {
  const rl = rateLimit(`session:resume:${clientKey(event)}`, {
    limit: 30,
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

  const body = await readBody<Body>(event)
  const token = body?.token?.trim()
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'token required' })
  }

  let payload
  try {
    payload = verifySessionToken(secret, token)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session token' })
  }

  await ensureMigrated()
  const db = getDb()
  const tokenHash = hashToken(token)

  const result = await db.execute({
    sql: `SELECT id FROM sessions WHERE id = ? AND token_hash = ? LIMIT 1`,
    args: [payload.sid, tokenHash],
  })

  if (result.rows.length === 0) {
    throw createError({ statusCode: 401, statusMessage: 'Session not found' })
  }

  const now = Date.now()
  await db.execute({
    sql: `UPDATE sessions SET last_seen_at = ? WHERE id = ?`,
    args: [now, payload.sid],
  })

  setHeader(event, 'Cache-Control', 'no-store')
  return { ok: true, session_id: payload.sid }
})
