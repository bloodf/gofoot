<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('training.title') }}</h1>
    <p class="text-sm text-gray-400">{{ t('training.subtitle') }}</p>

    <section class="rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('training.youth') }}</h2>
      <ul class="mt-2 space-y-2">
        <li
          v-for="y in youth"
          :key="y.id"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <span>{{ y.name }} · {{ y.position }} · pot {{ y.potential }}</span>
          <UButton size="sm" class="tap-target" color="primary" variant="soft" @click="promote(y.id)">
            {{ t('training.promote') }}
          </UButton>
        </li>
        <li v-if="!youth.length" class="text-xs text-gray-500">{{ t('training.noYouth') }}</li>
      </ul>
    </section>

    <section class="rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('training.focus') }}</h2>
      <div class="mt-2 flex flex-wrap gap-2">
        <UButton
          v-for="f in focuses"
          :key="f"
          size="sm"
          class="tap-target"
          :variant="focus === f ? 'solid' : 'soft'"
          color="primary"
          @click="focus = f"
        >
          {{ f }}
        </UButton>
      </div>
      <p class="mt-2 text-xs text-gray-400">{{ t('training.focusHint') }}</p>
    </section>
    <p v-if="msg" class="text-sm text-gofoot-primary">{{ msg }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const youth = ref<
  Array<{ id: string; name: string; position: string; potential: number; overall: number }>
>([])
const focus = ref('fitness')
const focuses = ['fitness', 'tactics', 'attack', 'defense', 'set_pieces']
const msg = ref('')

async function refresh() {
  await load()
  const res = await api<{ youth: typeof youth.value }>('/api/club/youth')
  youth.value = res.youth
}

async function promote(id: string) {
  await api('/api/club/youth/promote', { method: 'POST', body: { youthId: id } })
  msg.value = t('training.promoted')
  await refresh()
}

onMounted(refresh)
</script>
