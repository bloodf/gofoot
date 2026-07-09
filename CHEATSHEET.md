# 🇨🇳⚽⚽ GoFoot — Quick Reference / Cheat Sheet (v5 — Mobile-First + Cross-Platform Agent Team)

A condensed quick-reference for the master prompt `GOFOOT_PROMPT.md`.

## 🎯 Project

**Open-source (MIT), free, ad-free, no-monetization, no-paywalls, server-side authoritative football manager PWA.**
**No login. Session token = your key. Copy/paste between devices.**
**Real names. Joke-brand sponsors. TTS live. 5-min matches. Mobile-first.**

## What's new in v5 vs v4

| v4 | v5 |
|---|---|
| Desktop-first responsive | **Mobile-first** — phone is the primary form factor, tablet/desktop are scale-ups. Tap targets ≥ 44×44 px. Bottom nav. Bottom-sheet modals. |
| Single-target agent prompt | **Cross-platform** — works on MiniMax Agent, Grok Builder, AND OpenAI Codex. Each gets a small adapter file. |
| 22 sub-agents (role-based) | **7 named internal agents** with explicit contracts: Main/Orchestrator, Advisor, Engineer, UX/UI Designer, QA, Staff Engineer, Security Advisor |
| Ad-hoc spawn order | **Tight feedback loop** — Designer → Engineer → QA → Staff Eng → (Security) → Orchestrator with JSON envelope handoffs |

## 📱 Mobile-first design rules

- **Default styles target 390 px** (iPhone 12/13/14). All Tailwind defaults work on phone.
- **Tap targets ≥ 44×44 px** (`min-h-11 min-w-11`).
- **BottomNav (56 px) + AudioDock (36 px) at the bottom**. TopBar (48 px) at the top.
- **Sticky safe-area-insets** for iOS home indicator / Android gesture bar.
- **Bottom sheets** for modals, sub panels, negotiation rounds.
- **Horizontal scroll for tables**; **vertical scroll for ladder**; **swipe-right/left on `/match/[id]`** to navigate between matches.
- **Tablet+ (`md:`):** 2-col grids, side rail drawer.
- **Laptop+ (`lg:`):** always-on side nav, content + right rail.
- **Mobile e2e suite** mandatory — Playwright at 390×844 for every screen.
- **Lighthouse "Performance" mobile profile** ≥ 90.

## 🤖 The 7-agent team

| # | Role | Goal | Returns |
|---|---|---|---|
| 1 | **Main/Orchestrator** | Owns plan, dispatches agents, integrates, merges. | Decisions, merged diffs, cycle doc. |
| 2 | **Advisor to Main** | Senior strategist. Called on big decisions only. | Opinion + 3 trade-offs + recommendation. |
| 3 | **Engineer** | Writes code in-scope. | Files changed/added, `typecheck` + `build`, smoke test. |
| 4 | **UX/UI Designer** | Mobile-first interaction design. | Wireframe + props + a11y list + responsive rules. |
| 5 | **QA Engineer** | Tests against engineer's deliverable. | Tests + report + bug list (P0–P3). |
| 6 | **Staff Engineer** | Senior code review. | Approve / request-changes + refactors + confidence 1–5. |
| 7 | **Security Advisor** | Auth / anti-cheat / CSP / secrets. | Security report (P0–P2), patches requested. |

### Per-cycle loop

```
Orchestrator → Designer  → spec
Orchestrator → Engineer  → code
Orchestrator → QA        → tests + bugs
Orchestrator → Staff Eng → review (approve / request-changes)
Orchestrator → Security  → (if cycle touches auth/snapshot/session)
Orchestrator → integrate, accept or iterate
```

## 🌐 Cross-platform spawn adapters

The same body of the prompt works on three runtimes. Only the spawn mechanism differs:

- **MiniMax Agent** → `team({ command: "run", args: { plan_path: ".mavis/plans/gofoot-cycle-N.yaml" } })` + `communicate({ spawn: { agent_name: "..." } })` for one-off.
- **Grok Builder** → `.grok/agents.yaml` defines the 7 agents; orchestrator invokes them in chat.
- **OpenAI Codex** → `.codex/agents/{role}.md` per agent; orchestrator's system prompt references them.

The prompt ships with **adapter templates** for all three (YAML + Markdown snippets in §18.3).

## 🧱 Stack (unchanged from v4)

Vue 3 + Nuxt 3 + Pinia + TypeScript + **TursoDB** + Vercel + PWA + Web Audio + Web Speech API.
No login. Session token. HMAC-signed server authority. 40+ live match events. 5-min pacing.

## 🔒 Anti-cheat (unchanged from v4)

Server-side state. HMAC chain. CSP. No source maps. Rate limits. Symbol opacity on the wire.

## 🎭 Joke-brand sponsors (unchanged from v4)

80+ fictional Brazilian meme brands in `data/joke-brands.json`. CI step `pnpm check:brands` enforces no string literals outside the JSON.

## ⚽ Progressive ladder (unchanged)

```
Série D → C → B → A → Copa do Brasil → Supercopa Rei
      → CONMEBOL Libertadores → CONMEBOL Sudamericana
      → CONMEBOL Recopa → FIFA Club World Cup
```

## 🎮 Fantasy Mode (unchanged)

- "Live now" — today's biggest match.
- "Play the rest of [tournament]" — pull real results up to today, then take over.
- "Switch team after elimination" — keep playing.

## 💸 Economy (unchanged)

Ticket pricing with elasticity. Joke-brand sponsor rounds. Stadium expansion. Bank loans. Youth academy.

## 📦 Deliverables shipped

| File | Purpose |
|---|---|
| `GOFOOT_PROMPT.md` | **v5** Master Prompt |
| `CHEATSHEET.md` | This file |
| `LEGAL.md` | v5 Legal |
| `ATTRIBUTION.md` | Asset registry |
| `LICENSE` | MIT |
| `assets/` | Logo (SVG + PNG), favicon, 14 SFX mp3s, 6 TTS samples, asset README |
| `patches/sample-brasil-2026.patch.json` | Demo opt-in patch |

## ▶️ How to use the prompt

1. **Pick your platform** (MiniMax Agent, Grok Builder, or Codex).
2. **Copy the entire contents of `GOFOOT_PROMPT.md`** into the system message.
3. **Create the platform's adapter file** at Stage 0 (`.grok/agents.yaml` / `.mavis/plans/*.yaml` / `.codex/agents/*.md`).
4. **Add a user goal**: `"begin Stage 0 — Plan + Repo Init + mobile-first shell"`.
5. **Watch the orchestrator** spawn the 7-agent team per §18.
6. **Cycle loop** — Designer → Engineer → QA → Staff Eng → (Security) → Orchestrator. Each handoff is a JSON envelope.
7. **Mobile-first is non-negotiable.** Every screen must work on a 390 px viewport, period.

---

🇧🇷 **Bora!** — Phone first. Tablet bonus. Desktop é feriado. 7-agent team. Cross-platform. Real names. Joke brands. TTS. MIT. $0/month. ⚽📱
