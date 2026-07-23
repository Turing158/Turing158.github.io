import { ref, computed } from 'vue'

/**
 * 全局 Dialog 栈：跟踪嵌套弹窗，支持滚动锁定分层控制。
 *
 * - 最顶层 Dialog：允许内容滚动、仅它负责锁定页面滚动
 * - 非最顶层 Dialog（被嵌套）：禁止内容滚动、不操作页面滚动
 */
const dialogStack = ref<HTMLElement[]>([])

let originalBodyOverflow = ''
let originalBodyPaddingRight = ''
let originalHtmlOverflow = ''
let lockCount = 0

/** 仅最外层调用：锁定页面滚动（body + html，含滚动条宽度补偿） */
export function lockBodyScroll() {
  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow
    originalBodyPaddingRight = document.body.style.paddingRight
    originalHtmlOverflow = document.documentElement.style.overflow
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  }
  lockCount++
}

/** 仅最外层调用：恢复页面滚动 */
export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow
    document.body.style.paddingRight = originalBodyPaddingRight
    document.documentElement.style.overflow = originalHtmlOverflow
  }
}

export function useDialogStack() {
  const dialogEl = ref<HTMLElement | null>(null)

  function register(el: HTMLElement | null) {
    dialogEl.value = el
    if (el && !dialogStack.value.includes(el)) {
      dialogStack.value.push(el)
    }
  }

  function unregister(el: HTMLElement | null) {
    if (!el) return
    const idx = dialogStack.value.indexOf(el)
    if (idx >= 0) dialogStack.value.splice(idx, 1)
    if (dialogEl.value === el) dialogEl.value = null
  }

  /** 当前 dialog 是否处于最顶层（唯一可滚动层级） */
  const isTopmost = computed(() => {
    return dialogStack.value.length > 0
      && dialogStack.value[dialogStack.value.length - 1] === dialogEl.value
  })

  /** 当前 dialog 处于堆叠中且不是最顶层 → 应当禁止滚动 */
  const isNested = computed(() => dialogStack.value.length > 1 && !isTopmost.value)

  const depth = computed(() => dialogStack.value.length)

  return { dialogEl, register, unregister, isTopmost, isNested, depth }
}

export const dialogStackDepth = computed(() => dialogStack.value.length)
