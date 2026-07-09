<template>
  <dialog
    ref="dialogEl"
    class="fixed inset-x-0 bottom-0 z-50 m-0 w-full max-w-none rounded-t-2xl border-0 bg-gray-900 p-0 text-gray-100 shadow-2xl open:flex open:flex-col"
    :open="open || undefined"
    @close="emit('update:open', false)"
  >
    <div
      class="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-gray-600"
      aria-hidden="true"
    />
    <div class="max-h-[80vh] overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
      <slot />
    </div>
  </dialog>
  <div
    v-if="open"
    class="fixed inset-0 z-40 bg-black/50"
    aria-hidden="true"
    @click="emit('update:open', false)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()
const dialogEl = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (v) => {
    const el = dialogEl.value
    if (!el) return
    if (v && !el.open) {
      if (typeof el.showModal === 'function') el.showModal()
      else el.setAttribute('open', '')
    }
    if (!v && el.open) {
      if (typeof el.close === 'function') el.close()
      else el.removeAttribute('open')
    }
  },
)
</script>
