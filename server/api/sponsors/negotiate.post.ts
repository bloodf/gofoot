import { ensureMigrated, getDb } from '../../lib/db'
import { negotiateBrand } from '../../lib/game'
import { requireSession } from '../../lib/session-auth'
import { loadJokeBrands } from '../../lib/data'

export default defineEventHandler(async (event) => {
  const { sessionId } = await requireSession(event)
  const raw = await readBody(event).catch(() => null)
  const body = (raw && typeof raw === 'object' ? raw : {}) as {
    brandId?: string
    ask?: number
    round?: number
  }
  if (!body.brandId) {
    return { brands: loadJokeBrands() }
  }
  await ensureMigrated()
  return negotiateBrand(
    getDb(),
    sessionId,
    body.brandId,
    Number(body.ask ?? 10000),
    Number(body.round ?? 1),
  )
})
