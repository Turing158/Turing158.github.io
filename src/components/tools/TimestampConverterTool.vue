<template>
  <div class="tool-form">
    <div class="timestamp-now">
      <span class="ts-label">{{ $t('tools.timestamp.current') }}</span>
      <span class="ts-value">{{ currentTimestamp }}</span>
      <span class="ts-date">{{ currentDateStr }}</span>
    </div>
    <div class="timestamp-quick-actions">
      <Button size="small" @click="copyTimestamp">{{ $t('tools.timestamp.copyTimestamp') }}</Button>
      <Button size="small" @click="copyCurrentDate">{{ $t('tools.timestamp.copyDate') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.timestamp.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      :placeholder="$t('tools.timestamp.placeholder')"
    />
    <div class="tool-actions">
      <Button type="primary" size="small" @click="toDate">{{ $t('tools.timestamp.toDate') }}</Button>
      <Button size="small" @click="toTimestamp">{{ $t('tools.timestamp.toTimestamp') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.timestamp.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.timestamp.outputLabel') }}</label>
    <pre class="tool-output">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t, locale } = useI18n()
const input = ref('')
const output = ref('')
const currentTimestamp = ref(0)
const currentDateStr = ref('')
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const update = () => {
    currentTimestamp.value = Math.floor(Date.now() / 1000)
    currentDateStr.value = new Date().toLocaleString(locale.value)
  }
  update()
  timer = setInterval(update, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch(locale, () => {
  currentDateStr.value = new Date().toLocaleString(locale.value)
})

function toDate() {
  const ts = parseInt(input.value.trim())
  if (isNaN(ts)) {
    BlogTip.show(t('tools.timestamp.invalidTimestamp'), { type: 'error' })
    return
  }
  const ms = ts > 1e10 ? ts : ts * 1000
  const d = new Date(ms)
  output.value = `${d.toLocaleString(locale.value)}\nUTC: ${d.toUTCString()}\nISO: ${d.toISOString()}`
}

function toTimestamp() {
  const d = new Date(input.value.trim())
  if (isNaN(d.getTime())) {
    BlogTip.show(t('tools.timestamp.invalidDate'), { type: 'error' })
    return
  }
  output.value = `Seconds: ${Math.floor(d.getTime() / 1000)}\nMilliseconds: ${d.getTime()}`
}

function copyTimestamp() {
  copyText(String(currentTimestamp.value), t('tools.copied'))
}

function copyCurrentDate() {
  copyText(currentDateStr.value, t('tools.copied'))
}

function clear() {
  input.value = ''
  output.value = ''
}
</script>

<style scoped>
.timestamp-now {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
}
.ts-label {
  color: var(--text-secondary);
  font-weight: 600;
}
.ts-value {
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
}
.ts-date {
  color: var(--text-secondary);
  margin-left: auto;
}
.timestamp-quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
