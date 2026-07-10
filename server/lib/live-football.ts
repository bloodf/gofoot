/**
 * Live football catalog — teams + players from free HTTP APIs.
 * Cached in SQLite web_cache (local file DB in dev). No bundled clubs/players JSON at runtime.
 *
 * Sources (in order):
 * 1. TheSportsDB free API (default key "3")
 * 2. Optional football-data.org if FOOTBALL_DATA_API_TOKEN set
 * 3. Optional API-Football if API_FOOTBALL_KEY set
 */
import type { Client } from '@libsql/client'
import type { ClubRef } from '../engine/competition'
import type { SeedPlayer } from './data'
import { createRng } from '../engine/rng'

const CACHE_CLUBS = 'live:clubs:br:v2'
const CACHE_PLAYERS = 'live:players:br:v2'
const TTL_MS = 12 * 60 * 60 * 1000 // 12h

/** Major Brazilian clubs queried live (free TheSportsDB returns ≤10 per list endpoint). */
const BR_CLUB_QUERIES = [
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
  'Cuiabá',
  'Goiás',
  'Coritiba',
  'Vitória',
  'Ceará',
  'Avaí',
  'Sport Recife',
  'América Mineiro',
]

interface TsdbTeam {
  idTeam: string
  strTeam: string
  strTeamShort?: string
  strStadium?: string
  intStadiumCapacity?: string
  strLeague?: string
}

interface TsdbPlayer {
  idPlayer: string
  idTeam: string
  strPlayer: string
  strPosition?: string
  dateBorn?: string
  strNumber?: string
  strStatus?: string
}

function sportsDbKey(): string {
  try {
    const config = useRuntimeConfig()
    return (config as { theSportsDbApiKey?: string }).theSportsDbApiKey || '3'
  } catch {
    return process.env.THESPORTSDB_API_KEY || '3'
  }
}

function sportsDbBase(): string {
  return `https://www.thesportsdb.com/api/v1/json/${sportsDbKey()}`
}

async function httpJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GoFoot/0.1 (open-source football manager; local-dev)',
      ...headers,
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  return (await res.json()) as T
}

function slugId(name: string, externalId?: string): string {
  if (externalId) return `tsdb_${externalId}`
  return (
    'club_' +
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40)
  )
}

function mapPosition(raw?: string): string {
  const p = (raw || '').toLowerCase()
  if (p.includes('goal')) return 'GK'
  if (p.includes('centre-back') || p.includes('center back') || p.includes('central defender'))
    return 'CB'
  if (p.includes('left-back') || p.includes('left back')) return 'LB'
  if (p.includes('right-back') || p.includes('right back')) return 'RB'
  if (p.includes('defensive mid') || p.includes('defensive midfielder')) return 'CDM'
  if (p.includes('attacking mid') || p.includes('attacking midfielder')) return 'CAM'
  if (p.includes('midfield') || p.includes('midfielder')) return 'CM'
  if (p.includes('left wing') || p.includes('left winger') || p.includes('left mid')) return 'LW'
  if (p.includes('right wing') || p.includes('right winger') || p.includes('right mid')) return 'RW'
  if (p.includes('forward') || p.includes('striker') || p.includes('attacker') || p.includes('centre-forward'))
    return 'ST'
  if (p.includes('defender')) return 'CB'
  if (p.includes('coach') || p.includes('manager') || p.includes('staff')) return 'COACH'
  return 'CM'
}

function ageFromBorn(dateBorn?: string): number {
  if (!dateBorn) return 25
  const y = Number(dateBorn.slice(0, 4))
  if (!Number.isFinite(y)) return 25
  return Math.max(16, Math.min(42, new Date().getFullYear() - y))
}

function ratingsFor(position: string, age: number, seed: string) {
  const rng = createRng(seed)
  const base =
    position === 'GK'
      ? 68 + rng.int(0, 12)
      : position === 'ST'
        ? 66 + rng.int(0, 14)
        : 64 + rng.int(0, 12)
  const ageAdj = age < 21 ? -4 : age > 33 ? -5 : age > 30 ? -2 : 0
  const ovr = Math.max(45, Math.min(88, base + ageAdj))
  const bias = (good: boolean) => (good ? 4 : -3) + rng.int(-3, 3)
  return {
    overall: ovr,
    pace: clamp(ovr + bias(position === 'LW' || position === 'RW' || position === 'ST')),
    shooting: clamp(ovr + bias(position === 'ST' || position === 'CAM')),
    passing: clamp(ovr + bias(position === 'CM' || position === 'CAM' || position === 'CDM')),
    defending: clamp(ovr + bias(position === 'CB' || position === 'LB' || position === 'RB' || position === 'CDM')),
    physical: clamp(ovr + bias(position === 'CB' || position === 'ST')),
  }
}

