import { describe, expect, it } from 'vitest'
import {
  generateRoundRobin,
  applyResult,
  emptyTable,
  sortTable,
  nextDivision,
} from '../../server/engine/competition'
import { sellTickets, createLoan, tickLoan, negotiateSponsor } from '../../server/engine/economy'
import { expandSector, defaultStadium, expansionCost } from '../../server/engine/stadium'

const clubs = [
  { id: 'a', name: 'A', shortName: 'A', attack: 70, midfield: 70, defense: 70, goalkeeping: 70 },
  { id: 'b', name: 'B', shortName: 'B', attack: 65, midfield: 65, defense: 65, goalkeeping: 65 },
  { id: 'c', name: 'C', shortName: 'C', attack: 60, midfield: 60, defense: 60, goalkeeping: 60 },
  { id: 'd', name: 'D', shortName: 'D', attack: 55, midfield: 55, defense: 55, goalkeeping: 55 },
]

describe('competition', () => {
  it('generates round-robin fixtures', () => {
    const fx = generateRoundRobin(clubs, 'serie_d', 2026, 's1')
    expect(fx.length).toBe(6) // C(4,2)=6 single RR
    expect(new Set(fx.map((f) => f.id)).size).toBe(fx.length)
  })

  it('updates table standings', () => {
    let table = emptyTable(['a', 'b'])
    table = applyResult(table, 'a', 'b', 2, 1)
    const sorted = sortTable(table)
    expect(sorted[0]!.clubId).toBe('a')
    expect(sorted[0]!.points).toBe(3)
  })

  it('ladder next division', () => {
    expect(nextDivision('serie_d')).toBe('serie_c')
    expect(nextDivision('serie_a')).toBe('copa_do_brasil')
  })
})

describe('economy', () => {
  it('ticket elasticity reduces attendance at high price', () => {
    const base = {
      basePrice: 40,
      elasticity: 0.4,
      capacity: 20000,
      reputation: 50,
      homeDraw: true,
    }
    const low = sellTickets(base, 20)
    const high = sellTickets(base, 100)
    expect(low.attendance).toBeGreaterThan(high.attendance)
  })

  it('loan installments reduce remaining', () => {
    const loan = createLoan(100_000, 10, 0.1)
    const t = tickLoan(loan, 1_000_000)
    expect(t.loan.remaining).toBeLessThan(loan.remaining)
    expect(t.paid).toBeGreaterThan(0)
  })

  it('sponsor negotiation returns offer', () => {
    const r = negotiateSponsor(
      'seed',
      { id: 'tabajara', name: 'Indústrias Tabajara', tier: 'national' },
      40,
      5000,
      1,
    )
    expect(r.offer.brandId).toBe('tabajara')
    expect(r.offer.weeklyFee).toBeGreaterThan(0)
  })
})

describe('stadium', () => {
  it('expands capacity', () => {
    const s = defaultStadium('Test')
    const cost = expansionCost('north', 500, s.level)
    expect(cost).toBeGreaterThan(0)
    const n = expandSector(s, 'north', 500)
    expect(n.capacity).toBe(s.capacity + 500)
  })
})
