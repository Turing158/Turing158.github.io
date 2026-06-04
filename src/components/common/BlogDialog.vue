<template>
  <Teleport to="body">
    <Transition
      name="blog-dialog-fade"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="modelValue"
        class="blog-dialog-overlay"
        @click.self="handleOverlayClick"
        @keydown.esc="handleEsc"
        tabindex="-1"
        ref="overlayRef"
      >
        <div
          class="blog-dialog"
          :style="dialogStyle"
          role="dialog"
          aria-modal="true"
          ref="dialogRef"
        >
          <!-- Close button -->
          <slot v-if="showClose" name="close">
            <button class="blog-dialog-close" @click="close" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </slot>

          <!-- Header -->
          <div v-if="title || $slots.title" class="blog-dialog-header">
            <slot name="title">
              <span class="blog-dialog-title">{{ title }}</span>
            </slot>
          </div>

          <!-- Body -->
          <div class="blog-dialog-body" :style="bodyStyle">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="blog-dialog-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  height?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  closeOnClickOverlay?: boolean
  showClose?: boolean
  bodyOverflow?: string
  onOpen?: () => void
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: undefined,
  height: undefined,
  maxWidth: undefined,
  maxHeight: undefined,
  closeOnClickOverlay: false,
  showClose: true,
  bodyOverflow: undefined,
  onOpen: undefined,
  onClose: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const overlayRef = ref<HTMLElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

function normalizeSize(value: string | number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') {
    return value > 0 ? `${value}px` : undefined
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value
  }
  return undefined
}

const dialogStyle = computed(() => {
  const style: Record<string, string> = {}

  const w = normalizeSize(props.width)
  if (w) style.width = w

  const h = normalizeSize(props.height)
  if (h) style.height = h

  const mw = normalizeSize(props.maxWidth)
  if (mw) style.maxWidth = mw

  const mh = normalizeSize(props.maxHeight)
  if (mh) style.maxHeight = mh

  return style
})

const bodyStyle = computed(() => {
  if (props.bodyOverflow !== undefined) {
    return {
      overflow: props.bodyOverflow,
      ...(props.bodyOverflow === 'visible' ? { minHeight: '0' } : {}),
    }
  }
  return {}
})

function open() {
  emit('update:modelValue', true)
}

function close() {
  emit('update:modelValue', false)
}

function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    close()
  }
}

function handleEsc() {
  close()
}

// ── JavaScript Transition Hooks ──
// These ensure animations fire reliably regardless of scoped CSS +
// Teleport interaction quirks.

function onBeforeEnter(el: Element) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Overlay: start invisible
  overlay.style.opacity = '0'
  overlay.style.transition = 'opacity 0.3s ease'

  // Dialog: start scaled down + invisible
  if (dialog) {
    dialog.style.opacity = '0'
    dialog.style.transform = 'scale(0.85)'
    dialog.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
}

function onEnter(el: Element, done: () => void) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Force reflow so the browser registers the initial state
  void overlay.offsetHeight

  // Use requestAnimationFrame to ensure the next frame triggers the transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Overlay: fade in
      overlay.style.opacity = '1'

      // Dialog: pop in
      if (dialog) {
        dialog.style.opacity = '1'
        dialog.style.transform = 'scale(1)'
      }
    })
  })

  // Wait for the longer animation (dialog 350ms) before calling done
  setTimeout(done, 400)
}

function onAfterEnter(el: Element) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Clean up inline styles so CSS classes take over
  overlay.style.opacity = ''
  overlay.style.transition = ''
  if (dialog) {
    dialog.style.opacity = ''
    dialog.style.transform = ''
    dialog.style.transition = ''
  }
}

function onBeforeLeave(el: Element) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Set up exit transitions
  overlay.style.opacity = '1'
  overlay.style.transition = 'opacity 0.25s ease'

  if (dialog) {
    dialog.style.opacity = '1'
    dialog.style.transform = 'scale(1)'
    dialog.style.transition = 'transform 0.2s ease-in, opacity 0.2s ease-in'
  }
}

function onLeave(el: Element, done: () => void) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Force reflow
  void overlay.offsetHeight

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Overlay: fade out
      overlay.style.opacity = '0'

      // Dialog: shrink out
      if (dialog) {
        dialog.style.opacity = '0'
        dialog.style.transform = 'scale(0.92)'
      }
    })
  })

  // Wait for the longer animation before calling done
  setTimeout(done, 280)
}

function onAfterLeave(el: Element) {
  const overlay = el as HTMLElement
  const dialog = overlay.querySelector('.blog-dialog') as HTMLElement | null

  // Clean up inline styles
  overlay.style.opacity = ''
  overlay.style.transition = ''
  if (dialog) {
    dialog.style.opacity = ''
    dialog.style.transform = ''
    dialog.style.transition = ''
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await nextTick()
      overlayRef.value?.focus()
      props.onOpen?.()
    } else {
      props.onClose?.()
    }
  }
)

defineExpose({ open, close })
</script>

<style lang="less" scoped>
.blog-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--text-primary) 35%, transparent);
  backdrop-filter: blur(4px);
}

.blog-dialog {
  background: var(--bg-card);
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  outline: none;
  position: relative;
  box-shadow:
    0 4px 24px var(--shadow),
    0 12px 48px color-mix(in srgb, var(--text-primary) 12%);
  transition: box-shadow 0.3s ease;
}

.blog-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.blog-dialog-title {
  flex: 1;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.blog-dialog-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    background: var(--accent);
    color: var(--bg-card);
    border-color: var(--accent);
    transform: rotate(90deg) scale(1.05);
  }

  &:active {
    transform: rotate(90deg) scale(0.95);
  }
}

.blog-dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  color: var(--text-primary);

  &::-webkit-scrollbar {
    width: 6px;
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

.blog-dialog-footer {
  padding: 12px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
</style>
