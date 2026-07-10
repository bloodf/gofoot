/**
 * Career loop: AI matchday sims, season end, promotion, transfers, tactics, fantasy, cup.
 */
import { randomUUID } from 'node:crypto'
import type { Client } from '@libsql/client'
import {
  applyResult,
  generateRoundRobin,
  emptyTable,
  nextDivision,
  sortTable,
  type DivisionId,
} from '../engine/competition'
import { simulateMatch, type MatchSide } from '../engine/match'
import { createRng } from '../engine/rng'
import { clubById, ensureFootballData, loadClubs, loadPlayers } from './data'
import { chainLink, GENESIS_HASH, hmacHex } from './hmac'

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

async function loadTable(db: Client, sessionId: string, competitionId: string) {
  const rows = (
    await db.execute({
      sql: `SELECT * FROM league_table WHERE session_id = ? AND competition_id = ?`,
      args: [sessionId, competitionId],
    })
  ).rows
  return rows.map((r) => ({
    clubId: String(r.club_id),
    played: Number(r.played),
    won: Number(r.won),
    drawn: Number(r.drawn),
    lost: Number(r.lost),
    gf: Number(r.gf),
    ga: Number(r.ga),
    points: Number(r.points),
  }))
}

async function saveTable(
  db: Client,
  sessionId: string,
  competitionId: string,
  table: Awaited<ReturnType<typeof loadTable>>,
) {
  for (const row of table) {
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
}

/** Simulate a single fixture without user economy (AI matches). */
export async function simAiFixture(
  db: Client,
  sessionId: string,
  fixtureId: string,
  secret: string,
): Promise<{ homeGoals: number; awayGoals: number }> {
  await ensureFootballData(db)
  const fx = (
    await db.execute({
      sql: `SELECT * FROM fixtures WHERE session_id = ? AND id = ?`,
      args: [sessionId, fixtureId],
    })
  ).rows[0]
  if (!fx) throw new Error('fixture missing')
  if (fx.status === 'played') {
    return { homeGoals: Number(fx.home_goals), awayGoals: Number(fx.away_goals) }
  }

  const home = sideFromClub(String(fx.home_club_id))
  const away = sideFromClub(String(fx.away_club_id))
  const result = simulateMatch(String(fx.seed), home, away)
  const competitionId = String(fx.competition_id)

  await db.execute({
    sql: `UPDATE fixtures SET status='played', home_goals=?, away_goals=? WHERE session_id=? AND id=?`,
    args: [result.homeGoals, result.awayGoals, sessionId, fixtureId],
  })

  let table = await loadTable(db, sessionId, competitionId)
  table = applyResult(
    table,
    String(fx.home_club_id),
    String(fx.away_club_id),
    result.homeGoals,
    result.awayGoals,
  )
  await saveTable(db, sessionId, competitionId, table)

  const eventsJson = JSON.stringify(result.events)
  const hmac = hmacHex(secret, `${fixtureId}:${result.homeGoals}:${result.awayGoals}`)
  await db.execute({
    sql: `INSERT OR IGNORE INTO match_snapshots
      (id, session_id, fixture_id, events_json, home_goals, away_goals, hmac, created_at)
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

  return { homeGoals: result.homeGoals, awayGoals: result.awayGoals }
}

/** After user plays, sim all other fixtures on same matchday. */
export async function simRestOfMatchday(
  db: Client,
  sessionId: string,
  matchday: number,
  competitionId: string,
  secret: string,
  userClubId: string,
): Promise<number> {
  const rows = (
    await db.execute({
      sql: `SELECT id, home_club_id, away_club_id FROM fixtures
        WHERE session_id=? AND competition_id=? AND matchday=? AND status='scheduled'`,
      args: [sessionId, competitionId, matchday],
    })
  ).rows

  let n = 0
  for (const r of rows) {
    const home = String(r.home_club_id)
    const away = String(r.away_club_id)
    if (home === userClubId || away === userClubId) continue
    await simAiFixture(db, sessionId, String(r.id), secret)
    n++
  }
  return n
}

/** Sim all remaining scheduled fixtures (skip user club or include with force). */
export async function simRestOfSeason(
  db: Client,
  sessionId: string,
  secret: string,
  opts: { includeUser?: boolean } = {},
): Promise<{ simulated: number; promoted?: string | null }> {
  await ensureFootballData(db)
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  if (!career) throw createError({ statusCode: 404, statusMessage: 'No career' })

  const userClub = String(career.club_id)
  const rows = (
    await db.execute({
      sql: `SELECT id, home_club_id, away_club_id FROM fixtures
        WHERE session_id=? AND status='scheduled' ORDER BY matchday ASC`,
      args: [sessionId],
    })
  ).rows

  let simulated = 0
  for (const r of rows) {
    const home = String(r.home_club_id)
    const away = String(r.away_club_id)
    if (!opts.includeUser && (home === userClub || away === userClub)) continue
    await simAiFixture(db, sessionId, String(r.id), secret)
    simulated++
  }

  // If no user fixtures left, try season end
  const left = (
    await db.execute({
      sql: `SELECT COUNT(*) as c FROM fixtures WHERE session_id=? AND status='scheduled'
        AND (home_club_id=? OR away_club_id=?)`,
      args: [sessionId, userClub, userClub],
    })
  ).rows[0]
  let promoted: string | null = null
  if (Number(left?.c ?? 0) === 0) {
    // Finish any remaining AI fixtures
    const more = (
      await db.execute({
        sql: `SELECT id FROM fixtures WHERE session_id=? AND status='scheduled'`,
        args: [sessionId],
      })
    ).rows
    for (const r of more) {
      await simAiFixture(db, sessionId, String(r.id), secret)
      simulated++
    }
    promoted = await endSeason(db, sessionId, secret)
  }

  return { simulated, promoted }
}

export async function endSeason(
  db: Client,
  sessionId: string,
  secret: string,
): Promise<string | null> {
  await ensureFootballData(db)
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id = ?`,
      args: [sessionId],
    })
  ).rows[0]
  if (!career) return null

  const division = String(career.division) as DivisionId
  const season = Number(career.season)
  const userClub = String(career.club_id)

  let table = await loadTable(db, sessionId, division)
  table = sortTable(table)
  const rank = table.findIndex((r) => r.clubId === userClub) + 1
  const champion = table[0]?.clubId

  // Promote user if top 4 (or champion for cups later)
  let newDivision = division
  let reputation = Number(career.reputation)
  let board = Number(career.board_confidence)
  let cash = Number(career.cash)

  if (rank > 0 && rank <= 4) {
    const next = nextDivision(division)
    if (next && ['serie_c', 'serie_b', 'serie_a', 'copa_do_brasil', 'libertadores', 'club_world_cup'].includes(next)) {
      newDivision = next
      reputation = Math.min(99, reputation + 8)
      board = Math.min(100, board + 10)
      cash += 250_000
    }
  } else if (rank > table.length - 2 && table.length > 4) {
    // soft relegation board hit
    board = Math.max(10, board - 15)
    reputation = Math.max(10, reputation - 3)
  }

  const prize = rank === 1 ? 500_000 : rank <= 4 ? 150_000 : 25_000
  cash += prize

  await db.execute({
    sql: `INSERT INTO inbox_messages (id, session_id, subject, body, read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)`,
    args: [
      randomUUID(),
      sessionId,
      `Fim da temporada ${season}`,
      `Posição: ${rank}º. ${newDivision !== division ? `Promoção para ${newDivision}!` : 'Temporada encerrada.'} Bônus R$ ${prize}. Campeão: ${clubById(champion ?? '')?.name ?? champion}`,
      Date.now(),
    ],
  })

  // Reset fixtures for new season
  await db.execute({
    sql: `DELETE FROM fixtures WHERE session_id = ?`,
    args: [sessionId],
  })
  await db.execute({
    sql: `DELETE FROM league_table WHERE session_id = ?`,
    args: [sessionId],
  })
  await db.execute({
    sql: `DELETE FROM match_snapshots WHERE session_id = ?`,
    args: [sessionId],
  })

  const clubs = loadClubs()
  const fixtures = generateRoundRobin(clubs, newDivision, season + 1, `${sessionId}:${season + 1}`, 1)
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
      args: [sessionId, newDivision, row.clubId],
    })
  }

  // Cup bracket (quarter-final style 8 teams)
  await db.execute({ sql: `DELETE FROM cup_ties WHERE session_id = ?`, args: [sessionId] })
  const cupClubs = sortTable(table).slice(0, 8)
  if (cupClubs.length >= 4) {
    const rng = createRng(`${sessionId}:cup:${season + 1}`)
    const shuffled = [...cupClubs].sort(() => rng.next() - 0.5)
    for (let i = 0; i + 1 < Math.min(8, shuffled.length); i += 2) {
      const home = shuffled[i]!
      const away = shuffled[i + 1]!
      const seed = `${sessionId}:copa:${season + 1}:${home.clubId}:${away.clubId}`
      await db.execute({
        sql: `INSERT INTO cup_ties
          (id, session_id, competition_id, round, home_club_id, away_club_id, status, seed)
          VALUES (?, ?, 'copa_do_brasil', 'QF', ?, ?, 'scheduled', ?)`,
        args: [randomUUID(), sessionId, home.clubId, away.clubId, seed],
      })
    }
  }

  // Youth intake
  const rng = createRng(`${sessionId}:youth:${season + 1}`)
  const positions = ['GK', 'CB', 'CM', 'ST', 'LW']
  const names = ['Silva', 'Santos', 'Lima', 'Costa', 'Souza']
  for (let i = 0; i < 3; i++) {
    await db.execute({
      sql: `INSERT INTO youth_players (id, session_id, name, position, age, potential, overall, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'academy')`,
      args: [
        randomUUID(),
        sessionId,
        `${rng.pick(['João', 'Pedro', 'Lucas'])} ${rng.pick(names)}`,
        rng.pick(positions),
        16 + rng.int(0, 2),
        60 + rng.int(0, 25),
        45 + rng.int(0, 15),
      ],
    })
  }

  await db.execute({
    sql: `UPDATE career_state SET division=?, season=?, reputation=?, board_confidence=?, cash=?, season_day=1, updated_at=?
      WHERE session_id=?`,
    args: [newDivision, season + 1, reputation, board, cash, Date.now(), sessionId],
  })

  const payload = JSON.stringify({
    type: 'season.ended',
    season,
    rank,
    newDivision,
    prize,
  })
  const last = (
    await db.execute({
      sql: `SELECT seq, payload_hash FROM snapshots WHERE session_id=? ORDER BY seq DESC LIMIT 1`,
      args: [sessionId],
    })
  ).rows[0]
  const seq = Number(last?.seq ?? 0) + 1
  const prev = String(last?.payload_hash ?? GENESIS_HASH)
  const link = chainLink(secret, prev, payload)
  await db.execute({
    sql: `INSERT INTO snapshots (id, session_id, seq, kind, payload_json, prev_hash, payload_hash, hmac, created_at)
      VALUES (?, ?, ?, 'season.ended', ?, ?, ?, ?, ?)`,
    args: [randomUUID(), sessionId, seq, payload, prev, link.payloadHash, link.hmac, Date.now()],
  })

  return newDivision !== division ? newDivision : null
}

