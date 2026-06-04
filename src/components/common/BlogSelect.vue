<template>
  <div class="blog-select" :class="{ 'is-disabled': disabled }">
    <div
      ref="triggerRef"
      class="blog-select-trigger"
      :class="{ 'is-open': visible, 'is-disabled': disabled }"
      tabindex="0"
      role="combobox"
      :aria-expanded="visible"
      :aria-disabled="disabled"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <div v-if="$slots.prefix" class="blog-select-prefix">
        <slot name="prefix" />
      </div>

      <div class="blog-select-content">
        <input
          v-if="visible && searchable"
          ref="inputRef"
          v-model="searchQuery"
          class="blog-select-search-input"
          :placeholder="selectedLabel || placeholder"
          @input="onSearchInput"
          @click.stop
        />
        <div
          v-else
          class="blog-select-value"
          :class="{ 'is-placeholder': !hasValue }"
        >
          {{ hasValue ? selectedLabel : placeholder }}
        </div>
      </div>

      <button
        v-if="showClearBtn"
        class="blog-select-clear"
        @click.stop="clearValue"
        aria-label="Clear"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="blog-select-suffix" :class="{ 'is-open': visible }">
        <slot name="suffix">
          <svg
            width="12"
            height="7"
            viewBox="0 0 12 7"
            fill="none"
            class="blog-select-suffix-icon"
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="blog-select-dropdown">
        <div
          v-if="visible"
          ref="dropdownRef"
          class="blog-select-dropdown"
          :style="dropdownStyle"
        >
          <div
            v-if="displayOptions.length > 0"
            class="blog-select-option-list"
            :style="listStyle"
          >
            <div
              v-for="(option, index) in displayOptions"
              :key="option.value"
              class="blog-select-option"
              :class="{
                'is-active': index === activeIndex,
                'is-selected': modelValue?.value === option.value,
              }"
              @click="selectOption(option)"
              @mouseenter="activeIndex = index"
            >
              <slot
                name="option"
                :option="option"
                :index="index"
                :active="index === activeIndex"
                :selected="modelValue?.value === option.value"
              >
                {{ option.label }}
              </slot>
            </div>
          </div>
          <div v-else-if="!searchLoading" class="blog-select-empty">
            <slot name="empty">
              {{ emptyText || t('components.select.noData') }}
            </slot>
          </div>
          <div v-if="searchLoading" class="blog-select-loading">
            <slot name="loading">
              {{ loadingText || t('components.select.loading') }}
            </slot>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Option {
  label: string
  value: string
}

interface Props {
  modelValue?: Option
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  remote?: boolean
  remoteMethod?: (query: string) => Promise<Option[]>
  debounceDelay?: number
  loading?: boolean
  listHeight?: string | number
  clearable?: boolean
  emptyText?: string
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [],
  placeholder: '',
  disabled: false,
  searchable: false,
  remote: false,
  remoteMethod: undefined,
  debounceDelay: 300,
  loading: false,
  listHeight: 'auto',
  clearable: true,
  emptyText: '',
  loadingText: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: Option | undefined]
  change: [value: Option | undefined]
  search: [query: string]
  blur: []
  focus: []
}>()

const visible = ref(false)
const activeIndex = ref(-1)
const searchQuery = ref('')
const remoteOptions = ref<Option[]>([])
const searchLoading = ref(false)
const searchError = ref(false)
const dropdownStyle = ref<Record<string, string>>({})
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listAvailableHeight = ref<number>(0)

function normalizeSize(val: string | number | undefined): string | undefined {
  if (val === undefined || val === null) return undefined
  if (typeof val === 'number') return `${val}px`
  if (typeof val === 'string' && val.trim() !== '') return val
  return undefined
}

const hasValue = computed(() => !!props.modelValue)
const selectedLabel = computed(() => props.modelValue?.label ?? '')

const isClearable = computed(() => {
  if (props.disabled) return false
  if (!props.clearable) return false
  if (props.searchable) return hasValue.value || searchQuery.value.length > 0
  return hasValue.value
})

const showClearBtn = computed(() => isClearable.value)

const displayOptions = computed<Option[]>(() => {
  if (props.remote) {
    return remoteOptions.value
  }
  if (!props.searchable) return props.options ?? []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.options ?? []
  return (props.options ?? []).filter((opt) =>
    opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
  )
})

const listHeightStyle = computed(() => {
  return normalizeSize(props.listHeight)
})

