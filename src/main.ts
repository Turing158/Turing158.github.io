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

app.mount('#app')
