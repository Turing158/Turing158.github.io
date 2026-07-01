import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BlogTip from '@/plugins/blog-tip'
import { getContextItems, clearContextData, type ContextMenuItem } from './contextMenuRegistry'

/**
 * 自定义右键菜单 composable
 * - 监听 contextmenu 事件，阻止默认菜单
 * - 监听 click / Escape 关闭菜单
 * - 通过 registry 收集各页面注册的上下文菜单项
 */
export function useContextMenu() {
  const visible = ref(false)
  const x = ref(0)
  const y = ref(0)
  const selectedText = ref('')
  const contextItems = ref<ContextMenuItem[]>([])
  const sidebarOnly = ref(false)

  const router = useRouter()
  const { t } = useI18n()

  function show(e: MouseEvent) {
    const target = e.target as HTMLElement
    // 表单元素保留原生菜单
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    e.preventDefault()
    selectedText.value = window.getSelection()?.toString() || ''

    // 侧边栏区域右键：不显示任何菜单项，只保留品牌标识
    if (target.closest('.sidebar')) {
      contextItems.value = []
      selectedText.value = ''
      sidebarOnly.value = true
      x.value = e.clientX
      y.value = e.clientY
      visible.value = true
      return
    }

    sidebarOnly.value = false

    // 收集上下文菜单项
    contextItems.value = getContextItems(target, selectedText.value)

    x.value = e.clientX
    y.value = e.clientY
    visible.value = true

    // 等 DOM 渲染后修正位置，防止溢出视口
    nextTick(() => {
      const menu = document.querySelector('.context-menu') as HTMLElement
      if (!menu) return

      const rect = menu.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      let newX = x.value
      let newY = y.value

      if (newX + rect.width > vw) newX = vw - rect.width - 8
      if (newY + rect.height > vh) newY = vh - rect.height - 8

      x.value = Math.max(8, newX)
      y.value = Math.max(8, newY)
    })
  }

  function hide() {
    visible.value = false
    contextItems.value = []
    sidebarOnly.value = false
    clearContextData()
  }

  function goBack() {
    router.go(-1)
    hide()
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(selectedText.value)
      BlogTip.show(t('tools.copied'), { type: 'success', duration: 2000 })
    } catch {
      BlogTip.show(t('contextMenu.copyFailed'), { type: 'error', duration: 2000 })
    }
    hide()
  }

  function handleGlobalClick() {
    if (visible.value) hide()
  }

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible.value) hide()
  }

  onMounted(() => {
    document.addEventListener('contextmenu', show)
    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    document.removeEventListener('contextmenu', show)
    document.removeEventListener('click', handleGlobalClick)
    document.removeEventListener('keydown', handleEscape)
  })

  return {
    visible,
    x,
    y,
    selectedText,
    contextItems,
    sidebarOnly,
    goBack,
    copyText,
    hide,
  }
}
