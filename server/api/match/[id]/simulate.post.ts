import { ensureMigrated, getDb } from '../../../lib/db'
import { simulateFixture } from '../../../lib/game'
import { requireSession } from '../../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  const config = useRuntimeConfig()
  await ensureMigrated()
  return simulateFixture(getDb(), sessionId, id, config.sessionHmacSecret)
})
