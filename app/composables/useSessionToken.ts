import { get, set, del } from 'idb-keyval'

const IDB_KEY = 'gofoot.sessionToken'

/**
 * Session token lives in IndexedDB (not localStorage).
 * Token is the only identity — lose it, lose the save.
 */
export function useSessionToken() {
  const token = useState<string | null>('session-token', () => null)
  const ready = useState<boolean>('session-token-ready', () => false)

  async function load(): Promise<string | null> {
    if (!import.meta.client) {
      ready.value = true
      return null
    }
    try {
      const stored = await get<string>(IDB_KEY)
      token.value = stored ?? null
    } catch {
      token.value = null
    } finally {
      ready.value = true
    }
    return token.value
  }

  async function save(value: string): Promise<void> {
    token.value = value
    if (import.meta.client) {
      await set(IDB_KEY, value)
    }
  }

  async function clear(): Promise<void> {
    token.value = null
    if (import.meta.client) {
      await del(IDB_KEY)
    }
  }

  return { token, ready, load, save, clear }
}
