import { ref } from 'vue'

const STORAGE_KEY = 'blog-animations'
const ROOT_ATTR = 'data-animations'

/**
 * 全站动画总开关（侧边栏底部四宫格「动画」按钮）
 *
 * - 默认开启：只有用户显式关过（localStorage 记 'off'）才为关
 * - 关闭时在 <html> 上打 data-animations="off"：global.css 的全局规则把全站
 *   keyframes / transition / 平滑滚动一律压成 0；JS 侧的连续动画（云朵、打字机、
 *   数字滚动）由各自消费方 watch 本 ref 停止
 * - 模块级单例 ref：所有调用方共享同一状态（与 useTheme 同一范式）
 */
const animationsEnabled = ref(true)

function applyAnimations(on: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (on) {
    root.removeAttribute(ROOT_ATTR)
  } else {
    root.setAttribute(ROOT_ATTR, 'off')
  }
}

export function useAnimations() {
  /** 须在挂载前调用一次：恢复上次选择并落到 <html> 上 */
  const initAnimations = () => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      saved = null
    }
    animationsEnabled.value = saved !== 'off'
    applyAnimations(animationsEnabled.value)
  }

  const setAnimations = (on: boolean) => {
    animationsEnabled.value = on
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      /* 无痕模式等 localStorage 不可写：本次会话内仍然生效 */
    }
    applyAnimations(on)
  }

  const toggleAnimations = () => setAnimations(!animationsEnabled.value)

  return {
    animationsEnabled,
    initAnimations,
    setAnimations,
    toggleAnimations,
  }
}

/**
 * 给 scrollTo / scrollIntoView 用：JS 显式传入的 behavior 会覆盖 CSS 的
 * scroll-behavior（global.css 那条管不到），所以这些调用点得自己问开关。
 * 非响应式取即时值即可 —— 调用都发生在用户操作的回调里。
 */
export function scrollBehavior(): ScrollBehavior {
  return animationsEnabled.value ? 'smooth' : 'auto'
}
