<template>
  <div
    class="blog-input"
    :class="{
      'is-textarea': type === 'textarea',
      'has-prefix': $slots.prefix,
      'has-suffix': $slots.suffix,
      'is-disabled': disabled,
    }"
    :style="wrapperStyle"
  >
    <span v-if="$slots.prefix" class="blog-input-prefix">
      <slot name="prefix" />
    </span>

    <textarea
      v-if="type === 'textarea'"
      ref="inputRef"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxLength"
      :disabled="disabled"
      :readonly="readonly"
      :style="textareaStyle"
      class="blog-input-field"
      @input="onFieldInput"
      @change="onFieldChange"
    />

    <input
      v-else
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :disabled="disabled"
      :readonly="readonly"
      class="blog-input-field"
      @input="onFieldInput"
      @change="onFieldChange"
    />

    <span v-if="$slots.suffix" class="blog-input-suffix">
      <slot name="suffix" />
    </span>

    <span v-if="showCount" class="blog-input-count">
      {{ currentLength }}<template v-if="props.maxLength">/{{ props.maxLength }}</template>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'

interface Props {
  modelValue: string
  type?: 'text' | 'number' | 'textarea'
  placeholder?: string
  width?: string | number | 'auto'
  rows?: number
  maxLength?: number
  showCount?: boolean
  resizable?: boolean
  disabled?: boolean
  readonly?: boolean
  onChange?: (value: string) => void
  onInput?: (value: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  width: 'auto',
  rows: 3,
  maxLength: undefined,
  showCount: false,
  resizable: true,
  disabled: false,
  readonly: false,
  onChange: undefined,
  onInput: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  input: [value: string]
}>()

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const currentLength = computed(() => props.modelValue.length)

function normalizeWidth(): string | undefined {
  if (props.width === 'auto' || props.width === undefined || props.width === null) return undefined
  if (typeof props.width === 'number') return props.width > 0 ? `${props.width}px` : undefined
  const s = String(props.width).trim()
  return s || undefined
}

const wrapperStyle = computed(() => {
  const w = normalizeWidth()
  return w ? { width: w } : {}
})

const textareaStyle = computed<CSSProperties>(() => ({
  resize: props.type === 'textarea' && props.resizable ? 'vertical' : 'none',
}))

function onFieldInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  const value = target.value
  emit('update:modelValue', value)
  emit('input', value)
  props.onInput?.(value)
}

function onFieldChange(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  const value = target.value
  emit('change', value)
  props.onChange?.(value)
}

function focus() {
  inputRef.value?.focus()
}

function blur() {
  inputRef.value?.blur()
}

defineExpose({
  value: computed(() => props.modelValue),
  length: currentLength,
  maxLength: computed(() => props.maxLength ?? Infinity),
  focus,
  blur,
})
</script>

<style lang="less" scoped>
.blog-input {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover:not(.is-disabled) {
    border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  }

  &:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.has-prefix {
    .blog-input-field {
      padding-left: 8px;
    }
  }

  &.has-suffix {
    .blog-input-field {
      padding-right: 8px;
    }
  }

  &.is-textarea {
    align-items: flex-start;
  }
}

.blog-input-prefix,
.blog-input-suffix {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.25s ease;
}

.blog-input:focus-within .blog-input-prefix,
.blog-input:focus-within .blog-input-suffix {
  color: var(--accent);
}

.blog-input-prefix {
  border-right: 1px solid var(--border);
}

.blog-input-suffix {
  border-left: 1px solid var(--border);
}

.blog-input-field {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  outline: none;
  line-height: 1.5;
  transition: color 0.25s ease;

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }

  &:disabled {
    cursor: not-allowed;

    &::placeholder {
      opacity: 0.35;
    }
  }
}

textarea.blog-input-field {
  resize: vertical;
  min-height: 60px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
    transition: background 0.2s;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }
}

.blog-input-count {
  position: absolute;
  right: 10px;
  bottom: 6px;
  font-size: 0.7rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--text-secondary);
  pointer-events: none;
  line-height: 1;
  transition: color 0.25s ease;
}

.blog-input:focus-within .blog-input-count {
  color: var(--accent);
}
</style>
