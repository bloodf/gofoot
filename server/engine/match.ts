/**
 * Deterministic match simulator — server-side only.
 * 5-min default pacing: real_ts_ms = minute * (300_000 / 90) at 1x.
 */
import { createRng, type Rng } from './rng'

export type MatchEventType =
  | 'kickoff'
  | 'half_time'
  | 'full_time'
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_miss'
  | 'shot'
  | 'shot_on_target'
  | 'save'
  | 'block'
  | 'tackle'
  | 'interception'
  | 'clearance'
  | 'aerial'
  | 'foul'
  | 'last_man_foul'
  | 'offside'
  | 'var_check'
  | 'var_overturn'
  | 'corner'
  | 'free_kick'
  | 'throw_in'
  | 'long_ball'
  | 'through_ball'
  | 'dribble'
  | 'nutmeg'
  | 'yellow_card'
  | 'second_yellow'
  | 'red_card'
  | 'sub'
  | 'injury'
  | 'goal_line_clearance'
  | 'weather'
  | 'crowd'
  | 'morale'

export interface MatchSide {
  clubId: string
  name: string
  attack: number
  midfield: number
  defense: number
  goalkeeping: number
}

export interface MatchEvent {
  id: string
  type: MatchEventType
  minute: number
  /** Wall-clock offset from match start at 1x (ms). Client divides by speed. */
  real_ts_ms: number
  team?: 'home' | 'away'
  player?: string
  assist?: string
  text_pt: string
  text_en: string
  home_score: number
  away_score: number
  meta?: Record<string, unknown>
}

export interface MatchResult {
  seed: string
  home: MatchSide
  away: MatchSide
  homeGoals: number
  awayGoals: number
  events: MatchEvent[]
  duration_ms_1x: number
}

const MATCH_MS_1X = 300_000
const MS_PER_MINUTE = MATCH_MS_1X / 90

function strength(side: MatchSide): number {
  return (side.attack + side.midfield + side.defense + side.goalkeeping) / 4
}

function mkEvent(
  rng: Rng,
  partial: Omit<MatchEvent, 'id' | 'real_ts_ms'> & { real_ts_ms?: number },
): MatchEvent {
  return {
    id: `ev_${rng.int(1e8, 9e8)}`,
    real_ts_ms: partial.real_ts_ms ?? Math.round(partial.minute * MS_PER_MINUTE),
    ...partial,
  }
}

const EVENT_POOL: Array<{ type: MatchEventType; weight: number; scoring?: boolean }> = [
  { type: 'shot', weight: 18 },
  { type: 'shot_on_target', weight: 10 },
  { type: 'save', weight: 8 },
  { type: 'block', weight: 6 },
  { type: 'tackle', weight: 12 },
  { type: 'interception', weight: 8 },
  { type: 'clearance', weight: 6 },
  { type: 'aerial', weight: 5 },
  { type: 'foul', weight: 10 },
  { type: 'offside', weight: 5 },
  { type: 'corner', weight: 8 },
  { type: 'free_kick', weight: 5 },
  { type: 'throw_in', weight: 7 },
  { type: 'long_ball', weight: 6 },
  { type: 'through_ball', weight: 5 },
  { type: 'dribble', weight: 6 },
  { type: 'nutmeg', weight: 1 },
  { type: 'yellow_card', weight: 3 },
  { type: 'injury', weight: 1 },
  { type: 'var_check', weight: 1 },
  { type: 'crowd', weight: 2 },
  { type: 'weather', weight: 1 },
  { type: 'goal_line_clearance', weight: 1 },
]

function pickWeighted(rng: Rng): MatchEventType {
  const total = EVENT_POOL.reduce((s, e) => s + e.weight, 0)
  let r = rng.next() * total
  for (const e of EVENT_POOL) {
    r -= e.weight
    if (r <= 0) return e.type
  }
  return 'shot'
}

