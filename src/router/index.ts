import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { config } from '@/config'
import i18n from '@/i18n'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { titleKey: 'pageTitle.home' },
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/views/ArticlesView.vue'),
    meta: { titleKey: 'pageTitle.articles' },
  },
  {
    path: '/article/:slug',
    name: 'article-detail',
    component: () => import('@/views/ArticleDetailView.vue'),
    meta: { titleKey: 'pageTitle.articleDetail' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { titleKey: 'pageTitle.projects' },
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('@/views/ToolsView.vue'),
    meta: { titleKey: 'pageTitle.tools' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { titleKey: 'pageTitle.about' },
  },
  {
    path: '/commits/:repo?',
    name: 'commits',
    component: () => import('@/views/CommitsView.vue'),
    meta: { titleKey: 'pageTitle.commits' },
    props: true,
  },
]

const router = createRouter({
  history: createWebHashHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

const progressListeners: { onStart: () => void; onDone: () => void }[] = []

export function registerProgress(listener: { onStart: () => void; onDone: () => void }) {
  progressListeners.push(listener)
}

router.beforeEach((to) => {
  const titleKey = to.meta.titleKey as string | undefined
  let pageTitle = titleKey ? i18n.global.t(titleKey) : ''

  // 提交记录页：动态替换为仓库名
  if (to.name === 'commits' && to.params.repo) {
    pageTitle = to.params.repo as string
  }

  const { titleTemplate, title: blogTitle } = config.blog
  document.title = titleTemplate
    .replace('{current_page}', pageTitle)
    .replace('{blog_title}', blogTitle)
  progressListeners.forEach(l => l.onStart())
})

// 供组件在获取到异步数据后更新标题
export function updateDocumentTitle(pageTitle: string) {
  const { titleTemplate, title: blogTitle } = config.blog
  document.title = titleTemplate
    .replace('{current_page}', pageTitle)
    .replace('{blog_title}', blogTitle)
}

router.afterEach(() => {
  progressListeners.forEach(l => l.onDone())
})

export default router
