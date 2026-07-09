import { createClient, type Client } from '@libsql/client'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let client: Client | null = null
let migrated = false

function resolveUrl(url: string): string {
  if (url.startsWith('file:')) {
    const pathPart = url.slice('file:'.length)
    // Ensure parent dir exists for local files
    const abs = pathPart.startsWith('/')
      ? pathPart
      : join(process.cwd(), pathPart.replace(/^\.\//, ''))
    const dir = dirname(abs)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return `file:${abs}`
  }
  return url
}

export function getDb(): Client {
  if (client) return client

  const config = useRuntimeConfig()
  const url = resolveUrl(config.tursoDatabaseUrl || 'file:./.data/gofoot.db')
  const authToken = config.tursoAuthToken || undefined

  client = createClient({
    url,
    authToken: authToken || undefined,
  })

  return client
}

export async function ensureMigrated(): Promise<void> {
  if (migrated) return
  const db = getDb()

  // Prefer reading migration file; fall back to inline SQL for bundled deploys
  let sql: string
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const candidates = [
      join(process.cwd(), 'server/db/migrations/0001_init.sql'),
      join(here, '../db/migrations/0001_init.sql'),
    ]
    const path = candidates.find((p) => existsSync(p))
    if (!path) throw new Error('migration file not found')
    sql = readFileSync(path, 'utf8')
  } catch {
    sql = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  hmac TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log (session_id, seq);
`
  }

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    await db.execute(statement)
  }

  migrated = true
}

/** Test helper: reset singleton between unit tests */
export function _resetDbForTests(): void {
  client = null
  migrated = false
}
