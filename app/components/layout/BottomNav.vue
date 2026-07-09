<template>
  <nav
    class="flex h-bottomnav items-stretch justify-around"
    role="navigation"
    :aria-label="t('nav.main')"
  >
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="tap-target flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-gray-400 transition-colors"
      :class="isActive(item.to) ? 'text-gofoot-primary border-b-2 border-gofoot-primary' : ''"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <UIcon :name="item.icon" class="h-5 w-5" />
      <span>{{ t(item.labelKey) }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const items = [
  { to: '/', icon: 'i-heroicons-home', labelKey: 'nav.hub' },
  { to: '/club', icon: 'i-heroicons-user-group', labelKey: 'nav.club' },
  { to: '/career', icon: 'i-heroicons-trophy', labelKey: 'nav.career' },
  { to: '/settings', icon: 'i-heroicons-cog-6-tooth', labelKey: 'nav.settings' },
] as const

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>
