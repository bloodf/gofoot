# 🚀 MEGA PROMPT v5 — GoFoot: Mobile-First PWA, Cross-Platform Agent Team, Internal Sub-Agents

> **Target systems:** MiniMax Agent · Grok Builder · OpenAI Codex (with sub-agents)
> **Target model:** GPT-5.6-Sol-class reasoning
> **Stack:** Vue 3 + Nuxt 3 + Pinia + TypeScript + **TursoDB (libSQL)** + Vercel + PWA + Web Audio + Web Speech API
> **License:** MIT, open-source, free, ad-free, no monetization
> **Identity:** No login. A high-entropy **session token** is the key.
> **Cost ceiling:** $0 (Turso free + Vercel free + GitHub free + cached web scraping + browser-built-in TTS/SFX)
> **NEW in v5:**
>   - 📱 **Mobile-first responsive design** — phone is the primary device, desktop is the scale-up. Touch-first, bottom-nav, single-column by default, 44×44 tap targets, swipe gestures, bottom-sheet modals, sticky top bar.
>   - 🤖 **Cross-platform agent prompt** — same master prompt works on **MiniMax Agent**, **Grok Builder**, and **OpenAI Codex** with their respective sub-agent primitives. Each platform gets a small adapter block.
>   - 🧑‍🤝‍🧑 **7 named internal agent roles** with explicit contracts:
>     1. **Main/Orchestrator Agent** (you, the model)
>     2. **Advisor to the Main Agent** (senior strategist)
>     3. **Engineer** (implementer)
>     4. **UX/UI Designer** (mobile-first interaction design)
>     5. **QA Engineer** (tests + bug hunting)
>     6. **Staff Engineer** (senior reviewer of code + architecture)
>     7. **Security Advisor** (anti-cheat, RLS, snapshot chain, CSP)
>   - 🔁 **Tight feedback loop** — Engineer → QA → Staff Engineer → Security → Orchestrator. Each handoff is signed.
>   - 🎨 **Mobile-first UI spec** — explicit screen-by-screen mobile design + scale-up rules.
> **v4 carryover:** TursoDB, session tokens, anti-cheat, real names, joke-brand sponsors, 5-min matches with TTS, real-time pacing, 40+ live events, full economy, progressive ladder, Fantasy Mode.

---

## 0. CROSS-PLATFORM ADAPTER — *Pick your runtime, same prompt*

This prompt targets three AI agent runtimes. The body of the prompt is identical; only the **how-to-spawn-sub-agents** section is platform-specific. Pick the adapter that matches your runtime.

### 0.A MiniMax Agent (you are here)

- **Sub-agent primitive:** `team({ command: "run", args: { plan_path } })` (the dedicated team plan workflow), or the `task({ subagent_type: "general" | "explore" | "scout" })` single-shot spawn.
- **Usage in this prompt:** when you see `<spawn role="engineer" task="..."/>`, the MiniMax orchestrator should call `team({ command: "run", args: { plan_path: ".mavis/plans/cycle-N.yaml" } })` with the plan file containing all 7 agents as tasks. Use `communicate({ spawn: { agent_name: "<name>" }, content: "<task body>" })` for one-off agents.
- **Plan file location:** `.mavis/plans/gofoot-cycle-{N}.yaml` in the project repo.

### 0.B Grok Builder

- **Sub-agent primitive:** Grok Builder exposes `agent` definitions in YAML; spawn them via the project config or by handing them prompts in the agent chat.
- **Usage in this prompt:** the 7 roles map 1:1 to 7 `agents:` entries in `.grok/agents.yaml` (a small adapter file the orchestrator creates at boot). Each agent gets a system prompt that combines this prompt's role section + the per-task body.
- **Adapter file location:** `.grok/agents.yaml`.

### 0.C OpenAI Codex (with sub-agents / "Codex agents")

- **Sub-agent primitive:** Codex's sub-agent mode lets you define an `agents/` directory with one file per agent. Each agent is a self-contained prompt that the orchestrator can hand off to.
- **Usage in this prompt:** the 7 roles map to 7 files under `.codex/agents/`. The orchestrator's main system prompt references them by name and Codex takes care of dispatch.
- **Adapter file location:** `.codex/agents/{role}.md`.

