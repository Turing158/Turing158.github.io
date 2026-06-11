import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { config } from '@/config'
import i18n from '@/i18n'
import { useSeo } from '@/composables/useSeo'

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
    path: '/releases',
    name: 'releases',
    component: () => import('@/views/ReleasesView.vue'),
    meta: { titleKey: 'pageTitle.releases' },
  },
  {
    path: '/release/:repo',
    name: 'release-detail',
    component: () => import('@/views/ReleaseDetailView.vue'),
    meta: { titleKey: 'pageTitle.releaseDetail' },
    props: true,
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
  // FIXME: ResponsiveTimeDemo.vue is missing — temporarily disabled
  // {
  //   path: '/responsive-time-demo',
  //   name: 'responsive-time-demo',
  //   component: () => import('@/views/ResponsiveTimeDemo.vue'),
  //   meta: { titleKey: 'pageTitle.responsiveTimeDemo' },
  // },
  // 错误页面路由
  {
    path: '/not-found',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titleKey: 'pageTitle.notFound' },
  },
  {
    path: '/error',
    name: 'error',
    component: () => import('@/views/ErrorView.vue'),
    meta: { titleKey: 'pageTitle.error' },
    props: true,
  },
  // ===== 独立页面（layout: 'standalone'，不渲染 MainLayout）=====
  {
    path: '/sfmc',
    name: 'sfmc',
    component: () => import('@/views/standalone/SfmcLandingView.vue'),
    meta: { layout: 'standalone', titleKey: 'pageTitle.sfmc' },
  },
  {
    path: '/starfall-forum',
    name: 'starfall-forum',
    component: () => import('@/views/standalone/StarFallForumView.vue'),
    meta: { layout: 'standalone', titleKey: 'pageTitle.starfallForum' },
  },
  // 404 通配符路由（必须放在最后）
  {
    path: '/:pathMatch(.*)*',
    name: 'catch-all',
    redirect: '/not-found',
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

  // 发行详情页：动态替换为仓库名
  if (to.name === 'release-detail' && to.params.repo) {
    pageTitle = to.params.repo as string
  }

  const { titleTemplate, title: blogTitle } = config.blog
  // 独立页面不套用博客标题模板，直接使用完整产品名
  if (to.meta.layout === 'standalone') {
    document.title = pageTitle
    progressListeners.forEach(l => l.onStart())
    return
  }
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

router.afterEach((to) => {
  progressListeners.forEach(l => l.onDone())

  // 独立页面跳过全局 SEO（useSeo 会套用博客标题模板和主题色），由页面自行 useHead
  if (to.meta.layout === 'standalone') return

  // 为每个页面设置默认 SEO
  const titleKey = to.meta.titleKey as string | undefined
  let pageTitle = titleKey ? i18n.global.t(titleKey) : ''

  if (to.name === 'commits' && to.params.repo) {
    pageTitle = to.params.repo as string
  }
  if (to.name === 'release-detail' && to.params.repo) {
    pageTitle = to.params.repo as string
  }

  // 使用 useSeo 设置页面级 meta
  useSeo({
    title: pageTitle,
    url: to.fullPath,
    type: 'website',
  })
})

export default router