function describe(
  type: MatchEventType,
  teamName: string,
  other: string,
  player: string,
): { pt: string; en: string } {
  const map: Partial<Record<MatchEventType, { pt: string; en: string }>> = {
    goal: {
      pt: `GOOOL! ${player} marca para ${teamName}!`,
      en: `GOAL! ${player} scores for ${teamName}!`,
    },
    own_goal: {
      pt: `Gol contra de ${player}! Azar para ${teamName}.`,
      en: `Own goal by ${player}! Unlucky for ${teamName}.`,
    },
    penalty_goal: {
      pt: `Pênalti convertido! ${player} não perdoa.`,
      en: `Penalty converted! ${player} makes no mistake.`,
    },
    penalty_miss: {
      pt: `Pênalti perdido por ${player}!`,
      en: `Penalty missed by ${player}!`,
    },
    shot: { pt: `Finalização de ${player} (${teamName}).`, en: `Shot by ${player} (${teamName}).` },
    shot_on_target: {
      pt: `Chute no alvo de ${player}!`,
      en: `Shot on target by ${player}!`,
    },
    save: { pt: `Defesa espetacular do goleiro de ${teamName}!`, en: `Brilliant save for ${teamName}!` },
    block: { pt: `Bloqueio importante de ${player}.`, en: `Important block by ${player}.` },
    tackle: { pt: `Desarme firme de ${player}.`, en: `Strong tackle by ${player}.` },
    interception: { pt: `Interceptação de ${player}.`, en: `Interception by ${player}.` },
    clearance: { pt: `Afasta ${player} o perigo.`, en: `${player} clears the danger.` },
    aerial: { pt: `Disputa aérea vencida por ${player}.`, en: `Aerial won by ${player}.` },
    foul: { pt: `Falta de ${player} em ${other}.`, en: `Foul by ${player} on ${other}.` },
    last_man_foul: {
      pt: `Falta do último homem! ${player} em apuros.`,
      en: `Last-man foul! ${player} in trouble.`,
    },
    offside: { pt: `Impedimento de ${player}.`, en: `Offside against ${player}.` },
    var_check: { pt: `VAR confere o lance…`, en: `VAR is checking…` },
    var_overturn: { pt: `VAR anula o lance!`, en: `VAR overturns the decision!` },
    corner: { pt: `Escanteio para ${teamName}.`, en: `Corner for ${teamName}.` },
    free_kick: { pt: `Falta a favor de ${teamName}.`, en: `Free kick for ${teamName}.` },
    throw_in: { pt: `Lateral para ${teamName}.`, en: `Throw-in for ${teamName}.` },
    long_ball: { pt: `Bola longa de ${player}.`, en: `Long ball from ${player}.` },
    through_ball: { pt: `Passe em profundidade de ${player}!`, en: `Through ball by ${player}!` },
    dribble: { pt: `${player} dribla a marcação.`, en: `${player} dribbles past the marker.` },
    nutmeg: { pt: `Caneta de ${player}! A torcida vibra.`, en: `Nutmeg by ${player}! Crowd erupts.` },
    yellow_card: { pt: `Cartão amarelo para ${player}.`, en: `Yellow card for ${player}.` },
    second_yellow: {
      pt: `Segundo amarelo! ${player} expulso.`,
      en: `Second yellow! ${player} sent off.`,
    },
    red_card: { pt: `Vermelho direto para ${player}!`, en: `Straight red for ${player}!` },
    sub: { pt: `Substituição em ${teamName}: entra ${player}.`, en: `Sub for ${teamName}: on comes ${player}.` },
    injury: { pt: `${player} sente o físico e pede atenção.`, en: `${player} is down injured.` },
    goal_line_clearance: {
      pt: `Tira em cima da linha! ${player} salva ${teamName}.`,
      en: `Goal-line clearance! ${player} saves ${teamName}.`,
    },
    weather: { pt: `Chuva fina começa a cair no estádio.`, en: `Light rain starts falling.` },
    crowd: { pt: `A torcida de ${teamName} empurra o time!`, en: `${teamName} fans push the team!` },
    morale: { pt: `${player} levanta o time com um grito.`, en: `${player} rallies the team.` },
    kickoff: { pt: `Bola rolando!`, en: `Kick-off!` },
    half_time: { pt: `Intervalo.`, en: `Half-time.` },
    full_time: { pt: `Fim de jogo!`, en: `Full-time!` },
  }
  return map[type] ?? { pt: `${type} — ${teamName}`, en: `${type} — ${teamName}` }
}

const NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Lima',
  'Costa',
  'Ferreira',
  'Almeida',
  'Ribeiro',
  'Carvalho',
  'Gomes',
  'Martins',
  'Rocha',
  'Barbosa',
  'Dias',
  'Nunes',
  'Moreira',
  'Teixeira',
  'Mendes',
  'Araujo',
]