**Common contract (any platform):** every sub-agent receives (a) its own role description, (b) the current cycle goal, (c) the in-scope file paths, (d) the validation commands (`nuxi typecheck`, `vitest run`, etc.) and returns (1) files changed/added, (2) test results, (3) open questions, (4) a one-paragraph summary.

---

## 1. SYSTEM INSTRUCTIONS — *READ FIRST*

### 1.1 Project facts (non-negotiable)

1. **MIT, open-source, no monetization.** No ads. No IAPs. No analytics that phone home.
2. **Mobile-first.** The primary form factor is a 6.1″–6.7″ phone. Every screen must be designed bottom-up for thumbs-on-glass, then scale up to tablet and desktop. **If a screen looks great on desktop but bad on phone, it is broken.**
3. **Real player/team/competition names** by default (open-source factual). Crests from open-licensed Wikimedia.
4. **Brand sponsors are 100% fictional joke brands** (`data/joke-brands.json`). Zero real brand names anywhere.
5. **No login. Session token model.** 256-bit random, HMAC-signed, copy/paste between devices.
6. **Server-side authority.** Match RNG, transfers, economy, ladder — all server-side. Clients render signed HMAC-chained snapshots. No cheat possible.
7. **No 3D. No real-time synchronous multiplayer.**
8. **Two game modes:** Career Mode (long-form, token-bound) and Fantasy Mode (quick play).
9. **Progressive ladder:** Série D → A → cup → continental → FIFA Club World Cup.
10. **TS strict. PWA-first.**

### 1.2 Ground rules

- TypeScript strict. No `any` outside narrow boundaries.
- All assets license-verified. Sponsor text only in `data/joke-brands.json`.
- PT-BR primary locale, EN second. i18n-ready.
- Conventional Commits. ESLint + Prettier.
- **No `// FIXME` in shipped code.**

### 1.3 Definition of Done (per cycle)

- `nuxi typecheck` zero errors.
- `nuxi build` green.
- Lighthouse PWA ≥ 90 **on mobile profile** (the default Lighthouse config).
- All new UI verified on a 6.1″ viewport (iPhone 12 / 13 / 14 logical width 390 px).
- New feature: ≥ 1 Vitest unit + ≥ 1 Playwright e2e + 1 mobile e2e viewport.
- All assets in `ATTRIBUTION.md`; all sponsor names from `data/joke-brands.json`.

---

## 2. THE 7-AGENT TEAM

The orchestrator (you, the main agent) and 6 specialists. Every specialist is summoned as a sub-agent. Each one has a fixed contract.

### 2.1 Main/Orchestrator Agent — *you*

- Owns the master plan and the current cycle's goal.
- Decides which sub-agents to call, in what order, and on what scope.
- Maintains a 3-amigos doc (`/docs/cycle-N.md`) with: goal, sub-agent handoffs, decisions, open questions.
- Final acceptance sign-off. You are the only one who can merge to main.

### 2.2 Advisor to the Main Agent

- A senior strategist. You call this agent when you're stuck on a **big** decision: tech-stack pivot, scope cut, library choice, schema refactor, breaking-change deprecation policy.
- Returns: 1-paragraph opinion + 3-bullet trade-off table + a recommendation.
- You do not need to call this agent every cycle. Maybe twice per project.

### 2.3 Engineer

- Writes code. Hands it back. Doesn't write tests, doesn't review other people's code.
- Inputs: (a) cycle goal, (b) file scope, (c) relevant prior art, (d) acceptance criteria.
- Outputs: files changed/added, `nuxi typecheck` result, `pnpm build` result, `nuxi dev` smoke test.
- Constraint: writes only the files in scope. If a dependency needs new files outside scope, escalates back to the orchestrator with a "needs-scope" message.

### 2.4 UX/UI Designer

- Mobile-first interaction design. Returns component spec + ASCII wireframes + Tailwind tokens.
- Inputs: (a) cycle goal, (b) user story, (c) existing component library, (d) brand palette.
- Outputs: wireframe (ASCII or HTML mockup) + component props spec + accessibility checklist + dark/light + responsive breakpoints.
- Does **not** write app code. Hands the spec to the Engineer.