const listStyle = computed(() => {
  const style: Record<string, string> = {}
  const userH = listHeightStyle.value
  if (userH && userH !== 'auto') {
    style.maxHeight = userH
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

  // 计算选项列表可用高度，存到全局变量供 listStyle 使用
  listAvailableHeight.value = shouldOpenAbove ? availableAbove : availableBelow
}

function open() {
  if (props.disabled) return
  visible.value = true
  activeIndex.value = props.modelValue
    ? displayOptions.value.findIndex((o) => o.value === props.modelValue!.value)
    : -1
  searchQuery.value = ''
  remoteOptions.value = []
  nextTick(() => {
    updateDropdownPosition()
    scrollToActive()
    if (props.searchable) {
      inputRef.value?.focus()
    }
    emit('focus')
  })
}

function close() {
  visible.value = false
  activeIndex.value = -1
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  emit('blur')
}

function toggle() {
  if (visible.value) {
    close()
  } else {
    open()
  }
}

function selectOption(option: Option) {
  emit('update:modelValue', option)
  emit('change', option)
  close()
  triggerRef.value?.focus()
}

function clearValue(e: MouseEvent) {
  e.stopPropagation()
  searchQuery.value = ''
  remoteOptions.value = []
  searchError.value = false
  emit('update:modelValue', undefined)
  emit('change', undefined)
  if (props.searchable && visible.value) {
    inputRef.value?.focus()
  }
}

function scrollToActive() {
  if (!dropdownRef.value || activeIndex.value < 0) return
  const optionEl = dropdownRef.value.querySelector('.blog-select-option.is-active')
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

  const opts = displayOptions.value
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (opts.length > 0) {
        activeIndex.value = (activeIndex.value + 1) % opts.length
        scrollToActive()
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      if (opts.length > 0) {
        activeIndex.value =
          activeIndex.value <= 0 ? opts.length - 1 : activeIndex.value - 1
        scrollToActive()
      }
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value < opts.length) {
        selectOption(opts[activeIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      close()
      triggerRef.value?.focus()
      break
    case 'Tab':
      close()
      break
  }
}

function onSearchInput() {
  if (!props.remote || !props.remoteMethod) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const query = searchQuery.value
    if (!query.trim()) {
      remoteOptions.value = []
      return
    }
    searchLoading.value = true
    searchError.value = false
    emit('search', query)
    try {
      const results = await props.remoteMethod!(query)
      remoteOptions.value = results
      activeIndex.value = -1
    } catch {
      searchError.value = true
      remoteOptions.value = []
    } finally {
      searchLoading.value = false
    }
  }, props.debounceDelay)
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

onBeforeUnmount(() => {
  if (visible.value) {
    document.removeEventListener('click', onDocumentClick, true)
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})

defineExpose({
  focus: () => triggerRef.value?.focus(),
  blur: () => triggerRef.value?.blur(),
  clear: () => {
    searchQuery.value = ''
    remoteOptions.value = []
    searchError.value = false
    emit('update:modelValue', undefined)
    emit('change', undefined)
  },
  open,
  close,
  toggle,
})
</script>

<style lang="less" scoped>
.blog-select {
  position: relative;
  width: 100%;
  font-family: 'Nunito', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.blog-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  min-height: 42px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  &:hover:not(.is-disabled) {
    border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  }

  &.is-open {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.blog-select-prefix {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.blog-select-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.blog-select-value {
  color: var(--text-primary);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }
}

.blog-select-search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  padding: 0;

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.5;
  }
}

.blog-select-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
  }
}

.blog-select-suffix {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: transform 0.25s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.blog-select-suffix-icon {
  display: block;
}

/* ── Dropdown panel (Teleported to body) ── */
.blog-select-dropdown {
  z-index: 10001;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow:
    0 4px 16px var(--shadow),
    0 8px 40px color-mix(in srgb, var(--text-primary) 8%);
}

.blog-select-option-list {
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

.blog-select-option {
  padding: 9px 14px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition:
    background 0.2s ease,
    padding-left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);

  &:hover {
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    padding-left: 18px;
  }

  &:active {
    transform: scale(0.97);
  }

  &.is-active {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &.is-selected {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
    font-weight: 600;
  }
}

.blog-select-empty,
.blog-select-loading {
  padding: 24px 14px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* ── Dropdown transition ── */
.blog-select-dropdown-enter-active {
  transition:
    opacity 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.blog-select-dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.blog-select-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.blog-select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .blog-select-suffix {
    transition: none;
  }

  .blog-select-option {
    transition: none;
  }

  .blog-select-dropdown-enter-active,
  .blog-select-dropdown-leave-active {
    transition: opacity 0.1s ease;
  }

  .blog-select-dropdown-enter-from,
  .blog-select-dropdown-leave-to {
    transform: none;
  }
}
</style>
