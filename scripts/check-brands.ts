/**
 * Fail if known real-brand deny-list strings appear outside allowed paths.
 * Deny list lives in data/real-brand-denylist.json (not scanned for hits).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

const ALLOW_PREFIXES = [
  'data/joke-brands.json',
  'data/real-brand-denylist.json',
  'LEGAL.md',
  'GOFOOT_PROMPT.md',
  'CHEATSHEET.md',
  'ATTRIBUTION.md',
  'docs/',
  'scripts/check-brands.ts',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
]

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.output',
  '.git',
  '.data',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.vercel',
  'assets',
])

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.vue',
  '.json',
  '.md',
  '.css',
  '.html',
  '.yml',
  '.yaml',
  '.sql',
])

const denyList = JSON.parse(
  readFileSync(join(ROOT, 'data/real-brand-denylist.json'), 'utf8'),
) as { terms: string[] }

function isAllowed(rel: string): boolean {
  if (rel.startsWith('patches/')) return true
  return ALLOW_PREFIXES.some((p) => rel === p || rel.startsWith(p))
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else {
      const ext = name.includes('.') ? `.${name.split('.').pop()}` : ''
      if (TEXT_EXT.has(ext)) out.push(p)
    }
  }
  return out
}

const files = walk(ROOT)
const hits: string[] = []

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/')
  if (isAllowed(rel)) continue
  const text = readFileSync(file, 'utf8').toLowerCase()
  for (const brand of denyList.terms) {
    if (text.includes(brand.toLowerCase())) {
      hits.push(`${rel}: contains forbidden brand fragment "${brand}"`)
    }
  }
}

if (hits.length) {
  console.error('check:brands FAILED\n' + hits.join('\n'))
  process.exit(1)
}

console.log(`check:brands OK (${files.length} files scanned)`)
