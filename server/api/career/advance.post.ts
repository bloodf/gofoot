import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { ensureCareer } from '../../lib/game'
import { simRestOfSeason, endSeason } from '../../lib/career-ops'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const body = await readBody<{ mode?: 'rest_of_season' | 'end_season' | 'rest_ai' }>(event).catch(
    () => ({ mode: 'rest_ai' as const }),
  )
  const secret = useRuntimeConfig().sessionHmacSecret
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, secret)

  const mode = body?.mode ?? 'rest_ai'
  if (mode === 'end_season') {
    // Force sim all including user remaining, then end
    const r = await simRestOfSeason(db, sessionId, secret, { includeUser: true })
    return { ...r, mode }
  }
  if (mode === 'rest_of_season') {
    const r = await simRestOfSeason(db, sessionId, secret, { includeUser: true })
    return { ...r, mode }
  }
  const r = await simRestOfSeason(db, sessionId, secret, { includeUser: false })
  // If only user fixtures remain, do nothing more
  if (r.simulated === 0) {
    const pending = (
      await db.execute({
        sql: `SELECT COUNT(*) as c FROM fixtures WHERE session_id=? AND status='scheduled'`,
        args: [sessionId],
      })
    ).rows[0]
    if (Number(pending?.c ?? 0) === 0) {
      const promoted = await endSeason(db, sessionId, secret)
      return { simulated: 0, promoted, mode: 'end_season' }
    }
  }
  return { ...r, mode }
})
