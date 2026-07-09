<template>
  <div
    class="flex h-audiodock items-center justify-center gap-1 border-b border-gray-800/80 px-2"
    role="toolbar"
    :aria-label="t('audio.dock')"
  >
    <UButton
      :icon="playing ? 'i-heroicons-pause' : 'i-heroicons-play'"
      size="xs"
      color="gray"
      variant="ghost"
      class="tap-target"
      :aria-label="playing ? t('audio.pause') : t('audio.play')"
      @click="playing = !playing"
    />
    <UButton
      icon="i-heroicons-speaker-wave"
      size="xs"
      color="gray"
      variant="ghost"
      class="tap-target"
      :aria-label="t('audio.volume')"
      @click="muted = !muted"
    />
    <UButton
      size="xs"
      color="gray"
      variant="soft"
      class="tap-target min-w-[3rem] px-2 text-xs font-mono"
      :aria-label="t('audio.speed')"
      @click="cycleSpeed"
    >
      {{ speed }}x
    </UButton>
    <UButton
      :icon="muted ? 'i-heroicons-speaker-x-mark' : 'i-heroicons-speaker-wave'"
      size="xs"
      color="gray"
      variant="ghost"
      class="tap-target"
      :aria-label="muted ? t('audio.unmute') : t('audio.mute')"
      @click="muted = !muted"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const playing = ref(false)
const muted = ref(false)
const speeds = [1, 2, 5, 10] as const
const speedIdx = ref(0)
const speed = computed(() => speeds[speedIdx.value])

function cycleSpeed() {
  speedIdx.value = (speedIdx.value + 1) % speeds.length
}
</script>
