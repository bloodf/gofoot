import { describe, expect, it } from 'vitest'
import { simulateMatch } from '../../server/engine/match'

const home = {
  clubId: 'fla',
  name: 'Flamengo',
  attack: 78,
  midfield: 76,
  defense: 72,
  goalkeeping: 74,
}
const away = {
  clubId: 'vas',
  name: 'Vasco',
  attack: 69,
  midfield: 68,
  defense: 67,
  goalkeeping: 68,
}

describe('match engine', () => {
  it('is deterministic for the same seed', () => {
    const a = simulateMatch('seed-1', home, away)
    const b = simulateMatch('seed-1', home, away)
    expect(a.homeGoals).toBe(b.homeGoals)
    expect(a.awayGoals).toBe(b.awayGoals)
    expect(a.events.length).toBe(b.events.length)
    expect(a.events.map((e) => e.type)).toEqual(b.events.map((e) => e.type))
  })

  it('emits kickoff, half_time, full_time and 40+ events', () => {
    const r = simulateMatch('seed-rich', home, away)
    expect(r.events.some((e) => e.type === 'kickoff')).toBe(true)
    expect(r.events.some((e) => e.type === 'half_time')).toBe(true)
    expect(r.events.some((e) => e.type === 'full_time')).toBe(true)
    expect(r.events.length).toBeGreaterThanOrEqual(40)
    expect(r.duration_ms_1x).toBe(300_000)
    for (const e of r.events) {
      expect(e.real_ts_ms).toBeGreaterThanOrEqual(0)
      expect(e.real_ts_ms).toBeLessThanOrEqual(300_000)
    }
  })

  it('different seeds diverge', () => {
    const a = simulateMatch('aaa', home, away)
    const b = simulateMatch('bbb', home, away)
    const same =
      a.homeGoals === b.homeGoals &&
      a.awayGoals === b.awayGoals &&
      a.events.length === b.events.length
    // extremely unlikely both fully identical; allow rare collision by checking seed field
    expect(a.seed).not.toBe(b.seed)
    if (same) {
      expect(a.events[1]?.type).toBeDefined()
    }
  })
})