export async function ensureTactics(db: Client, sessionId: string) {
  const r = await db.execute({
    sql: `SELECT session_id FROM tactics WHERE session_id=?`,
    args: [sessionId],
  })
  if (!r.rows.length) {
    await db.execute({
      sql: `INSERT INTO tactics (session_id, formation, mentality, pressing, tempo, width)
        VALUES (?, '4-3-3', 'balanced', 50, 50, 50)`,
      args: [sessionId],
    })
  }
}

export async function getTactics(db: Client, sessionId: string) {
  await ensureTactics(db, sessionId)
  const r = (
    await db.execute({ sql: `SELECT * FROM tactics WHERE session_id=?`, args: [sessionId] })
  ).rows[0]!
  return {
    formation: String(r.formation),
    mentality: String(r.mentality),
    pressing: Number(r.pressing),
    tempo: Number(r.tempo),
    width: Number(r.width),
  }
}

export async function setTactics(
  db: Client,
  sessionId: string,
  body: {
    formation?: string
    mentality?: string
    pressing?: number
    tempo?: number
    width?: number
  },
) {
  await ensureTactics(db, sessionId)
  const cur = await getTactics(db, sessionId)
  const next = {
    formation: body.formation ?? cur.formation,
    mentality: body.mentality ?? cur.mentality,
    pressing: body.pressing ?? cur.pressing,
    tempo: body.tempo ?? cur.tempo,
    width: body.width ?? cur.width,
  }
  await db.execute({
    sql: `UPDATE tactics SET formation=?, mentality=?, pressing=?, tempo=?, width=? WHERE session_id=?`,
    args: [next.formation, next.mentality, next.pressing, next.tempo, next.width, sessionId],
  })
  return next
}