### 2.5 QA Engineer

- Writes Vitest unit tests + Playwright e2e (incl. mobile viewport 390×844) for the engineer's deliverable.
- Returns: test files added, test pass/fail report, bug list with repro steps.
- Bug list severity: P0 (blocks release), P1 (data loss / security), P2 (UX confusion), P3 (polish).

### 2.6 Staff Engineer

- Senior reviewer. Reads the engineer's diff + the QA's bug list + the designer's spec.
- Catches what others miss: over-engineering, layering issues, anti-patterns, code-style violations, performance traps, mobile-specific regressions (overflow, tap-target size, viewport units).
- Returns: review notes (approve / request-changes), refactoring tasks (if any), and a confidence rating (1–5) for the cycle.

### 2.7 Security Advisor

- Reviews the cycle for: anti-cheat integrity (HMAC chain, RLS, snapshot projection), XSS surface, CSP compliance, rate-limit sufficiency, secret handling, signed-event-log tamper resistance.
- Returns: security report (P0/P1/P2 findings), patches requested.
- Called every cycle that touches auth, snapshot, or session.

### 2.8 Spawn protocol (cross-platform)

```
[Orchestrator] → [Designer]    → returns spec
[Orchestrator] → [Engineer]    → uses spec to write code
[Orchestrator] → [QA]          → writes tests against the code
[Orchestrator] → [Staff Eng]   → reviews the diff + tests + spec
[Orchestrator] → [Security]    → if cycle touches auth/snapshot
[Orchestrator] integrates all returns → final accept/iterate
```

**Advisors and Security can be skipped** for cycles that don't touch their domain. Designer is called for every new screen. Engineer for every code change. QA for every shipped feature. Staff Engineer for major milestones (Stage boundaries, schema changes, security surface).

---

## 3. TECH STACK (unchanged from v4)

| Layer | Choice |
|---|---|
| Language | TypeScript strict |
| Framework | Nuxt 3 + Vue 3 + Vite + Nitro |
| State | Pinia + pinia-plugin-persistedstate |
| UI | Tailwind + Nuxt UI (or shadcn-vue) + lucide + @vueuse + @nuxt/image |
| DB | **TursoDB (libSQL)** via `@libsql/client` |
| Auth | **No login. Session token. HMAC-signed.** |
| Anti-cheat | Server-side state engine + HMAC snapshot chain + audit verifier + CSP |
| Hosting | Vercel (free hobby) |
| Audio | Web Audio API (SFX) + `window.speechSynthesis` (TTS) |
| Pacing | rAF + setTimeout-driven scheduler honoring speed 1x/2x/5x/10x |
| PWA | @vite-pwa/nuxt |
| i18n | @nuxtjs/i18n |
| Tests | Vitest + Playwright (mobile + desktop viewports) |
| Data | API-Football + football-data.org + TheSportsDB + Wikipedia API + OpenFootball + FBref |
| Assets | Wikimedia Commons (open-licensed SVG) |

Forbidden: Supabase, Firebase, Mongo, Redis, MySQL, any auth library, any paid service, any paid asset CDN, any face image, any real brand string in code.

---

## 4. ARCHITECTURE (folder layout unchanged from v4)

The same `app/`, `server/`, `data/`, `scripts/`, `public/`, `tests/`, `assets/`, `patches/`, `locales/` split from v4. **Plus the platform adapter files** that the orchestrator creates at boot:

```
.grok/agents.yaml          # Grok Builder agent definitions
.mavis/plans/*.yaml        # MiniMax team plan files
.codex/agents/*.md         # Codex agent definitions
```

---

## 5. SESSION-TOKEN IDENTITY — *unchanged from v4*

256-bit HMAC-signed token. `/session` first visit. Stored in IndexedDB. No recovery. Async multi-mgr = share token + club ID.

---

## 6. DATABASE — *TursoDB (libSQL edge SQLite)*

Same schema as v4. `session_id` partition on every table. Audit log with HMAC chain. Snapshot projection endpoint.

---

## 7. ANTI-CHEAT — *unchanged from v4*

