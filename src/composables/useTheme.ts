import { ref } from 'vue'

export type ThemeName = 'forest' | 'ocean' | 'sunset' | 'dark'

const THEME_KEY = 'blog-theme'
const SYSTEM_MODE_KEY = 'blog-theme-system-mode'
const SYSTEM_LIGHT_KEY = 'blog-theme-system-light'
const SYSTEM_DARK_KEY = 'blog-theme-system-dark'

const theme = ref<ThemeName>('forest')
const isSystemDark = ref(false)

// 系统模式：用户选择跟随系统
const systemMode = ref(false)
// 系统模式下选择的亮色主题（默认第一个：forest）
const systemLightTheme = ref<Exclude<ThemeName, 'dark'>>('forest')
// 系统模式下选择的暗色主题（默认第一个：dark）
const systemDarkTheme = ref<ThemeName>('dark')

/**
 * 检测系统暗色模式偏好
 */
function checkSystemDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * 根据系统模式计算应使用的主题
 */
function resolveTheme(): ThemeName {
  if (systemMode.value) {
    return isSystemDark.value ? systemDarkTheme.value : systemLightTheme.value
  }
  return theme.value
}

/**
 * 监听系统主题变化
 */
function watchSystemTheme() {
  if (typeof window === 'undefined') return
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', (e) => {
    isSystemDark.value = e.matches
    if (systemMode.value) {
      applyTheme(resolveTheme())
    }
  })
}

function applyTheme(t: ThemeName) {
  document.documentElement.setAttribute('data-theme', t)
  // 更新 meta theme-color（移动端浏览器地址栏颜色）
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  const colors: Record<ThemeName, string> = {
    forest: '#4a7c59',
    ocean: '#2a6f97',
    sunset: '#c05533',
    dark: '#0f172a',
  }
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colors[t])
  }
}

export function useTheme() {
  const initTheme = () => {
    isSystemDark.value = checkSystemDarkMode()
    watchSystemTheme()

    // 恢复系统模式设置
    const savedSystemMode = localStorage.getItem(SYSTEM_MODE_KEY)
    if (savedSystemMode === 'true') {
      systemMode.value = true
      const savedLight = localStorage.getItem(SYSTEM_LIGHT_KEY) as Exclude<ThemeName, 'dark'> | null
      const savedDark = localStorage.getItem(SYSTEM_DARK_KEY) as ThemeName | null
      if (savedLight) systemLightTheme.value = savedLight
      if (savedDark) systemDarkTheme.value = savedDark
      applyTheme(resolveTheme())
      return
    }

    // 普通模式：恢复手动选择的主题
    const saved = localStorage.getItem(THEME_KEY) as ThemeName | null
    const validThemes: ThemeName[] = ['forest', 'ocean', 'sunset', 'dark']

    if (saved && validThemes.includes(saved)) {
      theme.value = saved
    } else if (isSystemDark.value) {
      // 未设置过主题且系统为暗色 → 自动跟随
      theme.value = 'dark'
    }

    applyTheme(theme.value)
  }

  const setTheme = (t: ThemeName) => {
    // 手动选择主题时关闭系统模式
    systemMode.value = false
    localStorage.removeItem(SYSTEM_MODE_KEY)
    theme.value = t
    localStorage.setItem(THEME_KEY, t)
    applyTheme(t)
  }

  const toggleDark = () => {
    const newTheme = theme.value === 'dark' ? 'forest' : 'dark'
    setTheme(newTheme)
  }

  /**
 * 切换系统模式开关
   */
  const toggleSystemMode = () => {
    if (systemMode.value) {
      // 关闭系统模式：恢复手动选择的主题
      systemMode.value = false
      localStorage.removeItem(SYSTEM_MODE_KEY)
      applyTheme(theme.value)
    } else {
      // 开启系统模式：保存当前主题以便后续恢复
      systemMode.value = true
      localStorage.setItem(SYSTEM_MODE_KEY, 'true')
      applyTheme(resolveTheme())
    }
  }

  /**
   * 设置系统模式下的亮色主题
   */
  const setSystemLightTheme = (t: Exclude<ThemeName, 'dark'>) => {
    systemLightTheme.value = t
    localStorage.setItem(SYSTEM_LIGHT_KEY, t)
    if (systemMode.value && !isSystemDark.value) {
      applyTheme(t)
    }
  }

  /**
   * 设置系统模式下的暗色主题
   */
  const setSystemDarkTheme = (t: ThemeName) => {
    systemDarkTheme.value = t
    localStorage.setItem(SYSTEM_DARK_KEY, t)
    if (systemMode.value && isSystemDark.value) {
      applyTheme(t)
    }
  }

  return {
    theme,
    isSystemDark,
    systemMode,
    systemLightTheme,
    systemDarkTheme,
    initTheme,
    setTheme,
    toggleDark,
    toggleSystemMode,
    setSystemLightTheme,
    setSystemDarkTheme,
  }
}
