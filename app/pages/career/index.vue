<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('career.title') }}</h1>
    <p v-if="data" class="text-sm text-gray-400">
      {{ data.clubName }} · {{ t('career.season') }} {{ data.season }}
    </p>

    <ol class="space-y-2">
      <li
        v-for="rung in data?.rungs ?? []"
        :key="rung.id"
        class="rounded-xl border px-4 py-3"
        :class="
          rung.current
            ? 'border-gofoot-primary bg-gofoot-dark/40'
            : rung.unlocked
              ? 'border-gray-700 bg-gray-900/80'
              : 'border-gray-900 bg-gray-950 opacity-50'
        "
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">{{ rung.id }}</span>
          <span v-if="rung.current" class="text-xs text-gofoot-primary">{{ t('career.now') }}</span>
          <span v-else-if="!rung.unlocked" class="text-xs text-gray-600">🔒</span>
        </div>
        <p v-if="rung.current" class="mt-1 text-xs text-gray-400">{{ t('career.currentHint') }}</p>
      </li>
    </ol>

    <UButton to="/leagues/serie_d" class="tap-target min-h-11" block color="primary" variant="soft">
      {{ t('career.viewTable') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const data = ref<{
  clubName?: string
  season?: number
  rungs: Array<{ id: string; unlocked: boolean; current: boolean }>
} | null>(null)

onMounted(async () => {
  await load()
  data.value = await api('/api/career')
})
</script>
