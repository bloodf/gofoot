/**
 * Copy brand SVGs + SFX into public/ for PWA + match audio.
 */
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
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

const audioSrc = join(assets, 'audio')
const audioDest = join(publicDir, 'audio')
if (existsSync(audioSrc)) {
  mkdirSync(audioDest, { recursive: true })
  for (const f of readdirSync(audioSrc)) {
    if (!f.endsWith('.mp3')) continue
    // Skip TTS samples from public ship (reference only)
    if (f.startsWith('tts-sample-')) continue
    copyFileSync(join(audioSrc, f), join(audioDest, f))
    console.log(`copied audio/${f}`)
  }
}

console.log('fetch:assets done')
