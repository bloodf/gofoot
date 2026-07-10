<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('club.title') }}</h1>
    <p class="text-sm text-gray-400">{{ data?.players?.length ?? 0 }} jogadores</p>
    <div class="flex gap-2 overflow-x-auto pb-1">
      <UButton
        v-for="link in links"
        :key="link.to"
        size="sm"
        class="tap-target shrink-0"
        color="primary"
        variant="soft"
        :to="link.to"
      >
        {{ link.label }}
      </UButton>
    </div>

    <ul class="divide-y divide-gray-800 rounded-xl border border-gray-800">
      <li v-for="p in data?.players ?? []" :key="p.id">
        <button
          type="button"
          class="tap-target flex w-full items-center gap-3 px-3 py-3 text-left active:bg-gray-900"
          @click="selected = p"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gofoot-dark text-xs font-bold"
          >
            {{ p.position }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">{{ p.name }}</span>
            <span class="text-xs text-gray-500">#{{ p.shirtNumber }} · {{ p.age }}a</span>
          </span>
          <span class="text-sm font-semibold text-gofoot-accent">{{ p.overall }}</span>
          <span v-if="p.starter" class="text-[10px] uppercase text-gofoot-primary">XI</span>
        </button>
      </li>
    </ul>

    <UiBottomSheet :open="!!selected" @update:open="(v) => !v && (selected = null)">
      <template v-if="selected">
        <h2 class="text-base font-semibold">{{ selected.name }}</h2>
        <p class="text-xs text-gray-400">{{ selected.position }} · OVR {{ selected.overall }}</p>
        <dl class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div><dt class="text-gray-500">Pace</dt><dd>{{ selected.pace }}</dd></div>
          <div><dt class="text-gray-500">Shoot</dt><dd>{{ selected.shooting }}</dd></div>
          <div><dt class="text-gray-500">Pass</dt><dd>{{ selected.passing }}</dd></div>
          <div><dt class="text-gray-500">Def</dt><dd>{{ selected.defending }}</dd></div>
          <div><dt class="text-gray-500">Phy</dt><dd>{{ selected.physical }}</dd></div>
          <div><dt class="text-gray-500">Morale</dt><dd>{{ selected.morale }}</dd></div>
        </dl>
      </template>
    </UiBottomSheet>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

interface Player {
  id: string
  name: string
  position: string
  age: number
  overall: number
  pace: number
  shooting: number
  passing: number
  defending: number
  physical: number
  morale: number
  shirtNumber: number
  starter: boolean
}

const data = ref<{ players: Player[] } | null>(null)
const selected = ref<Player | null>(null)

const links = [
  { to: '/club/tactics', label: 'Táticas' },
  { to: '/club/transfers', label: 'Transferências' },
  { to: '/club/training', label: 'Base' },
  { to: '/club/finance', label: 'Finanças' },
  { to: '/club/stadium', label: 'Estádio' },
]

onMounted(async () => {
  await load()
  data.value = await api('/api/club/squad')
})
</script>
