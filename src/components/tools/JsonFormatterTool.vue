<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.jsonFormatter.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.jsonFormatter.placeholder')"
      :rows="8"
    />
    <div class="tool-actions">
      <Button type="primary" size="small" @click="formatJson">{{ $t('tools.jsonFormatter.format') }}</Button>
      <Button size="small" @click="minifyJson">{{ $t('tools.jsonFormatter.minify') }}</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.jsonFormatter.copy') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.jsonFormatter.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.jsonFormatter.outputLabel') }}</label>
    <pre class="tool-output">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()
const input = ref('')
const output = ref('')

function formatJson() {
  if (!input.value.trim()) {
    BlogTip.show(t('tools.jsonFormatter.empty'), { type: 'warning' })
    return
  }
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, 2)
  } catch {
    BlogTip.show(t('tools.jsonFormatter.invalid'), { type: 'error' })
  }
}

function minifyJson() {
  if (!input.value.trim()) {
    BlogTip.show(t('tools.jsonFormatter.empty'), { type: 'warning' })
    return
  }
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed)
  } catch {
    BlogTip.show(t('tools.jsonFormatter.invalid'), { type: 'error' })
  }
}

function copyResult() {
  if (!output.value) {
    BlogTip.show(t('tools.jsonFormatter.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(output.value, t('tools.copied'))
}

function clear() {
  input.value = ''
  output.value = ''
}
</script>
