<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('club.title') }}</h1>
    <p class="text-sm text-gray-400">{{ t('club.placeholder') }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
