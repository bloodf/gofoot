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
      <NuxtLink to="/session" class="tap-target flex items-center text-sm text-gofoot-primary">
        {{ t('settings.manageSession') }}
      </NuxtLink>
      <NuxtLink to="/audit" class="tap-target flex items-center text-sm text-gofoot-primary">
        {{ t('settings.audit') }}
      </NuxtLink>
      <NuxtLink to="/fantasy" class="tap-target flex items-center text-sm">Fantasy</NuxtLink>
      <NuxtLink to="/club/finance" class="tap-target flex items-center text-sm">Finanças</NuxtLink>
      <NuxtLink to="/patches" class="tap-target flex items-center text-sm">Patches</NuxtLink>
      <NuxtLink to="/club/tactics" class="tap-target flex items-center text-sm">Táticas</NuxtLink>
      <NuxtLink to="/club/transfers" class="tap-target flex items-center text-sm">Transferências</NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
</script>
