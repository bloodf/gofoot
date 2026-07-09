import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  // Optional client persist for non-authoritative UI prefs only.
  // Game state is never client-authoritative.
  // @ts-expect-error pinia type from Nuxt plugin injection
  $pinia.use(piniaPluginPersistedstate)
})
