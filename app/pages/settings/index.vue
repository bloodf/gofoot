<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('settings.title') }}</h1>
    <section class="space-y-2">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {{ t('settings.language') }}
      </h2>
      <div class="flex gap-2">
        <UButton
          class="tap-target"
          :variant="locale === 'pt-BR' ? 'solid' : 'soft'"
          color="primary"
          @click="setLocale('pt-BR')"
        >
          PT-BR
        </UButton>
        <UButton
          class="tap-target"
          :variant="locale === 'en' ? 'solid' : 'soft'"
          color="primary"
          @click="setLocale('en')"
        >
          EN
        </UButton>
      </div>
    </section>
    <section class="space-y-2">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {{ t('settings.session') }}
      </h2>
      <NuxtLink to="/session" class="text-sm text-gofoot-primary underline">
        {{ t('settings.manageSession') }}
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
</script>
