<template>
  <div class="mx-auto flex w-full max-w-lg flex-col gap-3">
    <header class="sticky top-0 z-10 rounded-xl border border-gray-800 bg-gray-950/95 p-3 backdrop-blur">
      <div class="flex items-center justify-between gap-2 text-sm font-semibold">
        <span class="truncate">{{ match?.home?.name ?? '…' }}</span>
        <span class="font-mono text-lg text-gofoot-accent">
          {{ scoreHome }} - {{ scoreAway }}
        </span>
        <span class="truncate text-right">{{ match?.away?.name ?? '…' }}</span>
      </div>
      <div class="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>{{ minute }}'</span>
        <span>{{ statusLabel }}</span>
      </div>
    </header>

    <div
      ref="streamEl"
      class="max-h-[50vh] space-y-2 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-3"
    >
      <p
        v-for="ev in visibleEvents"
        :key="ev.id"
        class="text-sm leading-snug"
        :class="ev.type.includes('goal') ? 'font-semibold text-gofoot-accent' : 'text-gray-200'"
      >
        <span class="mr-1 font-mono text-xs text-gray-500">{{ ev.minute }}'</span>
        {{ locale.startsWith('pt') ? ev.text_pt : ev.text_en }}
      </p>
      <p v-if="!visibleEvents.length" class="text-sm text-gray-500">{{ t('match.waiting') }}</p>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="match?.status !== 'played' || !started"
        data-testid="match-sim"
        class="tap-target min-h-11 flex-1"
        color="primary"
        :loading="loading"
        @click="run"
      >
        {{ t('match.play') }}
      </UButton>
      <UButton class="tap-target min-h-11" color="gray" variant="soft" @click="cycleSpeed">
        {{ speed }}x
      </UButton>
      <UButton class="tap-target min-h-11" color="gray" variant="soft" @click="paused = !paused">
        {{ paused ? t('match.resume') : t('match.pause') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()
const { speed, onEvent } = useMatchAudio()

interface MatchEvent {
  id: string
  type: string
  minute: number
  real_ts_ms: number
  text_pt: string
  text_en: string
  home_score: number
  away_score: number
}

interface MatchPayload {
  id: string
  status: string
  home: { name: string }
  away: { name: string }
  homeGoals?: number
  awayGoals?: number
  events: MatchEvent[]
  duration_ms_1x: number
}

const match = ref<MatchPayload | null>(null)
const events = ref<MatchEvent[]>([])
const visibleEvents = ref<MatchEvent[]>([])
const loading = ref(false)
const started = ref(false)
const paused = ref(false)
const minute = ref(0)
const scoreHome = ref(0)
const scoreAway = ref(0)
const streamEl = ref<HTMLElement | null>(null)
let timers: ReturnType<typeof setTimeout>[] = []

const statusLabel = computed(() => {
  if (!started.value) return match.value?.status === 'played' ? t('match.ended') : t('match.scheduled')
  if (paused.value) return t('match.paused')
  return t('match.live')
})

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  timers = []
}

function schedule(evs: MatchEvent[], duration: number) {
  clearTimers()
  visibleEvents.value = []
  started.value = true
  const factor = 1 / Math.max(1, speed.value)
  for (const ev of evs) {
    const delay = ev.real_ts_ms * factor
    const handle = setTimeout(() => {
      if (paused.value) return
      visibleEvents.value = [...visibleEvents.value, ev]
      minute.value = ev.minute
      scoreHome.value = ev.home_score
      scoreAway.value = ev.away_score
      onEvent(ev.type, locale.value.startsWith('pt') ? ev.text_pt : ev.text_en)
      nextTick(() => {
        streamEl.value?.scrollTo({ top: streamEl.value.scrollHeight, behavior: 'smooth' })
      })
    }, delay)
    timers.push(handle)
  }
  // safety end
  timers.push(
    setTimeout(() => {
      minute.value = 90
    }, duration * factor + 50),
  )
}

async function run() {
  loading.value = true
  try {
    await load()
    const id = String(route.params.id)
    const res = await api<MatchPayload & { events: MatchEvent[] }>(`/api/match/${id}/simulate`, {
      method: 'POST',
    })
    match.value = res
    events.value = res.events
    scoreHome.value = 0
    scoreAway.value = 0
    schedule(res.events, res.duration_ms_1x || 300_000)
  } finally {
    loading.value = false
  }
}

function cycleSpeed() {
  const speeds = [1, 2, 5, 10]
  const i = speeds.indexOf(speed.value)
  speed.value = speeds[(i + 1) % speeds.length]!
}

onMounted(async () => {
  await load()
  match.value = await api(`/api/match/${route.params.id}`)
  if (match.value?.status === 'played' && match.value.events?.length) {
    events.value = match.value.events
    visibleEvents.value = match.value.events
    scoreHome.value = Number(match.value.homeGoals ?? 0)
    scoreAway.value = Number(match.value.awayGoals ?? 0)
    minute.value = 90
    started.value = true
  }
})

onBeforeUnmount(() => clearTimers())
</script>
