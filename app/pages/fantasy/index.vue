<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('fantasy.title') }}</h1>

    <div
      v-if="data?.live"
      class="rounded-xl border border-gofoot-primary/50 bg-gradient-to-br from-gofoot-dark/50 to-gray-900 p-4"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-gofoot-primary">
        {{ t('fantasy.liveNow') }}
      </p>
      <p class="mt-2 text-base font-semibold">
        {{ data.live.home.name }} vs {{ data.live.away.name }}
      </p>
      <p class="text-xs text-gray-400">{{ data.live.competition }}</p>
      <UButton class="tap-target mt-3 min-h-11" block color="primary" @click="toast = t('fantasy.soon')">
        {{ t('fantasy.play') }}
      </UButton>
    </div>

    <ul class="space-y-2">
      <li
        v-for="p in data?.presets ?? []"
        :key="p.id"
        class="rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3"
      >
        <p class="text-sm font-medium">{{ p.title }}</p>
        <p class="text-xs text-gray-400">{{ p.description }}</p>
      </li>
    </ul>
    <p v-if="toast" class="text-sm text-gofoot-accent">{{ toast }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()

const data = ref<{
  live: { home: { name: string }; away: { name: string }; competition: string }
  presets: Array<{ id: string; title: string; description: string }>
} | null>(null)
const toast = ref('')

onMounted(async () => {
  data.value = await api('/api/fantasy')
})
</script>
