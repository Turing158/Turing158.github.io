import { ref } from 'vue'

export type ThemeName = 'forest' | 'ocean' | 'sunset'

const THEME_KEY = 'blog-theme'

const theme = ref<ThemeName>('forest')

function applyTheme(t: ThemeName) {
  // 直接设置到 <html> 上，确保 CSS 属性选择器能正确匹配
  document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeName | null
    if (saved && ['forest', 'ocean', 'sunset'].includes(saved)) {
      theme.value = saved
    }
    // 同步到 DOM
    applyTheme(theme.value)
  }

  const setTheme = (t: ThemeName) => {
    theme.value = t
    localStorage.setItem(THEME_KEY, t)
    applyTheme(t)
  }

  return { theme, initTheme, setTheme }
}