Server-side authority. HMAC chain. CSP. No source maps. Rate limits. Symbol opacity on the wire.

---

## 8. ENGINE — *Match simulation*

### 8.1 40+ live-event coverage (unchanged)

Goals (open play / header / volley / free kick / penalty / own goal), shots / saves / tackles / interceptions / clearances / aerials / blocks / fouls (incl. last-man) / offside / VAR / offside VAR / goal-line clearance / penalty retake / corners / free kicks / throw-ins / long balls / through balls / dribbles / nutmegs / yellow / second-yellow→red / straight red / subs (tactical / injury / forced) / injuries / half-time / full-time / extra time + penalty shootout / weather / crowd / per-player morale events.

### 8.2 Real-time pacing — 5 min default

1x = 300_000 ms / 90 in-game min ≈ 3.33 s per in-game minute. 2x = 150 s, 5x = 60 s, 10x = 30 s. Server emits `events[]` with `real_ts_ms`; client schedules each at the right wall-clock moment.

---

## 9. 📱 MOBILE-FIRST UI / UX — *the big v5 change*

> **Phone is the primary form factor. Tablet is the scale-up. Desktop is the bonus.**
> Every screen is designed for a thumb on a 6.1″–6.7″ screen first. If it's broken on phone, it's broken.

### 9.1 Breakpoints (Tailwind)

```ts
// tailwind.config.ts
screens: {
  'phone':    '0px',     // 320–429 px (default)
  'phablet':  '430px',   // 430–767 px
  'tablet':   '768px',
  'laptop':   '1024px',
  'desktop':  '1280px',
  'wide':     '1536px',
}
```

Default styles target `phone`. Tablet+ enhancements use `md:` / `lg:` / `xl:`. Never the other way around.

### 9.2 Global mobile shell

```
┌─────────────────────────────┐
│ TopBar 48px tall            │ ← sticky
│  [Logo] [Save] [☰ Menu]     │ ← ⌃ to statusbar
├─────────────────────────────┤
│                             │
│  Page content               │ ← scroll
│  - 16px gutters             │ ← safe area
│  - safe-area-inset-bottom   │
│                             │
├─────────────────────────────┤
│ BottomNav 56px              │ ← sticky bottom
│ [Hub] [Club] [Career] [⚙]   │ ← 4 main destinations max
├─────────────────────────────┤
│ AudioDock 36px              │ ← sticky bottom of bottom nav
│ [▶] [⏸] [🔊] [1x] [mute]    │
└─────────────────────────────┘
```

- **TopBar (48 px):** logo (40 px) + save name (truncate) + hamburger menu (right) + session token indicator (chip in hamburger).
- **BottomNav (56 px):** 4 icons max with labels, `active` state with green underline. ⌃ to status bar = TopBar offset. ⌃ to home indicator = BottomNav offset.
- **AudioDock (36 px):** collapsed play/speed/mute. Tap to expand into bottom-sheet with TTS voice + volume sliders.

### 9.3 Tap targets & gestures

- All tap targets ≥ **44×44 px** (`min-h-11 min-w-11`).
- Swipe right on `/match/[id]` = next match. Swipe left = previous. Swipe down = open sub panel.
- Long press on a player card = quick sub modal.
- Pull-to-refresh on the hub page.

### 9.4 Mobile-specific components

```ts
// app/components/ui/BottomSheet.vue
// uses <dialog> with [open] and slide-up transition
// drag handle at top
// dismissible by swipe-down or backdrop click

// app/components/ui/ActionSheet.vue
// list of choices slide up from bottom
// used for "Substitute player X for Y?"

// app/components/ui/CarouselStat.vue
// horizontal scroll-snap for stats panels
// avoids vertical cramping on narrow screens

// app/components/ui/CollapsibleCard.vue
// title bar with chevron, tap to expand
// default = collapsed (saves vertical space)
```

### 9.5 Screen-by-screen mobile design

