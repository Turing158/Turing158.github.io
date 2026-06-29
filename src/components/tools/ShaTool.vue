<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.sha.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.sha.placeholder')"
      :rows="5"
    />
    <div class="sha-options">
      <div class="sha-algo-row">
        <label class="config-label">{{ $t('tools.sha.algorithmLabel') }}</label>
        <div class="sha-radio-group">
          <label
            v-for="opt in algoOptions"
            :key="opt.value"
            class="sha-radio-item"
            :class="{ 'is-checked': selectedAlgo === opt.value }"
          >
            <input
              type="radio"
              :value="opt.value"
              v-model="selectedAlgo"
              class="sha-radio-input"
            />
            <span class="sha-radio-label">{{ opt.label }}</span>
          </label>
        </div>
      </div>
      <Checkbox
        v-model="uppercaseModel"
        :options="uppercaseOptions"
      />
    </div>
    <div class="tool-actions">
      <Button type="primary" size="small" @click="encode">{{ $t('tools.sha.encode') }}</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.sha.copy') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.sha.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.sha.outputLabel') }}</label>
    <div class="sha-output-list">
      <div v-for="(item, idx) in outputList" :key="idx" class="sha-output-item">
        <span class="sha-algo-tag">{{ item.algo }}</span>
        <pre class="tool-output sha-output">{{ item.hash }}</pre>
      </div>
      <pre v-if="outputList.length === 0" class="tool-output"></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

const input = ref('')
const algos = ['sha1', 'sha256', 'sha512'] as const
type ShaAlgo = (typeof algos)[number]
const algoLabelMap: Record<ShaAlgo, string> = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
}
const algoOptions = computed(() =>
  algos.map((a) => ({ label: algoLabelMap[a], value: a }))
)
const selectedAlgo = ref<ShaAlgo>('sha256')
const uppercase = ref(false)
const outputList = ref<{ algo: string; hash: string }[]>([])
const uppercaseOptions = computed(() => [
  { label: t('tools.sha.uppercase'), value: 'upper' },
])
const uppercaseModel = computed<(string)[]>({
  get: () => (uppercase.value ? ['upper'] : []),
  set: (val) => {
    uppercase.value = Array.isArray(val) && val.includes('upper')
    if (outputList.value.length > 0) {
      outputList.value = outputList.value.map((item) => ({
        ...item,
        hash: uppercase.value ? item.hash.toUpperCase() : item.hash.toLowerCase(),
      }))
    }
  },
})

const SHA_ALGO_MAP: Record<ShaAlgo, string> = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
}

async function shaHex(text: string, algo: ShaAlgo): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const subtle = (typeof crypto !== 'undefined' && crypto.subtle) as SubtleCrypto | undefined
  if (!subtle) {
    throw new Error(t('tools.sha.unsupported'))
  }
  const buf = await subtle.digest(SHA_ALGO_MAP[algo], data)
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function applyCase(hash: string): string {
  return uppercase.value ? hash.toUpperCase() : hash.toLowerCase()
}

async function encode() {
  if (!input.value) {
    BlogTip.show(t('tools.sha.empty'), { type: 'warning' })
    return
  }
  try {
    const raw = await shaHex(input.value, selectedAlgo.value)
    outputList.value = [{ algo: algoLabelMap[selectedAlgo.value], hash: applyCase(raw) }]
  } catch (e: any) {
    outputList.value = [{ algo: 'Error', hash: e.message }]
  }
}

function copyResult() {
  if (outputList.value.length === 0) {
    BlogTip.show(t('tools.sha.nothingToCopy'), { type: 'warning' })
    return
  }
  const text = outputList.value.map((item) => `${item.algo}: ${item.hash}`).join('\n')
  copyText(text, t('tools.copied'))
}

function clear() {
  input.value = ''
  outputList.value = []
}
</script>

<style scoped>
.sha-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sha-algo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.sha-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sha-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.sha-radio-item.is-checked {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}
.sha-radio-input {
  display: none;
}
.sha-output-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sha-output-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.sha-algo-tag {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  margin-top: 14px;
}
.sha-output {
  flex: 1;
}
</style>
