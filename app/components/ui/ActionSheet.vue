<template>
  <UiBottomSheet :open="open" @update:open="emit('update:open', $event)">
    <h2 v-if="title" class="mb-3 text-base font-semibold">{{ title }}</h2>
    <ul class="divide-y divide-gray-800">
      <li v-for="(action, i) in actions" :key="i">
        <button
          type="button"
          class="tap-target flex w-full items-center px-1 py-3 text-left text-sm active:bg-gray-800"
          :class="action.danger ? 'text-gofoot-danger' : ''"
          @click="onPick(action)"
        >
          {{ action.label }}
        </button>
      </li>
    </ul>
    <button
      type="button"
      class="tap-target mt-2 flex w-full items-center justify-center rounded-lg bg-gray-800 py-3 text-sm font-medium"
      @click="emit('update:open', false)"
    >
      {{ cancelLabel }}
    </button>
  </UiBottomSheet>
</template>

<script setup lang="ts">
export interface ActionSheetItem {
  label: string
  value?: string
  danger?: boolean
}

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    actions: ActionSheetItem[]
    cancelLabel?: string
  }>(),
  { cancelLabel: 'Cancelar' },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [action: ActionSheetItem]
}>()

function onPick(action: ActionSheetItem) {
  emit('select', action)
  emit('update:open', false)
}
</script>
