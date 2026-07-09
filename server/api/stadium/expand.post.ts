import { ensureMigrated, getDb } from '../../lib/db'
import { expandStadiumSector } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ sector?: string; add?: number }>(event)
  const sector = body?.sector
  if (!sector || !['north', 'south', 'east', 'west'].includes(sector)) {
    throw createError({ statusCode: 400, statusMessage: 'sector required' })
  }
  const add = Number(body?.add ?? 500)
  if (add < 100 || add > 5000) {
    throw createError({ statusCode: 400, statusMessage: 'add 100–5000' })
  }
  await ensureMigrated()
  return expandStadiumSector(
    getDb(),
    sessionId,
    sector as 'north' | 'south' | 'east' | 'west',
    add,
  )
})
