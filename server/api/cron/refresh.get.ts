/**
 * Vercel Cron entry — cached web refresh placeholder.
 * Secure with CRON_SECRET in production.
 */
import { ensureMigrated, getDb } from '../../lib/db'

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
  await db.execute({
    sql: `INSERT INTO refresh_state (job_name, last_run_at, last_status, meta_json)
      VALUES ('web_refresh', ?, 'ok', ?)
      ON CONFLICT(job_name) DO UPDATE SET last_run_at=excluded.last_run_at, last_status=excluded.last_status, meta_json=excluded.meta_json`,
    args: [now, JSON.stringify({ note: 'local seed refresh heartbeat', source: 'seed-index' })],
  })
  await db.execute({
    sql: `INSERT INTO web_cache (cache_key, payload_json, fetched_at, expires_at)
      VALUES ('heartbeat', ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET payload_json=excluded.payload_json, fetched_at=excluded.fetched_at, expires_at=excluded.expires_at`,
    args: [JSON.stringify({ ok: true }), now, now + 86_400_000],
  })

  return { ok: true, at: now }
})