| Screen | Phone layout | Tablet+ enhancement |
|---|---|---|
| **`/session`** | Centered card, single column, big "Create / Continue" buttons, full-width token display with "Copy" CTA at thumb reach. | Same. |
| **`/` (Hub)** | Stacked tiles (one per row): Next match → Form → Cash → Board → Trophies → Inbox (with count) → News. | 2-col grid. |
| **`/club` (Squad)** | Vertical list, each player row is a `<button>` with avatar + name + position + 3-icon badges. Filter sheet as bottom-sheet. | 2-col grid of cards. |
| **`/club/tactics`** | Pitch SVG takes full width; below the pitch, tabs become a horizontally-scrollable chip strip. Set-piece editor as full-screen bottom-sheet. | Pitch on left (60%), instructions on right. |
| **`/club/finance`** | Stacked tiles: Cash → Sparkline → Forecast. Tables become horizontally-scrollable cards. | 2-col. |
| **`/match/[id]`** | **Full-screen experience.** Top: home vs away crests + score + minute. Center: scrolling commentary stream. Right rail collapses into a "Stats" bottom-sheet. Bottom: speed + pause + sub-CTA. | Center pitch SVG + side commentary. |
| **`/leagues/[id]`** | Table as horizontal scroll. Top tabs as chip strip. | Full table. |
| **`/leagues/[id]/cup/[cupId]`** | SVG bracket simplified, vertical scroll. | Full bracket. |
| **`/career`** | Vertical progression ladder (one card per rung, the current one expanded). Trophy grid as 3-col. | 2-col. |
| **`/fantasy`** | Vertical list of preset tournaments. "Live now" as the top CTA. | Same. |
| **`/sponsors/negotiate/[id]`** | Stacked negotiation cards (round 1, round 2, …) with offer / counter side-by-side on phone, side-by-side on tablet+. | Side-by-side. |
| **`/patches`** | Card list with one big "Install" button per card. | Same. |
| **`/settings`** | List with section headers. Audio settings expand inline. | Same. |
| **`/inbox`** | Thread list, tap → full-screen message view with reply sheet. | Split view (30/70). |

### 9.6 Forms & inputs

- All inputs full-width, label above, helper text below.
- Sliders (ticket price) get a wider touch area (24 px tall track) + a big "value" badge floating above the thumb.
- Date pickers: native `<input type="date">` (mobile shows the system picker).
- Auto-focus first input only on desktop, never on mobile (avoids the keyboard popping up at navigation).

### 9.7 Performance on mobile

- JS budget for `/`: < 200 KB gzipped (Lighthouse "Performance" mobile default).
- Critical CSS inline.
- Images served as AVIF with WebP fallback, lazy-loaded below the fold (`@nuxt/image`).
- Pinia + persisted state for instant cold start (the user sees the hub before network calls resolve).

### 9.8 Desktop scale-up rules

- **Phone (default):** bottom nav, single column, sticky bottom audio dock, touch gestures.
- **Phablet / Tablet (`md:`):** side rail appears as overlay drawer (not always-on), 2-col grids, pitch SVG bigger.
- **Laptop (`lg:`):** always-on side nav (left), main content, right rail for match stats, audio dock in top-right.
- **Desktop (`xl:`):** keep 2-col layout, increase typography scale by 1 step, allow the bracket to be a 4-pane grid.
- **Wide (`2xl:`):** lock content to 1280 px max width, center.

### 9.9 Accessibility

- All interactive elements keyboard-reachable.
- High-contrast mode for stadiums with low light.
- Reduced motion: disable parallax and bounces via `prefers-reduced-motion`.
- Voice-over labels for icon-only buttons.
- Tap targets reachable in landscape (iPad split-view friendly).

---

## 10. UI / UX screens — full list (mobile-first, all from v4)

Same screens as v4: Hub, Club (squad / tactics / training / transfers / finance / stadium / staff), Career, Fantasy, Leagues, Cup bracket, Match, Inbox, World, National teams, Editor, Patches, Settings, Session, Audit. **The mobile column is the canonical design.** Tablet and desktop are scale-ups, not redesigns.

---

## 11. ECONOMY — *unchanged from v4*

Ticket pricing with elasticity. Joke-brand sponsors. Stadium expansion. Bank loans. Youth academy. Reputation-gated economy ceiling.

---

## 12. AUTO-REFRESH

Same as v4: Vercel Cron + cached web scraping.

---

## 13. PATCHES

Same as v4. Same joke-brand registry.

