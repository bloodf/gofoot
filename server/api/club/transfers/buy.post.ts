import { ensureMigrated, getDb } from '../../../lib/db'
import { requireSession } from '../../../lib/session-auth'
import { ensureCareer } from '../../../lib/game'
import { buyTransfer } from '../../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ listingId?: string }>(event)
  if (!body?.listingId) throw createError({ statusCode: 400, statusMessage: 'listingId required' })
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  return buyTransfer(db, sessionId, body.listingId)
})
