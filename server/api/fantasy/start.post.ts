import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { ensureCareer } from '../../lib/game'
import { startFantasy } from '../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ mode?: string; clubId?: string }>(event)
  if (!body?.clubId) throw createError({ statusCode: 400, statusMessage: 'clubId required' })
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return startFantasy(db, sessionId, body.mode ?? 'live_now', body.clubId)
})
