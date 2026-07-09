/**
 * Unauthenticated routes stay public.
 * Everything else needs a session token in IndexedDB.
 */
const PUBLIC = new Set(['/session', '/health'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (PUBLIC.has(to.path) || to.path.startsWith('/api')) return

  const { token, ready, load } = useSessionToken()
  if (!ready.value) {
    await load()
  }

  if (!token.value && to.path !== '/session') {
    return navigateTo('/session')
  }
})
