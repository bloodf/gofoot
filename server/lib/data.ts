import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ClubRef } from '../engine/competition'

export interface SeedPlayer {
  key: string
  clubId: string
  name: string
  position: string
  age: number
  overall: number
  pace: number
  shooting: number
  passing: number
  defending: number
  physical: number
  wage: number
  value: number
  shirtNumber: number
}

export interface JokeBrand {
  id: string
  name: string
  tier: string
  categories: string[]
}

function readJson<T>(rel: string): T {
  const candidates = [join(process.cwd(), rel), join(process.cwd(), '..', rel)]
  for (const p of candidates) {
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf8')) as T
    }
  }
  throw new Error(`Missing data file: ${rel}`)
}

let clubsCache: ClubRef[] | null = null
let playersCache: SeedPlayer[] | null = null
let brandsCache: JokeBrand[] | null = null

export function loadClubs(): ClubRef[] {
  if (clubsCache) return clubsCache
  const data = readJson<{ clubs: ClubRef[] }>('data/clubs-br.json')
  clubsCache = data.clubs
  return clubsCache
}

export function loadPlayers(): SeedPlayer[] {
  if (playersCache) return playersCache
  const data = readJson<{ players: SeedPlayer[] }>('data/players-br.json')
  playersCache = data.players
  return playersCache
}

export function loadJokeBrands(): JokeBrand[] {
  if (brandsCache) return brandsCache
  const data = readJson<{ brands: JokeBrand[] }>('data/joke-brands.json')
  brandsCache = data.brands
  return brandsCache
}

export function clubById(id: string): ClubRef | undefined {
  return loadClubs().find((c) => c.id === id)
}

export function playersForClub(clubId: string): SeedPlayer[] {
  return loadPlayers().filter((p) => p.clubId === clubId)
}
