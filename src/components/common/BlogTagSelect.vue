<template>
  <div class="blog-tag-select" :class="{ 'is-disabled': disabled }">
    <div
      ref="triggerRef"
      class="blog-tag-select-trigger px-fade"
      :class="{ 'is-open': visible, 'is-disabled': disabled }"
      role="combobox"
      :aria-expanded="visible"
      :aria-disabled="disabled"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="blog-tag-select-tag"
        @click.stop
      >
        {{ tag }}
        <button
          type="button"
          class="blog-tag-select-tag-remove"
          :aria-label="`Remove ${tag}`"
          @click.stop="removeTag(tag)"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </button>
      </span>

      <input
        ref="inputRef"
        v-model="query"
        class="blog-tag-select-input"
        :placeholder="modelValue.length ? '' : placeholder"
        :maxlength="tagMaxLength"
        :disabled="disabled"
        @click.stop="visible || open()"
        @keydown="handleBackspace"
      />

      <div class="blog-tag-select-suffix" :class="{ 'is-open': visible }">
        <svg width="12" height="7" viewBox="0 0 12 7" fill="none" class="blog-tag-select-chevron">
          <path
            d="M1 1L6 6L11 1"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="blog-tag-select-dropdown">
        <div v-if="visible" ref="dropdownRef" class="blog-tag-select-dropdown" :style="dropdownStyle">
          <div v-if="filteredOptions.length" class="blog-tag-select-option-list" :style="listStyle">
            <div
              v-for="(option, index) in filteredOptions"
              :key="option"
              class="blog-tag-select-option"
              :class="{ 'is-active': index === activeIndex }"
              @click="addTag(option)"
              @mouseenter="activeIndex = index"
            >
              {{ option }}
            </div>
          </div>
          <div v-else-if="!canCreate" class="blog-tag-select-empty">
            {{ emptyText || t('components.tagSelect.empty') }}
          </div>
          <div
            v-if="canCreate"
            class="blog-tag-select-option blog-tag-select-option--create"
            :class="{ 'is-active': activeIndex === filteredOptions.length }"
            @click="createTag"
            @mouseenter="activeIndex = filteredOptions.length"
          >
            <span class="blog-tag-select-plus">+</span>
            {{ t('components.tagSelect.create') }}「{{ query.trim() }}」
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// 标签多选选择器：可搜索过滤、可多选、可输入自定义标签（参考 BlogSelect 的像素风触发器/下拉实现）
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  modelValue: string[]
  /** 可选标签列表 */
  options?: string[]
  placeholder?: string
  disabled?: boolean
  /** 允许输入列表外的新标签 */
  creatable?: boolean
  /** 最多可选标签数，超出不允再加 */
  maxTags?: number
  /** 单个标签最大长度（同时限制输入框） */
  tagMaxLength?: number
  listHeight?: string | number
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '',
  disabled: false,
  creatable: true,
  maxTags: undefined,
  tagMaxLength: undefined,
  listHeight: 'auto',
  emptyText: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
}>()

const visible = ref(false)
const activeIndex = ref(-1)
const query = ref('')
const dropdownStyle = ref<Record<string, string>>({})

const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listAvailableHeight = ref<number>(0)

const isFull = computed(() => props.maxTags !== undefined && props.modelValue.length >= props.maxTags)

/** 未选中的候选标签，按输入过滤 */
const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.options.filter(
    (opt) => !props.modelValue.includes(opt) && (!q || opt.toLowerCase().includes(q)),
  )
})

/** 输入的内容不在候选中 → 显示"添加 xxx" */
const canCreate = computed(() => {
  const value = query.value.trim()
  return (
    props.creatable &&
    !isFull.value &&
    value.length > 0 &&
    !props.modelValue.includes(value) &&
    !props.options.some((opt) => opt.toLowerCase() === value.toLowerCase()) &&
    (!props.tagMaxLength || value.length <= props.tagMaxLength)
  )
})

const listStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.listHeight !== 'auto' && props.listHeight !== undefined) {
    style.maxHeight = typeof props.listHeight === 'number' ? `${props.listHeight}px` : props.listHeight
    style.overflowY = 'auto'
  } else if (listAvailableHeight.value > 0) {
    style.maxHeight = `${listAvailableHeight.value}px`
    style.overflowY = 'auto'
  }
  return style
})

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const gap = 4
  const edgeMargin = 12
  const availableBelow = window.innerHeight - rect.bottom - gap - edgeMargin
  const availableAbove = rect.top - gap - edgeMargin

  const shouldOpenAbove = availableBelow < 160 && availableAbove > availableBelow

  dropdownStyle.value = {
    position: 'fixed',
    width: `${rect.width}px`,
    left: `${rect.left}px`,
    ...(shouldOpenAbove
      ? { bottom: `${window.innerHeight - rect.top + gap}px` }
      : { top: `${rect.bottom + gap}px` }),
  }

  listAvailableHeight.value = shouldOpenAbove ? availableAbove : availableBelow
}

function open() {
  if (props.disabled) return
  visible.value = true
  activeIndex.value = -1
  query.value = ''
  nextTick(() => {
    updateDropdownPosition()
    inputRef.value?.focus()
  })
}

function close() {
  visible.value = false
  activeIndex.value = -1
  query.value = ''
}