function clamp(n: number) {
  return Math.max(30, Math.min(95, n))
}

function clubStrength(name: string): { attack: number; midfield: number; defense: number; goalkeeping: number } {
  const elite = ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Atlético Mineiro', 'Fluminense', 'Botafogo']
  const strong = ['Grêmio', 'Internacional', 'Cruzeiro', 'Santos', 'Bahia', 'Fortaleza', 'Vasco da Gama']
  const base = elite.some((e) => name.includes(e))
    ? 74
    : strong.some((e) => name.includes(e))
      ? 70
      : 64
  const rng = createRng(`str:${name}`)
  return {
    attack: base + rng.int(-2, 4),
    midfield: base + rng.int(-2, 3),
    defense: base + rng.int(-3, 3),
    goalkeeping: base + rng.int(-2, 2),
  }
}

async function cacheGet(db: Client | null, key: string): Promise<string | null> {
  if (!db) return null
  try {
    const r = await db.execute({
      sql: `SELECT payload_json, expires_at FROM web_cache WHERE cache_key = ?`,
      args: [key],
    })
    const row = r.rows[0]
    if (!row) return null
    if (Number(row.expires_at) < Date.now()) return null
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
    /* cache optional during early boot */
  }
}

async function fetchTeamByName(name: string): Promise<TsdbTeam | null> {
  const url = `${sportsDbBase()}/searchteams.php?t=${encodeURIComponent(name)}`
  const data = await httpJson<{ teams: TsdbTeam[] | null }>(url)
  const teams = data.teams || []
  // Prefer Brazilian leagues
  const br = teams.find(
    (t) =>
      (t.strLeague || '').toLowerCase().includes('brazil') ||
      (t.strLeague || '').toLowerCase().includes('brasileiro') ||
      (t.strLeague || '').toLowerCase().includes('serie'),
  )
  return br || teams[0] || null
}

async function fetchPlayersForTeam(idTeam: string): Promise<TsdbPlayer[]> {
  const url = `${sportsDbBase()}/lookup_all_players.php?id=${idTeam}`
  const data = await httpJson<{ player: TsdbPlayer[] | null }>(url)
  return (data.player || []).filter((p) => {
    const pos = mapPosition(p.strPosition)
    return pos !== 'COACH' && (p.strStatus || 'Active') !== 'Retired'
  })
}

async function fetchFromTheSportsDb(): Promise<{ clubs: ClubRef[]; players: SeedPlayer[]; source: string }> {
  const clubs: ClubRef[] = []
  const players: SeedPlayer[] = []
  const seen = new Set<string>()

  for (const query of BR_CLUB_QUERIES) {
    try {
      const team = await fetchTeamByName(query)
      if (!team?.idTeam || seen.has(team.idTeam)) continue
      seen.add(team.idTeam)
      const id = slugId(team.strTeam, team.idTeam)
      const str = clubStrength(team.strTeam)
      clubs.push({
        id,
        name: team.strTeam,
        shortName: (team.strTeamShort || team.strTeam.slice(0, 3)).toUpperCase().slice(0, 4),
        attack: str.attack,
        midfield: str.midfield,
        defense: str.defense,
        goalkeeping: str.goalkeeping,
      })

      const squad = await fetchPlayersForTeam(team.idTeam)
      let n = 0
      for (const p of squad) {
        const position = mapPosition(p.strPosition)
        if (position === 'COACH') continue
        const age = ageFromBorn(p.dateBorn)
        const rates = ratingsFor(position, age, `${team.idTeam}:${p.idPlayer}`)
        const shirt = Number(p.strNumber) || n + 1
        players.push({
          key: `tsdb_${p.idPlayer}`,
          clubId: id,
          name: p.strPlayer,
          position,
          age,
          overall: rates.overall,
          pace: rates.pace,
          shooting: rates.shooting,
          passing: rates.passing,
          defending: rates.defending,
          physical: rates.physical,
          wage: Math.round(rates.overall * 90),
          value: Math.round(rates.overall * rates.overall * 140),
          shirtNumber: shirt,
        })
        n++
      }
      // small delay to be polite to free tier
      await new Promise((r) => setTimeout(r, 120))
    } catch (e) {
      console.warn('[live-football] team fetch failed', query, e)
    }
  }

  if (clubs.length < 8) {
    throw new Error(`TheSportsDB returned too few clubs (${clubs.length})`)
  }

  return {
    clubs,
    players,
    source: `thesportsdb:${sportsDbKey() === '3' ? 'free' : 'key'}`,
  }
}

