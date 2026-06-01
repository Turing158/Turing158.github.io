import { ref, type App } from 'vue'

export type TipType = 'info' | 'success' | 'warning' | 'error'

export interface TipItem {
  id: number
  message: string
  type: TipType
  count: number
  duration: number // ms, 0 = never auto-remove
  pauseOnHover: boolean
  leaving: boolean // 正在播放消失动画
}

export interface TipOptions {
  type?: TipType
  duration?: number // ms, default 3000, 0 = never auto-remove
  pauseOnHover?: boolean // default true
}

export const tips = ref<TipItem[]>([])

let idSeed = 0
const leaveTimerMap = new Map<number, ReturnType<typeof setTimeout>>()
const safetyTimerMap = new Map<number, ReturnType<typeof setTimeout>>()

// 离场动画时长，必须与 CSS @keyframes blog-tip-out 一致
const LEAVE_ANIMATION_MS = 300

function clearSafetyTimer(id: number) {
  const t = safetyTimerMap.get(id)
  if (t) {
    clearTimeout(t)
    safetyTimerMap.delete(id)
  }
}

// 安全移除：无论 animationend 是否触发，都能保证元素最终被清理
function safeRemove(id: number) {
  clearSafetyTimer(id)
  const idx = tips.value.findIndex(t => t.id === id)
  if (idx !== -1) tips.value.splice(idx, 1)
}

function scheduleRemove(tip: TipItem) {
  clearLeaveTimer(tip.id)
  clearSafetyTimer(tip.id)
  if (tip.duration === 0) return
  leaveTimerMap.set(
    tip.id,
    setTimeout(() => {
      const t = tips.value.find(x => x.id === tip.id)
      if (!t) return
      t.leaving = true
      // 兜底：动画播放完后若仍未移除，强制清理
      safetyTimerMap.set(
        tip.id,
        setTimeout(() => safeRemove(tip.id), LEAVE_ANIMATION_MS + 50)
      )
    }, tip.duration)
  )
}

export function clearLeaveTimer(id: number) {
  const t = leaveTimerMap.get(id)
  if (t) {
    clearTimeout(t)
    leaveTimerMap.delete(id)
  }
}

// 由容器在 animationend 后调用，提前清理
export function finalizeRemove(id: number) {
  safeRemove(id)
}

export function startLeaveTimer(id: number) {
  const tip = tips.value.find(t => t.id === id)
  if (tip) scheduleRemove(tip)
}

const BlogTip = {
  show(message: string, options?: TipOptions) {
    const type = options?.type ?? 'info'
    const duration = options?.duration ?? 3000
    const pauseOnHover = options?.pauseOnHover ?? true

    // 正在播放消失动画的 tip 不参与合并，让它自然离场后重新创建
    const existing = tips.value.find(t => t.message === message && t.type === type && !t.leaving)
    if (existing) {
      existing.count++
      existing.duration = duration
      existing.pauseOnHover = pauseOnHover
      existing.leaving = false
      scheduleRemove(existing)
      return
    }

    const tip: TipItem = {
      id: ++idSeed,
      message,
      type,
      count: 1,
      duration,
      pauseOnHover,
      leaving: false,
    }
    tips.value.push(tip)
    scheduleRemove(tip)
  },

  remove(id: number) {
    clearLeaveTimer(id)
    const idx = tips.value.findIndex(t => t.id === id)
    if (idx !== -1) tips.value.splice(idx, 1)
  },

  clear() {
    leaveTimerMap.forEach(t => clearTimeout(t))
    leaveTimerMap.clear()
    safetyTimerMap.forEach(t => clearTimeout(t))
    safetyTimerMap.clear()
    tips.value = []
  },

  install(app: App) {
    app.config.globalProperties.$blogTip = BlogTip
    app.provide('blogTip', BlogTip)
  },
}

export { LEAVE_ANIMATION_MS }
export default BlogTip
