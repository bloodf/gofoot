import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{vue,js,ts}', './components/**/*.{vue,js,ts}'],
  theme: {
    screens: {
      // GoFoot mobile-first (phone is default)
      phone: '0px',
      phablet: '430px',
      // aliases for Nuxt UI / ecosystem
      sm: '430px',
      md: '768px',
      tablet: '768px',
      lg: '1024px',
      laptop: '1024px',
      xl: '1280px',
      desktop: '1280px',
      '2xl': '1536px',
      wide: '1536px',
    },
    extend: {
      colors: {
        gofoot: {
          primary: '#0a8f4a',
          dark: '#086a39',
          accent: '#f5d35e',
          danger: '#c0392b',
        },
      },
      minHeight: {
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      height: {
        topbar: '48px',
        bottomnav: '56px',
        audiodock: '36px',
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}

export default config