/** Optional football-data.org Brasileirão (BSA) if token present. */
async function fetchFromFootballData(): Promise<{ clubs: ClubRef[]; players: SeedPlayer[]; source: string } | null> {
  let token = process.env.FOOTBALL_DATA_API_TOKEN || ''
  try {
    const config = useRuntimeConfig() as { footballDataApiToken?: string }
    token = config.footballDataApiToken || token
  } catch {
    /* ignore */
  }
  if (!token) return null

  const data = await httpJson<{
    teams: Array<{ id: number; name: string; shortName?: string; tla?: string; squad?: Array<{
      id: number
      name: string
      position?: string
      dateOfBirth?: string
      shirtNumber?: number
    }> }>
  }>('https://api.football-data.org/v4/competitions/BSA/teams', {
    'X-Auth-Token': token,
  })

  const clubs: ClubRef[] = []
  const players: SeedPlayer[] = []
  for (const t of data.teams || []) {
    const id = `fd_${t.id}`
    const str = clubStrength(t.name)
    clubs.push({
      id,
      name: t.name,
      shortName: (t.tla || t.shortName || t.name.slice(0, 3)).toUpperCase().slice(0, 4),
      ...str,
    })
    // squad may need separate endpoint
  }

  // Fetch squads per team
  for (const t of data.teams || []) {
    try {
      const detail = await httpJson<{
        id: number
        squad?: Array<{
          id: number
          name: string
          position?: string
          dateOfBirth?: string
          shirtNumber?: number
        }>
      }>(`https://api.football-data.org/v4/teams/${t.id}`, { 'X-Auth-Token': token })
      const clubId = `fd_${t.id}`
      for (const [i, p] of (detail.squad || []).entries()) {
        const position = mapPosition(p.position)
        const age = ageFromBorn(p.dateOfBirth)
        const rates = ratingsFor(position, age, `fd:${p.id}`)
        players.push({
          key: `fd_${p.id}`,
          clubId,
          name: p.name,
          position,
          age,
          overall: rates.overall,
          pace: rates.pace,
          shooting: rates.shooting,
          passing: rates.passing,
          defending: rates.defending,
          physical: rates.physical,
          wage: Math.round(rates.overall * 90),
          value: Math.round(rates.overall * rates.overall * 140),
          shirtNumber: p.shirtNumber || i + 1,
        })
      }
      await new Promise((r) => setTimeout(r, 200))
    } catch (e) {
      console.warn('[live-football] fd squad failed', t.id, e)
    }
  }

  if (!clubs.length) return null
  return { clubs, players, source: 'football-data.org' }
}

export interface LiveCatalog {
  clubs: ClubRef[]
  players: SeedPlayer[]
  source: string
  fetchedAt: number
}

let memory: LiveCatalog | null = null
let inflight: Promise<LiveCatalog> | null = null

export async function ensureLiveCatalog(db: Client | null = null): Promise<LiveCatalog> {
  if (memory && Date.now() - memory.fetchedAt < TTL_MS) return memory
  if (inflight) return inflight

  inflight = (async () => {
    // SQLite cache
    const cachedClubs = await cacheGet(db, CACHE_CLUBS)
    const cachedPlayers = await cacheGet(db, CACHE_PLAYERS)
    if (cachedClubs && cachedPlayers) {
      try {
        const clubs = JSON.parse(cachedClubs) as ClubRef[]
        const players = JSON.parse(cachedPlayers) as SeedPlayer[]
        if (clubs.length >= 8 && players.length >= 20) {
          memory = { clubs, players, source: 'web_cache', fetchedAt: Date.now() }
          return memory
        }
      } catch {
        /* refetch */
      }
    }

    let catalog: { clubs: ClubRef[]; players: SeedPlayer[]; source: string }

    const fd = await fetchFromFootballData().catch((e) => {
      console.warn('[live-football] football-data skipped', e)
      return null
    })
    if (fd && fd.clubs.length >= 8) {
      catalog = fd
    } else {
      catalog = await fetchFromTheSportsDb()
    }

    await cacheSet(db, CACHE_CLUBS, catalog.clubs)
    await cacheSet(db, CACHE_PLAYERS, catalog.players)

    memory = {
      clubs: catalog.clubs,
      players: catalog.players,
      source: catalog.source,
      fetchedAt: Date.now(),
    }
    console.info(
      `[live-football] loaded ${memory.clubs.length} clubs, ${memory.players.length} players via ${memory.source}`,
    )
    return memory
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
  const c = await ensureLiveCatalog(db)
  return c.clubs
}

export async function getLivePlayers(db: Client | null = null): Promise<SeedPlayer[]> {
  const c = await ensureLiveCatalog(db)
  return c.players
}
