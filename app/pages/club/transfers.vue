<template>
  <div class="mx-auto w-full max-w-lg space-y-3">
    <h1 class="text-lg font-semibold">{{ t('transfers.title') }}</h1>
    <p class="text-sm text-gray-400">{{ t('transfers.subtitle') }}</p>
    <p v-if="msg" class="text-sm text-gofoot-accent">{{ msg }}</p>
    <ul class="divide-y divide-gray-800 rounded-xl border border-gray-800">
      <li v-for="l in listings" :key="l.id" class="flex items-center gap-2 px-3 py-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ l.name }}</p>
          <p class="text-xs text-gray-500">
            {{ l.position }} · OVR {{ l.overall }} · {{ l.clubFromName }}
          </p>
        </div>
        <span class="text-xs text-gofoot-accent">{{ money(l.askingPrice) }}</span>
        <UButton size="sm" class="tap-target" color="primary" :loading="buying === l.id" @click="buy(l.id)">
          {{ t('transfers.buy') }}
        </UButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

interface Listing {
  id: string
  name: string
  position: string
  overall: number
  askingPrice: number
  clubFromName: string
}

const listings = ref<Listing[]>([])
const buying = ref('')
const msg = ref('')

function money(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

async function refresh() {
  await load()
  const res = await api<{ listings: Listing[] }>('/api/club/transfers')
  listings.value = res.listings
}

async function buy(id: string) {
  buying.value = id
  msg.value = ''
  try {
    const r = await api<{ player: string; spent: number }>('/api/club/transfers/buy', {
      method: 'POST',
      body: { listingId: id },
    })
    msg.value = `${r.player} ✓ ${money(r.spent)}`
    await refresh()
  } catch (e: unknown) {
    msg.value = e instanceof Error ? e.message : 'erro'
  } finally {
    buying.value = ''
  }
}

onMounted(refresh)
</script>
