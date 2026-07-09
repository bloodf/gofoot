# GoFoot

Open-source, **mobile-first** football manager PWA. MIT. Free. Ad-free. No monetization.

- **No login** — a high-entropy session token is your save key
- **Server-authoritative** — match RNG, economy, ladder (Turso/libSQL + HMAC audit chain)
- **Real names**, **joke-brand sponsors** only (`data/joke-brands.json`)
- **PT-BR** primary, **EN** second

Master prompt: [`GOFOOT_PROMPT.md`](./GOFOOT_PROMPT.md) · Quick ref: [`CHEATSHEET.md`](./CHEATSHEET.md)

## Stack

Vue 3 · Nuxt 3 · Pinia · TypeScript · TursoDB (libSQL) · Vercel · PWA · Web Audio · Web Speech API

## Stage 0 status

Repo scaffold + session token mint/resume + mobile shell (TopBar / BottomNav / AudioDock) + adapters.

## Develop

```bash
cp .env.example .env
pnpm install
pnpm fetch:assets
pnpm dev
```

Open [http://localhost:3000/session](http://localhost:3000/session) — create a session, copy the token.

### Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm typecheck` | `nuxi typecheck` |
| `pnpm build` | Production build |
| `pnpm test:unit` | Vitest |
| `pnpm test:mobile` | Playwright @ 390×844 |
| `pnpm check:brands` | Real-brand deny-list guard |
| `pnpm check:attribution` | ATTRIBUTION.md present |

## Agent adapters

| Platform | Path |
|---|---|
| Grok Builder | `.grok/agents.yaml` |
| MiniMax | `.mavis/plans/gofoot-cycle-0.yaml` |
| OpenAI Codex | `.codex/agents/*.md` |

## License

MIT — see [`LICENSE`](./LICENSE). Legal posture: [`LEGAL.md`](./LEGAL.md).
