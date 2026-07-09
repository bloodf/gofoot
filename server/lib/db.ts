import { createClient, type Client } from '@libsql/client'
import { readFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

let client: Client | null = null
let migrated = false

function resolveUrl(url: string): string {
  if (url.startsWith('file:')) {
    const pathPart = url.slice('file:'.length)
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

function migrationDirs(): string[] {
  const here = dirname(fileURLToPath(import.meta.url))
  return [
    join(process.cwd(), 'server/db/migrations'),
    join(here, '../db/migrations'),
  ]
}

function loadMigrationFiles(): Array<{ id: string; sql: string }> {
  for (const dir of migrationDirs()) {
    if (!existsSync(dir)) continue
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
    if (!files.length) continue
    return files.map((f) => ({
      id: f.replace(/\.sql$/, ''),
      sql: readFileSync(join(dir, f), 'utf8'),
    }))
  }
  return []
}

function splitSql(sql: string): string[] {
  return sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((s) => s.length > 0)
}

export async function ensureMigrated(): Promise<void> {
  if (migrated) return
  const db = getDb()

  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `)

  const applied = await db.execute(`SELECT id FROM schema_migrations`)
  const done = new Set(applied.rows.map((r) => String(r.id)))

  const files = loadMigrationFiles()
  if (!files.length) {
    // Minimal fallback
    const fallback = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
`
    for (const statement of splitSql(fallback)) {
      await db.execute(statement)
    }
  } else {
    for (const file of files) {
      if (done.has(file.id)) continue
      for (const statement of splitSql(file.sql)) {
        await db.execute(statement)
      }
      await db.execute({
        sql: `INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)`,
        args: [file.id, Date.now()],
      })
    }
  }

  migrated = true
}

export function _resetDbForTests(): void {
  client = null
  migrated = false
}
