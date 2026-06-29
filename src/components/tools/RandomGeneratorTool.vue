<template>
  <div class="tool-form random-generator">
    <div class="random-config">
      <div class="config-row">
        <div class="config-item">
          <label class="config-label">{{ $t('tools.randomGenerator.min') }}</label>
          <BlogInput
            v-model="minStr"
            type="number"
            :placeholder="'0'"
          />
        </div>
        <div class="config-separator">
          <span class="separator-line"></span>
          <span class="separator-text">{{ $t('tools.randomGenerator.to') }}</span>
          <span class="separator-line"></span>
        </div>
        <div class="config-item">
          <label class="config-label">{{ $t('tools.randomGenerator.max') }}</label>
          <BlogInput
            v-model="maxStr"
            type="number"
            :placeholder="'100'"
          />
        </div>
      </div>
      <div class="config-row">
        <div class="config-item">
          <label class="config-label">{{ $t('tools.randomGenerator.count') }}</label>
          <BlogInput
            v-model="countStr"
            type="number"
            :min="1"
            :max="100"
            :placeholder="'1'"
          />
        </div>
        <div class="config-item checkbox-item">
          <Checkbox
            v-model="uniqueModel"
            :options="uniqueOptions"
          />
        </div>
      </div>
    </div>

    <div class="random-actions">
      <Button type="primary" size="small" @click="generateOnce" :disabled="isGenerating">
        {{ $t('tools.randomGenerator.generate') }}
      </Button>
      <Button :danger="isGenerating" size="small" @click="toggleContinuous">
        <span v-if="isGenerating" class="btn-content">
          <span class="stop-icon">■</span>
          {{ $t('tools.randomGenerator.stop') }}
        </span>
        <span v-else class="btn-content">
          <span class="play-icon">▶</span>
          {{ $t('tools.randomGenerator.start') }}
        </span>
      </Button>
      <span
        class="copy-all-wrapper"
        @pointerdown="startCopyAllLongPress"
        @pointerup="cancelCopyAllLongPress"
        @pointerleave="cancelCopyAllLongPress"
        @pointercancel="cancelCopyAllLongPress"
      >
        <Button size="small" @click="copyAll" :disabled="results.length === 0">
          {{ $t('tools.randomGenerator.copyAll') }}
        </Button>
      </span>
      <Button size="small" danger @click="clear" :disabled="isGenerating">
        {{ $t('tools.randomGenerator.clear') }}
      </Button>
    </div>

    <div class="random-results">
      <div class="results-header">
        <span class="results-title">{{ $t('tools.randomGenerator.results') }}</span>
        <span v-if="results.length > 0" class="results-count">
          {{ results.length }} {{ $t('tools.randomGenerator.numbers') }}
        </span>
      </div>
      <div class="results-display" :class="{ 'is-generating': isGenerating }">
        <TransitionGroup name="number-pop" tag="div" class="numbers-grid">
          <div
            v-for="(num, index) in displayResults"
            :key="`${num}-${index}`"
            class="number-ball"
            :title="$t('tools.randomGenerator.clickToCopy')"
            :style="{ '--ball-index': index }"
            @click="copyOne(num)"
          >
            <span class="number-value">{{ num }}</span>
          </div>
        </TransitionGroup>
        <div v-if="displayResults.length === 0" class="empty-state">
          <span class="empty-icon">🎲</span>
          <span class="empty-text">{{ $t('tools.randomGenerator.empty') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const props = withDefaults(defineProps<{ separator?: string }>(), { separator: ' ' })

const emit = defineEmits<{
  'request-separator-edit': []
}>()

const { t } = useI18n()

const minStr = ref<string>('0')
const maxStr = ref<string>('100')
const countStr = ref<string>('1')
const unique = ref(false)
const results = ref<number[]>([])
const isGenerating = ref(false)
let randomTimer: ReturnType<typeof setInterval> | undefined

const MAX_DISPLAY = 100
const displayResults = computed(() => results.value.slice(-MAX_DISPLAY))

const uniqueOptions = computed(() => [
  { label: t('tools.randomGenerator.unique'), value: 'unique' as const },
])
const uniqueModel = computed<(string)[]>({
  get: () => (unique.value ? ['unique'] : []),
  set: (val) => { unique.value = Array.isArray(val) && val.includes('unique') },
})

onUnmounted(() => {
  if (randomTimer) clearInterval(randomTimer)
})

function generateBatch(): number[] | null {
  const m = Math.ceil(Number(minStr.value))
  const M = Math.floor(Number(maxStr.value))
  const c = Math.floor(Number(countStr.value))
  if (!Number.isFinite(m) || !Number.isFinite(M) || m > M) {
    BlogTip.show(t('tools.randomGenerator.invalidRange'), { type: 'error' })
    return null
  }
  if (!Number.isFinite(c) || c < 1) {
    BlogTip.show(t('tools.randomGenerator.invalidCount'), { type: 'error' })
    return null
  }
  const range = M - m + 1
  if (unique.value && c > range) {
    BlogTip.show(t('tools.randomGenerator.uniqueError', { n: c }), { type: 'error' })
    return null
  }
  if (unique.value) {
    const pool = new Set<number>()
    while (pool.size < c) {
      pool.add(Math.floor(Math.random() * range) + m)
    }
    return Array.from(pool)
  }
  const list: number[] = []
  for (let i = 0; i < c; i++) {
    list.push(Math.floor(Math.random() * range) + m)
  }
  return list
}

function generateOnce() {
  if (isGenerating.value) return
  const batch = generateBatch()
  if (!batch) return
  results.value = batch
}

function toggleContinuous() {
  if (isGenerating.value) {
    stopTimer()
    return
  }
  const first = generateBatch()
  if (!first) return
  results.value = first
  isGenerating.value = true
  randomTimer = setInterval(() => {
    const next = generateBatch()
    if (!next) { stopTimer(); return }
    results.value = next
  }, 200)
}

function stopTimer() {
  if (randomTimer) {
    clearInterval(randomTimer)
    randomTimer = undefined
  }
  isGenerating.value = false
}

function clear() {
  if (isGenerating.value) return
  results.value = []
}

function copyAll() {
  if (results.value.length === 0) return
  copyText(results.value.join(props.separator), t('tools.copied'))
}

function copyOne(num: number) {
  copyText(String(num), t('tools.copied'))
}

let longPressTimer: ReturnType<typeof setTimeout> | undefined

function startCopyAllLongPress() {
  if (results.value.length === 0) return
  longPressTimer = setTimeout(() => {
    emit('request-separator-edit')
  }, 500)
}

function cancelCopyAllLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = undefined
  }
}
</script>

<style scoped>
.random-generator {
  gap: 18px;
}
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
.config-item {
  flex: 1;
  min-width: 100px;
}
.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.config-separator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 10px;
}
.separator-line {
  width: 20px;
  height: 1px;
  background: var(--border);
}
.separator-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
}
.checkbox-item {
  display: flex;
  align-items: center;
  padding-top: 20px;
}
.random-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.stop-icon { font-size: 10px; }
.play-icon { font-size: 12px; }
.copy-all-wrapper {
  display: inline-flex;
}
.random-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.results-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.results-count {
  font-size: 0.75rem;
  color: var(--accent);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 10px;
}
.results-display {
  min-height: 80px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  background: var(--bg-card);
}
.results-display.is-generating {
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(var(--accent), 0.15);
}
.numbers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.number-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 8px;
  border-radius: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
}
.number-ball:hover {
  transform: scale(1.1);
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
}
.empty-icon { font-size: 2rem; }
.empty-text { font-size: 0.85rem; color: var(--text-secondary); }

.number-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.number-pop-leave-active {
  transition: all 0.2s ease;
}
.number-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.number-pop-leave-to {
  opacity: 0;
  transform: scale(1.5);
}
</style>
