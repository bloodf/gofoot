import { randomUUID } from 'node:crypto'
import type { Client } from '@libsql/client'
import { generateRoundRobin, emptyTable, applyResult, sortTable, type DivisionId } from '../engine/competition'
import { simulateMatch, type MatchSide } from '../engine/match'
import { sellTickets, createLoan, tickLoan, negotiateSponsor } from '../engine/economy'
import { defaultStadium, expandSector, expansionCost } from '../engine/stadium'
import { chainLink, GENESIS_HASH, hmacHex } from './hmac'
import { loadClubs, loadJokeBrands, playersForClub, clubById } from './data'
import { createRng } from '../engine/rng'

export async function ensureCareer(db: Client, sessionId: string, secret: string): Promise<void> {
  const existing = await db.execute({
    sql: `SELECT session_id FROM career_state WHERE session_id = ?`,
    args: [sessionId],
  })
  if (existing.rows.length) return

  const clubs = loadClubs()
  const rng = createRng(sessionId)
  // Start in serie_d with a weaker club
  const sorted = [...clubs].sort(
    (a, b) => a.attack + a.defense - (b.attack + b.defense),
  )
  const club = rng.pick(sorted.slice(0, 8))
  const now = Date.now()
  const division: DivisionId = 'serie_d'
  const season = 2026

  await db.execute({
    sql: `INSERT INTO career_state
      (session_id, club_id, season, division, reputation, cash, board_confidence, season_day, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [sessionId, club.id, season, division, 25, 500_000, 65, 1, now, now],
  })

  const stadium = defaultStadium(club.name)
  await db.execute({
    sql: `INSERT INTO stadium (session_id, name, capacity, north, south, east, west, level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      sessionId,
      stadium.name,
      stadium.capacity,
      stadium.north,
      stadium.south,
      stadium.east,
      stadium.west,
      stadium.level,
    ],
  })

  await db.execute({
    sql: `INSERT INTO ticket_pricing (session_id, base_price, elasticity, last_attendance)
      VALUES (?, ?, ?, ?)`,
    args: [sessionId, 35, 0.35, 0],
  })

  // Squad from seed for user club; other clubs remain seed-only for match sim
  const squad = playersForClub(club.id)
  for (const [i, p] of squad.entries()) {
    await db.execute({
      sql: `INSERT INTO squad_players
        (id, session_id, club_id, player_key, name, position, age, overall, pace, shooting, passing, defending, physical, morale, fitness, wage, value, shirt_number, starter)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        randomUUID(),
        sessionId,
        club.id,
        p.key,
        p.name,
        p.position,
        p.age,
        p.overall,
        p.pace,
        p.shooting,
        p.passing,
        p.defending,
        p.physical,
        70,
        100,
        p.wage,
        p.value,
        p.shirtNumber,
        i < 11 ? 1 : 0,
      ],
    })
  }

  // Fixtures: all seed clubs in user's division competition
  const fixtures = generateRoundRobin(clubs, division, season, sessionId, 1)
  for (const fx of fixtures) {
    await db.execute({
      sql: `INSERT INTO fixtures
        (id, session_id, competition_id, season, matchday, home_club_id, away_club_id, kickoff_day, status, seed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
      args: [
        `${sessionId}_${fx.id}`,
        sessionId,
        fx.competitionId,
        fx.season,
        fx.matchday,
        fx.homeClubId,
        fx.awayClubId,
        fx.kickoffDay,
        fx.seed,
      ],
    })
  }

  for (const row of emptyTable(clubs.map((c) => c.id))) {
    await db.execute({
      sql: `INSERT INTO league_table
        (session_id, competition_id, club_id, played, won, drawn, lost, gf, ga, points)
        VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0)`,
      args: [sessionId, division, row.clubId],
    })
  }

  // Initial joke sponsor offer in inbox
  const brands = loadJokeBrands()
  const brand = rng.pick(brands)
  await db.execute({
    sql: `INSERT INTO inbox_messages (id, session_id, subject, body, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)`,
    args: [
      randomUUID(),
      sessionId,
      `Proposta de patrocínio: ${brand.name}`,
      `${brand.name} quer estampar o manto. Negocie em Patrocínios.`,
      now,
    ],
  })

  // Genesis snapshot
  const payload = JSON.stringify({ type: 'career.started', clubId: club.id, division })
  const { payloadHash, hmac } = chainLink(secret, GENESIS_HASH, payload)
  await db.execute({
    sql: `INSERT INTO snapshots (id, session_id, seq, kind, payload_json, prev_hash, payload_hash, hmac, created_at)
      VALUES (?, ?, 1, 'career.started', ?, ?, ?, ?, ?)`,
    args: [randomUUID(), sessionId, payload, GENESIS_HASH, payloadHash, hmac, now],
  })
}

function sideFromClub(clubId: string): MatchSide {
  const c = clubById(clubId)
  if (!c) {
    return {
      clubId,
      name: clubId,
      attack: 60,
      midfield: 60,
      defense: 60,
      goalkeeping: 60,
    }
  }
  return {
    clubId: c.id,
    name: c.name,
    attack: c.attack,
    midfield: c.midfield,
    defense: c.defense,
    goalkeeping: c.goalkeeping,
  }
}

export async function getHub(db: Client, sessionId: string) {
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  if (!career) throw createError({ statusCode: 404, statusMessage: 'Career missing' })

  const clubId = String(career.club_id)
  const club = clubById(clubId)
  const nextFx = (
    await db.execute({
      sql: `SELECT * FROM fixtures WHERE session_id = ? AND status = 'scheduled'
        AND (home_club_id = ? OR away_club_id = ?)
        ORDER BY kickoff_day ASC, matchday ASC LIMIT 1`,
      args: [sessionId, clubId, clubId],
    })
  ).rows[0]

  const unread = (
    await db.execute({
      sql: `SELECT COUNT(*) as c FROM inbox_messages WHERE session_id = ? AND read = 0`,
      args: [sessionId],
    })
  ).rows[0]

  return {
    career: {
      clubId: career.club_id,
      clubName: club?.name ?? career.club_id,
      season: career.season,
      division: career.division,
      reputation: career.reputation,
      cash: career.cash,
      boardConfidence: career.board_confidence,
      seasonDay: career.season_day,
    },
    nextMatch: nextFx
      ? {
          id: nextFx.id,
          homeClubId: nextFx.home_club_id,
          awayClubId: nextFx.away_club_id,
          homeName: clubById(String(nextFx.home_club_id))?.name,
          awayName: clubById(String(nextFx.away_club_id))?.name,
          matchday: nextFx.matchday,
          kickoffDay: nextFx.kickoff_day,
        }
      : null,
    inboxUnread: Number(unread?.c ?? 0),
  }
}

export async function getSquad(db: Client, sessionId: string) {
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const career = (
    await db.execute({
      sql: `SELECT club_id FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const rows = (
    await db.execute({
      sql: `SELECT * FROM squad_players WHERE session_id = ? ORDER BY starter DESC, overall DESC`,
      args: [sessionId],
    })
  ).rows
  return {
    clubId: career?.club_id,
    players: rows.map((r) => ({
      id: r.id,
      key: r.player_key,
      name: r.name,
      position: r.position,
      age: r.age,
      overall: r.overall,
      pace: r.pace,
      shooting: r.shooting,
      passing: r.passing,
      defending: r.defending,
      physical: r.physical,
      morale: r.morale,
      fitness: r.fitness,
      wage: r.wage,
      value: r.value,
      shirtNumber: r.shirt_number,
      starter: Boolean(r.starter),
    })),
  }
}

export async function simulateFixture(db: Client, sessionId: string, fixtureId: string, secret: string) {
  await ensureCareer(db, sessionId, secret)
  const fx = (
    await db.execute({
      sql: `SELECT * FROM fixtures WHERE session_id = ? AND id = ?`,
      args: [sessionId, fixtureId],
    })
  ).rows[0]
  if (!fx) throw createError({ statusCode: 404, statusMessage: 'Fixture not found' })
  if (fx.status === 'played') {
    const snap = (
      await db.execute({
        sql: `SELECT * FROM match_snapshots WHERE session_id = ? AND fixture_id = ?`,
        args: [sessionId, fixtureId],
      })
    ).rows[0]
    return {
      fixtureId,
      status: 'played',
      homeGoals: fx.home_goals,
      awayGoals: fx.away_goals,
      events: snap ? JSON.parse(String(snap.events_json)) : [],
      duration_ms_1x: 300_000,
    }
  }

  const home = sideFromClub(String(fx.home_club_id))
  const away = sideFromClub(String(fx.away_club_id))
  const result = simulateMatch(String(fx.seed), home, away)

  // Ticket revenue if user is home
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]!
  const stadium = (
    await db.execute({
      sql: `SELECT * FROM stadium WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const tickets = (
    await db.execute({
      sql: `SELECT * FROM ticket_pricing WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]

  let cash = Number(career.cash)
  let attendance = 0
  let gate = 0
  if (String(fx.home_club_id) === String(career.club_id) && stadium && tickets) {
    const sold = sellTickets(
      {
        basePrice: Number(tickets.base_price),
        elasticity: Number(tickets.elasticity),
        capacity: Number(stadium.capacity),
        reputation: Number(career.reputation),
        homeDraw: true,
      },
      Number(tickets.base_price),
    )
    attendance = sold.attendance
    gate = sold.revenue
    cash += gate
    await db.execute({
      sql: `UPDATE ticket_pricing SET last_attendance = ? WHERE session_id = ?`,
      args: [attendance, sessionId],
    })
    const seasonDay = Number(career.season_day)
    await db.execute({
      sql: `INSERT INTO finance_ledger (id, session_id, day, kind, amount, note, created_at)
        VALUES (?, ?, ?, 'gate', ?, ?, ?)`,
      args: [
        randomUUID(),
        sessionId,
        seasonDay,
        gate,
        `Bilheteria vs ${away.name}`,
        Date.now(),
      ],
    })
  }

  await db.execute({
    sql: `UPDATE fixtures SET status = 'played', home_goals = ?, away_goals = ? WHERE session_id = ? AND id = ?`,
    args: [result.homeGoals, result.awayGoals, sessionId, fixtureId],
  })

  const competitionId = String(fx.competition_id)
  // Update table
  const tableRows = (
    await db.execute({
      sql: `SELECT * FROM league_table WHERE session_id = ? AND competition_id = ?`,
      args: [sessionId, competitionId],
    })
  ).rows.map((r) => ({
    clubId: String(r.club_id),
    played: Number(r.played),
    won: Number(r.won),
    drawn: Number(r.drawn),
    lost: Number(r.lost),
    gf: Number(r.gf),
    ga: Number(r.ga),
    points: Number(r.points),
  }))
  const updated = applyResult(
    tableRows,
    String(fx.home_club_id),
    String(fx.away_club_id),
    result.homeGoals,
    result.awayGoals,
  )
  for (const row of updated) {
    await db.execute({
      sql: `UPDATE league_table SET played=?, won=?, drawn=?, lost=?, gf=?, ga=?, points=?
        WHERE session_id=? AND competition_id=? AND club_id=?`,
      args: [
        row.played,
        row.won,
        row.drawn,
        row.lost,
        row.gf,
        row.ga,
        row.points,
        sessionId,
        competitionId,
        row.clubId,
      ],
    })
  }

  // Advance season day
  await db.execute({
    sql: `UPDATE career_state SET cash = ?, season_day = season_day + 1, updated_at = ? WHERE session_id = ?`,
    args: [cash, Date.now(), sessionId],
  })

  // Loan tick
  const loans = (
    await db.execute({
      sql: `SELECT * FROM bank_loans WHERE session_id = ? AND status = 'active'`,
      args: [sessionId],
    })
  ).rows
  for (const loanRow of loans) {
    const ticked = tickLoan(
      {
        principal: Number(loanRow.principal),
        remaining: Number(loanRow.remaining),
        installment: Number(loanRow.installment),
        weeksLeft: Number(loanRow.weeks_left),
        interestRate: Number(loanRow.interest_rate),
        status: 'active',
      },
      cash,
    )
    cash = ticked.cash
    await db.execute({
      sql: `UPDATE bank_loans SET remaining=?, weeks_left=?, status=? WHERE id=? AND session_id=?`,
      args: [
        ticked.loan.remaining,
        ticked.loan.weeksLeft,
        ticked.loan.status,
        String(loanRow.id),
        sessionId,
      ],
    })
    if (ticked.paid > 0) {
      await db.execute({
        sql: `INSERT INTO finance_ledger (id, session_id, day, kind, amount, note, created_at)
          VALUES (?, ?, ?, 'loan_payment', ?, 'Parcela de empréstimo', ?)`,
        args: [randomUUID(), sessionId, Number(career.season_day), -ticked.paid, Date.now()],
      })
    }
  }
  await db.execute({
    sql: `UPDATE career_state SET cash = ? WHERE session_id = ?`,
    args: [cash, sessionId],
  })

  const eventsJson = JSON.stringify(result.events)
  const hmac = hmacHex(secret, `${fixtureId}:${result.homeGoals}:${result.awayGoals}:${eventsJson}`)
  await db.execute({
    sql: `INSERT INTO match_snapshots (id, session_id, fixture_id, events_json, home_goals, away_goals, hmac, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      sessionId,
      fixtureId,
      eventsJson,
      result.homeGoals,
      result.awayGoals,
      hmac,
      Date.now(),
    ],
  })

  // Snapshot chain
  const last = (
    await db.execute({
      sql: `SELECT seq, payload_hash FROM snapshots WHERE session_id = ? ORDER BY seq DESC LIMIT 1`,
      args: [sessionId],
    })
  ).rows[0]
  const seq = Number(last?.seq ?? 0) + 1
  const prev = String(last?.payload_hash ?? GENESIS_HASH)
  const payload = JSON.stringify({
    type: 'match.played',
    fixtureId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    gate,
    attendance,
  })
  const link = chainLink(secret, prev, payload)
  await db.execute({
    sql: `INSERT INTO snapshots (id, session_id, seq, kind, payload_json, prev_hash, payload_hash, hmac, created_at)
      VALUES (?, ?, ?, 'match.played', ?, ?, ?, ?, ?)`,
    args: [randomUUID(), sessionId, seq, payload, prev, link.payloadHash, link.hmac, Date.now()],
  })

  return {
    fixtureId,
    status: 'played',
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    homeName: home.name,
    awayName: away.name,
    events: result.events,
    duration_ms_1x: result.duration_ms_1x,
    gate,
    attendance,
  }
}

export async function getLeague(db: Client, sessionId: string, competitionId: string) {
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const table = (
    await db.execute({
      sql: `SELECT * FROM league_table WHERE session_id = ? AND competition_id = ?`,
      args: [sessionId, competitionId],
    })
  ).rows.map((r) => ({
    clubId: String(r.club_id),
    name: clubById(String(r.club_id))?.name ?? r.club_id,
    shortName: clubById(String(r.club_id))?.shortName ?? r.club_id,
    played: Number(r.played),
    won: Number(r.won),
    drawn: Number(r.drawn),
    lost: Number(r.lost),
    gf: Number(r.gf),
    ga: Number(r.ga),
    gd: Number(r.gf) - Number(r.ga),
    points: Number(r.points),
  }))
  const sorted = sortTable(
    table.map((t) => ({
      clubId: t.clubId,
      played: t.played,
      won: t.won,
      drawn: t.drawn,
      lost: t.lost,
      gf: t.gf,
      ga: t.ga,
      points: t.points,
    })),
  )
  const byId = new Map(table.map((t) => [t.clubId, t]))
  return {
    competitionId,
    table: sorted.map((r, i) => ({ rank: i + 1, ...byId.get(r.clubId)! })),
  }
}

export async function getCareerLadder(db: Client, sessionId: string) {
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const rungs = [
    'serie_d',
    'serie_c',
    'serie_b',
    'serie_a',
    'copa_do_brasil',
    'libertadores',
    'sudamericana',
    'club_world_cup',
  ]
  const current = String(career?.division ?? 'serie_d')
  const idx = rungs.indexOf(current)
  return {
    current,
    reputation: career?.reputation,
    cash: career?.cash,
    clubId: career?.club_id,
    clubName: clubById(String(career?.club_id))?.name,
    season: career?.season,
    rungs: rungs.map((id, i) => ({
      id,
      unlocked: i <= idx,
      current: id === current,
    })),
  }
}

export async function takeLoan(db: Client, sessionId: string, principal: number) {
  await ensureCareer(db, sessionId, useRuntimeConfig().sessionHmacSecret)
  const loan = createLoan(principal, 12, 0.12)
  const id = randomUUID()
  await db.execute({
    sql: `INSERT INTO bank_loans (id, session_id, principal, remaining, installment, weeks_left, interest_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    args: [id, sessionId, loan.principal, loan.remaining, loan.installment, loan.weeksLeft, loan.interestRate],
  })
  await db.execute({
    sql: `UPDATE career_state SET cash = cash + ?, updated_at = ? WHERE session_id = ?`,
    args: [principal, Date.now(), sessionId],
  })
  await db.execute({
    sql: `INSERT INTO finance_ledger (id, session_id, day, kind, amount, note, created_at)
      VALUES (?, ?, 0, 'loan_in', ?, 'Empréstimo bancário', ?)`,
    args: [randomUUID(), sessionId, principal, Date.now()],
  })
  return { id, ...loan }
}

export async function setTicketPrice(db: Client, sessionId: string, price: number) {
  await db.execute({
    sql: `UPDATE ticket_pricing SET base_price = ? WHERE session_id = ?`,
    args: [price, sessionId],
  })
  return { basePrice: price }
}

export async function negotiateBrand(
  db: Client,
  sessionId: string,
  brandId: string,
  ask: number,
  round: number,
) {
  const brands = loadJokeBrands()
  const brand = brands.find((b) => b.id === brandId)
  if (!brand) throw createError({ statusCode: 404, statusMessage: 'Brand not found' })
  const career = (
    await db.execute({
      sql: `SELECT reputation FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  const result = negotiateSponsor(
    sessionId,
    brand,
    Number(career?.reputation ?? 20),
    ask,
    round,
  )
  if (result.accepted) {
    await db.execute({
      sql: `INSERT INTO sponsors (id, session_id, brand_id, brand_name, tier, weekly_fee, status, rounds_json)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      args: [
        randomUUID(),
        sessionId,
        brand.id,
        brand.name,
        brand.tier,
        result.offer.weeklyFee,
        JSON.stringify({ round, ask }),
      ],
    })
  }
  return result
}

export async function expandStadiumSector(
  db: Client,
  sessionId: string,
  sector: 'north' | 'south' | 'east' | 'west',
  add: number,
) {
  const row = (
    await db.execute({
      sql: `SELECT * FROM stadium WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Stadium missing' })
  const cost = expansionCost(sector, add, Number(row.level))
  const career = (
    await db.execute({
      sql: `SELECT cash FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  if (Number(career?.cash) < cost) {
    throw createError({ statusCode: 400, statusMessage: 'Insufficient cash' })
  }
  const next = expandSector(
    {
      name: String(row.name),
      capacity: Number(row.capacity),
      north: Number(row.north),
      south: Number(row.south),
      east: Number(row.east),
      west: Number(row.west),
      level: Number(row.level),
    },
    sector,
    add,
  )
  await db.execute({
    sql: `UPDATE stadium SET capacity=?, north=?, south=?, east=?, west=?, level=? WHERE session_id=?`,
    args: [next.capacity, next.north, next.south, next.east, next.west, next.level, sessionId],
  })
  await db.execute({
    sql: `UPDATE career_state SET cash = cash - ?, updated_at = ? WHERE session_id = ?`,
    args: [cost, Date.now(), sessionId],
  })
  return { stadium: next, cost }
}

export async function getAuditChain(db: Client, sessionId: string) {
  const rows = (
    await db.execute({
      sql: `SELECT seq, kind, prev_hash, payload_hash, hmac, created_at FROM snapshots
        WHERE session_id = ? ORDER BY seq ASC`,
      args: [sessionId],
    })
  ).rows
  let intact = true
  for (let i = 1; i < rows.length; i++) {
    // structural check only (recompute needs payload)
    if (!rows[i]?.prev_hash || !rows[i]?.hmac) intact = false
  }
  return {
    intact,
    length: rows.length,
    entries: rows.map((r) => ({
      seq: r.seq,
      kind: r.kind,
      prevHash: r.prev_hash,
      payloadHash: r.payload_hash,
      hmac: r.hmac,
      createdAt: r.created_at,
    })),
  }
}

export function fantasyLiveCard() {
  const clubs = loadClubs()
  const rng = createRng(`fantasy:${new Date().toISOString().slice(0, 10)}`)
  const home = rng.pick(clubs)
  const away = rng.pick(clubs.filter((c) => c.id !== home.id))
  return {
    id: `live_${home.id}_${away.id}`,
    title: 'Live now',
    home: { id: home.id, name: home.name },
    away: { id: away.id, name: away.name },
    competition: 'Série A',
    mode: 'live_now',
  }
}
