/**
 * TheSportsDB free public API (key "3" without signup; optional premium key).
 * Used for stadium metadata and squad fallback when Wikipedia has no fs player table.
 * All names come from the API response — never generated.
 */
const UA = 'GoFoot/0.1 (https://github.com/bloodf/gofoot-grok; open-source football manager)'

export interface TsdbTeam {
  idTeam: string
  strTeam: string
  strTeamShort?: string
  strStadium?: string
  intStadiumCapacity?: string
  strLeague?: string
  strBadge?: string
}

export interface TsdbPlayer {
  idPlayer: string
  idTeam: string
  strPlayer: string
  strPosition?: string
  dateBorn?: string
  strNumber?: string
  strStatus?: string
  strNationality?: string
}

function base(): string {
  let key = process.env.THESPORTSDB_API_KEY || '3'
  try {
    const config = useRuntimeConfig() as { theSportsDbApiKey?: string }
    key = config.theSportsDbApiKey || key
  } catch {
    /* CLI */
  }
  return `https://www.thesportsdb.com/api/v1/json/${key}`
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`TheSportsDB HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function searchTeam(name: string): Promise<TsdbTeam | null> {
  const data = await getJson<{ teams: TsdbTeam[] | null }>(
    `/searchteams.php?t=${encodeURIComponent(name)}`,
  )
  const teams = data.teams || []
  const br = teams.find((t) =>
    /brazil|brasileiro|serie/i.test(t.strLeague || ''),
  )
  return br || teams[0] || null
}

export async function listLeagueTeams(leagueName: string): Promise<TsdbTeam[]> {
  const data = await getJson<{ teams: TsdbTeam[] | null }>(
    `/search_all_teams.php?l=${encodeURIComponent(leagueName)}`,
  )
  return data.teams || []
}

export async function listTeamPlayers(idTeam: string): Promise<TsdbPlayer[]> {
  const data = await getJson<{ player: TsdbPlayer[] | null }>(
    `/lookup_all_players.php?id=${idTeam}`,
  )
  return (data.player || []).filter((p) => {
    const pos = (p.strPosition || '').toLowerCase()
    if (pos.includes('coach') || pos.includes('manager') || pos.includes('staff')) return false
    if ((p.strStatus || '').toLowerCase() === 'retired') return false
    return Boolean(p.strPlayer)
  })
}

export function mapTsdbPosition(raw?: string): string {
  const p = (raw || '').toLowerCase()
  if (p.includes('goal')) return 'GK'
  if (p.includes('left-back') || p.includes('left back')) return 'LB'
  if (p.includes('right-back') || p.includes('right back')) return 'RB'
  if (p.includes('centre-back') || p.includes('center back') || p.includes('central defender'))
    return 'CB'
  if (p.includes('defensive mid')) return 'CDM'
  if (p.includes('attacking mid')) return 'CAM'
  if (p.includes('midfield')) return 'CM'
  if (p.includes('left wing') || p.includes('left winger')) return 'LW'
  if (p.includes('right wing') || p.includes('right winger')) return 'RW'
  if (p.includes('forward') || p.includes('striker') || p.includes('attacker') || p.includes('centre-forward'))
    return 'ST'
  if (p.includes('defender')) return 'CB'
  return 'CM'
}

export function ageFromBorn(dateBorn?: string): number | null {
  if (!dateBorn || dateBorn.length < 4) return null
  const y = Number(dateBorn.slice(0, 4))
  if (!Number.isFinite(y) || y < 1960 || y > 2015) return null
  return Math.max(15, Math.min(45, new Date().getFullYear() - y))
}
