/**
 * Live football catalog — real clubs + real players only.
 *
 * Public sources (no paid key required for baseline):
 * 1. Wikipedia MediaWiki API — Brasileirão clubs + first-team squads (fs player)
 * 2. TheSportsDB free API — stadium meta + squad fallback (real names only)
 * 3. Optional FOOTBALL_DATA_API_TOKEN — football-data.org BSA
 *
 * Cached in local SQLite web_cache. No procedural player names.
 */
import type { Client } from '@libsql/client'
import type { ClubRef } from '../engine/competition'
import type { SeedPlayer } from './data'
import {
  fetchSerieAClubsFromWikipedia,
  fetchSquadFromWikipedia,
  type WikiClub,
} from './providers/wikipedia'
import {
  ageFromBorn,
  listTeamPlayers,
  mapTsdbPosition,
  searchTeam,
  type TsdbPlayer,
} from './providers/thesportsdb'

const CACHE_CLUBS = 'live:clubs:br:v3'
const CACHE_PLAYERS = 'live:players:br:v3'
const CACHE_META = 'live:meta:br:v3'
const TTL_MS = 6 * 60 * 60 * 1000 // 6h

export interface LiveCatalog {
  clubs: ClubRef[]
  players: SeedPlayer[]
  source: string
  fetchedAt: number
  warnings: string[]
}

let memory: LiveCatalog | null = null
let inflight: Promise<LiveCatalog> | null = null

async function cacheGet(db: Client | null, key: string): Promise<string | null> {
  if (!db) return null
  try {
    const r = await db.execute({
      sql: `SELECT payload_json, expires_at FROM web_cache WHERE cache_key = ?`,
      args: [key],
    })
    const row = r.rows[0]
    if (!row || Number(row.expires_at) < Date.now()) return null
    return String(row.payload_json)
  } catch {
    return null
  }
}

async function cacheSet(db: Client | null, key: string, payload: unknown): Promise<void> {
  if (!db) return
  const now = Date.now()
  try {
    await db.execute({
      sql: `INSERT INTO web_cache (cache_key, payload_json, fetched_at, expires_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
          payload_json=excluded.payload_json,
          fetched_at=excluded.fetched_at,
          expires_at=excluded.expires_at`,
      args: [key, JSON.stringify(payload), now, now + TTL_MS],
    })
  } catch {
    /* optional */
  }
}

function clubIdFromPage(page: string): string {
  return (
    'wiki_' +
    page
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 48)
  )
}

/** Deterministic ratings from real position + age only (no PRNG names). */
function ratingsFromRole(position: string, age: number | null): {
  overall: number
  pace: number
  shooting: number
  passing: number
  defending: number
  physical: number
} {
  const a = age ?? 26
  // Base by role (fixed table, not random)
  const baseByPos: Record<string, number> = {
    GK: 72,
    CB: 70,
    LB: 69,
    RB: 69,
    CDM: 70,
    CM: 71,
    CAM: 72,
    LW: 71,
    RW: 71,
    ST: 73,
  }
  let ovr = baseByPos[position] ?? 68
  if (a < 20) ovr -= 4
  else if (a < 23) ovr -= 1
  else if (a > 34) ovr -= 5
  else if (a > 31) ovr -= 2
  ovr = Math.max(50, Math.min(84, ovr))

  const adj = (n: number) => Math.max(40, Math.min(90, n))
  return {
    overall: ovr,
    pace: adj(ovr + (['LW', 'RW', 'ST', 'LB', 'RB'].includes(position) ? 3 : -2)),
    shooting: adj(ovr + (['ST', 'CAM', 'RW', 'LW'].includes(position) ? 4 : -4)),
    passing: adj(ovr + (['CM', 'CAM', 'CDM'].includes(position) ? 3 : -1)),
    defending: adj(ovr + (['CB', 'LB', 'RB', 'CDM', 'GK'].includes(position) ? 4 : -5)),
    physical: adj(ovr + (['CB', 'ST', 'CDM'].includes(position) ? 2 : 0)),
  }
}

function shortName(name: string, code?: string): string {
  if (code && code.length <= 4) return code.toUpperCase()
  const parts = name.replace(/^(CR|SC|SE|EC|FC|AA|CA)\s+/i, '').split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 3).toUpperCase()
  return (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 2)).toUpperCase()
}

