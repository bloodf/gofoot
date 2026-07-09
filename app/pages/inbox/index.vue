<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('inbox.title') }}</h1>
    <ul class="divide-y divide-gray-800 rounded-xl border border-gray-800">
      <li v-for="m in messages" :key="m.id" class="px-3 py-3">
        <p class="text-sm font-medium" :class="m.read ? 'text-gray-400' : ''">{{ m.subject }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ m.body }}</p>
      </li>
      <li v-if="!messages.length" class="px-3 py-6 text-center text-sm text-gray-500">
        {{ t('inbox.empty') }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const messages = ref<Array<{ id: string; subject: string; body: string; read: boolean }>>([])

onMounted(async () => {
  await load()
  const res = await api<{ messages: typeof messages.value }>('/api/inbox')
  messages.value = res.messages
})
</script>
