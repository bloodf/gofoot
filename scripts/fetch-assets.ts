/**
 * Copy brand SVGs into public/ for PWA + UI.
 * Raster icon generation (sharp) can be added when needed.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const assets = join(root, 'assets')
const publicDir = join(root, 'public')

const copies: Array<[string, string]> = [
  ['logo.svg', 'brand/logo.svg'],
  ['favicon.svg', 'favicon.svg'],
  ['favicon.svg', 'icons/icon.svg'],
]

for (const [from, to] of copies) {
  const src = join(assets, from)
  const dest = join(publicDir, to)
  if (!existsSync(src)) {
    console.warn(`skip missing ${from}`)
    continue
  }
  mkdirSync(join(dest, '..'), { recursive: true })
  copyFileSync(src, dest)
  console.log(`copied ${from} → public/${to}`)
}

console.log('fetch:assets done')
