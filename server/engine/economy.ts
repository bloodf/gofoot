/**
 * Economy: ticket elasticity, sponsor fees, loan installments.
 * All decisions are pure functions — persist on server after.
 */
import { createRng } from './rng'

export interface TicketState {
  basePrice: number
  elasticity: number
  capacity: number
  reputation: number
  homeDraw: boolean
}

export interface TicketOutcome {
  price: number
  attendance: number
  revenue: number
}

/** Higher price → lower demand; elasticity is demand sensitivity. */
export function sellTickets(state: TicketState, price: number): TicketOutcome {
  const fair = state.basePrice * (0.8 + state.reputation / 200)
  const demandFactor = Math.exp(-state.elasticity * ((price - fair) / Math.max(1, fair)))
  const homeBoost = state.homeDraw ? 1.12 : 1
  const raw = state.capacity * 0.55 * demandFactor * homeBoost * (0.7 + state.reputation / 150)
  const attendance = Math.max(0, Math.min(state.capacity, Math.round(raw)))
  return { price, attendance, revenue: attendance * price }
}

export interface SponsorOffer {
  brandId: string
  brandName: string
  tier: string
  weeklyFee: number
  round: number
}

export function negotiateSponsor(
  seed: string,
  brand: { id: string; name: string; tier: string },
  reputation: number,
  playerAsk: number,
  round: number,
): { accepted: boolean; offer: SponsorOffer; counter: number } {
  const rng = createRng(`${seed}:sponsor:${brand.id}:${round}`)
  const tierMul = brand.tier === 'national' ? 1.4 : brand.tier === 'regional' ? 1.0 : 0.7
  const fair = 8000 * tierMul * (0.5 + reputation / 100)
  const noise = 0.85 + rng.next() * 0.3
  const offerFee = Math.round(fair * noise)
  const counter = Math.round(offerFee * (1.05 + round * 0.03))
  const maxAccept = offerFee * (1.15 + round * 0.05)
  const accepted = playerAsk <= maxAccept
  return {
    accepted,
    offer: {
      brandId: brand.id,
      brandName: brand.name,
      tier: brand.tier,
      weeklyFee: accepted ? Math.min(playerAsk, counter) : offerFee,
      round,
    },
    counter,
  }
}

export interface LoanState {
  principal: number
  remaining: number
  installment: number
  weeksLeft: number
  interestRate: number
  status: 'active' | 'paid' | 'defaulted'
}

export function createLoan(principal: number, weeks: number, annualRate: number): LoanState {
  const interest = principal * (annualRate * (weeks / 52))
  const total = principal + interest
  const installment = Math.round((total / weeks) * 100) / 100
  return {
    principal,
    remaining: total,
    installment,
    weeksLeft: weeks,
    interestRate: annualRate,
    status: 'active',
  }
}

export function tickLoan(loan: LoanState, cash: number): {
  loan: LoanState
  cash: number
  paid: number
  defaulted: boolean
} {
  if (loan.status !== 'active') return { loan, cash, paid: 0, defaulted: false }
  if (cash < loan.installment) {
    return {
      loan: { ...loan, status: 'defaulted' },
      cash,
      paid: 0,
      defaulted: true,
    }
  }
  const paid = Math.min(loan.installment, loan.remaining)
  const remaining = Math.round((loan.remaining - paid) * 100) / 100
  const weeksLeft = loan.weeksLeft - 1
  const status = remaining <= 0 || weeksLeft <= 0 ? 'paid' : 'active'
  return {
    loan: {
      ...loan,
      remaining: Math.max(0, remaining),
      weeksLeft: Math.max(0, weeksLeft),
      status,
    },
    cash: cash - paid,
    paid,
    defaulted: false,
  }
}

export function weeklyWageBill(wages: number[]): number {
  return wages.reduce((s, w) => s + w, 0)
}
