import { ensureMigrated, getDb } from '../../lib/db'
import { getSquad } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  await ensureMigrated()
  return getSquad(getDb(), sessionId)
})
