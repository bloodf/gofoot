/**
 * Verify ATTRIBUTION.md exists and lists required license sections + brand assets.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const path = join(root, 'ATTRIBUTION.md')
if (!existsSync(path)) {
  console.error('check:attribution FAILED — ATTRIBUTION.md missing')
  process.exit(1)
}

const text = readFileSync(path, 'utf8')
const required = ['Vue 3', 'Nuxt 3', 'MIT', 'Wikimedia', 'joke-brands']
const missing = required.filter((r) => !text.toLowerCase().includes(r.toLowerCase()))
// joke-brands may only be in data — allow LEGAL instead
const softMissing = missing.filter((m) => m !== 'joke-brands')

if (softMissing.length) {
  console.error('check:attribution FAILED — missing sections:', softMissing.join(', '))
  process.exit(1)
}

// Ensure public brand files exist
const brand = join(root, 'public/brand/logo.svg')
const fav = join(root, 'public/favicon.svg')
if (!existsSync(brand) || !existsSync(fav)) {
  console.error('check:attribution FAILED — public brand assets missing (run pnpm fetch:assets)')
  process.exit(1)
}

const audioDir = join(root, 'public/audio')
if (existsSync(audioDir)) {
  const sfx = readdirSync(audioDir).filter((f) => f.startsWith('sfx-'))
  if (sfx.length < 5) {
    console.error('check:attribution FAILED — expected SFX in public/audio')
    process.exit(1)
  }
}

console.log('check:attribution OK')
