import { ref } from 'vue'

/**
 * 右键菜单上下文项定义
 */
export interface ContextMenuItem {
  /** 唯一标识 */
  id: string
  /** 显示文本（已翻译的字符串） */
  label: string
  /** SVG 图标字符串（24x24 viewBox） */
  icon: string
  /** 点击回调 */
  action: () => void
  /** 是否为危险操作（显示为红色） */
  danger?: boolean
}

/**
 * 上下文提供者函数：根据点击目标返回额外的菜单项
 */
export type ContextProvider = (target: HTMLElement, selectedText: string) => ContextMenuItem[]

// ── 共享状态 ──

/** 当前注册的上下文提供者 */
const providers = ref<ContextProvider[]>([])

/** 当前上下文数据（由 view 在右键时临时设置） */
const contextData = ref<Record<string, unknown>>({})

/**
 * 注册一个上下文提供者（在 view 的 onMounted 中调用）
 * 返回取消注册函数
 */
export function registerContextProvider(provider: ContextProvider): () => void {
  providers.value.push(provider)
  return () => {
    const idx = providers.value.indexOf(provider)
    if (idx !== -1) providers.value.splice(idx, 1)
  }
}

/**
 * 获取当前点击目标对应的所有额外菜单项
 */
export function getContextItems(target: HTMLElement, selectedText: string): ContextMenuItem[] {
  const items: ContextMenuItem[] = []
  for (const provider of providers.value) {
    try {
      items.push(...provider(target, selectedText))
    } catch {
      // 忽略提供者错误
    }
  }
  return items
}

/**
 * 设置当前上下文数据（供 view 传递额外信息）
 */
export function setContextData(data: Record<string, unknown>) {
  contextData.value = data
}

/**
 * 获取当前上下文数据
 */
export function getContextData(): Record<string, unknown> {
  return contextData.value
}

/**
 * 清空上下文数据
 */
export function clearContextData() {
  contextData.value = {}
}
