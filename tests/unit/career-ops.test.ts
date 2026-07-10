import { describe, expect, it } from 'vitest'
import { nextDivision, generateRoundRobin, sortTable, applyResult, emptyTable } from '../../server/engine/competition'
import { simulateMatch } from '../../server/engine/match'

describe('career progression helpers', () => {
  it('promotion path reaches club world cup', () => {
    let d = nextDivision('serie_d')
    const path: string[] = []
    while (d) {
      path.push(d)
      d = nextDivision(d)
    }
    expect(path).toContain('serie_a')
    expect(path).toContain('club_world_cup')
  })

  it('full RR + table has a champion', () => {
    const clubs = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      name: `Club ${i}`,
      shortName: `C${i}`,
      attack: 50 + i,
      midfield: 50,
      defense: 50,
      goalkeeping: 50,
    }))
    const fx = generateRoundRobin(clubs, 'serie_d', 2026, 't')
    let table = emptyTable(clubs.map((c) => c.id))
    for (const f of fx) {
      const home = clubs.find((c) => c.id === f.homeClubId)!
      const away = clubs.find((c) => c.id === f.awayClubId)!
      const r = simulateMatch(f.seed, {
        clubId: home.id,
        name: home.name,
        attack: home.attack,
        midfield: home.midfield,
        defense: home.defense,
        goalkeeping: home.goalkeeping,
      }, {
        clubId: away.id,
        name: away.name,
        attack: away.attack,
        midfield: away.midfield,
        defense: away.defense,
        goalkeeping: away.goalkeeping,
      })
      table = applyResult(table, f.homeClubId, f.awayClubId, r.homeGoals, r.awayGoals)
    }
    const sorted = sortTable(table)
    expect(sorted[0]!.played).toBe(5)
    expect(sorted[0]!.points).toBeGreaterThanOrEqual(0)
  })
})