export async function ensureTransferList(db: Client, sessionId: string) {
  await ensureFootballData(db)
  const count = (
    await db.execute({
      sql: `SELECT COUNT(*) as c FROM transfer_list WHERE session_id=? AND status='listed'`,
      args: [sessionId],
    })
  ).rows[0]
  if (Number(count?.c ?? 0) > 0) return

  const career = (
    await db.execute({
      sql: `SELECT club_id FROM career_state WHERE session_id=?`,
      args: [sessionId],
    })
  ).rows[0]
  const userClub = String(career?.club_id ?? '')
  const players = loadPlayers()
    .filter((p) => p.clubId !== userClub)
    .slice(0, 40)

  for (const p of players) {
    await db.execute({
      sql: `INSERT INTO transfer_list
        (id, session_id, player_key, name, position, overall, age, asking_price, wage, club_from, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'listed')`,
      args: [
        randomUUID(),
        sessionId,
        p.key,
        p.name,
        p.position,
        p.overall,
        p.age,
        p.value,
        p.wage,
        p.clubId,
      ],
    })
  }
}

export async function listTransfers(db: Client, sessionId: string) {
  await ensureTransferList(db, sessionId)
  const rows = (
    await db.execute({
      sql: `SELECT * FROM transfer_list WHERE session_id=? AND status='listed' ORDER BY overall DESC LIMIT 50`,
      args: [sessionId],
    })
  ).rows
  return rows.map((r) => ({
    id: String(r.id),
    playerKey: String(r.player_key),
    name: String(r.name),
    position: String(r.position),
    overall: Number(r.overall),
    age: Number(r.age),
    askingPrice: Number(r.asking_price),
    wage: Number(r.wage),
    clubFrom: String(r.club_from),
    clubFromName: clubById(String(r.club_from))?.name ?? r.club_from,
  }))
}

