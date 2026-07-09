import { hashToken, verifySessionToken } from './auth'
import { ensureMigrated, getDb } from './db'
import { getHeader } from 'h3'
import type { H3Event } from 'h3'

export async function requireSession(event: H3Event): Promise<{ sessionId: string; token: string }> {
  const config = useRuntimeConfig()
  const secret = config.sessionHmacSecret
  if (!secret || secret.length < 16) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_HMAC_SECRET not configured' })
  }

  const header = getHeader(event, 'x-session-token') || getHeader(event, 'authorization')
  let token = header?.startsWith('Bearer ') ? header.slice(7).trim() : header?.trim()

  // Query fallback (avoid reading body — would consume POST payload)
  if (!token) {
    const q = getQuery(event)
    if (typeof q.token === 'string') token = q.token
  }

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Session token required' })
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
  if (!result.rows.length) {
    throw createError({ statusCode: 401, statusMessage: 'Session not found' })
  }

  return { sessionId: payload.sid, token }
}
