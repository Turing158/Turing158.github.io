<template>
  <div class="tool-form">
    <label class="tool-label">{{ $t('tools.md5.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.md5.placeholder')"
      :rows="5"
    />
    <div class="md5-options">
      <Checkbox
        v-model="uppercaseModel"
        :options="uppercaseOptions"
      />
    </div>
    <div class="tool-actions">
      <Button type="primary" size="small" @click="encode">{{ $t('tools.md5.encode') }}</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.md5.copy') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.md5.clear') }}</Button>
    </div>
    <label class="tool-label">{{ $t('tools.md5.outputLabel') }}</label>
    <pre class="tool-output">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'
import { md5 } from '@/utils/md5'

const { t } = useI18n()
const input = ref('')
const output = ref('')
const uppercase = ref(false)

const uppercaseOptions = computed(() => [
  { label: t('tools.md5.uppercase'), value: 'upper' },
])

const uppercaseModel = computed<(string)[]>({
  get: () => (uppercase.value ? ['upper'] : []),
  set: (val) => {
    uppercase.value = Array.isArray(val) && val.includes('upper')
    if (output.value) {
      output.value = uppercase.value
        ? output.value.toUpperCase()
        : output.value.toLowerCase()
    }
  },
})

function encode() {
  if (!input.value) {
    BlogTip.show(t('tools.md5.empty'), { type: 'warning' })
    return
  }
  try {
    output.value = uppercase.value ? md5(input.value).toUpperCase() : md5(input.value).toLowerCase()
  } catch (e: any) {
    output.value = `Error: ${e.message}`
  }
}

function copyResult() {
  if (!output.value) {
    BlogTip.show(t('tools.md5.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(output.value, t('tools.copied'))
}

function clear() {
  input.value = ''
  output.value = ''
}
</script>
