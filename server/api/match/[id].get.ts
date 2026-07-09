import { ensureMigrated, getDb } from '../../lib/db'
import { requireSession } from '../../lib/session-auth'
import { clubById } from '../../lib/data'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id required' })
  await ensureMigrated()
  const db = getDb()
  const fx = (
    await db.execute({
      sql: `SELECT * FROM fixtures WHERE session_id = ? AND id = ?`,
      args: [sessionId, id],
    })
  ).rows[0]
  if (!fx) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  let events: unknown[] = []
  if (fx.status === 'played') {
    const snap = (
      await db.execute({
        sql: `SELECT events_json FROM match_snapshots WHERE session_id = ? AND fixture_id = ?`,
        args: [sessionId, id],
      })
    ).rows[0]
    if (snap) events = JSON.parse(String(snap.events_json))
  }

  return {
    id: fx.id,
    status: fx.status,
    competitionId: fx.competition_id,
    matchday: fx.matchday,
    home: {
      id: fx.home_club_id,
      name: clubById(String(fx.home_club_id))?.name ?? fx.home_club_id,
    },
    away: {
      id: fx.away_club_id,
      name: clubById(String(fx.away_club_id))?.name ?? fx.away_club_id,
    },
    homeGoals: fx.home_goals,
    awayGoals: fx.away_goals,
    events,
    duration_ms_1x: 300_000,
  }
})
