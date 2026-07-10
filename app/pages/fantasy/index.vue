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
    </div>

    <section class="space-y-2">
      <h2 class="text-sm font-semibold">{{ t('fantasy.pickClub') }}</h2>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="c in data?.clubs ?? []"
          :key="c.id"
          size="sm"
          class="tap-target"
          :variant="clubId === c.id ? 'solid' : 'soft'"
          color="primary"
          @click="clubId = c.id"
        >
          {{ c.name }}
        </UButton>
      </div>
    </section>

    <ul class="space-y-2">
      <li
        v-for="p in data?.presets ?? []"
        :key="p.id"
        class="rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3"
      >
        <p class="text-sm font-medium">{{ p.title }}</p>
        <p class="text-xs text-gray-400">{{ p.description }}</p>
        <UButton
          class="tap-target mt-2 min-h-11"
          block
          color="primary"
          :disabled="!clubId"
          :loading="starting === p.id"
          @click="start(p.id)"
        >
          {{ t('fantasy.play') }}
        </UButton>
      </li>
    </ul>

    <div v-if="active" class="rounded-xl border border-gofoot-primary/40 p-4">
      <p class="text-sm font-semibold">{{ active.clubName }} · {{ t('fantasy.pts') }} {{ active.state.points }}</p>
      <p class="text-xs text-gray-400">MD {{ active.state.matchday }} · {{ active.state.played }} jogos</p>
      <UButton class="tap-target mt-3 min-h-11" block color="primary" :loading="playing" @click="play">
        {{ t('fantasy.nextMatch') }}
      </UButton>
      <div v-if="lastResult" class="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">
        <p class="font-semibold text-gofoot-accent">
          {{ lastResult.home }} {{ lastResult.homeGoals }}–{{ lastResult.awayGoals }} {{ lastResult.away }}
        </p>
        <p v-for="ev in lastResult.events.slice(0, 8)" :key="ev.id">
          {{ ev.minute }}' {{ ev.text_pt }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const data = ref<{
  live: { home: { name: string }; away: { name: string }; competition: string }
  presets: Array<{ id: string; title: string; description: string }>
  clubs: Array<{ id: string; name: string }>
} | null>(null)

const clubId = ref('')
const starting = ref('')
const playing = ref(false)
const active = ref<{
  id: string
  clubName: string
  state: { points: number; matchday: number; played: number }
} | null>(null)
const lastResult = ref<{
  home: string
  away: string
  homeGoals: number
  awayGoals: number
  events: Array<{ id: string; minute: number; text_pt: string }>
} | null>(null)

async function start(mode: string) {
  if (!clubId.value) return
  starting.value = mode
  await load()
  try {
    const res = await api<{
      id: string
      clubName: string
      state: { points: number; matchday: number; played: number }
    }>('/api/fantasy/start', {
      method: 'POST',
      body: { mode, clubId: clubId.value },
    })
    active.value = res
    lastResult.value = null
  } finally {
    starting.value = ''
  }
}

async function play() {
  if (!active.value) return
  playing.value = true
  try {
    const res = await api<{
      home: string
      away: string
      homeGoals: number
      awayGoals: number
      events: Array<{ id: string; minute: number; text_pt: string }>
      state: { points: number; matchday: number; played: number }
    }>(`/api/fantasy/${active.value.id}/play`, { method: 'POST' })
    lastResult.value = res
    active.value = { ...active.value, state: res.state }
  } finally {
    playing.value = false
  }
}

onMounted(async () => {
  data.value = await api('/api/fantasy')
  clubId.value = data.value?.clubs?.[0]?.id ?? ''
})
</script>
