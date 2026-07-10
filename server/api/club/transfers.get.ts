import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { ensureCareer } from '../../lib/game'
import { listTransfers } from '../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return { listings: await listTransfers(db, sessionId) }
})