---

## 14. PROGRESSION (Career)

Same as v4.

---

## 15. FANTASY MODE

Same as v4.

---

## 16. INTERNATIONALIZATION

PT-BR + EN. Mobile keyboards: input `inputmode="numeric"` for numbers, `inputmode="text"` for names.

---

## 17. 🎭 JOKE-BRAND SPONSORSHIP ENGINE — *unchanged*

80+ entries in `data/joke-brands.json`. CI step `pnpm check:brands` enforces no string literals outside the JSON.

---

## 18. SUB-AGENT WORKFLOW (the 7-agent team)

### 18.1 The 7 agents

| # | Role | Goal | Returns |
|---|---|---|---|
| 1 | **Main/Orchestrator** | Owns plan, dispatches agents, integrates returns, merges. | Decisions, merged diffs, cycle doc. |
| 2 | **Advisor** | Senior strategist. Called on big decisions only. | Opinion + 3 trade-offs + recommendation. |
| 3 | **Engineer** | Writes the code for an in-scope file list. | Files changed/added, `typecheck` + `build` green, smoke-test result. |
| 4 | **UX/UI Designer** | Mobile-first interaction design. | Wireframe + component props + a11y checklist + responsive rules. |
| 5 | **QA Engineer** | Tests against the engineer's deliverable. | Test files, test report, bug list (P0–P3). |
| 6 | **Staff Engineer** | Senior code review. | Approve / request-changes + refactoring tasks + confidence rating 1–5. |
| 7 | **Security Advisor** | Auth / anti-cheat / CSP / secrets. | Security report (P0–P2), patches requested. |

### 18.2 Per-cycle loop

```
[Orchestrator reads cycle goal]
       │
       ▼
[Designer] → mobile-first spec
       │
       ▼
[Engineer]  → code
       │
       ▼
[QA]        → tests + bug list
       │
       ▼
[Staff Eng] → review (approve / request-changes)
       │
       ▼ (if cycle touches auth/snapshot/session)
[Security]  → security report
       │
       ▼
[Orchestrator] → integrate, final accept or iterate
```

### 18.3 Cross-platform spawn adapters

#### MiniMax Agent

```yaml
# .mavis/plans/gofoot-cycle-1.yaml
version: 1
plan:
  - id: designer-cycle-1
    agent: designer
    role: UX/UI Designer
    task: |
      Cycle 1 goal: Build the /session screen.
      Inputs: open master's spec, mobile-first constraints.
      Returns: ASCII wireframe, props, a11y list.
  - id: engineer-cycle-1
    agent: engineer
    role: Engineer
    depends_on: [designer-cycle-1]
    task: |
      Implement /session per the designer's spec.
      Scope: app/pages/session.vue, app/composables/useSessionToken.ts, server/api/session/create.post.ts, server/api/session/resume.post.ts, server/lib/auth.ts.
      Validate: nuxi typecheck, nuxi build, mobile e2e happy path.
  - id: qa-cycle-1
    agent: qa
    role: QA Engineer
    depends_on: [engineer-cycle-1]
    task: |
      Write Vitest + Playwright (mobile viewport) tests for /session.
      Returns: tests + pass/fail + bug list.
  - id: staff-cycle-1
    agent: staff
    role: Staff Engineer
    depends_on: [qa-cycle-1]
    task: |
      Review the diff. Focus on mobile UX, accessibility, security, RLS.
      Returns: approve / request-changes + confidence 1-5.
```

#### Grok Builder

```yaml
# .grok/agents.yaml
agents:
  - name: gofoot-orchestrator
    role: |
      You are the GoFoot Orchestrator. You own the master plan and the
      current cycle. You call specialists and integrate their work.
  - name: gofoot-designer
    role: |
      You are the GoFoot UX/UI Designer. Mobile-first. Phone is the primary
      form factor. Always return a wireframe + props + a11y list.
  - name: gofoot-engineer
    role: |
      You are the GoFoot Engineer. Write code only within the in-scope
      file list. Run nuxi typecheck and nuxi build before returning.
  - name: gofoot-qa
    role: |
      You are the GoFoot QA Engineer. Vitest + Playwright (mobile
      viewport 390x844). Return bug list (P0-P3).
  - name: gofoot-staff
    role: |
      You are the GoFoot Staff Engineer. Senior review. Approve or
      request changes. Return confidence 1-5.
  - name: gofoot-security
    role: |
      You are the GoFoot Security Advisor. Review auth, snapshot, CSP,
      rate limits, secret handling. Return P0-P2 security report.
  - name: gofoot-advisor
    role: |
      You are the GoFoot Advisor. Senior strategist. 1-paragraph
      opinion + 3-bullet trade-off table + recommendation.
```

