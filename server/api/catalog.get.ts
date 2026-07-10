import { ensureMigrated, getDb } from '../lib/db'
import { ensureFootballData, catalogMeta } from '../lib/data'

/** Public diagnostic: live football catalog status (no secrets). */
export default defineEventHandler(async () => {
  await ensureMigrated()
  const db = getDb()
  const cat = await ensureFootballData(db)
  return {
    ok: true,
    source: cat.source,
    fetchedAt: cat.fetchedAt,
    clubs: cat.clubs.length,
    players: cat.players.length,
    sampleClubs: cat.clubs.slice(0, 5).map((c) => c.name),
    meta: catalogMeta(),
  }
})
