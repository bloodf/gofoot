<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('leagues.title') }}</h1>
    <p class="text-xs text-gray-400">{{ competitionId }}</p>

    <div class="overflow-x-auto rounded-xl border border-gray-800">
      <table class="w-full min-w-[480px] text-left text-sm">
        <thead class="bg-gray-900 text-xs text-gray-400">
          <tr>
            <th class="px-2 py-2">#</th>
            <th class="px-2 py-2">{{ t('leagues.club') }}</th>
            <th class="px-2 py-2">P</th>
            <th class="px-2 py-2">W</th>
            <th class="px-2 py-2">D</th>
            <th class="px-2 py-2">L</th>
            <th class="px-2 py-2">GD</th>
            <th class="px-2 py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in table"
            :key="row.clubId"
            class="border-t border-gray-800"
            :class="row.clubId === myClub ? 'bg-gofoot-dark/30' : ''"
          >
            <td class="px-2 py-2 text-gray-500">{{ row.rank }}</td>
            <td class="px-2 py-2 font-medium">{{ row.shortName || row.name }}</td>
            <td class="px-2 py-2">{{ row.played }}</td>
            <td class="px-2 py-2">{{ row.won }}</td>
            <td class="px-2 py-2">{{ row.drawn }}</td>
            <td class="px-2 py-2">{{ row.lost }}</td>
            <td class="px-2 py-2">{{ row.gd }}</td>
            <td class="px-2 py-2 font-semibold">{{ row.points }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <UButton
        v-for="id in comps"
        :key="id"
        size="sm"
        class="tap-target shrink-0"
        :variant="id === competitionId ? 'solid' : 'soft'"
        color="primary"
        :to="`/leagues/${id}`"
      >
        {{ id }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const competitionId = computed(() => String(route.params.id || 'serie_d'))
const comps = ['serie_d', 'serie_c', 'serie_b', 'serie_a']
const table = ref<
  Array<{
    rank: number
    clubId: string
    name: string
    shortName: string
    played: number
    won: number
    drawn: number
    lost: number
    gd: number
    points: number
  }>
>([])
const myClub = ref('')

watch(
  competitionId,
  async () => {
    await load()
    const hub = await api<{ career: { clubId: string; division: string } }>('/api/hub')
    myClub.value = hub.career.clubId
    const res = await api<{ table: typeof table.value }>(`/api/leagues/${competitionId.value}`)
    table.value = res.table
  },
  { immediate: true },
)
</script>
