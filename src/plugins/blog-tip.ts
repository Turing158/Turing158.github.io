import { ref, type App } from 'vue'

export type TipType = 'info' | 'success' | 'warning' | 'error'

export interface TipItem {
  id: number
  message: string
  type: TipType
  count: number
  /** 自动消失时长（ms），0 = 永不自动消失 */
  duration: number
  /** 鼠标移入是否停表，默认 true */
  pauseOnHover: boolean
  /** 正在播放离场动画（此期间不参与同消息合并） */
  leaving: boolean

  /* —— 以下由 BlogTipContainer 维护的视图状态 —— */
  /** 已停表（鼠标移入或键盘聚焦中） */
  paused: boolean
  /** 已展开（hover / focus） */
  opened: boolean
  /** 键盘聚焦中 */
  focused: boolean
  /** 展开态实测高度（px），0 = 尚未测量 */
  openHeight: number
  /** 卡包层叠深度，0 = 最新（完整浮在最上） */
  depth: number
  /** 容器装不下，已折成「卡边」 */
  peeking: boolean
  /** 容量仍不够，已整条隐藏 */
  hidden: boolean
  /** 自增即重建进度条元素，让 CSS 动画从头播放 —— 「重新计满」的载体 */
  restartToken: number
}

export interface TipOptions {
  type?: TipType
  /** 自动消失时长（ms），默认 5000，传 0 表示不自动消失 */
  duration?: number
  /** 鼠标移入是否停表，默认 true */
  pauseOnHover?: boolean
}

/** 响应式气泡列表；最新的一条在数组首位（渲染在最上方） */
export const tips = ref<TipItem[]>([])

let idSeed = 0

/** 倒计时句柄，刻意不进响应式：定时器不是 UI 状态 */
const lifeTimers = new Map<number, ReturnType<typeof setTimeout>>()

/** 离场动画时长，必须与 BlogTipContainer 样式里 blog-tip-out 的时长（--tip-dur-out）一致 */
export const LEAVE_ANIMATION_MS = 220

function clearLifeTimer(id: number) {
  const t = lifeTimers.get(id)
  if (t) {
    clearTimeout(t)
    lifeTimers.delete(id)
  }
}

/** 开始 / 重新开始倒计时。进度条靠 restartToken 重建元素，因此是「重新计满」而非续接剩余时间 */
export function startLife(tip: TipItem) {
  clearLifeTimer(tip.id)
  tip.paused = false
  if (tip.duration <= 0) return
  tip.restartToken++
  lifeTimers.set(
    tip.id,
    setTimeout(() => dismiss(tip), tip.duration)
  )
}

/** 停表（hover / 键盘聚焦）。只清定时器，进度条由 CSS 动画自己暂停在当前位置 */
export function pauseLife(tip: TipItem) {
  clearLifeTimer(tip.id)
  tip.paused = true
}

function removeTip(id: number) {
  clearLifeTimer(id)
  const idx = tips.value.findIndex((t) => t.id === id)
  if (idx !== -1) tips.value.splice(idx, 1)
}

/** 播放离场动画后移除；重复调用安全（leaving 期间直接返回） */
export function dismiss(tip: TipItem) {
  // 无论走哪个分支都先清句柄：mouseleave 可能在元素已移除后才补触发并排一个新定时器，
  // 那个定时器正是在这里（而非 lifeTimers 内部）收尾
  clearLifeTimer(tip.id)
  if (tip.leaving || !tips.value.includes(tip)) return
  tip.leaving = true
  setTimeout(() => removeTip(tip.id), LEAVE_ANIMATION_MS)
}

const BlogTip = {
  show(message: string, options?: TipOptions) {
    const type = options?.type ?? 'info'
    const duration = options?.duration ?? 5000
    const pauseOnHover = options?.pauseOnHover ?? true

    // 正在播放离场动画的不参与合并，让它自然退场后另起一条
    const existing = tips.value.find(
      (t) => t.message === message && t.type === type && !t.leaving
    )
    if (existing) {
      existing.count++
      existing.duration = duration
      // 刻意不覆盖 pauseOnHover：悬停行为在气泡诞生时确定，中途改会让 paused 与新语义
      // 失配（pauseOnHover=false 期间鼠标停在上面时 paused 一直是 false）
      // 只有用户没在看这条时才重启计时；正在看（hover / 聚焦）就保持原节奏，
      // 否则会在鼠标底下倒计时消失
      if (!existing.opened && !existing.paused) startLife(existing)
      return existing
    }

    const tip: TipItem = {
      id: ++idSeed,
      message,
      type,
      count: 1,
      duration,
      pauseOnHover,
      leaving: false,
      paused: false,
      opened: false,
      focused: false,
      openHeight: 0,
      depth: 0,
      peeking: false,
      hidden: false,
      restartToken: 0,
    }
    tips.value.unshift(tip) // 最新的插到最前（最上方），旧的依次下沉
    startLife(tip)
    return tip
  },

  remove(id: number) {
    removeTip(id)
  },

  clear() {
    lifeTimers.forEach((t) => clearTimeout(t))
    lifeTimers.clear()
    tips.value = []
  },

  install(app: App) {
    app.config.globalProperties.$blogTip = BlogTip
    app.provide('blogTip', BlogTip)
  },
}

export default BlogTip
