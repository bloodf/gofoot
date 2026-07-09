<template>
  <div class="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6 px-1">
    <div class="text-center">
      <img src="/brand/logo.svg" alt="GoFoot" class="mx-auto h-16 w-16" width="64" height="64" />
      <h1 class="mt-3 text-xl font-bold tracking-tight">{{ t('session.title') }}</h1>
      <p class="mt-1 text-sm text-gray-400">{{ t('session.subtitle') }}</p>
    </div>

    <div class="space-y-3 rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
      <UButton
        data-testid="session-create"
        block
        size="lg"
        class="tap-target min-h-11"
        color="primary"
        :loading="creating"
        @click="onCreate"
      >
        {{ t('session.create') }}
      </UButton>

      <div class="space-y-2">
        <label class="block text-xs font-medium text-gray-400" for="token-input">
          {{ t('session.pasteToken') }}
        </label>
        <textarea
          id="token-input"
          v-model="paste"
          data-testid="session-token-input"
          rows="3"
          class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-xs text-gray-100"
          :placeholder="t('session.tokenPlaceholder')"
        />
        <UButton
          data-testid="session-continue"
          block
          size="lg"
          class="tap-target min-h-11"
          color="gray"
          variant="soft"
          :loading="resuming"
          @click="onResume"
        >
          {{ t('session.continue') }}
        </UButton>
      </div>

      <div v-if="displayToken" class="space-y-2 rounded-lg bg-gray-950 p-3">
        <p class="text-xs text-gray-400">{{ t('session.tokenOnce') }}</p>
        <code
          data-testid="session-token-display"
          class="block break-all font-mono text-[11px] leading-relaxed text-gofoot-accent"
        >
          {{ displayToken }}
        </code>
        <UButton
          data-testid="session-copy"
          block
          size="md"
          class="tap-target min-h-11"
          color="primary"
          variant="outline"
          @click="copyToken"
        >
          {{ copied ? t('session.copied') : t('session.copy') }}
        </UButton>
      </div>

      <p v-if="error" class="text-sm text-gofoot-danger" role="alert">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
})

const { t } = useI18n()
const { token, save, load } = useSessionToken()
const router = useRouter()

const paste = ref('')
const displayToken = ref('')
const creating = ref(false)
const resuming = ref(false)
const copied = ref(false)
const error = ref('')

onMounted(async () => {
  await load()
  if (token.value) {
    paste.value = token.value
  }
})

async function onCreate() {
  creating.value = true
  error.value = ''
  try {
    const res = await $fetch<{ token: string }>('/api/session/create', { method: 'POST' })
    if (!res?.token) {
      throw new Error(t('session.errorCreate'))
    }
    displayToken.value = res.token
    await save(res.token)
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'data' in e
        ? String((e as { data?: { statusMessage?: string } }).data?.statusMessage || '')
        : ''
    error.value =
      msg || (e instanceof Error ? e.message : t('session.errorCreate')) || t('session.errorCreate')
  } finally {
    creating.value = false
  }
}

async function onResume() {
  resuming.value = true
  error.value = ''
  const value = paste.value.trim()
  if (!value) {
    error.value = t('session.errorResume')
    resuming.value = false
    return
  }
  try {
    await $fetch('/api/session/resume', {
      method: 'POST',
      body: { token: value },
    })
    await save(value)
    await router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('session.errorResume')
  } finally {
    resuming.value = false
  }
}

async function copyToken() {
  if (!displayToken.value || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(displayToken.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    error.value = t('session.errorCopy')
  }
}
</script>
