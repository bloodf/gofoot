<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold tracking-tight">{{ t('hub.title') }}</h1>
    <p class="text-sm text-gray-400">{{ t('hub.subtitle') }}</p>

    <ul class="space-y-2">
      <li v-for="tile in tiles" :key="tile.key">
        <div
          class="rounded-xl border border-gray-800 bg-gray-900/80 px-4 py-3"
          :class="tile.accent ? 'border-gofoot-primary/40' : ''"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">{{ t(tile.labelKey) }}</span>
            <span class="text-xs text-gray-500">{{ tile.placeholder }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-400">{{ t(tile.hintKey) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const tiles: Array<{
  key: string
  labelKey: string
  hintKey: string
  placeholder: string
  accent?: boolean
}> = [
  { key: 'next', labelKey: 'hub.nextMatch', hintKey: 'hub.nextMatchHint', placeholder: '—', accent: true },
  { key: 'form', labelKey: 'hub.form', hintKey: 'hub.formHint', placeholder: 'W D L' },
  { key: 'cash', labelKey: 'hub.cash', hintKey: 'hub.cashHint', placeholder: 'R$ —' },
  { key: 'board', labelKey: 'hub.board', hintKey: 'hub.boardHint', placeholder: '—' },
  { key: 'trophies', labelKey: 'hub.trophies', hintKey: 'hub.trophiesHint', placeholder: '0' },
  { key: 'inbox', labelKey: 'hub.inbox', hintKey: 'hub.inboxHint', placeholder: '0' },
  { key: 'news', labelKey: 'hub.news', hintKey: 'hub.newsHint', placeholder: '—' },
]
</script>
