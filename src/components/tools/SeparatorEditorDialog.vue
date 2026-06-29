<template>
  <BlogDialog
    v-model="visible"
    :title="$t('tools.randomGenerator.separatorTitle')"
    width="420px"
    max-width="90vw"
    :show-close="true"
    :close-on-click-overlay="false"
  >
    <template #title>
      <span>✂️</span>
      <span class="modal-title-text">{{ $t('tools.randomGenerator.separatorTitle') }}</span>
    </template>

    <div class="separator-editor-body">
      <p class="separator-editor-hint">{{ $t('tools.randomGenerator.separatorHint') }}</p>
      <div class="separator-presets">
        <button
          v-for="preset in presets"
          :key="preset.label"
          type="button"
          class="separator-chip"
          :class="{ 'is-active': localValue === preset.value }"
          @click="localValue = preset.value"
        >{{ preset.label }}</button>
      </div>
      <BlogInput
        v-model="localValue"
        :placeholder="$t('tools.randomGenerator.separatorPlaceholder')"
      />
      <div v-if="preview" class="separator-preview">
        <span class="separator-preview-label">{{ $t('tools.randomGenerator.separatorPreview') }}</span>
        <code class="separator-preview-text">{{ preview }}</code>
      </div>
    </div>

    <template #footer>
      <div class="separator-actions">
        <Button size="small" @click="reset">{{ $t('tools.randomGenerator.separatorReset') }}</Button>
        <Button size="small" @click="cancel">{{ $t('tools.randomGenerator.separatorCancel') }}</Button>
        <Button type="primary" size="small" @click="confirm">{{ $t('tools.randomGenerator.separatorConfirm') }}</Button>
      </div>
    </template>
  </BlogDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogDialog from '@/components/common/BlogDialog.vue'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  value?: string
  previewSamples?: string[]
}>(), {
  value: ' ',
  previewSamples: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  confirm: [separator: string]
  cancel: []
}>()

const { t } = useI18n()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const localValue = ref(props.value)

watch(() => props.value, (v) => { localValue.value = v })

const presets = computed(() => [
  { label: t('tools.randomGenerator.sepSpace'), value: ' ' },
  { label: t('tools.randomGenerator.sepComma'), value: ',' },
  { label: t('tools.randomGenerator.sepNewline'), value: '\n' },
  { label: t('tools.randomGenerator.sepDash'), value: '-' },
  { label: t('tools.randomGenerator.sepPipe'), value: '|' },
  { label: t('tools.randomGenerator.sepEmpty'), value: '' },
])

const preview = computed(() => {
  if (props.previewSamples.length === 0) return ''
  return props.previewSamples.slice(0, 5).join(localValue.value)
})

function reset() {
  localValue.value = ' '
}

function cancel() {
  emit('cancel')
  visible.value = false
}

function confirm() {
  emit('confirm', localValue.value)
  visible.value = false
}
</script>

<style scoped>
.modal-title-text {
  font-size: 1.2rem;
  color: var(--text-primary);
}
.separator-editor-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.separator-editor-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}
.separator-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.separator-chip {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.separator-chip.is-active {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}
.separator-preview {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border);
}
.separator-preview-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}
.separator-preview-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  word-break: break-all;
}
.separator-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
