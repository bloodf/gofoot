/**
 * Data accessors — clubs/players come from live APIs (see live-football.ts).
 * Joke brands stay local JSON (fictional only; never live).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Client } from '@libsql/client'
import type { ClubRef } from '../engine/competition'
import {
  ensureLiveCatalog,
  getLiveClubs,
  getLivePlayers,
  type LiveCatalog,
} from './live-football'

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

let brandsCache: JokeBrand[] | null = null
let lastCatalog: LiveCatalog | null = null

/** Warm live catalog (call before sync helpers). */
export async function ensureFootballData(db: Client | null = null): Promise<LiveCatalog> {
  lastCatalog = await ensureLiveCatalog(db)
  return lastCatalog
}

export async function loadClubsAsync(db: Client | null = null): Promise<ClubRef[]> {
  return getLiveClubs(db)
}

export async function loadPlayersAsync(db: Client | null = null): Promise<SeedPlayer[]> {
  return getLivePlayers(db)
}

/**
 * Sync accessors — require ensureFootballData() first in the request.
 * Used by match engine helpers after catalog is warm.
 */
export function loadClubs(): ClubRef[] {
  if (!lastCatalog?.clubs?.length) {
    throw new Error('Football catalog not loaded — await ensureFootballData(db) first')
  }
  return lastCatalog.clubs
}

export function loadPlayers(): SeedPlayer[] {
  if (!lastCatalog?.players?.length) {
    throw new Error('Football catalog not loaded — await ensureFootballData(db) first')
  }
  return lastCatalog.players
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

export function catalogMeta(): { source: string; clubCount: number; playerCount: number } | null {
  if (!lastCatalog) return null
  return {
    source: lastCatalog.source,
    clubCount: lastCatalog.clubs.length,
    playerCount: lastCatalog.players.length,
  }
}