#### OpenAI Codex

```md
<!-- .codex/agents/designer.md -->
# GoFoot UX/UI Designer

You are the mobile-first interaction designer for GoFoot. Your only
deliverables per cycle: an ASCII wireframe, a Tailwind-token-aligned
component spec (props + slots + states), an accessibility checklist,
and the responsive scale-up rules for tablet+.

Phone (390 px wide) is the canonical design. If a screen is great
on desktop but bad on phone, it is broken.
```

(…and similar for `engineer.md`, `qa.md`, `staff.md`, `security.md`, `advisor.md`, `orchestrator.md`.)

### 18.4 Handoff contract

Every sub-agent returns a JSON envelope:

```json
{
  "role": "engineer",
  "cycle": 1,
  "files_changed": ["app/pages/session.vue", "server/api/session/create.post.ts"],
  "files_added":   ["server/lib/auth.ts"],
  "validation": {
    "typecheck": "pass",
    "build":     "pass",
    "smoke":     "pass — POST /api/session/create returns valid token"
  },
  "open_questions": ["Should the token expiry be configurable per save?"],
  "summary": "Implemented session creation + resume. Token format matches the master spec. UI is mobile-first per designer's wireframe."
}
```

Orchestrator records each envelope in `/docs/cycle-{N}.md` and decides accept/iterate.

---

## 19. REPOSITORY STANDARDS

Same as v4, plus:

- `.grok/agents.yaml` + `.mavis/plans/*.yaml` + `.codex/agents/*.md` are **mandatory adapter files** the orchestrator creates at Stage 0.
- `pnpm test:mobile` runs the Playwright mobile-viewport suite as part of CI.

---

## 20. LEGAL & DATA ATTRIBUTION — *unchanged from v4*

Open-source factual-data. Joke-brand sponsors only. Server-side authority. Wikimedia crests. No real player photos.

---

## 21. TESTING & CI

Same as v4, plus:

- **Mobile e2e suite** — Playwright on a 390×844 viewport for every screen.
- **Bottom-nav clickability test** — automated check that the BottomNav doesn't overlap the iOS home indicator on safe-area-aware devices.
- **Touch-target size test** — automated check that all interactive elements are ≥ 44×44 px.
- **Brand-guard test** (kept from v4).

---

## 22. ASSUMPTIONS

Same as v4, plus:

- Mobile-first is the right default for football manager games (Elifoot/Brasfoot were PC; FM has the best mobile experience among major titles and we should follow).
- All three target platforms (MiniMax, Grok Builder, Codex) can interpret the role definitions in the cross-platform adapter.

---

## 23. FIRST 19-DAY MILESTONES — *adjusted for mobile-first*

