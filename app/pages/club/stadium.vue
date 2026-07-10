<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('stadium.title') }}</h1>
    <template v-if="stadium">
      <p class="text-sm text-gray-400">{{ stadium.name }}</p>
      <p class="text-2xl font-bold text-gofoot-accent">{{ stadium.capacity }}</p>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="s in sectors"
          :key="s"
          class="rounded-xl border border-gray-800 bg-gray-900/60 p-3 text-center"
        >
          <p class="text-xs uppercase text-gray-500">{{ s }}</p>
          <p class="text-lg font-semibold">{{ stadium[s] }}</p>
          <UButton size="sm" class="tap-target mt-2" color="primary" variant="soft" @click="expand(s)">
            +500
          </UButton>
        </div>
      </div>
      <p class="text-xs text-gray-500">{{ t('stadium.level') }} {{ stadium.level }}</p>
    </template>
    <p v-if="msg" class="text-sm text-gofoot-primary">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

type Sector = 'north' | 'south' | 'east' | 'west'
const sectors: Sector[] = ['north', 'south', 'east', 'west']
const stadium = ref<{
  name: string
  capacity: number
  north: number
  south: number
  east: number
  west: number
  level: number
} | null>(null)
const msg = ref('')

async function refresh() {
  await load()
  const fin = await api<{ stadium: typeof stadium.value }>('/api/finance')
  stadium.value = fin.stadium
}

async function expand(sector: Sector) {
  const r = await api<{ stadium: typeof stadium.value; cost: number }>('/api/stadium/expand', {
    method: 'POST',
    body: { sector, add: 500 },
  })
  stadium.value = r.stadium
  msg.value = `−${r.cost}`
}

onMounted(refresh)
</script>
