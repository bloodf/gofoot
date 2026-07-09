import type { Client, InArgs, ResultSet } from '@libsql/client'

/**
 * Session-partition helpers. Every data query must pass session_id.
 * Bare table access is refused at the helper layer (app-level RLS).
 */
export function requireSessionId(sessionId: unknown): string {
  if (typeof sessionId !== 'string' || sessionId.length < 8) {
    throw new Error('session_id required for partitioned query')
  }
  return sessionId
}

/**
 * Execute SQL that MUST contain a session_id bind and a session_id predicate.
 * Guardrails are intentionally simple for Stage 0.
 */
export async function executeForSession(
  db: Client,
  sessionId: string,
  sql: string,
  args: InArgs = [],
): Promise<ResultSet> {
  const sid = requireSessionId(sessionId)
  const normalized = sql.toLowerCase()

  if (!normalized.includes('session_id')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'RLS violation: SQL must reference session_id',
    })
  }

  // Ensure session id is present in args (positional or named)
  const hasSid =
    (Array.isArray(args) && args.includes(sid)) ||
    (!Array.isArray(args) &&
      args !== null &&
      typeof args === 'object' &&
      Object.values(args as Record<string, unknown>).includes(sid))

  if (!hasSid) {
    throw createError({
      statusCode: 500,
      statusMessage: 'RLS violation: session_id must be bound as a parameter',
    })
  }

  return db.execute({ sql, args })
}

export async function appendAudit(
  db: Client,
  params: {
    id: string
    sessionId: string
    seq: number
    eventType: string
    payloadJson: string
    prevHash: string
    payloadHash: string
    hmac: string
    createdAt: number
  },
): Promise<void> {
  const sid = requireSessionId(params.sessionId)
  await db.execute({
    sql: `INSERT INTO audit_log
      (id, session_id, seq, event_type, payload_json, prev_hash, payload_hash, hmac, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.id,
      sid,
      params.seq,
      params.eventType,
      params.payloadJson,
      params.prevHash,
      params.payloadHash,
      params.hmac,
      params.createdAt,
    ],
  })
}