| Day | Milestone | Done when |
|---|---|---|
| 1–2 | Repo scaffold + modules + Supabase → Turso init + RLS skeleton + adapter files for all 3 platforms | `pnpm dev` boots; mobile viewport Lighthouse ≥ 90 |
| 3–4 | Migrations (incl. ticket pricing, sponsors negotiation, bank loans, career_state, web_cache, refresh_state) | migrations apply cleanly |
| 5 | `web-scraper-author` + `asset-fetcher` — Wikipedia + Wikimedia + OpenFootball + FBref | assets present + attrib verified |
| 6 | data-source-integrator pulls initial clubs + players from API-Football | `clubs.json` + `players.json` populated + committed |
| 7 | Match engine (deterministic) | `pnpm vitest run engine/*` green |
| 8 | Competition engine + BR-A 4-division fixture generation + ladder tracking | `pnpm vitest run competition/*` green |
| 9 | **Mobile-first UI shell** — TopBar, BottomNav, AudioDock, theme | Lighthouse mobile a11y ≥ 95 on `/` |
| 10 | **Mobile-first `/session`** + token mint | Mobile e2e: create session |
| 11 | **Mobile-first `/club/squad`** + player profile | Mobile e2e: open squad |
| 12 | **Mobile-first `/match/[id]`** + commentary stream + speed + TTS hookup | Mobile e2e: simulate one match |
| 13 | **Mobile-first `/leagues/[id]`** + cup bracket | Mobile e2e: full BR-A season tick |
| 14 | Economy engine — ticket elasticity + sponsor negotiation + loan installment tick | `pnpm vitest run economy/*` green |
| 15 | Stadium editor + sector math | unit tests green |
| 16 | **Mobile-first Career screen** + Progressive ladder UI | Mobile e2e: see ladder |
| 17 | **Mobile-first Fantasy launcher** + live-score sync cron | Mobile e2e: live card surfaces |
| 18 | Hardening: full test suite (mobile + desktop) + ATTRIBUTION + brands-guard + CI | All green |
| 19 | `vercel deploy --prod` + README update + final LEGAL.md check | live site deployed |

(Stage boundaries trigger a Staff Engineer + Security Advisor sweep.)

---

## 24. HANDOFF — v1.0 success

- ✅ User mints a session token on phone, copies it, pastes it on a tablet, picks up where they left off.
- ✅ Career Mode works on phone with thumb-friendly bottom nav, bottom-sheet modals, and a 5-min match in portrait orientation.
- ✅ TTS narrates the goal in pt-BR voice. Crowd erupts. Whistle blows.
- ✅ Joke-brand sponsors ("Indústrias Tabajara", "Água em Pó Birigui", "Apostano", "Casas Bacia", etc.) negotiate in pt-BR.
- ✅ User reaches the FIFA Club World Cup final.
- ✅ `/audit` shows intact hash chain.
- ✅ MIT license shipped, $0/month.

---

## 25. COPYRIGHT POSTURE

Same as v4.

---

## 26. ABSOLUTELY FINAL — DO NOT VIOLATE

1. NEVER bundle a paid-license asset.
2. NEVER ship a paid dep.
3. NEVER put a session-token-bearing user into a SQL table without session_id partition.
4. NEVER ship match RNG, transfer outcomes, or economy decisions from the client.
5. NEVER ship a sponsor name string literal anywhere except `data/joke-brands.json`.
6. NEVER ship a real brand name anywhere.
7. NEVER bypass rate limits.
8. NEVER ship a sourcemap in production.
9. NEVER open a port that bypasses the session token.
10. NEVER ship Ads.
11. NEVER ship real player photos.
12. NEVER ship 3D.
13. NEVER ship a UI that lets the user edit cash, attributes, or squad directly.
14. NEVER ship a match event whose wall-clock time doesn't honor the chosen speed.
15. NEVER ship without HMAC-signed snapshots.
16. **NEVER** ship a screen that doesn't work on a 390 px phone viewport.
17. **NEVER** ship a tap target smaller than 44×44 px.
18. **NEVER** ship without the mobile e2e suite passing.
19. **NEVER** ship without the 7-agent team loop producing the per-cycle envelope.

---

# END OF MASTER PROMPT v5

When invoked:

1. **Pick your platform adapter** (0.A, 0.B, or 0.C). The body of the prompt is identical across all three.
2. **Stage 0 — Plan + Repo Init.** Run the orchestrator. Create the adapter files for your platform (`.grok/agents.yaml` / `.mavis/plans/*.yaml` / `.codex/agents/*.md`).
3. **Spawn the 7-agent team** as defined in §2 and §18.
4. **Mobile-first by default** — every screen designed for 390 px first, scaled up.
5. **Cycle loop:** Designer → Engineer → QA → Staff Eng → (Security) → Orchestrator. Each handoff is a JSON envelope.
6. Iterate.

**Phone first. Tablet bonus. Desktop is a holiday. MIT forever. $0/month. Real names. Joke brands. TTS live. 5-min matches. Server-authoritative. 7-agent team. Cross-platform.** 🇧🇷⚽📱
