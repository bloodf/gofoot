/** Stadium sector math + expansion costs. */

export interface StadiumState {
  name: string
  capacity: number
  north: number
  south: number
  east: number
  west: number
  level: number
}

export function recomputeCapacity(s: Omit<StadiumState, 'capacity'>): StadiumState {
  const capacity = s.north + s.south + s.east + s.west
  return { ...s, capacity }
}

export function expansionCost(sector: 'north' | 'south' | 'east' | 'west', add: number, level: number): number {
  const base = 250_000
  return Math.round(base * add * (1 + level * 0.15) * (sector === 'north' || sector === 'south' ? 1 : 0.95))
}

export function expandSector(
  stadium: StadiumState,
  sector: 'north' | 'south' | 'east' | 'west',
  add: number,
): StadiumState {
  const next = { ...stadium, [sector]: stadium[sector] + add, level: stadium.level }
  if (next.north + next.south + next.east + next.west > stadium.capacity * 1.5) {
    next.level = stadium.level + 1
  }
  return recomputeCapacity(next)
}

export function defaultStadium(clubName: string): StadiumState {
  return recomputeCapacity({
    name: `Estádio ${clubName}`,
    north: 4000,
    south: 4000,
    east: 3500,
    west: 3500,
    level: 1,
  })
}
