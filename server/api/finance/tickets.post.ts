import { ensureMigrated, getDb } from '../../lib/db'
import { setTicketPrice } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ price?: number }>(event)
  const price = Number(body?.price ?? 0)
  if (!Number.isFinite(price) || price < 5 || price > 500) {
    throw createError({ statusCode: 400, statusMessage: 'price 5–500' })
  }
  await ensureMigrated()
  return setTicketPrice(getDb(), sessionId, price)
})
