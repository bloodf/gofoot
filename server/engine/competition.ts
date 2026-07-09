/**
 * Competition engine: BR ladder divisions + round-robin fixtures + table updates.
 */
import { createRng } from './rng'

export type DivisionId =
  | 'serie_d'
  | 'serie_c'
  | 'serie_b'
  | 'serie_a'
  | 'copa_do_brasil'
  | 'libertadores'
  | 'sudamericana'
  | 'club_world_cup'

export const LADDER_ORDER: DivisionId[] = [
  'serie_d',
  'serie_c',
  'serie_b',
  'serie_a',
  'copa_do_brasil',
  'libertadores',
  'sudamericana',
  'club_world_cup',
]

export const DIVISION_LABEL: Record<DivisionId, { pt: string; en: string }> = {
  serie_d: { pt: 'Série D', en: 'Série D' },
  serie_c: { pt: 'Série C', en: 'Série C' },
  serie_b: { pt: 'Série B', en: 'Série B' },
  serie_a: { pt: 'Série A', en: 'Série A' },
  copa_do_brasil: { pt: 'Copa do Brasil', en: 'Copa do Brasil' },
  libertadores: { pt: 'Libertadores', en: 'Libertadores' },
  sudamericana: { pt: 'Sudamericana', en: 'Sudamericana' },
  club_world_cup: { pt: 'Mundial de Clubes', en: 'Club World Cup' },
}

export interface ClubRef {
  id: string
  name: string
  shortName: string
  attack: number
  midfield: number
  defense: number
  goalkeeping: number
}

export interface FixturePlan {
  id: string
  competitionId: string
  season: number
  matchday: number
  homeClubId: string
  awayClubId: string
  kickoffDay: number
  seed: string
}

export interface TableRow {
  clubId: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

/** Single round-robin: each pair plays once. */
export function generateRoundRobin(
  clubs: ClubRef[],
  competitionId: string,
  season: number,
  seedBase: string,
  startDay = 1,
): FixturePlan[] {
  const ids = clubs.map((c) => c.id)
  const n = ids.length
  if (n < 2) return []

  // Circle method needs even count
  const list = [...ids]
  if (list.length % 2 === 1) list.push('BYE')

  const rounds = list.length - 1
  const half = list.length / 2
  const fixtures: FixturePlan[] = []
  let arr = [...list]
  let day = startDay
  let matchday = 1

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = arr[i]!
      const away = arr[arr.length - 1 - i]!
      if (home === 'BYE' || away === 'BYE') continue
      const seed = `${seedBase}:${competitionId}:${season}:md${matchday}:${home}:${away}`
      fixtures.push({
        id: `fx_${hashId(seed)}`,
        competitionId,
        season,
        matchday,
        homeClubId: home,
        awayClubId: away,
        kickoffDay: day,
        seed,
      })
    }
    // rotate
    const fixed = arr[0]!
    const rest = arr.slice(1)
    rest.unshift(rest.pop()!)
    arr = [fixed, ...rest]
    matchday++
    day += 3
  }

  return fixtures
}

function hashId(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36) + s.length.toString(36)
}

export function emptyTable(clubIds: string[]): TableRow[] {
  return clubIds.map((clubId) => ({
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }))
}

export function applyResult(
  table: TableRow[],
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
): TableRow[] {
  const next = table.map((r) => ({ ...r }))
  const home = next.find((r) => r.clubId === homeId)
  const away = next.find((r) => r.clubId === awayId)
  if (!home || !away) return next

  home.played++
  away.played++
  home.gf += homeGoals
  home.ga += awayGoals
  away.gf += awayGoals
  away.ga += homeGoals

  if (homeGoals > awayGoals) {
    home.won++
    home.points += 3
    away.lost++
  } else if (homeGoals < awayGoals) {
    away.won++
    away.points += 3
    home.lost++
  } else {
    home.drawn++
    away.drawn++
    home.points++
    away.points++
  }
  return next
}

export function sortTable(table: TableRow[]): TableRow[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.gf - a.ga
    const gdB = b.gf - b.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })
}

export function nextDivision(current: DivisionId): DivisionId | null {
  const i = LADDER_ORDER.indexOf(current)
  if (i < 0 || i >= LADDER_ORDER.length - 1) return null
  // career ladder: only promote within serie d->a first
  const series: DivisionId[] = ['serie_d', 'serie_c', 'serie_b', 'serie_a']
  const si = series.indexOf(current)
  if (si >= 0 && si < series.length - 1) return series[si + 1]!
  if (current === 'serie_a') return 'copa_do_brasil'
  if (current === 'copa_do_brasil') return 'libertadores'
  if (current === 'libertadores') return 'club_world_cup'
  return null
}

export function pickUserClub(clubs: ClubRef[], seed: string): ClubRef {
  const rng = createRng(seed)
  // Prefer weaker clubs for career start (lower reputation)
  const sorted = [...clubs].sort(
    (a, b) => a.attack + a.defense - (b.attack + b.defense),
  )
  const pool = sorted.slice(0, Math.max(4, Math.floor(sorted.length / 2)))
  return rng.pick(pool)
}
