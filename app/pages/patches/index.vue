<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('patches.title') }}</h1>
    <p class="text-sm text-gray-400">{{ t('patches.subtitle') }}</p>
    <ul class="space-y-2">
      <li
        v-for="p in available"
        :key="p.slug"
        class="rounded-xl border border-gray-800 bg-gray-900/70 p-4"
      >
        <p class="text-sm font-medium">{{ p.title }}</p>
        <p class="text-xs text-gray-400">{{ p.description }}</p>
        <UButton
          class="tap-target mt-3 min-h-11"
          block
          color="primary"
          :disabled="installed.has(p.slug)"
          @click="install(p.slug)"
        >
          {{ installed.has(p.slug) ? t('patches.installed') : t('patches.install') }}
        </UButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const available = ref<Array<{ slug: string; title: string; description: string }>>([])
const installed = ref(new Set<string>())

async function refresh() {
  await load()
  const res = await api<{
    available: typeof available.value
    installed: Array<{ slug: string }>
  }>('/api/patches')
  available.value = res.available
  installed.value = new Set(res.installed.map((i) => i.slug))
}

async function install(slug: string) {
  await api('/api/patches/install', { method: 'POST', body: { slug } })
  await refresh()
}

onMounted(refresh)
</script>
