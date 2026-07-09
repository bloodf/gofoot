<template>
  <header
    class="fixed inset-x-0 top-0 z-40 flex h-topbar items-center gap-2 border-b border-gray-800 bg-gray-950/95 px-3 backdrop-blur safe-pt"
    role="banner"
  >
    <NuxtLink
      to="/"
      class="tap-target flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gofoot-primary"
      :aria-label="t('nav.home')"
    >
      <img src="/brand/logo.svg" alt="" width="40" height="40" class="h-10 w-10" />
      <span class="hidden phablet:inline text-sm font-semibold tracking-tight">GoFoot</span>
    </NuxtLink>

    <p class="min-w-0 flex-1 truncate text-sm text-gray-400" :title="saveLabel">
      {{ saveLabel }}
    </p>

    <UButton
      icon="i-heroicons-bars-3"
      color="gray"
      variant="ghost"
      class="tap-target"
      :aria-label="t('nav.menu')"
      @click="menuOpen = true"
    />

    <UModal v-model="menuOpen">
      <UCard>
        <template #header>
          <h2 class="text-base font-semibold">{{ t('nav.menu') }}</h2>
        </template>
        <ul class="space-y-2 text-sm">
          <li>
            <span class="text-gray-400">{{ t('session.tokenChip') }}</span>
            <code class="mt-1 block truncate rounded bg-gray-900 px-2 py-1 text-xs">
              {{ tokenPreview }}
            </code>
          </li>
          <li>
            <NuxtLink
              to="/session"
              class="tap-target flex items-center text-gofoot-primary"
              @click="menuOpen = false"
            >
              {{ t('nav.session') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/settings"
              class="tap-target flex items-center"
              @click="menuOpen = false"
            >
              {{ t('nav.settings') }}
            </NuxtLink>
          </li>
        </ul>
      </UCard>
    </UModal>
  </header>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { token, load } = useSessionToken()
const menuOpen = ref(false)

onMounted(() => {
  void load()
})

const saveLabel = computed(() => t('hub.saveNamePlaceholder'))
const tokenPreview = computed(() => {
  const v = token.value
  if (!v) return t('session.noToken')
  return `${v.slice(0, 8)}…${v.slice(-6)}`
})
</script>
