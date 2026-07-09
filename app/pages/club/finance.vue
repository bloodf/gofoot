<template>
  <div class="mx-auto w-full max-w-lg space-y-4">
    <h1 class="text-lg font-semibold">{{ t('finance.title') }}</h1>
    <p class="text-2xl font-bold text-gofoot-accent">{{ formatMoney(Number(data?.cash ?? 0)) }}</p>

    <section class="space-y-2 rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('finance.tickets') }}</h2>
      <label class="block text-xs text-gray-400">{{ t('finance.ticketPrice') }}: {{ price }}</label>
      <input
        v-model.number="price"
        type="range"
        min="10"
        max="120"
        step="1"
        class="h-6 w-full"
        @change="savePrice"
      />
      <p class="text-xs text-gray-500">
        {{ t('finance.lastAttendance') }}: {{ data?.tickets?.lastAttendance ?? 0 }}
      </p>
    </section>

    <section class="space-y-2 rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('finance.loan') }}</h2>
      <UButton class="tap-target min-h-11" block color="gray" :loading="loaning" @click="takeLoan">
        {{ t('finance.takeLoan') }} (R$ 200.000)
      </UButton>
      <ul class="text-xs text-gray-400">
        <li v-for="l in data?.loans ?? []" :key="l.id">
          {{ l.status }} · rest {{ formatMoney(l.remaining) }} · {{ l.weeksLeft }}w
        </li>
      </ul>
    </section>

    <section class="space-y-2 rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('finance.sponsors') }}</h2>
      <UButton class="tap-target min-h-11" block color="primary" variant="soft" @click="negotiate">
        {{ t('finance.negotiate') }}
      </UButton>
      <ul class="text-xs">
        <li v-for="s in data?.sponsors ?? []" :key="s.id">
          {{ s.brandName }} · {{ formatMoney(s.weeklyFee) }}/sem
        </li>
      </ul>
      <p v-if="sponsorMsg" class="text-xs text-gofoot-accent">{{ sponsorMsg }}</p>
    </section>

    <section class="space-y-2 rounded-xl border border-gray-800 p-3">
      <h2 class="text-sm font-semibold">{{ t('finance.stadium') }}</h2>
      <p class="text-sm">{{ data?.stadium?.name }} · cap {{ data?.stadium?.capacity }}</p>
      <div class="grid grid-cols-2 gap-2">
        <UButton
          v-for="sec in sectors"
          :key="sec"
          size="sm"
          class="tap-target"
          color="gray"
          @click="expand(sec)"
        >
          +{{ sec }}
        </UButton>
      </div>
    </section>

    <section>
      <h2 class="mb-2 text-sm font-semibold">{{ t('finance.ledger') }}</h2>
      <ul class="space-y-1 text-xs text-gray-400">
        <li v-for="e in data?.ledger ?? []" :key="e.id" class="flex justify-between">
          <span>{{ e.note || e.kind }}</span>
          <span :class="e.amount >= 0 ? 'text-gofoot-primary' : 'text-gofoot-danger'">
            {{ formatMoney(e.amount) }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { api } = useApi()
const { load } = useSessionToken()

const data = ref<{
  cash: number
  tickets?: { basePrice: number; lastAttendance: number }
  loans: Array<{ id: string; remaining: number; weeksLeft: number; status: string }>
  sponsors: Array<{ id: string; brandName: string; weeklyFee: number }>
  stadium?: { name: string; capacity: number }
  ledger: Array<{ id: string; kind: string; amount: number; note?: string }>
} | null>(null)

const price = ref(35)
const loaning = ref(false)
const sponsorMsg = ref('')
const sectors = ['north', 'south', 'east', 'west'] as const

function formatMoney(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n)
}

async function refresh() {
  await load()
  data.value = await api('/api/finance')
  price.value = Number(data.value?.tickets?.basePrice ?? 35)
}

async function savePrice() {
  await api('/api/finance/tickets', { method: 'POST', body: { price: price.value } })
  await refresh()
}

async function takeLoan() {
  loaning.value = true
  try {
    await api('/api/finance/loan', { method: 'POST', body: { principal: 200_000 } })
    await refresh()
  } finally {
    loaning.value = false
  }
}

async function negotiate() {
  const list = await api<{ brands?: Array<{ id: string }> }>('/api/sponsors/negotiate', {
    method: 'POST',
    body: {},
  })
  const brandId = list.brands?.[0]?.id
  if (!brandId) return
  const res = await api<{ accepted: boolean; offer: { brandName: string; weeklyFee: number } }>(
    '/api/sponsors/negotiate',
    { method: 'POST', body: { brandId, ask: 12000, round: 1 } },
  )
  sponsorMsg.value = res.accepted
    ? `OK ${res.offer.brandName}: ${formatMoney(res.offer.weeklyFee)}`
    : t('finance.sponsorRejected')
  await refresh()
}

async function expand(sector: (typeof sectors)[number]) {
  await api('/api/stadium/expand', { method: 'POST', body: { sector, add: 500 } })
  await refresh()
}

onMounted(refresh)
</script>
