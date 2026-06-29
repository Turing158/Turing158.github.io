<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.regex.patternLabel') }}</label>
    <BlogInput
      v-model="pattern"
      :placeholder="$t('tools.regex.patternPlaceholder')"
    />
    <label class="tool-label">{{ $t('tools.regex.flagsLabel') }}</label>
    <Checkbox v-model="selectedFlags" :options="flagOptions" direction="horizontal" />
    <label class="tool-label">{{ $t('tools.regex.testLabel') }}</label>
    <BlogInput
      v-model="testInput"
      type="textarea"
      :placeholder="$t('tools.regex.testPlaceholder')"
      :rows="5"
    />
    <div class="tool-actions">
      <Button type="primary" size="small" @click="testRegex">{{ $t('tools.regex.test') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.regex.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.regex.resultLabel') }}</label>
    <pre class="tool-output regex-output">
      <span v-if="error" class="error-text">{{ error }}</span>
      <template v-else>
        <div v-for="(match, i) in results" :key="i" class="regex-match">
          <span class="match-index">#{{ i + 1 }}</span>
          <span class="match-group">{{ match.fullMatch }}
            <template v-if="match.groups">
              <span v-for="(g, k) in match.groups" :key="k" class="named-group">{{ k }}: {{ g }}</span>
            </template>
          </span>
        </div>
        <span v-if="results.length === 0" class="no-match">{{ $t('tools.regex.noMatch') }}</span>
      </template>
    </pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'

interface RegexMatch {
  fullMatch: string
  index: number
  groups?: Record<string, string>
}

const pattern = ref('')
const flags = ['g', 'i', 'm', 's', 'u', 'y']
const flagOptions = computed(() => flags.map(f => ({ label: f, value: f })))
const selectedFlags = ref<string[]>(['g'])
const testInput = ref('')
const results = ref<RegexMatch[]>([])
const error = ref('')

function testRegex() {
  error.value = ''
  results.value = []
  if (!pattern.value) return
  try {
    const re = new RegExp(pattern.value, selectedFlags.value.join(''))
    if (selectedFlags.value.includes('g')) {
      const matches = [...testInput.value.matchAll(new RegExp(re.source, re.flags))]
      results.value = matches.map(m => ({
        fullMatch: m[0],
        index: m.index,
        groups: m.groups,
      }))
    } else {
      const match = re.exec(testInput.value)
      if (match) {
        results.value.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.groups,
        })
      }
    }
  } catch (e: any) {
    error.value = e.message
  }
}

function clear() {
  pattern.value = ''
  testInput.value = ''
  results.value = []
  error.value = ''
  selectedFlags.value = ['g']
}
</script>

<style scoped>
.regex-output {
  .regex-match {
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; }
  }
  .match-index {
    color: var(--accent);
    font-weight: 600;
    margin-right: 8px;
  }
  .match-group {
    color: var(--text-primary);
  }
  .named-group {
    display: block;
    padding-left: 16px;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
  .no-match {
    color: var(--text-secondary);
  }
  .error-text {
    color: #e74c3c;
  }
}
</style>
