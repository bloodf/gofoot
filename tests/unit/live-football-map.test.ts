import { describe, expect, it } from 'vitest'
import { createRng } from '../../server/engine/rng'

// Unit-test pure mapping bits without network
function mapPosition(raw?: string): string {
  const p = (raw || '').toLowerCase()
  if (p.includes('goal')) return 'GK'
  if (p.includes('centre-back') || p.includes('center back')) return 'CB'
  if (p.includes('left-back')) return 'LB'
  if (p.includes('right-back')) return 'RB'
  if (p.includes('forward') || p.includes('striker') || p.includes('attacker')) return 'ST'
  if (p.includes('midfield')) return 'CM'
  if (p.includes('coach') || p.includes('manager')) return 'COACH'
  return 'CM'
}

describe('live football mapping', () => {
  it('maps common positions', () => {
    expect(mapPosition('Goalkeeper')).toBe('GK')
    expect(mapPosition('Centre-Back')).toBe('CB')
    expect(mapPosition('Left-Back')).toBe('LB')
    expect(mapPosition('Attacker')).toBe('ST')
    expect(mapPosition('Manager')).toBe('COACH')
  })

  it('rng is deterministic for attribute seeds', () => {
    const a = createRng('tsdb:1')
    const b = createRng('tsdb:1')
    expect(a.next()).toBe(b.next())
  })
})
