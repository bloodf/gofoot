import { ensureMigrated, getDb } from '../lib/db'
import { requireSession } from '../lib/session-auth'
import { ensureCareer } from '../lib/game'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  await ensureMigrated()
  const db = getDb()
  const secret = useRuntimeConfig().sessionHmacSecret
  await ensureCareer(db, sessionId, secret)

  const career = (
    await db.execute({
      sql: `SELECT cash, reputation FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const tickets = (
    await db.execute({
      sql: `SELECT * FROM ticket_pricing WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const loans = (
    await db.execute({
      sql: `SELECT * FROM bank_loans WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows
  const sponsors = (
    await db.execute({
      sql: `SELECT * FROM sponsors WHERE session_id = ? AND status = 'active'`,
      args: [sessionId],
    })
  ).rows
  const ledger = (
    await db.execute({
      sql: `SELECT * FROM finance_ledger WHERE session_id = ? ORDER BY created_at DESC LIMIT 20`,
      args: [sessionId],
    })
  ).rows
  const stadium = (
    await db.execute({
      sql: `SELECT * FROM stadium WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]

  return {
    cash: career?.cash,
    reputation: career?.reputation,
    tickets: tickets
      ? {
          basePrice: tickets.base_price,
          elasticity: tickets.elasticity,
          lastAttendance: tickets.last_attendance,
        }
      : null,
    loans: loans.map((l) => ({
      id: l.id,
      principal: l.principal,
      remaining: l.remaining,
      installment: l.installment,
      weeksLeft: l.weeks_left,
      status: l.status,
    })),
    sponsors: sponsors.map((s) => ({
      id: s.id,
      brandId: s.brand_id,
      brandName: s.brand_name,
      weeklyFee: s.weekly_fee,
      tier: s.tier,
    })),
    stadium: stadium
      ? {
          name: stadium.name,
          capacity: stadium.capacity,
          north: stadium.north,
          south: stadium.south,
          east: stadium.east,
          west: stadium.west,
          level: stadium.level,
        }
      : null,
    ledger: ledger.map((e) => ({
      id: e.id,
      day: e.day,
      kind: e.kind,
      amount: e.amount,
      note: e.note,
      createdAt: e.created_at,
    })),
  }
})