export async function buyTransfer(db: Client, sessionId: string, listingId: string) {
  const career = (
    await db.execute({
      sql: `SELECT * FROM career_state WHERE session_id=?`,
      args: [sessionId],
    })
  ).rows[0]
  if (!career) throw createError({ statusCode: 404, statusMessage: 'No career' })

  const listing = (
    await db.execute({
      sql: `SELECT * FROM transfer_list WHERE session_id=? AND id=? AND status='listed'`,
      args: [sessionId, listingId],
    })
  ).rows[0]
  if (!listing) throw createError({ statusCode: 404, statusMessage: 'Listing not found' })

  const price = Number(listing.asking_price)
  const cash = Number(career.cash)
  if (cash < price) throw createError({ statusCode: 400, statusMessage: 'Insufficient cash' })

  const seed = loadPlayers().find((p) => p.key === String(listing.player_key))
  await db.execute({
    sql: `INSERT INTO squad_players
      (id, session_id, club_id, player_key, name, position, age, overall, pace, shooting, passing, defending, physical, morale, fitness, wage, value, shirt_number, starter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 70, 100, ?, ?, ?, 0)`,
    args: [
      randomUUID(),
      sessionId,
      String(career.club_id),
      String(listing.player_key),
      String(listing.name),
      String(listing.position),
      Number(listing.age),
      Number(listing.overall),
      seed?.pace ?? Number(listing.overall),
      seed?.shooting ?? Number(listing.overall),
      seed?.passing ?? Number(listing.overall),
      seed?.defending ?? Number(listing.overall),
      seed?.physical ?? Number(listing.overall),
      Number(listing.wage),
      price,
      99,
    ],
  })

  await db.execute({
    sql: `UPDATE transfer_list SET status='sold' WHERE id=? AND session_id=?`,
    args: [listingId, sessionId],
  })
  await db.execute({
    sql: `UPDATE career_state SET cash = cash - ?, updated_at=? WHERE session_id=?`,
    args: [price, Date.now(), sessionId],
  })
  await db.execute({
    sql: `INSERT INTO finance_ledger (id, session_id, day, kind, amount, note, created_at)
      VALUES (?, ?, ?, 'transfer_out', ?, ?, ?)`,
    args: [
      randomUUID(),
      sessionId,
      Number(career.season_day),
      -price,
      `Contratação: ${listing.name}`,
      Date.now(),
    ],
  })

  return { ok: true, spent: price, player: String(listing.name) }
}

