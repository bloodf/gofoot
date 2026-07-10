import { ensureMigrated, getDb } from '../../../lib/db'
import { requireSession } from '../../../lib/session-auth'
import { ensureCareer } from '../../../lib/game'
import { playFantasyMatch } from '../../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const secret = useRuntimeConfig().sessionHmacSecret
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, secret)
  return playFantasyMatch(db, sessionId, id, secret)
})
