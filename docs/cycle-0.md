# Cycle 0 — Stage 0 Plan + Repo Init

## Goal

Scaffold Nuxt 3 + Turso session skeleton + mobile-first shell + platform adapters so `pnpm dev` boots and Stage 0 DoD gates pass.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Nuxt 3.17.x (not Nuxt 4 create-nuxt default) | Prompt pins Nuxt 3 |
| UI kit | Nuxt UI + Tailwind | Faster Nuxt integration |
| DB local | `file:./.data/gofoot.db` via `@libsql/client` | $0, no Turso account required for dev |
| Token storage | IndexedDB (`idb-keyval`) | Spec: not localStorage |
| Schema Stage 0 | `sessions` + `audit_log` only | Expand Day 3–4 |

## Handoffs

Orchestrator implemented Stage 0 directly (single-agent greenfield). Adapter files created for Grok / MiniMax / Codex.

```json
{
  "role": "engineer",
  "cycle": 0,
  "files_changed": [],
  "files_added": ["package.json", "nuxt.config.ts", "app/**", "server/**", "tests/**", ".grok/agents.yaml"],
  "validation": {
    "typecheck": "pass",
    "build": "pass",
    "unit": "pass — 6 tests",
    "mobile_e2e": "pass — session CTA ≥ 44px @ 390×844",
    "check_brands": "pass"
  },
  "open_questions": [
    "Remote Turso URL for shared multi-device in staging?",
    "Nuxt UI green palette mapping vs custom gofoot CSS vars only?"
  ],
  "summary": "Stage 0 scaffold: mobile shell, session mint/resume, HMAC audit genesis, adapters, unit + mobile e2e smoke."
}
```

## Open questions

1. When to require remote Turso vs file DB for multi-device token resume across machines.
2. Expand joke-brands to 80+ during economy cycle.

## Next cycle

Day 3–4: full migrations (career_state, finance, sponsors, web_cache, refresh_state).
