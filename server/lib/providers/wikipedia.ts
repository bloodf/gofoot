/**
 * Wikipedia MediaWiki API — free, no key.
 * Source of truth for current Brazilian Serie A clubs + first-team squads (real names).
 */
const UA = 'GoFoot/0.1 (https://github.com/bloodf/gofoot-grok; open-source football manager)'
const API = 'https://en.wikipedia.org/w/api.php'

export interface WikiClub {
  /** Wikipedia page title */
  page: string
  name: string
  code?: string
}

export interface WikiPlayer {
  name: string
  position: string
  shirtNumber: number | null
  nationality?: string
}

async function wikiJson<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', origin: '*', ...params })) {
    url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
  return (await res.json()) as T
}

function displayName(wikilink: string): { page: string; name: string } {
  // [[Page|Display]] or [[Page]]
  const inner = wikilink.replace(/^\[\[|\]\]$/g, '')
  const [page, display] = inner.split('|')
  return {
    page: (page || '').trim(),
    name: (display || page || '').trim(),
  }
}

/** Try current/previous season pages for Brasileirão Série A. */
export async function fetchSerieAClubsFromWikipedia(): Promise<WikiClub[]> {
  const year = new Date().getFullYear()
  const candidates = [
    `${year}_Campeonato_Brasileiro_Série_A`,
    `${year - 1}_Campeonato_Brasileiro_Série_A`,
    `${year + 1}_Campeonato_Brasileiro_Série_A`,
  ]

  let wikitext = ''
  for (const page of candidates) {
    try {
      const data = await wikiJson<{
        parse?: { wikitext?: string; title?: string }
        error?: unknown
      }>({
        action: 'parse',
        page,
        prop: 'wikitext',
      })
      if (data.parse?.wikitext) {
        wikitext = data.parse.wikitext
        break
      }
    } catch {
      /* try next */
    }
  }
  if (!wikitext) {
    throw new Error('Wikipedia: could not load Brasileirão Série A season page')
  }

  const byPage = new Map<string, WikiClub>()

  // League table template: |name_FLA=[[CR Flamengo|Flamengo]]  (authoritative 20 clubs)
  for (const m of wikitext.matchAll(/\|name_([A-Z0-9]+)\s*=\s*(\{\{nowrap\|)?(\[\[[^\]]+\]\])/g)) {
    const code = m[1]
    const link = m[3]!
    const { page, name } = displayName(link)
    if (!page || page.startsWith('File:') || page.startsWith('Image:')) continue
    if (name.length < 2) continue
    // Skip non-club template noise
    if (/^(File|Image|Category|Template):/i.test(page)) continue
    byPage.set(page, { page, name, code })
  }

  const clubs = [...byPage.values()]
  if (clubs.length < 10) {
    throw new Error(`Wikipedia: expected ≥10 Serie A clubs from name_* table, got ${clubs.length}`)
  }
  return clubs.sort((a, b) => a.name.localeCompare(b.name))
}

async function findSquadSectionIndex(page: string): Promise<number | null> {
  const data = await wikiJson<{
    parse?: { sections?: Array<{ index: string; line: string; anchor?: string }> }
  }>({
    action: 'parse',
    page,
    prop: 'sections',
  })
  const sections = data.parse?.sections || []
  const preferred = [
    'first-team squad',
    'first team squad',
    'current squad',
    'squad',
    'players',
  ]
  for (const pref of preferred) {
    const hit = sections.find((s) => s.line.toLowerCase().includes(pref))
    if (hit) return Number(hit.index)
  }
  return null
}

function mapWikiPos(pos: string): string {
  const p = pos.toUpperCase()
  if (p === 'GK') return 'GK'
  if (p === 'DF' || p === 'CB' || p === 'LB' || p === 'RB') {
    if (p === 'LB') return 'LB'
    if (p === 'RB') return 'RB'
    return 'CB'
  }
  if (p === 'MF' || p === 'CM' || p === 'DM' || p === 'AM') {
    if (p === 'DM') return 'CDM'
    if (p === 'AM') return 'CAM'
    return 'CM'
  }
  if (p === 'FW' || p === 'ST' || p === 'CF' || p === 'LW' || p === 'RW') {
    if (p === 'LW') return 'LW'
    if (p === 'RW') return 'RW'
    return 'ST'
  }
  return 'CM'
}

export async function fetchSquadFromWikipedia(page: string): Promise<WikiPlayer[]> {
  const section = await findSquadSectionIndex(page)
  const params: Record<string, string> = {
    action: 'parse',
    page,
    prop: 'wikitext',
  }
  if (section != null && !Number.isNaN(section)) {
    params.section = String(section)
  }

  const data = await wikiJson<{ parse?: { wikitext?: string } }>(params)
  let text = data.parse?.wikitext || ''

  // If full page (no section), try to extract first-team block
  if (section == null) {
    const m = text.match(
      /===?\s*First[- ]team squad[\s\S]*?(?=\n===?\s*[A-Z]|\n==\s|$)/i,
    )
    if (m) text = m[0]
  }

  const players: WikiPlayer[] = []
  const seen = new Set<string>()

  for (const m of text.matchAll(/\{\{[Ff]s player\|([^}]+)\}\}/g)) {
    const body = m[1]!
    const no = body.match(/no\s*=\s*([^|]+)/i)?.[1]?.trim()
    const pos = body.match(/pos\s*=\s*([^|]+)/i)?.[1]?.trim() || 'MF'
    const nameMatch =
      body.match(/name\s*=\s*\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/i) ||
      body.match(/name\s*=\s*([^|{]+)/i)
    const name = nameMatch?.[1]?.trim()
    if (!name || name.length < 2) continue
    if (seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    const shirt = no && /^\d+$/.test(no) ? Number(no) : null
    players.push({
      name,
      position: mapWikiPos(pos),
      shirtNumber: shirt,
      nationality: body.match(/nat\s*=\s*([^|]+)/i)?.[1]?.trim(),
    })
  }

  return players
}

/** Resolve a display club name to a Wikipedia page via search. */
export async function resolveWikipediaPage(query: string): Promise<string | null> {
  const data = await wikiJson<{
    query?: { search?: Array<{ title: string }> }
  }>({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
  })
  const hits = data.query?.search || []
  // Prefer football club pages
  const preferred = hits.find(
    (h) =>
      /F\.?C|Football|Futebol|Esporte|Clube|CR |SC |EC |SE /i.test(h.title) ||
      h.title.includes(query.split(' ')[0] || query),
  )
  return preferred?.title || hits[0]?.title || null
}
