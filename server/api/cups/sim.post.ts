import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { ensureCareer } from '../../lib/game'
import { simCupTie } from '../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ tieId?: string }>(event)
  if (!body?.tieId) throw createError({ statusCode: 400, statusMessage: 'tieId required' })
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return simCupTie(db, sessionId, body.tieId)
})
