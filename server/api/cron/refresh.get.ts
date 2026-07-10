/**
 * Vercel Cron / manual refresh — re-fetch live football catalog into web_cache.
 */
import { ensureMigrated, getDb } from '../../lib/db'
import { clearLiveCatalogMemory } from '../../lib/live-football'
import { ensureFootballData } from '../../lib/data'

export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = getHeader(event, 'authorization')
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  await ensureMigrated()
  const db = getDb()
  const now = Date.now()

  // Bust memory + SQLite cache keys by deleting rows
  await db.execute({
    sql: `DELETE FROM web_cache WHERE cache_key LIKE 'live:%'`,
  }).catch(() => null)
  clearLiveCatalogMemory()

  const cat = await ensureFootballData(db)

  await db.execute({
    sql: `INSERT INTO refresh_state (job_name, last_run_at, last_status, meta_json)
      VALUES ('web_refresh', ?, 'ok', ?)
      ON CONFLICT(job_name) DO UPDATE SET last_run_at=excluded.last_run_at, last_status=excluded.last_status, meta_json=excluded.meta_json`,
    args: [
      now,
      JSON.stringify({
        source: cat.source,
        clubs: cat.clubs.length,
        players: cat.players.length,
      }),
    ],
  })

  return {
    ok: true,
    at: now,
    source: cat.source,
    clubs: cat.clubs.length,
    players: cat.players.length,
  }
})
