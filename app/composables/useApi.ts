export function useApi() {
  const { token, load } = useSessionToken()

  async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
    if (!token.value) await load()
    const headers: Record<string, string> = {}
    if (token.value) headers['x-session-token'] = token.value
    const res = await $fetch(path, {
      method: (opts.method as 'GET') || 'GET',
      body: opts.body as Record<string, unknown> | undefined,
      headers,
    })
    return res as T
  }

  return { api }
}
