import { ensureMigrated, getDb } from '../../lib/db'
import { takeLoan } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ principal?: number }>(event)
  const principal = Number(body?.principal ?? 0)
  if (!Number.isFinite(principal) || principal < 50_000 || principal > 5_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'principal 50k–5M' })
  }
  await ensureMigrated()
  return takeLoan(getDb(), sessionId, principal)
})