function toggle() {
  if (visible.value) {
    close()
  } else {
    open()
  }
}

function addTag(tag: string) {
  if (props.disabled || props.modelValue.includes(tag)) {
    query.value = ''
    return
  }
  if (isFull.value) return
  emit('update:modelValue', [...props.modelValue, tag])
  emit('change', [...props.modelValue, tag])
  query.value = ''
  activeIndex.value = -1
  inputRef.value?.focus()
}

function createTag() {
  const value = query.value.trim()
  if (!value || !canCreate.value) return
  addTag(value)
}

function removeTag(tag: string) {
  if (props.disabled) return
  const next = props.modelValue.filter((item) => item !== tag)
  emit('update:modelValue', next)
  emit('change', next)
}

/** 输入为空时按退格删除最后一个标签 */
function handleBackspace(e: KeyboardEvent) {
  if (e.key === 'Backspace' && query.value === '' && props.modelValue.length > 0) {
    e.preventDefault()
    removeTag(props.modelValue[props.modelValue.length - 1])
  }
}

function scrollToActive() {
  if (!dropdownRef.value || activeIndex.value < 0) return
  const optionEl = dropdownRef.value.querySelector('.blog-tag-select-option.is-active')
  if (optionEl) {
    optionEl.scrollIntoView({ block: 'nearest' })
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (!visible.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
    return
  }

  const total = filteredOptions.value.length + (canCreate.value ? 1 : 0)
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (total > 0) {
        activeIndex.value = activeIndex.value >= total - 1 ? 0 : activeIndex.value + 1
        scrollToActive()
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (total > 0) {
        activeIndex.value = activeIndex.value <= 0 ? total - 1 : activeIndex.value - 1
        scrollToActive()
      }
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value === filteredOptions.value.length && canCreate.value) {
        createTag()
      } else if (activeIndex.value >= 0 && activeIndex.value < filteredOptions.value.length) {
        addTag(filteredOptions.value[activeIndex.value])
      } else if (canCreate.value) {
        createTag()
      }
      break
    case 'Escape':
      e.preventDefault()
      close()
      break
    case 'Tab':
      close()
      break
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!visible.value) return
  const target = e.target as HTMLElement
  if (triggerRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  close()
}

watch(visible, (val) => {
  if (val) {
    document.addEventListener('click', onDocumentClick, true)
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
  } else {
    document.removeEventListener('click', onDocumentClick, true)
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
  }
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: () => emit('update:modelValue', []),
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})
</script>

<style lang="less" scoped>
.blog-tag-select {
  position: relative;
  width: 100%;
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.blog-tag-select-trigger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  min-height: 42px;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  cursor: text;
  user-select: none;
  --px-frame-fade: var(--px-frame-accent-soft);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &.is-open {
    --px-frame-fade: var(--px-frame-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);

    &::after {
      opacity: 1;
    }
  }

  &.is-disabled {
    cursor: not-allowed;

    /* 压过工具类 .px-fade:hover::after，禁用态不淡入 */
    &::after {
      opacity: 0;
    }
  }
}

.blog-tag-select-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  color: var(--accent);
  padding: 2px 6px 2px 8px;
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame-muted) 6 / calc(2 * var(--pxs)) stretch;
  font-size: 0.78rem;
  line-height: 1.4;
  white-space: nowrap;
}

.blog-tag-select-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  border: none;
  background: transparent;
  color: currentColor;
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.2s ease, color 0.2s ease, transform 0.15s ease;

  &:hover {
    opacity: 1;
    color: var(--fgColor-danger);
    transform: scale(1.15);
  }
}

.blog-tag-select-input {
  flex: 1 1 96px;
  min-width: 96px;
  padding: 5px 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.5;
  }
}

.blog-tag-select-suffix {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.25s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.blog-tag-select-chevron {
  display: block;
}

/* ── Dropdown panel (Teleported to body) ── */
.blog-tag-select-dropdown {
  z-index: 10001;
  background: var(--bg-card);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  box-shadow:
    0 4px 16px var(--shadow),
    0 8px 40px color-mix(in srgb, var(--text-primary) 8%);
}

.blog-tag-select-option-list {
  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border);
    --pxs: 2px; clip-path: var(--pxc);
    transition: background 0.2s;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }
}

.blog-tag-select-option {
  position: relative;
  /* isolation + ::before z-index:-1：hover 背景层压在文字之下 */
  isolation: isolate;
  padding: 9px 14px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: padding-left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  /* hover 背景：透明度 0→1 + 缩放 0.9→1 弹入 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    opacity: 0;
    transform: scale(0.9);
    transition:
      opacity 0.15s ease,
      transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &:hover::before {
    opacity: 1;
    transform: scale(1);
  }

  &:hover {
    padding-left: 18px;
  }

  &:active {
    transform: scale(0.97);
  }

  &.is-active {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &--create {
    border-top: 1px dashed var(--border);
    color: var(--accent);

    .blog-tag-select-plus {
      font-weight: 700;
      margin-right: 2px;
    }
  }
}

.blog-tag-select-empty {
  padding: 24px 14px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* ── Dropdown transition ── */
.blog-tag-select-dropdown-enter-active {
  transition:
    opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.blog-tag-select-dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.blog-tag-select-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.blog-tag-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
