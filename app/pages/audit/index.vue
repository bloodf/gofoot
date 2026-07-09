<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('audit.title') }}</h1>
    <p class="text-sm" :class="data?.intact ? 'text-gofoot-primary' : 'text-gofoot-danger'">
      {{ data?.intact ? t('audit.intact') : t('audit.broken') }} · {{ data?.length ?? 0 }}
      {{ t('audit.entries') }}
    </p>
    <ul class="space-y-2 font-mono text-[11px]">
      <li
        v-for="e in data?.entries ?? []"
        :key="e.seq"
        class="rounded border border-gray-800 bg-gray-900/60 p-2"
      >
        <div>#{{ e.seq }} {{ e.kind }}</div>
        <div class="truncate text-gray-500">hmac {{ e.hmac }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const data = ref<{
  intact: boolean
  length: number
  entries: Array<{ seq: number; kind: string; hmac: string }>
} | null>(null)

onMounted(async () => {
  await load()
  data.value = await api('/api/audit')
})
</script>
