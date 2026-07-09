/** Deterministic mulberry32 PRNG for server-side match/economy RNG. */

export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h >>> 0) || 1
}

export function createRng(seed: string | number) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed)
  if (a === 0) a = 1

  function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min
  }

  function pick<T>(arr: readonly T[]): T {
    return arr[int(0, arr.length - 1)]!
  }

  function chance(p: number): boolean {
    return next() < p
  }

  return { next, int, pick, chance, seed: a }
}

export type Rng = ReturnType<typeof createRng>
