import { ensureMigrated, getDb } from '../lib/db'
import { ensureFootballData, loadClubs } from '../lib/data'
import { fantasyLiveCard } from '../lib/game'

export default defineEventHandler(async () => {
  await ensureMigrated()
  const db = getDb()
  await ensureFootballData(db)
  return {
    live: fantasyLiveCard(),
    presets: [
      { id: 'live_now', title: 'Live now', description: "Today's card — take over a club" },
      {
        id: 'rest_of_serie_a',
        title: 'Play the rest of Série A',
        description: 'Take over and finish the tournament',
      },
      {
        id: 'switch_team',
        title: 'Switch team after elimination',
        description: 'Keep playing after cup exit',
      },
    ],
    clubs: loadClubs().slice(0, 12).map((c) => ({ id: c.id, name: c.name })),
    catalog: {
      source: (await ensureFootballData(db)).source,
      clubCount: loadClubs().length,
    },
  }
})
