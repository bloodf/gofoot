import { ensureMigrated, getDb } from '../../lib/db'
import { getLeague } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const id = getRouterParam(event, 'id') || 'serie_d'
  await ensureMigrated()
  return getLeague(getDb(), sessionId, id)
})
