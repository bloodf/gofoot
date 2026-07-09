import { ensureMigrated, getDb } from '../lib/db'
import { getAuditChain } from '../lib/game'
import { requireSession } from '../lib/session-auth'
import { ensureCareer } from '../lib/game'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return getAuditChain(db, sessionId)
})