export async function promoteYouth(db: Client, sessionId: string, youthId: string) {
  const y = (
    await db.execute({
      sql: `SELECT * FROM youth_players WHERE session_id=? AND id=? AND status='academy'`,
      args: [sessionId, youthId],
    })
  ).rows[0]
  if (!y) throw createError({ statusCode: 404, statusMessage: 'Youth not found' })

  const career = (
    await db.execute({
      sql: `SELECT club_id FROM career_state WHERE session_id=?`,
      args: [sessionId],
    })
  ).rows[0]
  const ovr = Number(y.overall)
  await db.execute({
    sql: `INSERT INTO squad_players
      (id, session_id, club_id, player_key, name, position, age, overall, pace, shooting, passing, defending, physical, morale, fitness, wage, value, shirt_number, starter)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 75, 100, ?, ?, 30, 0)`,
    args: [
      randomUUID(),
      sessionId,
      String(career?.club_id),
      `youth_${y.id}`,
      String(y.name),
      String(y.position),
      Number(y.age),
      ovr,
      ovr,
      ovr,
      ovr,
      ovr,
      ovr,
      ovr * 50,
      ovr * ovr * 80,
    ],
  })
  await db.execute({
    sql: `UPDATE youth_players SET status='promoted' WHERE id=? AND session_id=?`,
    args: [youthId, sessionId],
  })
  return { ok: true }
}

export async function startFantasy(
  db: Client,
  sessionId: string,
  mode: string,
  clubId: string,
) {
  await ensureFootballData(db)
  const club = clubById(clubId)
  if (!club) throw createError({ statusCode: 400, statusMessage: 'Invalid club' })

  const id = randomUUID()
  const now = Date.now()
  const state = {
    mode,
    matchday: 1,
    played: 0,
    points: 0,
    history: [] as Array<{ opp: string; hg: number; ag: number }>,
  }
  await db.execute({
    sql: `INSERT INTO fantasy_saves (id, session_id, mode, club_id, competition_id, state_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'serie_a', ?, ?, ?)`,
    args: [id, sessionId, mode, clubId, JSON.stringify(state), now, now],
  })
  return { id, clubId, clubName: club.name, mode, state }
}

export async function playFantasyMatch(db: Client, sessionId: string, fantasyId: string, secret: string) {
  await ensureFootballData(db)
  const row = (
    await db.execute({
      sql: `SELECT * FROM fantasy_saves WHERE session_id=? AND id=?`,
      args: [sessionId, fantasyId],
    })
  ).rows[0]
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Fantasy save not found' })

  const state = JSON.parse(String(row.state_json)) as {
    mode: string
    matchday: number
    played: number
    points: number
    history: Array<{ opp: string; hg: number; ag: number; seed: string }>
  }
  const clubs = loadClubs().filter((c) => c.id !== String(row.club_id))
  const rng = createRng(`${fantasyId}:${state.matchday}`)
  const opp = rng.pick(clubs)
  const home = sideFromClub(String(row.club_id))
  const away = sideFromClub(opp.id)
  const seed = `${fantasyId}:md${state.matchday}`
  const result = simulateMatch(seed, home, away)

  let pts = 0
  if (result.homeGoals > result.awayGoals) pts = 3
  else if (result.homeGoals === result.awayGoals) pts = 1

  state.played++
  state.points += pts
  state.matchday++
  state.history.push({
    opp: opp.name,
    hg: result.homeGoals,
    ag: result.awayGoals,
    seed,
  })

  await db.execute({
    sql: `UPDATE fantasy_saves SET state_json=?, updated_at=? WHERE id=? AND session_id=?`,
    args: [JSON.stringify(state), Date.now(), fantasyId, sessionId],
  })

  return {
    fantasyId,
    home: home.name,
    away: away.name,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    events: result.events,
    duration_ms_1x: result.duration_ms_1x,
    state,
    pointsGained: pts,
  }
}

