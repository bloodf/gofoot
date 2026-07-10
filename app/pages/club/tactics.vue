<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('tactics.title') }}</h1>

    <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
      <p class="mb-2 text-xs text-gray-400">{{ t('tactics.pitch') }}</p>
      <div class="relative mx-auto aspect-[2/3] w-full max-w-xs rounded-lg bg-gofoot-dark/80 p-2">
        <div
          v-for="(slot, i) in formationSlots"
          :key="i"
          class="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gofoot-primary text-[10px] font-bold"
          :style="{ left: slot.x + '%', top: slot.y + '%' }"
        >
          {{ slot.pos }}
        </div>
      </div>
    </div>

    <label class="block text-xs text-gray-400">{{ t('tactics.formation') }}</label>
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="f in formations"
        :key="f"
        size="sm"
        class="tap-target"
        :variant="form.formation === f ? 'solid' : 'soft'"
        color="primary"
        @click="form.formation = f"
      >
        {{ f }}
      </UButton>
    </div>

    <label class="block text-xs text-gray-400">{{ t('tactics.mentality') }}</label>
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="m in mentalities"
        :key="m"
        size="sm"
        class="tap-target"
        :variant="form.mentality === m ? 'solid' : 'soft'"
        color="primary"
        @click="form.mentality = m"
      >
        {{ m }}
      </UButton>
    </div>

    <div v-for="key in sliders" :key="key" class="space-y-1">
      <label class="text-xs text-gray-400">{{ t(`tactics.${key}`) }}: {{ form[key] }}</label>
      <input v-model.number="form[key]" type="range" min="0" max="100" class="h-6 w-full" />
    </div>

    <UButton class="tap-target min-h-11" block color="primary" :loading="saving" @click="save">
      {{ t('tactics.save') }}
    </UButton>
    <p v-if="msg" class="text-sm text-gofoot-primary">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2']
const mentalities = ['defensive', 'balanced', 'attacking']
const sliders = ['pressing', 'tempo', 'width'] as const

const form = reactive({
  formation: '4-3-3',
  mentality: 'balanced',
  pressing: 50,
  tempo: 50,
  width: 50,
})
const saving = ref(false)
const msg = ref('')

const formationSlots = computed(() => {
  const map: Record<string, Array<{ pos: string; x: number; y: number }>> = {
    '4-3-3': [
      { pos: 'GK', x: 50, y: 90 },
      { pos: 'LB', x: 15, y: 70 },
      { pos: 'CB', x: 35, y: 72 },
      { pos: 'CB', x: 65, y: 72 },
      { pos: 'RB', x: 85, y: 70 },
      { pos: 'CM', x: 30, y: 50 },
      { pos: 'CM', x: 50, y: 52 },
      { pos: 'CM', x: 70, y: 50 },
      { pos: 'LW', x: 20, y: 28 },
      { pos: 'ST', x: 50, y: 22 },
      { pos: 'RW', x: 80, y: 28 },
    ],
    '4-4-2': [
      { pos: 'GK', x: 50, y: 90 },
      { pos: 'LB', x: 15, y: 70 },
      { pos: 'CB', x: 35, y: 72 },
      { pos: 'CB', x: 65, y: 72 },
      { pos: 'RB', x: 85, y: 70 },
      { pos: 'LM', x: 18, y: 48 },
      { pos: 'CM', x: 40, y: 50 },
      { pos: 'CM', x: 60, y: 50 },
      { pos: 'RM', x: 82, y: 48 },
      { pos: 'ST', x: 38, y: 24 },
      { pos: 'ST', x: 62, y: 24 },
    ],
  }
  return map[form.formation] ?? map['4-3-3']!
})

async function save() {
  saving.value = true
  msg.value = ''
  try {
    await api('/api/club/tactics', { method: 'POST', body: { ...form } })
    msg.value = t('tactics.saved')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
  const data = await api<typeof form>('/api/club/tactics')
  Object.assign(form, data)
})
</script>
