import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { ensureCareer } from '../../lib/game'
import { setTactics } from '../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody(event)
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return setTactics(db, sessionId, body ?? {})
})
