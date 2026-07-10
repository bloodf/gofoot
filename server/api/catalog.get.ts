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
    sampleClubs: cat.clubs.slice(0, 8).map((c) => ({
      id: c.id,
      name: c.name,
      players: cat.players.filter((p) => p.clubId === c.id).length,
    })),
    samplePlayers: cat.players.slice(0, 12).map((p) => ({
      name: p.name,
      clubId: p.clubId,
      position: p.position,
      shirt: p.shirtNumber,
    })),
    warnings: (cat as { warnings?: string[] }).warnings ?? [],
    meta: catalogMeta(),
  }
})