export async function getCupBracket(db: Client, sessionId: string) {
  await ensureFootballData(db)
  const rows = (
    await db.execute({
      sql: `SELECT * FROM cup_ties WHERE session_id=? ORDER BY round ASC`,
      args: [sessionId],
    })
  ).rows
  return {
    ties: rows.map((r) => ({
      id: String(r.id),
      round: String(r.round),
      home: {
        id: String(r.home_club_id),
        name: clubById(String(r.home_club_id))?.name ?? r.home_club_id,
      },
      away: {
        id: String(r.away_club_id),
        name: clubById(String(r.away_club_id))?.name ?? r.away_club_id,
      },
      homeGoals: r.home_goals,
      awayGoals: r.away_goals,
      status: String(r.status),
    })),
  }
}

export async function simCupTie(db: Client, sessionId: string, tieId: string) {
  await ensureFootballData(db)
  const r = (
    await db.execute({
      sql: `SELECT * FROM cup_ties WHERE session_id=? AND id=?`,
      args: [sessionId, tieId],
    })
  ).rows[0]
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Tie not found' })
  if (r.status === 'played') {
    return { homeGoals: r.home_goals, awayGoals: r.away_goals }
  }
  const result = simulateMatch(
    String(r.seed),
    sideFromClub(String(r.home_club_id)),
    sideFromClub(String(r.away_club_id)),
  )
  await db.execute({
    sql: `UPDATE cup_ties SET status='played', home_goals=?, away_goals=? WHERE id=? AND session_id=?`,
    args: [result.homeGoals, result.awayGoals, tieId, sessionId],
  })
  return {
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    events: result.events,
  }
}

export async function installPatch(db: Client, sessionId: string, slug: string) {
  await db.execute({
    sql: `INSERT OR REPLACE INTO patches_installed (session_id, slug, installed_at) VALUES (?, ?, ?)`,
    args: [sessionId, slug, Date.now()],
  })
  return { ok: true, slug }
}

export async function listPatches(db: Client, sessionId: string) {
  const installed = (
    await db.execute({
      sql: `SELECT slug, installed_at FROM patches_installed WHERE session_id=?`,
      args: [sessionId],
    })
  ).rows
  return {
    available: [
      {
        slug: 'minimal-generic-shields',
        title: 'Minimalist generic shields',
        description: 'Opt-in alternative crests (sample patch)',
      },
    ],
    installed: installed.map((r) => ({
      slug: String(r.slug),
      installedAt: Number(r.installed_at),
    })),
  }
}

export async function listYouth(db: Client, sessionId: string) {
  const rows = (
    await db.execute({
      sql: `SELECT * FROM youth_players WHERE session_id=? AND status='academy'`,
      args: [sessionId],
    })
  ).rows
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    position: String(r.position),
    age: Number(r.age),
    potential: Number(r.potential),
    overall: Number(r.overall),
  }))
}

export async function setStarters(db: Client, sessionId: string, playerIds: string[]) {
  await db.execute({
    sql: `UPDATE squad_players SET starter=0 WHERE session_id=?`,
    args: [sessionId],
  })
  for (const id of playerIds.slice(0, 11)) {
    await db.execute({
      sql: `UPDATE squad_players SET starter=1 WHERE session_id=? AND id=?`,
      args: [sessionId, id],
    })
  }
  return { ok: true, count: Math.min(11, playerIds.length) }
}
