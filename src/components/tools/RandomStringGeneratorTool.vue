/**
 * Random String Generator Tool
 */
<template>
  <div class="tool-form random-generator">
    <div class="random-config">
      <div class="config-row">
        <div class="config-item">
          <label class="config-label">{{ $t('tools.randomString.length') }}</label>
          <BlogInput
            v-model="stringLenStr"
            type="number"
            :min="1"
            :placeholder="'16'"
          />
        </div>
        <div class="config-item">
          <label class="config-label">{{ $t('tools.randomString.count') }}</label>
          <BlogInput
            v-model="stringCountStr"
            type="number"
            :min="1"
            :placeholder="'1'"
          />
        </div>
      </div>
      <div class="config-row charset-row">
        <label class="config-label">{{ $t('tools.randomString.charset') }}</label>
        <Checkbox
          v-model="charsets"
          :options="charsetOptions"
          direction="horizontal"
        />
      </div>
    </div>

    <div class="random-actions">
      <Button type="primary" size="small" @click="generateOnce" :disabled="isGenerating">
        {{ $t('tools.randomString.generate') }}
      </Button>
      <Button :danger="isGenerating" size="small" @click="toggleContinuous">
        <span v-if="isGenerating" class="btn-content">
          <span class="stop-icon">■</span>
          {{ $t('tools.randomString.stop') }}
        </span>
        <span v-else class="btn-content">
          <span class="play-icon">▶</span>
          {{ $t('tools.randomString.start') }}
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
          {{ $t('tools.randomString.copyAll') }}
        </Button>
      </span>
      <Button danger size="small" @click="clear" :disabled="isGenerating">
        {{ $t('tools.randomString.clear') }}
      </Button>
    </div>

    <div class="random-results">
      <div class="results-header">
        <span class="results-title">{{ $t('tools.randomString.results') }}</span>
        <span v-if="results.length > 0" class="results-count">
          {{ results.length }} {{ $t('tools.randomString.items') }}
        </span>
      </div>
      <div class="results-display" :class="{ 'is-generating': isGenerating }">
        <TransitionGroup name="number-pop" tag="div" class="strings-list">
          <div
            v-for="(str, index) in displayResults"
            :key="`${str}-${index}`"
            class="string-pill"
            :title="$t('tools.randomGenerator.clickToCopy')"
            @click="copyOne(str)"
          >
            <span class="string-value">{{ str }}</span>
          </div>
        </TransitionGroup>
        <div v-if="displayResults.length === 0" class="empty-state">
          <span class="empty-icon">🔤</span>
          <span class="empty-text">{{ $t('tools.randomString.empty') }}</span>
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

const stringLenStr = ref<string>('16')
const stringCountStr = ref<string>('1')
const charsets = ref<string[]>(['lower', 'upper', 'digit'])
const results = ref<string[]>([])
const isGenerating = ref(false)
let stringTimer: ReturnType<typeof setInterval> | undefined

const MAX_DISPLAY = 100
const displayResults = computed(() => results.value.slice(-MAX_DISPLAY))

const charsetOptions = computed(() => [
  { label: t('tools.randomString.lower'), value: 'lower' },
  { label: t('tools.randomString.upper'), value: 'upper' },
  { label: t('tools.randomString.digit'), value: 'digit' },
  { label: t('tools.randomString.symbol'), value: 'symbol' },
])

const CHARSET_MAP: Record<string, string> = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}<>?/.,;:',
}

onUnmounted(() => {
  if (stringTimer) clearInterval(stringTimer)
})

function generateBatch(): string[] | null {
  const length = Math.floor(Number(stringLenStr.value))
  const count = Math.floor(Number(stringCountStr.value))
  if (!Number.isFinite(length) || length < 1) {
    BlogTip.show(t('tools.randomString.invalidLength'), { type: 'error' })
    return null
  }
  if (!Number.isFinite(count) || count < 1) {
    BlogTip.show(t('tools.randomString.invalidCount'), { type: 'error' })
    return null
  }
  if (charsets.value.length === 0) {
    BlogTip.show(t('tools.randomString.invalidCharset'), { type: 'error' })
    return null
  }
  const pool = charsets.value.map(k => CHARSET_MAP[k] ?? '').join('')
  if (!pool) {
    BlogTip.show(t('tools.randomString.invalidCharset'), { type: 'error' })
    return null
  }
  const list: string[] = []
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined
  for (let i = 0; i < count; i++) {
    let s = ''
    if (cryptoObj?.getRandomValues) {
      const buf = new Uint32Array(length)
      cryptoObj.getRandomValues(buf)
      for (let j = 0; j < length; j++) {
        s += pool[buf[j] % pool.length]
      }
    } else {
      for (let j = 0; j < length; j++) {
        s += pool[Math.floor(Math.random() * pool.length)]
      }
    }
    list.push(s)
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
  stringTimer = setInterval(() => {
    const next = generateBatch()
    if (!next) { stopTimer(); return }
    results.value = next
  }, 200)
}

function stopTimer() {
  if (stringTimer) {
    clearInterval(stringTimer)
    stringTimer = undefined
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

function copyOne(str: string) {
  copyText(str, t('tools.copied'))
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
.random-generator { gap: 18px; }
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
.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.charset-row {
  flex-direction: column;
  align-items: flex-start;
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
.copy-all-wrapper { display: inline-flex; }
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
.results-display.is-generating {
  border-color: var(--accent); box-shadow: 0 0 12px rgba(var(--accent), 0.15);
}
.strings-list { display: flex; flex-wrap: wrap; gap: 8px; }
.string-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
}
.string-pill:hover {
  transform: scale(1.05);
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px;
}
.empty-icon { font-size: 2rem; }
.empty-text { font-size: 0.85rem; color: var(--text-secondary); }

.number-pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.number-pop-leave-active { transition: all 0.2s ease; }
.number-pop-enter-from { opacity: 0; transform: scale(0.5); }
.number-pop-leave-to { opacity: 0; transform: scale(1.5); }
</style>
