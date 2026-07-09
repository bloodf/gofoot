<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold tracking-tight">{{ t('hub.title') }}</h1>
    <p v-if="hub" class="text-sm text-gray-400">
      {{ hub.career.clubName }} · {{ hub.career.division }} · {{ formatMoney(hub.career.cash) }}
    </p>
    <p v-else class="text-sm text-gray-400">{{ t('hub.subtitle') }}</p>

    <div
      v-if="hub?.nextMatch"
      class="rounded-xl border border-gofoot-primary/40 bg-gray-900/80 px-4 py-3"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-medium">{{ t('hub.nextMatch') }}</span>
        <span class="text-xs text-gray-500">MD {{ hub.nextMatch.matchday }}</span>
      </div>
      <p class="mt-1 text-sm">
        {{ hub.nextMatch.homeName }} vs {{ hub.nextMatch.awayName }}
      </p>
      <UButton
        class="tap-target mt-3 min-h-11"
        block
        color="primary"
        :to="`/match/${hub.nextMatch.id}`"
      >
        {{ t('hub.openMatch') }}
      </UButton>
    </div>

    <ul class="space-y-2">
      <li v-for="tile in tiles" :key="tile.key">
        <NuxtLink
          :to="tile.to"
          class="block rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3 active:bg-gray-800"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">{{ t(tile.labelKey) }}</span>
            <span class="text-xs text-gray-500">{{ tile.value }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-400">{{ t(tile.hintKey) }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

interface Hub {
  career: {
    clubName: string
    division: string
    cash: number
    boardConfidence: number
    reputation: number
  }
  nextMatch: {
    id: string
    homeName?: string
    awayName?: string
    matchday: number
  } | null
  inboxUnread: number
}

const hub = ref<Hub | null>(null)

function formatMoney(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n)
}

const tiles = computed(() => [
  {
    key: 'cash',
    labelKey: 'hub.cash',
    hintKey: 'hub.cashHint',
    value: hub.value ? formatMoney(hub.value.career.cash) : '—',
    to: '/club/finance',
  },
  {
    key: 'board',
    labelKey: 'hub.board',
    hintKey: 'hub.boardHint',
    value: hub.value ? `${hub.value.career.boardConfidence}%` : '—',
    to: '/career',
  },
  {
    key: 'form',
    labelKey: 'hub.form',
    hintKey: 'hub.formHint',
    value: hub.value?.career.division ?? '—',
    to: '/leagues/serie_d',
  },
  {
    key: 'inbox',
    labelKey: 'hub.inbox',
    hintKey: 'hub.inboxHint',
    value: String(hub.value?.inboxUnread ?? 0),
    to: '/inbox',
  },
  {
    key: 'trophies',
    labelKey: 'hub.trophies',
    hintKey: 'hub.trophiesHint',
    value: '→',
    to: '/career',
  },
  {
    key: 'fantasy',
    labelKey: 'hub.fantasy',
    hintKey: 'hub.fantasyHint',
    value: '▶',
    to: '/fantasy',
  },
])

onMounted(async () => {
  await load()
  try {
    hub.value = await api<Hub>('/api/hub')
  } catch {
    hub.value = null
  }
})
</script>
