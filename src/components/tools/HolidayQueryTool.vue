<template>
  <div class="tool-form holiday-query">
    <div class="random-config">
      <div class="config-row">
        <div class="config-item config-item--country">
          <label class="config-label">{{ $t('tools.holidayQuery.country') }}</label>
          <BlogSelect
            v-model="selectedCountry"
            :options="countryOptions"
            :placeholder="$t('tools.holidayQuery.country')"
            :disabled="!countriesLoaded || loading"
          />
        </div>
        <div class="config-item config-item--year">
          <label class="config-label">{{ $t('tools.holidayQuery.year') }}</label>
          <BlogInput
            v-model="yearStr"
            type="number"
            :min="1974"
            :max="2100"
            :step="1"
          />
        </div>
      </div>
      <div class="config-row">
        <Button
          type="primary"
          size="small"
          :disabled="loading || !selectedCountry"
          @click="fetchHolidays"
        >
          {{ loading ? $t('tools.holidayQuery.loading') : $t('tools.holidayQuery.query') }}
        </Button>
      </div>
    </div>

    <div class="random-results holiday-results">
      <div class="results-header">
        <span class="results-title">{{ $t('tools.holidayQuery.results') }}</span>
        <span v-if="holidays.length > 0" class="results-count">
          {{ holidays.length }} {{ $t('tools.holidayQuery.count') }}
        </span>
      </div>

      <div class="results-display holiday-display">
        <div v-if="loading" class="holiday-loading">
          <span class="loading-spinner" />
          <span>{{ $t('tools.holidayQuery.loading') }}</span>
        </div>
        <div v-else-if="error" class="holiday-error">
          <span class="empty-icon">⚠️</span>
          <span class="empty-text">{{ $t('tools.holidayQuery.loadFailed') }}</span>
          <Button size="small" @click="fetchHolidays">{{ $t('tools.holidayQuery.retry') }}</Button>
        </div>
        <div v-else-if="holidays.length === 0" class="empty-state">
          <span class="empty-icon">🎉</span>
          <span class="empty-text">{{ queried ? $t('tools.holidayQuery.noResults') : $t('tools.holidayQuery.empty') }}</span>
        </div>
        <div v-else class="holiday-list">
          <div
            v-for="(h, index) in holidays"
            :key="`${h.date}-${h.name}-${index}`"
            class="holiday-row"
            :class="{ 'is-passed': isPassed(h) }"
          >
            <span
              class="holiday-name"
              :title="$t('tools.holidayQuery.toggleNameTip')"
              @click="toggleName(h)"
            >{{ getDisplayName(h) }}</span>
            <span class="holiday-date">{{ h.date }}</span>
            <span class="holiday-status" :class="{ 'is-passed': isPassed(h) }">
              {{ statusLabel(h) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import BlogSelect from '@/components/common/BlogSelect.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'

const { t, locale } = useI18n()

interface NagerCountry {
  countryCode: string
  name: string
}
interface NagerHoliday {
  date: string
  localName: string
  name: string
  types: string[]
}
interface SelectOption {
  label: string
  value: string
}

const yearStr = ref<string>(String(new Date().getFullYear()))
const selectedCountry = ref<SelectOption | undefined>(undefined)
const holidays = ref<NagerHoliday[]>([])
const loading = ref(false)
const error = ref(false)
const queried = ref(false)
const countryList = ref<NagerCountry[]>([])
const countriesLoaded = ref(false)
const nameDisplayMode = ref<Record<string, 'local' | 'name'>>({})
const nowTick = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | undefined

const countryOptions = computed(() => {
  const collator = new Intl.Collator(locale.value)
  const isZh = locale.value.startsWith('zh')
  return countryList.value
    .map((c) => {
      let label = c.name
      if (isZh) {
        const key = `tools.holidayQuery.countries.${c.countryCode}`
        const translated = t(key)
        if (translated !== key) {
          label = translated
        }
      }
      return { value: c.countryCode, label }
    })
    .sort((a, b) => collator.compare(a.label, b.label))
})

onMounted(() => {
  fetchCountries()
  startTick()
})

onUnmounted(() => {
  stopTick()
})

function startTick() {
  if (tickTimer) return
  nowTick.value = Date.now()
  tickTimer = setInterval(() => { nowTick.value = Date.now() }, 1000)
}

function stopTick() {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = undefined }
}

async function fetchCountries() {
  if (countriesLoaded.value) return
  try {
    const res = await fetch('https://date.nager.at/api/v3/AvailableCountries')
    if (!res.ok) throw new Error()
    const data = (await res.json()) as NagerCountry[]
    countryList.value = data
    countriesLoaded.value = true
  } catch {
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
  }
}

function holidayKey(h: NagerHoliday): string {
  return `${h.date}__${h.name}`
}

function getDisplayName(h: NagerHoliday): string {
  const mode = nameDisplayMode.value[holidayKey(h)] ?? 'local'
  return mode === 'name' ? h.name : h.localName
}

function toggleName(h: NagerHoliday) {
  const k = holidayKey(h)
  nameDisplayMode.value[k] = (nameDisplayMode.value[k] ?? 'local') === 'local' ? 'name' : 'local'
}

function isPassed(h: NagerHoliday): boolean {
  const [y, m, d] = h.date.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime() + 86400000
  return nowTick.value >= target
}

function statusLabel(h: NagerHoliday): string {
  const [y, m, d] = h.date.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  const diff = target - nowTick.value
  if (diff < 0 && nowTick.value >= target + 86400000) return t('tools.holidayQuery.passed')
  const safeDiff = Math.max(0, diff)
  const days = Math.floor(safeDiff / 86400000)
  if (days >= 1) return t('tools.holidayQuery.daysLeft', { n: days })
  const hours = Math.floor(safeDiff / 3600000)
  if (hours >= 1) return t('tools.holidayQuery.hoursLeft', { n: hours })
  const minutes = Math.floor(safeDiff / 60000)
  if (minutes >= 1) return t('tools.holidayQuery.minutesLeft', { n: minutes })
  const seconds = Math.floor(safeDiff / 1000)
  return t('tools.holidayQuery.secondsLeft', { n: seconds })
}

async function fetchHolidays() {
  const y = Math.floor(Number(yearStr.value))
  const code = selectedCountry.value?.value
  if (!Number.isFinite(y) || y < 1974 || y > 2100) {
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
    return
  }
  if (!code) return
  loading.value = true
  error.value = false
  try {
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${y}/${code}`)
    if (!res.ok) throw new Error()
    const data = (await res.json()) as NagerHoliday[]
    holidays.value = data
    nameDisplayMode.value = {}
    queried.value = true
  } catch {
    error.value = true
    holidays.value = []
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.holiday-query { gap: 16px; }
.random-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.config-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.config-item { flex: 1; min-width: 100px; }
.config-item--country { flex: 2; }
.config-item--year { flex: 1; }
.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.random-results { display: flex; flex-direction: column; gap: 8px; }
.results-header { display: flex; align-items: center; gap: 8px; }
.results-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.results-count {
  font-size: 0.75rem; color: var(--accent);
  background: var(--bg-secondary); padding: 2px 8px; border-radius: 10px;
}
.results-display {
  min-height: 80px; border: 1px solid var(--border);
  border-radius: 8px; padding: 12px; background: var(--bg-card);
}
.holiday-loading {
  display: flex; align-items: center; gap: 8px; justify-content: center; padding: 20px;
  color: var(--text-secondary); font-size: 0.85rem;
}
.holiday-error {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px;
}
.empty-icon { font-size: 2rem; }
.empty-text { font-size: 0.85rem; color: var(--text-secondary); }
.holiday-list { display: flex; flex-direction: column; }
.holiday-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 4px; border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}
.holiday-row:last-child { border-bottom: none; }
.holiday-row.is-passed { opacity: 0.5; }
.holiday-name {
  flex: 1; font-weight: 500; color: var(--text-primary); cursor: pointer;
}
.holiday-name:hover { color: var(--accent); }
.holiday-date {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;
}
.holiday-status {
  font-size: 0.8rem; font-weight: 500; white-space: nowrap; min-width: 80px; text-align: right;
  color: var(--accent);
}
.holiday-status.is-passed { color: var(--text-secondary); }
</style>
