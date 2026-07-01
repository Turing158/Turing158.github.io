import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useTheme } from './composables/useTheme'
import BlogTip from './plugins/blog-tip'
import 'highlight.js/styles/github.css'
import 'github-markdown-css/github-markdown-light.css'
import 'animal-island-vue/style'
import './styles/variables.css'
import './styles/animal-island-theme.css'
import './styles/global.css'
import './styles/gitalk-theme.css'

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(BlogTip)
app.use(head)

// Initialize theme before mounting
const { initTheme } = useTheme()
initTheme()

// 等待初始路由解析完成再挂载，避免独立页面硬刷新时闪现 MainLayout
router.isReady().then(() => {
  printConsoleArt()
  app.mount('#app')
})

function printConsoleArt() {
  const title = `
   ████████╗██╗   ██╗██████╗ ██╗███╗   ██╗ ██████╗     ██╗ ██████╗███████╗
   ╚══██╔══╝██║   ██║██╔══██╗██║████╗  ██║██╔════╝     ██║██╔════╝██╔════╝
      ██║   ██║   ██║██████╔╝██║██╔██╗ ██║██║  ███╗    ██║██║     █████╗
      ██║   ██║   ██║██╔══██╗██║██║╚██╗██║██║   ██║    ██║██║     ██╔══╝
      ██║   ╚██████╔╝██║  ██║██║██║ ╚████║╚██████╔╝    ██║╚██████╗███████╗
      ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝ ╚═════╝╚══════╝
  `

  console.info(
    '%c' + title,
    'color: #4d96ff; font-weight: bold; font-size: 11px;'
  )

  console.info(
    '%c Blog %c Turing_ICE ',
    'background:#546e7a;color:#fff;padding:3px 6px;border-radius:3px 0 0 3px;font-size:12px;font-weight:bold;',
    'background:#1565c0;color:#fff;padding:3px 6px;border-radius:0 3px 3px 0;font-size:12px;font-weight:bold;'
  )

  console.info(
    '%c🔧 欢迎来到 Turing_ICE 的博客！来看看有什么好玩的吧 → %c/tools',
    'color: #1a237e; font-size: 13px;',
    'color: #ff6b6b; font-weight: bold; font-size: 13px;'
  )
}
