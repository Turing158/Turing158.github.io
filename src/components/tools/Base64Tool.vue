<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.base64.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.base64.placeholder')"
      :rows="6"
    />
    <div class="tool-actions">
      <Button type="primary" size="small" @click="encode">{{ $t('tools.base64.encode') }}</Button>
      <Button size="small" @click="decode">{{ $t('tools.base64.decode') }}</Button>
      <Button size="small" @click="swap">{{ $t('tools.base64.swap') }}</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.base64.copy') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.base64.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.base64.outputLabel') }}</label>
    <pre class="tool-output">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()
const input = ref('')
const output = ref('')

function encode() {
  try {
    const bytes = new TextEncoder().encode(input.value)
    const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('')
    output.value = btoa(binString)
  } catch (e: any) {
    output.value = `Error: ${e.message}`
  }
}

function decode() {
  try {
    const binString = atob(input.value.trim())
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!)
    output.value = new TextDecoder().decode(bytes)
  } catch (e: any) {
    output.value = `Error: ${e.message}`
  }
}

function swap() {
  const temp = input.value
  input.value = output.value
  output.value = temp
}

function copyResult() {
  copyText(output.value, t('tools.copied'))
}

function clear() {
  input.value = ''
  output.value = ''
}
</script>
