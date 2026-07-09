<template>
  <div class="flex min-h-full flex-col bg-gray-950 text-gray-100">
    <LayoutTopBar />
    <main
      class="flex-1 overflow-y-auto px-4 py-3"
      :style="{
        paddingBottom:
          'calc(var(--bottomnav-h) + var(--audiodock-h) + env(safe-area-inset-bottom, 0px) + 12px)',
        paddingTop: 'calc(var(--topbar-h) + env(safe-area-inset-top, 0px) + 8px)',
      }"
    >
      <slot />
    </main>
    <div
      class="fixed inset-x-0 bottom-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800"
      :style="{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }"
    >
      <LayoutAudioDock />
      <LayoutBottomNav />
    </div>
  </div>
</template>
