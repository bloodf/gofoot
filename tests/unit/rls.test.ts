import { describe, expect, it } from 'vitest'
import { requireSessionId } from '../../server/lib/rls'

describe('RLS session_id guard', () => {
  it('accepts a valid session id', () => {
    expect(requireSessionId('01234567-89ab-cdef-0123-456789abcdef')).toBe(
      '01234567-89ab-cdef-0123-456789abcdef',
    )
  })

  it('rejects missing session id', () => {
    expect(() => requireSessionId(undefined)).toThrow()
    expect(() => requireSessionId('')).toThrow()
    expect(() => requireSessionId('short')).toThrow()
  })
})
