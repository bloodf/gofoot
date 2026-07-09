import { ensureMigrated, getDb } from '../lib/db'
import { requireSession } from '../lib/session-auth'
import { ensureCareer } from '../lib/game'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  await ensureMigrated()
  const db = getDb()
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const rows = (
    await db.execute({
      sql: `SELECT * FROM inbox_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [sessionId],
    })
  ).rows
  return {
    messages: rows.map((m) => ({
      id: m.id,
      subject: m.subject,
      body: m.body,
      read: Boolean(m.read),
      createdAt: m.created_at,
    })),
  }
})
