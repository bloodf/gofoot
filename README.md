# GoFoot

Open-source, **mobile-first** football manager PWA. MIT. Free. Ad-free. No monetization.

- **No login** — high-entropy session token is your save key
- **Server-authoritative** — match RNG, economy, ladder (libSQL/Turso + HMAC snapshots)
- **Real club names**, **joke-brand sponsors** only (`data/joke-brands.json`)
- **PT-BR** primary, **EN** second
- **5-minute matches** with commentary pacing, SFX, and Web Speech TTS

Master prompt: [`GOFOOT_PROMPT.md`](./GOFOOT_PROMPT.md) · Cheatsheet: [`CHEATSHEET.md`](./CHEATSHEET.md)

## Stack

Vue 3 · Nuxt 3 · Pinia · TypeScript · TursoDB/libSQL · Vercel · PWA · Web Audio · Web Speech API

## Features (v0.1 stages 0–19)

| Area | What ships |
|---|---|
| Identity | HMAC session mint/resume, IndexedDB token |
| Career | Série D→… ladder UI, seeded BR clubs |
| Match | Deterministic engine, 40+ event types, 1x/2x/5x/10x pacing |
| Competition | Round-robin fixtures + live table |
| Economy | Ticket elasticity, loans, joke-brand sponsors |
| Stadium | Sector capacity expansion |
| Fantasy | Live-now launcher + cron refresh stub |
| Anti-cheat | Audit snapshot chain at `/audit` |

## Develop

```bash
cp .env.example .env
pnpm install
pnpm fetch:assets
pnpm dev
```

1. Open `/session` → **Criar sessão** → copy token  
2. Continue → Hub → open next match → **Jogar**  
3. Squad `/club`, table `/leagues/serie_d`, finance `/club/finance`, career `/career`

### Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm typecheck` | TypeScript |
| `pnpm build` | Production (Vercel preset) |
| `pnpm test:unit` | Engines + auth |
| `pnpm test:mobile` | Playwright 390×844 |
| `pnpm check:brands` | Real-brand deny list |
| `pnpm fetch:assets` | Brand + SFX → `public/` |

## Deploy (Vercel)

```bash
# set env on Vercel:
# SESSION_HMAC_SECRET=<32+ random bytes>
# TURSO_DATABASE_URL=libsql://...
# TURSO_AUTH_TOKEN=...
# CRON_SECRET=... (optional)
pnpm build
npx vercel deploy --prebuilt
```

Cron: daily `GET /api/cron/refresh` (see `vercel.json`).

## Data

- `data/clubs-br.json` / `data/players-br.json` — seed (OpenFootball-style factual clubs + procedural squads)
- `data/joke-brands.json` — only allowed sponsor names
- External API keys optional later; Stage ship uses local seed ($0)

## License

MIT — [`LICENSE`](./LICENSE). Legal: [`LEGAL.md`](./LEGAL.md).
