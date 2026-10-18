import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useTheme } from './composables/useTheme'
import { useAnimations } from './composables/useAnimations'
import { useSettings } from './composables/useSettings'
import { usePwaInstall } from './composables/usePwaInstall'
import { installAxiosPoolInterceptor } from './utils/axiosPool'
import BlogTip from './plugins/blog-tip'
import 'highlight.js/styles/github.css'
import 'github-markdown-css/github-markdown-light.css'
import 'animal-island-vue/style'
import './styles/variables.css'
import './styles/animal-island-theme.css'
import './styles/global.css'
import './styles/cube-loader.css'
// 必须在 github-markdown-light.css / github.css 之后，用于覆盖其写死的浅色取值
import './styles/markdown-dark.css'
import './styles/gitalk-theme.css'

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

// 后端域名池：让 5 处 axios 调用点也具备「额度耗尽自动换域名」的能力（挂全局拦截器）
installAxiosPoolInterceptor()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(BlogTip)
app.use(head)

// Initialize theme before mounting
const { initTheme } = useTheme()
initTheme()

// 动画总开关：与主题一样在挂载前应用（早于任何组件渲染，首帧就不会闪动画）
const { initAnimations } = useAnimations()
initAnimations()

// 设置中心（语言 / 动画以外的偏好：遮罩类型、点遮罩关闭、点击行为）
// 同样在挂载前恢复，保证首个弹窗就按用户偏好渲染
const { initSettings } = useSettings()
initSettings()

// PWA 安装：尽早注册 beforeinstallprompt（该事件只派发一次，晚注册会漏）
const { initPwaInstall } = usePwaInstall()
initPwaInstall()

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
    'background:#546e7a;color:#fff;padding:3px 6px;font-size:12px;font-weight:bold;',
    'background:#1565c0;color:#fff;padding:3px 6px;font-size:12px;font-weight:bold;'
  )

  console.info(
    '%c🔧 欢迎来到 Turing_ICE 的博客！来看看有什么好玩的吧 → %c/tools',
    'color: #1a237e; font-size: 13px;',
    'color: #ff6b6b; font-weight: bold; font-size: 13px;'
  )
}
