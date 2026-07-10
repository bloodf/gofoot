# ATTRIBUTION.md — Open Data, Open Sources, Open Crests

> This file is **auto-generated** at build time by `scripts/check-attribution.ts`.
> It lists every external asset and data source used by GoFoot, with source URL + license.
> Any new asset MUST be added here or CI fails (`pnpm check:attribution`).

---

## Code & Libraries

| Component | Source | License |
|---|---|---|
| Vue 3 | vuejs.org | MIT |
| Nuxt 3 | nuxt.com | MIT |
| Pinia | pinia.vuejs.org | MIT |
| Tailwind | tailwindcss.com | MIT |
| shadcn-vue / Nuxt UI | respective repos | MIT |
| lucide-vue-next | lucide.dev | ISC |
| Vitest, Playwright | vitest.dev, playwright.dev | MIT |
| @vite-pwa/nuxt | vite-pwa-org | MIT |
| @nuxtjs/i18n | nuxt.com modules | MIT |
| @libsql/client | turso.tech | MIT |
| idb-keyval | npm | Apache-2.0 |

## Sponsors registry

Fictional sponsors only — see `data/joke-brands.json` (never real brands).

---

## Data sources (factual, non-commercial use)

| Source | URL | Use | License/ToS |
|---|---|---|---|
| API-Football (RapidAPI) | https://www.api-football.com/ | Fixtures, squads, attributes | Free tier (100 req/day); commercial use requires plan upgrade |
| football-data.org | https://www.football-data.org/ | UEFA competitions, fixtures | Free tier for top competitions |
| TheSportsDB | https://www.thesportsdb.com/ | Artwork previews | Free tier for non-commercial |
| OpenFootball (CSV datasets) | https://github.com/openfootball | Fallback mirror | CC0 / public domain |
| FBref (Sports Reference) | https://fbref.com/ | Advanced stats, deep attributes | Free for non-commercial; check ToS for scraping |
| StatsBomb Open Data | https://github.com/statsbomb/open-data | Event data | CC-BY-NC |
| Wikipedia API | https://en.wikipedia.org/ | Real-name reconciliation, club metadata | CC-BY-SA |
| Wikimedia Commons | commons.wikimedia.org | Crests, flags, trophies | Mixed (MIT, CC0, CC-BY, CC-BY-SA per file) |

---

## Open-licensed crest / flag / trophy assets

(THIS SECTION IS POPULATED AT BUILD TIME by `scripts/fetch-assets.ts`. Each row is one asset:
file path under `/public/crests/`, source URL on Wikimedia Commons, license.)

> Example entry (filled by build):
>
> | File | Source URL | License |
> |---|---|---|
> | `public/crests/br/fla.svg` | `https://commons.wikimedia.org/wiki/File:CR_Flamengo_Logo.svg` | CC-BY-SA-3.0 |
> | `public/crests/br/cor.svg` | `https://commons.wikimedia.org/wiki/File:Sport_Club_Corinthians_Paulista_crest.svg` | CC-BY-SA-3.0 |
> | … | … | … |

---

## Country flags

Country flag SVGs are pulled from Wikimedia Commons (public-domain or open-licensed
per-file). The build script `scripts/fetch-assets.ts` records each individual license.

---

## Optional community packs

Users opt-in to community patches through `/patches`. Each pack declares its license in
its own manifest (`patches/<slug>/index.json`). Patches are user-side content; they are
not bundled by default. The default install pulls from Wikimedia Commons only.

---

## Updating this file

Run `pnpm run fetch:assets --check` to update. CI runs `pnpm run check:attribution`
on every PR.