function strengthFromSquad(players: SeedPlayer[]): {
  attack: number
  midfield: number
  defense: number
  goalkeeping: number
} {
  const avg = (pos: string[]) => {
    const list = players.filter((p) => pos.includes(p.position))
    if (!list.length) return 68
    return Math.round(list.reduce((s, p) => s + p.overall, 0) / list.length)
  }
  return {
    attack: avg(['ST', 'LW', 'RW', 'CAM']),
    midfield: avg(['CM', 'CDM', 'CAM']),
    defense: avg(['CB', 'LB', 'RB']),
    goalkeeping: avg(['GK']),
  }
}

function playersFromTsdb(clubId: string, list: TsdbPlayer[]): SeedPlayer[] {
  const out: SeedPlayer[] = []
  for (const p of list) {
    const position = mapTsdbPosition(p.strPosition)
    const age = ageFromBorn(p.dateBorn)
    const rates = ratingsFromRole(position, age)
    const shirt = p.strNumber && /^\d+$/.test(p.strNumber) ? Number(p.strNumber) : out.length + 1
    out.push({
      key: `tsdb_${p.idPlayer}`,
      clubId,
      name: p.strPlayer.trim(),
      position,
      age: age ?? 26,
      overall: rates.overall,
      pace: rates.pace,
      shooting: rates.shooting,
      passing: rates.passing,
      defending: rates.defending,
      physical: rates.physical,
      wage: Math.round(rates.overall * 100),
      value: Math.round(rates.overall * rates.overall * 150),
      shirtNumber: shirt,
    })
  }
  return out
}

function playersFromWiki(
  clubId: string,
  list: Array<{ name: string; position: string; shirtNumber: number | null }>,
): SeedPlayer[] {
  return list.map((p, i) => {
    const rates = ratingsFromRole(p.position, null)
    return {
      key: `wiki_${clubId}_${(p.shirtNumber ?? i + 1)}_${p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 24)}`,
      clubId,
      name: p.name,
      position: p.position,
      age: 26,
      overall: rates.overall,
      pace: rates.pace,
      shooting: rates.shooting,
      passing: rates.passing,
      defending: rates.defending,
      physical: rates.physical,
      wage: Math.round(rates.overall * 100),
      value: Math.round(rates.overall * rates.overall * 150),
      shirtNumber: p.shirtNumber ?? i + 1,
    }
  })
}

