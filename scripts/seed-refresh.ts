/**
 * Offline "data refresh" — regenerates derived indexes from local seed.
 * (No paid APIs. Optional: set OPENFOOTBALL_MIRROR later.)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const clubsPath = join(root, 'data/clubs-br.json')
const playersPath = join(root, 'data/players-br.json')

if (!existsSync(clubsPath) || !existsSync(playersPath)) {
  console.error('seed-refresh: missing seed files')
  process.exit(1)
}

const clubs = JSON.parse(readFileSync(clubsPath, 'utf8')) as {
  clubs: Array<{ id: string; name: string }>
}
const players = JSON.parse(readFileSync(playersPath, 'utf8')) as {
  players: Array<{ clubId: string }>
}

const index = {
  generatedAt: new Date().toISOString(),
  clubCount: clubs.clubs.length,
  playerCount: players.players.length,
  byClub: Object.fromEntries(
    clubs.clubs.map((c) => [
      c.id,
      {
        name: c.name,
        players: players.players.filter((p) => p.clubId === c.id).length,
      },
    ]),
  ),
}

writeFileSync(join(root, 'data/seed-index.json'), JSON.stringify(index, null, 2))
console.log(`seed-refresh OK — ${index.clubCount} clubs, ${index.playerCount} players`)
