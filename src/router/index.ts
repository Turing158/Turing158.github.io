import { nextTick } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAchievements } from '@/composables/useAchievements'

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
    path: '/tools/:id',
    name: 'tool-detail',
    component: () => import('@/views/ToolDetailView.vue'),
    meta: { titleKey: 'pageTitle.toolDetail' },
  },
  {
    path: '/achievements',
    name: 'achievements',
    component: () => import('@/views/AchievementsView.vue'),
    meta: { titleKey: 'pageTitle.achievements' },
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/views/FriendsView.vue'),
    meta: { titleKey: 'pageTitle.friends' },
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
  {
    path: '/sfmc-jar',
    name: 'sfmc-jar',
    component: () => import('@/views/standalone/SfmcJarLandingView.vue'),
    meta: { layout: 'standalone', titleKey: 'pageTitle.sfmcJar' },
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

// 百度统计：hash 路由下首次进入的 PV 由 index.html 的 hm.js 自动上报，
// 此处只负责补报后续的站内跳转，故用该标志跳过第一次导航，避免重复计数。
let hasTrackedInitialPageview = false

export function registerProgress(listener: { onStart: () => void; onDone: () => void }) {
  progressListeners.push(listener)
}

router.beforeEach(() => {
  // 页面标题 / meta 由各视图的 useSeo / usePageSeo 设置（响应语言与异步数据）。
  // 独立页面自行调用 useHead，这里只负责进度条。
  progressListeners.forEach(l => l.onStart())
})

router.afterEach((to) => {
  progressListeners.forEach(l => l.onDone())

  // 记录路由访问（成就系统）
  if (to.name && typeof to.name === 'string') {
    const achievements = useAchievements()
    achievements.handleRouteVisit(to.name)
  }

  // 百度统计：hash 路由的站内跳转不触发页面加载，hm.js 不会自动记录，
  // 因此除首次外手动补报一条 PV；等 nextTick 让各视图的 useSeo 先更新 document.title，
  // 否则该条 PV 记录到的是上一页的标题。
  // 只上报 fullPath（如 /article/xxx），保证日后改用 history 路由时报表口径不变。
  if (!hasTrackedInitialPageview) {
    hasTrackedInitialPageview = true
  } else {
    nextTick(() => {
      window._hmt?.push(['_trackPageview', to.fullPath])
    })
  }
})

export default router
