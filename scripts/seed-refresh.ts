/**
 * Live catalog smoke refresh (CLI) — hits TheSportsDB and writes a diagnostic index.
 * Runtime game data does NOT use data/*.json for clubs/players; it uses live APIs + SQLite cache.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KEY = process.env.THESPORTSDB_API_KEY || '3'
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`

const QUERIES = ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Botafogo']

async function main() {
  const clubs: Array<{ id: string; name: string }> = []
  for (const q of QUERIES) {
    const res = await fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(q)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { teams?: Array<{ idTeam: string; strTeam: string }> }
    const t = data.teams?.[0]
    if (t) clubs.push({ id: t.idTeam, name: t.strTeam })
    await new Promise((r) => setTimeout(r, 150))
  }

  const index = {
    generatedAt: new Date().toISOString(),
    source: 'thesportsdb-live',
    sampleClubCount: clubs.length,
    clubs,
    note: 'Runtime uses server/lib/live-football.ts + web_cache; this file is diagnostic only.',
  }
  writeFileSync(join(process.cwd(), 'data/seed-index.json'), JSON.stringify(index, null, 2))
  console.log(`seed-refresh OK — live sample ${clubs.length} clubs from TheSportsDB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