export function simulateMatch(
  seed: string,
  home: MatchSide,
  away: MatchSide,
): MatchResult {
  const rng = createRng(seed)
  let homeGoals = 0
  let awayGoals = 0
  const events: MatchEvent[] = []

  const push = (partial: Omit<MatchEvent, 'id' | 'real_ts_ms' | 'home_score' | 'away_score'>) => {
    events.push(
      mkEvent(rng, {
        ...partial,
        home_score: homeGoals,
        away_score: awayGoals,
      }),
    )
  }

  push({
    type: 'kickoff',
    minute: 0,
    text_pt: describe('kickoff', home.name, away.name, '').pt,
    text_en: describe('kickoff', home.name, away.name, '').en,
  })

  const homeStr = strength(home)
  const awayStr = strength(away)
  const total = homeStr + awayStr
  const homeChance = homeStr / total

  // Expected goals ~ 2.4 combined, scaled by attack vs defense
  const xgHome = (1.35 * home.attack) / Math.max(40, away.defense)
  const xgAway = (1.15 * away.attack) / Math.max(40, home.defense)

  const minutes = new Set<number>()
  // ~40–55 live events across 90'
  const eventCount = rng.int(40, 55)
  while (minutes.size < eventCount) {
    minutes.add(rng.int(1, 90))
  }
  // Ensure HT/FT markers
  const ordered = [...minutes].sort((a, b) => a - b)

  let yellows: Record<string, number> = {}

  for (const minute of ordered) {
    if (minute === 45) {
      push({
        type: 'half_time',
        minute: 45,
        text_pt: `Intervalo: ${home.name} ${homeGoals} x ${awayGoals} ${away.name}`,
        text_en: `Half-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`,
      })
    }

    const team: 'home' | 'away' = rng.chance(homeChance) ? 'home' : 'away'
    const side = team === 'home' ? home : away
    const opp = team === 'home' ? away : home
    const player = rng.pick(NAMES)
    const other = rng.pick(NAMES)

    // Goal attempt based on xG share
    const teamXg = team === 'home' ? xgHome : xgAway
    const goalP = Math.min(0.22, teamXg / 12)

    if (rng.chance(goalP)) {
      let type: MatchEventType = 'goal'
      if (rng.chance(0.08)) type = 'own_goal'
      else if (rng.chance(0.12)) type = 'penalty_goal'
      else if (rng.chance(0.1)) {
        // header/volley flavor via meta
        type = 'goal'
      }

      if (type === 'own_goal') {
        if (team === 'home') awayGoals++
        else homeGoals++
      } else {
        if (team === 'home') homeGoals++
        else awayGoals++
      }

      const d = describe(type, side.name, opp.name, player)
      push({
        type,
        minute,
        team: type === 'own_goal' ? team : team,
        player,
        text_pt: d.pt,
        text_en: d.en,
        meta: { style: rng.pick(['open_play', 'header', 'volley', 'free_kick']) },
      })

      if (rng.chance(0.15)) {
        push({
          type: 'var_check',
          minute,
          team,
          text_pt: describe('var_check', side.name, opp.name, player).pt,
          text_en: describe('var_check', side.name, opp.name, player).en,
        })
      }
      continue
    }

    if (rng.chance(0.03)) {
      // penalty miss sequence
      const d = describe('penalty_miss', side.name, opp.name, player)
      push({
        type: 'penalty_miss',
        minute,
        team,
        player,
        text_pt: d.pt,
        text_en: d.en,
      })
      continue
    }

    let type = pickWeighted(rng)

    if (type === 'yellow_card') {
      yellows[player] = (yellows[player] ?? 0) + 1
      if (yellows[player] >= 2) type = 'second_yellow'
    }
    if (type === 'foul' && rng.chance(0.05)) type = 'last_man_foul'
    if (type === 'last_man_foul' && rng.chance(0.6)) {
      push({
        type: 'red_card',
        minute,
        team,
        player,
        text_pt: describe('red_card', side.name, opp.name, player).pt,
        text_en: describe('red_card', side.name, opp.name, player).en,
      })
      continue
    }

    if (minute >= 55 && minute <= 85 && rng.chance(0.08)) {
      type = 'sub'
    }

    const d = describe(type, side.name, opp.name, player)
    push({
      type,
      minute,
      team,
      player,
      text_pt: d.pt,
      text_en: d.en,
    })
  }

  // Guarantee half-time if not present
  if (!events.some((e) => e.type === 'half_time')) {
    push({
      type: 'half_time',
      minute: 45,
      text_pt: `Intervalo: ${home.name} ${homeGoals} x ${awayGoals} ${away.name}`,
      text_en: `Half-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`,
    })
    events.sort((a, b) => a.minute - b.minute || a.real_ts_ms - b.real_ts_ms)
  }

  push({
    type: 'full_time',
    minute: 90,
    text_pt: `Fim de jogo: ${home.name} ${homeGoals} x ${awayGoals} ${away.name}`,
    text_en: `Full-time: ${home.name} ${homeGoals} - ${awayGoals} ${away.name}`,
  })

  return {
    seed,
    home,
    away,
    homeGoals,
    awayGoals,
    events,
    duration_ms_1x: MATCH_MS_1X,
  }
}

export { MATCH_MS_1X, MS_PER_MINUTE }
