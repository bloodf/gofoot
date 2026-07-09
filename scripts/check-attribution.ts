/**
 * Stage 0 stub: ensure ATTRIBUTION.md exists.
 * Full asset pipeline will regenerate rows later.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const path = join(process.cwd(), 'ATTRIBUTION.md')
if (!existsSync(path)) {
  console.error('check:attribution FAILED — ATTRIBUTION.md missing')
  process.exit(1)
}
console.log('check:attribution OK (stub — full registry on asset pipeline cycle)')
