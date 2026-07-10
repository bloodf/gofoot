import { ensureMigrated, getDb } from '../../../lib/db'
import { requireSession } from '../../../lib/session-auth'
import { ensureCareer } from '../../../lib/game'
import { promoteYouth } from '../../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ youthId?: string }>(event)
  if (!body?.youthId) throw createError({ statusCode: 400, statusMessage: 'youthId required' })
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return promoteYouth(db, sessionId, body.youthId)
})