async function buildCatalogFromLive(): Promise<LiveCatalog> {
  const warnings: string[] = []
  const sources: string[] = []

  // 1) Clubs from Wikipedia season page (real clubs in current Brasileirão)
  let wikiClubs: WikiClub[] = []
  try {
    wikiClubs = await fetchSerieAClubsFromWikipedia()
    sources.push('wikipedia:serie-a-season')
  } catch (e) {
    warnings.push(`wikipedia clubs: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (wikiClubs.length < 8) {
    // Fallback: discover clubs via TheSportsDB search of known league string
    const fallbackNames = [
      'Flamengo',
      'Palmeiras',
      'Corinthians',
      'São Paulo',
      'Santos',
      'Grêmio',
      'Internacional',
      'Atlético Mineiro',
      'Cruzeiro',
      'Botafogo',
      'Vasco da Gama',
      'Fluminense',
      'Bahia',
      'Fortaleza',
      'Athletico Paranaense',
      'Bragantino',
      'Ceará',
      'Vitória',
      'Juventude',
      'Sport Recife',
    ]
    for (const name of fallbackNames) {
      try {
        const t = await searchTeam(name)
        if (t) wikiClubs.push({ page: t.strTeam, name: t.strTeam, code: t.strTeamShort })
        await sleep(100)
      } catch {
        /* continue */
      }
    }
    sources.push('thesportsdb:team-search')
  }

  // Dedupe by name
  const seenNames = new Set<string>()
  wikiClubs = wikiClubs.filter((c) => {
    const k = c.name.toLowerCase()
    if (seenNames.has(k)) return false
    seenNames.add(k)
    return true
  })

  const clubs: ClubRef[] = []
  const players: SeedPlayer[] = []

  for (const wc of wikiClubs) {
    const id = clubIdFromPage(wc.page || wc.name)
    let squad: SeedPlayer[] = []

    // 2a) Squad from Wikipedia first-team (preferred — full real squads)
    try {
      const wikiSquad = await fetchSquadFromWikipedia(wc.page)
      if (wikiSquad.length >= 11) {
        squad = playersFromWiki(id, wikiSquad)
        if (!sources.includes('wikipedia:squads')) sources.push('wikipedia:squads')
      }
    } catch (e) {
      warnings.push(`wiki squad ${wc.name}: ${e instanceof Error ? e.message : String(e)}`)
    }

    // 2b) Fallback squad from TheSportsDB (real names only)
    if (squad.length < 11) {
      try {
        const ts = await searchTeam(wc.name)
        if (ts?.idTeam) {
          const list = await listTeamPlayers(ts.idTeam)
          if (list.length) {
            squad = playersFromTsdb(id, list)
            if (!sources.includes('thesportsdb:squads')) sources.push('thesportsdb:squads')
          }
        }
      } catch (e) {
        warnings.push(`tsdb squad ${wc.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    if (squad.length === 0) {
      warnings.push(`no live players for ${wc.name} — club skipped`)
      await sleep(80)
      continue
    }

    const str = strengthFromSquad(squad)
    clubs.push({
      id,
      name: wc.name,
      shortName: shortName(wc.name, wc.code),
      attack: str.attack,
      midfield: str.midfield,
      defense: str.defense,
      goalkeeping: str.goalkeeping,
    })
    players.push(...squad)
    await sleep(150) // be polite to public APIs
  }

  if (clubs.length < 6) {
    throw new Error(
      `Live catalog failed: only ${clubs.length} clubs with real squads. Check network / APIs. Warnings: ${warnings.slice(0, 5).join('; ')}`,
    )
  }

  return {
    clubs,
    players,
    source: sources.join('+') || 'live',
    fetchedAt: Date.now(),
    warnings,
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function ensureLiveCatalog(db: Client | null = null): Promise<LiveCatalog> {
  if (memory && Date.now() - memory.fetchedAt < TTL_MS) return memory
  if (inflight) return inflight

  inflight = (async () => {
    const cachedClubs = await cacheGet(db, CACHE_CLUBS)
    const cachedPlayers = await cacheGet(db, CACHE_PLAYERS)
    const cachedMeta = await cacheGet(db, CACHE_META)
    if (cachedClubs && cachedPlayers) {
      try {
        const clubs = JSON.parse(cachedClubs) as ClubRef[]
        const players = JSON.parse(cachedPlayers) as SeedPlayer[]
        const meta = cachedMeta
          ? (JSON.parse(cachedMeta) as { source: string; warnings: string[] })
          : { source: 'web_cache', warnings: [] as string[] }
        if (clubs.length >= 6 && players.length >= 50) {
          // Reject cache that looks synthetic (legacy)
          const synthetic = players.some((p) => p.key.startsWith('proc_') || /_p\d+$/.test(p.key))
          if (!synthetic) {
            memory = {
              clubs,
              players,
              source: meta.source || 'web_cache',
              fetchedAt: Date.now(),
              warnings: meta.warnings || [],
            }
            return memory
          }
        }
      } catch {
        /* refetch */
      }
    }

    const catalog = await buildCatalogFromLive()
    await cacheSet(db, CACHE_CLUBS, catalog.clubs)
    await cacheSet(db, CACHE_PLAYERS, catalog.players)
    await cacheSet(db, CACHE_META, { source: catalog.source, warnings: catalog.warnings })
    memory = catalog
    console.info(
      `[live-football] ${catalog.clubs.length} clubs, ${catalog.players.length} players via ${catalog.source}`,
    )
    if (catalog.warnings.length) {
      console.warn('[live-football] warnings', catalog.warnings.slice(0, 8))
    }
    return catalog
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function clearLiveCatalogMemory(): void {
  memory = null
}

export async function getLiveClubs(db: Client | null = null): Promise<ClubRef[]> {
  return (await ensureLiveCatalog(db)).clubs
}

export async function getLivePlayers(db: Client | null = null): Promise<SeedPlayer[]> {
  return (await ensureLiveCatalog(db)).players
}
