<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('cup.title') }}</h1>
    <p class="text-xs text-gray-400">{{ cupId }}</p>
    <ul class="space-y-2">
      <li
        v-for="tie in ties"
        :key="tie.id"
        class="rounded-xl border border-gray-800 bg-gray-900/70 p-3"
      >
        <p class="text-xs text-gray-500">{{ tie.round }}</p>
        <p class="text-sm font-medium">
          {{ tie.home.name }}
          <span class="text-gofoot-accent">
            {{ tie.status === 'played' ? `${tie.homeGoals}–${tie.awayGoals}` : 'vs' }}
          </span>
          {{ tie.away.name }}
        </p>
        <UButton
          v-if="tie.status !== 'played'"
          size="sm"
          class="tap-target mt-2"
          color="primary"
          @click="sim(tie.id)"
        >
          {{ t('cup.sim') }}
        </UButton>
      </li>
      <li v-if="!ties.length" class="text-sm text-gray-500">{{ t('cup.empty') }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const cupId = computed(() => String(route.params.cupId || 'copa_do_brasil'))
const ties = ref<
  Array<{
    id: string
    round: string
    home: { name: string }
    away: { name: string }
    homeGoals?: number
    awayGoals?: number
    status: string
  }>
>([])

async function refresh() {
  await load()
  const res = await api<{ ties: typeof ties.value }>(`/api/cups/${cupId.value}`)
  ties.value = res.ties
}

async function sim(tieId: string) {
  await api('/api/cups/sim', { method: 'POST', body: { tieId } })
  await refresh()
}

onMounted(refresh)
</script>
