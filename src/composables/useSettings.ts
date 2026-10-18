import { ref } from 'vue'

/**
 * 设置中心（侧边栏底部四宫格「设置」按钮打开的 SettingsDialog）
 *
 * - 模块级单例 ref：设置弹窗、侧边栏按钮、BlogDialog、工具页、搜索卡片共享同一份状态
 *   （与 useTheme / useAnimations 同一范式），任一处改动全站即时生效
 * - 每项都持久化到 localStorage（key 前缀 `blog-`，与主题 / 语言 / 动画一致）
 * - 默认值一律等于「设置功能出现之前的行为」，老用户不打开设置面板就感知不到任何变化
 */

export type DialogBackdrop = 'blur' | 'dim' | 'light' | 'none'
export type ToolClickAction = 'dialog' | 'newTab' | 'samePage'
export type SearchClickAction = 'newTab' | 'samePage'

const KEYS = {
  closeOnClickOverlay: 'blog-dialog-close-on-overlay',
  dialogBackdrop: 'blog-dialog-backdrop',
  toolClickAction: 'blog-tool-click',
  searchClickAction: 'blog-search-click',
} as const

const BACKDROP_VALUES: readonly DialogBackdrop[] = ['blur', 'dim', 'light', 'none']
const TOOL_CLICK_VALUES: readonly ToolClickAction[] = ['dialog', 'newTab', 'samePage']
const SEARCH_CLICK_VALUES: readonly SearchClickAction[] = ['newTab', 'samePage']

// ── 默认值 ──
// closeOnClickOverlay: 默认「关」—— BlogDialog 此前的 prop 默认值就是 false，
//   只有少数调用点显式传 true，保持默认即不改变任何既有弹窗的行为
// dialogBackdrop: 'blur' 为 BlogDialog 原有观感（35% 文字色 + 4px 模糊）
// toolClickAction: 'dialog' 为工具页原有的「点卡片开弹窗」
// searchClickAction: 'samePage' 为搜索卡片原有的 router-link 站内跳转
export const SETTINGS_DEFAULTS = {
  closeOnClickOverlay: false,
  dialogBackdrop: 'blur',
  toolClickAction: 'dialog',
  searchClickAction: 'samePage',
} as const

const closeOnClickOverlay = ref<boolean>(SETTINGS_DEFAULTS.closeOnClickOverlay)
const dialogBackdrop = ref<DialogBackdrop>(SETTINGS_DEFAULTS.dialogBackdrop)
const toolClickAction = ref<ToolClickAction>(SETTINGS_DEFAULTS.toolClickAction)
const searchClickAction = ref<SearchClickAction>(SETTINGS_DEFAULTS.searchClickAction)

/** 读 localStorage 并校验取值，异常 / 非法值一律回落默认值 */
function readStored<T extends string>(key: string, valid: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw && (valid as readonly string[]).includes(raw)) return raw as T
  } catch {
    /* 无痕模式等 localStorage 不可读：用默认值 */
  }
  return fallback
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 不可写：本次会话内仍然生效 */
  }
}

function removeStored(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* 忽略 */
  }
}

function readBoolStored(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === 'on') return true
    if (raw === 'off') return false
  } catch {
    /* 忽略 */
  }
  return fallback
}

export function useSettings() {
  /** 须在挂载前调用一次：恢复上次的全部选择 */
  const initSettings = () => {
    closeOnClickOverlay.value = readBoolStored(
      KEYS.closeOnClickOverlay,
      SETTINGS_DEFAULTS.closeOnClickOverlay,
    )
    dialogBackdrop.value = readStored(KEYS.dialogBackdrop, BACKDROP_VALUES, SETTINGS_DEFAULTS.dialogBackdrop)
    toolClickAction.value = readStored(KEYS.toolClickAction, TOOL_CLICK_VALUES, SETTINGS_DEFAULTS.toolClickAction)
    searchClickAction.value = readStored(KEYS.searchClickAction, SEARCH_CLICK_VALUES, SETTINGS_DEFAULTS.searchClickAction)
  }

  const setCloseOnClickOverlay = (on: boolean) => {
    closeOnClickOverlay.value = on
    writeStored(KEYS.closeOnClickOverlay, on ? 'on' : 'off')
  }

  const setDialogBackdrop = (type: DialogBackdrop) => {
    if (!BACKDROP_VALUES.includes(type)) return
    dialogBackdrop.value = type
    writeStored(KEYS.dialogBackdrop, type)
  }

  const setToolClickAction = (action: ToolClickAction) => {
    if (!TOOL_CLICK_VALUES.includes(action)) return
    toolClickAction.value = action
    writeStored(KEYS.toolClickAction, action)
  }

  const setSearchClickAction = (action: SearchClickAction) => {
    if (!SEARCH_CLICK_VALUES.includes(action)) return
    searchClickAction.value = action
    writeStored(KEYS.searchClickAction, action)
  }

  /** 恢复默认：只清本模块的 key，不碰主题 / 语言 / 动画（那两项由各自模块管理） */
  const resetSettings = () => {
    closeOnClickOverlay.value = SETTINGS_DEFAULTS.closeOnClickOverlay
    dialogBackdrop.value = SETTINGS_DEFAULTS.dialogBackdrop
    toolClickAction.value = SETTINGS_DEFAULTS.toolClickAction
    searchClickAction.value = SETTINGS_DEFAULTS.searchClickAction
    Object.values(KEYS).forEach(removeStored)
  }

  /** 是否已偏离默认值（决定「恢复默认」按钮是否可点） */
  const isDirty = () =>
    closeOnClickOverlay.value !== SETTINGS_DEFAULTS.closeOnClickOverlay ||
    dialogBackdrop.value !== SETTINGS_DEFAULTS.dialogBackdrop ||
    toolClickAction.value !== SETTINGS_DEFAULTS.toolClickAction ||
    searchClickAction.value !== SETTINGS_DEFAULTS.searchClickAction

  return {
    closeOnClickOverlay,
    dialogBackdrop,
    toolClickAction,
    searchClickAction,
    initSettings,
    setCloseOnClickOverlay,
    setDialogBackdrop,
    setToolClickAction,
    setSearchClickAction,
    resetSettings,
    isDirty,
  }
}
