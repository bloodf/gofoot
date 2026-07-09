/**
 * In-memory rate limiter (per isolate). Good enough for Stage 0 / hobby.
 * Replace with edge store if multi-region abuse appears.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + opts.windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  const remaining = Math.max(0, opts.limit - bucket.count)
  return {
    ok: bucket.count <= opts.limit,
    remaining,
    resetAt: bucket.resetAt,
  }
}

export function clientKey(event: { node?: { req?: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } } } }): string {
  const headers = event.node?.req?.headers ?? {}
  const fwd = headers['x-forwarded-for']
  const ip =
    (typeof fwd === 'string' ? fwd.split(',')[0]?.trim() : undefined) ||
    event.node?.req?.socket?.remoteAddress ||
    'unknown'
  return ip
}
