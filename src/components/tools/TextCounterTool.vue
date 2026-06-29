<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.textCounter.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.textCounter.placeholder')"
      :rows="8"
    />
    <div class="counter-stats">
      <div class="stat-item">
        <span class="stat-value">{{ stats.chars }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.chars') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.charsNoSpace }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.charsNoSpace') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.words }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.words') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.lines }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.lines') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.paragraphs }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.paragraphs') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.bytes }}</span>
        <span class="stat-label">{{ $t('tools.textCounter.bytes') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import BlogInput from '@/components/common/BlogInput.vue'

const input = ref('')
const stats = reactive({ chars: 0, charsNoSpace: 0, words: 0, lines: 0, paragraphs: 0, bytes: 0 })

function countText() {
  const text = input.value
  const cjkCount = (text.match(/[一-鿿぀-ゟ゠-ヿ가-힯]/g) || []).length
  const latinWords = text.trim() ? text.trim().split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length : 0
  stats.chars = text.length
  stats.charsNoSpace = text.replace(/\s/g, '').length
  stats.words = cjkCount + latinWords
  stats.lines = text ? text.split(/\n/).length : 0
  stats.paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.trim()).length : 0
  stats.bytes = new TextEncoder().encode(text).length
}

countText()
watch(input, () => { countText() })
</script>

<style scoped>
.counter-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}
</style>
