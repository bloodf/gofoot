# GoFoot

Open-source, **mobile-first** football manager PWA. MIT. Free. Ad-free. No monetization.

- **No login** — session token is the save key (copy between devices)
- **Server-authoritative** — match RNG, economy, ladder (libSQL/Turso + HMAC snapshots)
- **Real club names**, **106 joke-brand sponsors** (`data/joke-brands.json`)
- **PT-BR** primary · **EN** second
- **5-minute matches** with commentary pacing, SFX, Web Speech TTS

Master prompt: [`GOFOOT_PROMPT.md`](./GOFOOT_PROMPT.md) · Completion matrix: [`docs/DONE.md`](./docs/DONE.md)

## Play loop

```bash
cp .env.example .env
pnpm install
pnpm fetch:assets
pnpm dev
```

1. `/session` → create token → copy it  
2. Hub → next match → **Jogar** (AI fixtures on the matchday auto-sim)  
3. Club: elenco, táticas, transferências, base, finanças, estádio  
4. Carreira → **Simular resto da temporada** → promotion ladder  
5. Fantasy → pick club → play matches  
6. `/audit` → HMAC chain  

## Data (live — real names only)

Clubs + players are **fetched live** at runtime. No procedural names, no seed JSON rosters.

| Source | What | Key |
|---|---|---|
| [Wikipedia MediaWiki API](https://www.mediawiki.org/wiki/API:Main_page) | Brasileirão clubs + first-team squads (`fs player`) | none |
| [TheSportsDB](https://www.thesportsdb.com/) | Stadium meta + squad fallback | free `3` or `THESPORTSDB_API_KEY` |
| [football-data.org](https://www.football-data.org/) | Optional BSA teams | `FOOTBALL_DATA_API_TOKEN` |

Cache: local SQLite `web_cache` (6h).  
Inspect: `GET /api/catalog` · refresh: `GET /api/cron/refresh`.

Joke-brand **sponsors** stay fictional in `data/joke-brands.json` (legal).

## Stack

Vue 3 · Nuxt 3 · Pinia · TypeScript · local SQLite (libSQL file) / Turso · Vercel · PWA · Web Audio · Web Speech

## Verify

```bash
pnpm typecheck
pnpm test:unit
pnpm test:mobile
pnpm check:brands
pnpm check:attribution
pnpm build
```

## Deploy

```bash
# Vercel env:
# SESSION_HMAC_SECRET=<32+ random>
# TURSO_DATABASE_URL=libsql://...
# TURSO_AUTH_TOKEN=...
# CRON_SECRET=... (optional)
pnpm build && npx vercel deploy --prebuilt --prod
```

Local `file:` DB works for dev only. Production needs remote Turso.

## License

MIT — [`LICENSE`](./LICENSE) · [`LEGAL.md`](./LEGAL.md)
