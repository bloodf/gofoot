// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  future: {
    compatibilityVersion: 4,
  },
  srcDir: 'app',
  serverDir: 'server',
  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  sourcemap: {
    server: false,
    client: false,
  },

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],

  runtimeConfig: {
    sessionHmacSecret: process.env.SESSION_HMAC_SECRET || '',
    tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:./.data/gofoot.db',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    /** TheSportsDB key — free public key is "3". Premium key optional. */
    theSportsDbApiKey: process.env.THESPORTSDB_API_KEY || '3',
    /** Optional football-data.org free-tier token for BSA squads */
    footballDataApiToken: process.env.FOOTBALL_DATA_API_TOKEN || '',
    public: {
      appName: 'GoFoot',
    },
  },

  app: {
    head: {
      title: 'GoFoot',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0a8f4a' },
        {
          name: 'description',
          content: 'Open-source, mobile-first football manager. No login. Session token.',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  colorMode: {
    preference: 'system',
    fallback: 'dark',
  },

  i18n: {
    locales: [
      { code: 'pt-BR', language: 'pt-BR', file: 'pt-BR.json', name: 'Português' },
      { code: 'en', language: 'en', file: 'en.json', name: 'English' },
    ],
    defaultLocale: 'pt-BR',
    lazy: true,
    langDir: '../locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'gofoot_locale',
      fallbackLocale: 'pt-BR',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'GoFoot',
      short_name: 'GoFoot',
      description: 'Open-source football manager PWA',
      theme_color: '#0a8f4a',
      background_color: '#0a0a0a',
      display: 'standalone',
      orientation: 'portrait-primary',
      lang: 'pt-BR',
      icons: [
        {
          src: '/icons/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  nitro: {
    preset: 'vercel',
    serverAssets: [{ baseName: 'gofoot-data', dir: './data' }],
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      },
    },
  },

  vite: {
    build: {
      sourcemap: false,
    },
  },
})
