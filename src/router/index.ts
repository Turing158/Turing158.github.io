import { nextTick } from 'vue'
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import type { RouteLocationNormalized, RouteLocationRaw, RouteRecordRaw } from 'vue-router'
import { useAchievements } from '@/composables/useAchievements'
import { ALL_ROUTES } from '@/data/routes'

/**
 * 组件映射：key 与 src/data/routes.ts 的路由 name 一一对应。
 * 路由表本身由 ALL_ROUTES 生成，避免路径 / 标题 key 在两处重复维护。
 */
const VIEWS: Record<string, RouteRecordRaw['component']> = {
  home: () => import('@/views/HomeView.vue'),
  articles: () => import('@/views/ArticlesView.vue'),
  'article-detail': () => import('@/views/ArticleDetailView.vue'),
  projects: () => import('@/views/ProjectsView.vue'),
  releases: () => import('@/views/ReleasesView.vue'),
  'release-detail': () => import('@/views/ReleaseDetailView.vue'),
  tools: () => import('@/views/ToolsView.vue'),
  'tool-detail': () => import('@/views/ToolDetailView.vue'),
  achievements: () => import('@/views/AchievementsView.vue'),
  friends: () => import('@/views/FriendsView.vue'),
  about: () => import('@/views/AboutView.vue'),
  commits: () => import('@/views/CommitsView.vue'),
  // FIXME: ResponsiveTimeDemo.vue is missing — temporarily disabled
  // 'responsive-time-demo': () => import('@/views/ResponsiveTimeDemo.vue'),
  'not-found': () => import('@/views/NotFoundView.vue'),
  error: () => import('@/views/ErrorView.vue'),
  // ===== 独立页面（layout: 'standalone'，不渲染 MainLayout）=====
  sfmc: () => import('@/views/standalone/SfmcLandingView.vue'),
  'starfall-forum': () => import('@/views/standalone/StarFallForumView.vue'),
  'sfmc-jar': () => import('@/views/standalone/SfmcJarLandingView.vue'),
}

const routes: RouteRecordRaw[] = [
  ...ALL_ROUTES.map((route) => {
    const component = VIEWS[route.name]
    if (!component) {
      throw new Error(`[router] 缺少路由组件映射：${route.name}（见 src/router/index.ts 的 VIEWS）`)
    }
    return {
      path: route.path,
      name: route.name,
      component,
      props: route.props,
      meta: {
        titleKey: route.titleKey,
        ...(route.standalone ? { layout: 'standalone' } : {}),
      },
    } satisfies RouteRecordRaw
  }),
  // 404 通配符路由（必须放在最后）
  {
    path: '/:pathMatch(.*)*',
    name: 'catch-all',
    redirect: '/not-found',
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

const progressListeners: { onStart: () => void; onDone: () => void }[] = []

// 百度统计：SPA 站内跳转不触发页面加载，hm.js 只在首次进入时自动上报一次，
// 此处负责补报后续的站内跳转，故用该标志跳过第一次导航，避免重复计数。
let hasTrackedInitialPageview = false

/**
 * 旧 hash 链接兜底：`/#/article/xxx` → `/article/xxx`
 *
 * 改造前全站是 hash 路由，用户收藏夹、外部引用与已被搜索引擎收录的地址都是
 * `/#/article/xxx` 形式。浏览器不会把 `#` 之后的内容发给服务器，所以这类地址
 * 仍会命中首页文件、由前端接管。
 *
 * ⚠️ 必须在**路由守卫**里做，而不是提前改 `location`：
 * `createWebHistory()` 在模块导入时就把初始 `location` 快照进了内部状态，
 * 而 `app.use(router)` 会用那份快照发起首次导航 —— 在外部直接 replaceState
 * 会被随后的首次导航覆盖回 hash。走守卫则在导航解析阶段改道，一处覆盖
 * 首屏与后续所有到达方式。
 *
 * history 模式下 `/#/tools` 解析为 path=`/` + hash=`#/tools`，因此:
 *   - hash 以 `#/` 开头 → 旧路由地址，改道到对应真实路径
 *   - 其余 hash（`#section` 之类的正文锚点）→ 保持原样
 *
 * 客户端做不了 301，但足以兜住已收藏链接与已收录页面的可达性。
 */
function legacyHashRedirect(to: RouteLocationNormalized): RouteLocationRaw | true {
  const { hash } = to
  if (!hash.startsWith('#/')) return true

  const [rawPath, rawQuery] = hash.slice(1).split('?')
  // 路径内若再出现 #（如 /#/article/x#section）只保留第一段
  const path = rawPath.split('#')[0] || '/'
  const query: Record<string, string> = {}
  if (rawQuery) {
    for (const [key, value] of new URLSearchParams(rawQuery)) query[key] = value
  }

  return { path, query, hash: '', replace: true }
}

/**
 * tool-detail 地址归一化：无斜杠的 /tools/x 统一改写成 /tools/x/。
 *
 * 路由模板定义为 `/tools/:id/`（理由见 routes.ts），vue-router 默认 strict:false
 * 对两种形式都能匹配，但地址栏写什么由到达方式决定：直接访问会被 GitHub Pages
 * 301 成带斜杠形式，而站内 resolve / 旧 hash 兜底产出的是无斜杠形式。
 * 在守卫里补一次客户端改写，保证同一工具页无论怎么到达地址栏都是同一个 URL。
 */
function normalizeToolDetailPath(to: RouteLocationNormalized): RouteLocationRaw | true {
  if (to.name !== 'tool-detail' || to.path.endsWith('/')) return true
  return { path: `${to.path}/`, query: to.query, hash: to.hash, replace: true }
}

export function registerProgress(listener: { onStart: () => void; onDone: () => void }) {
  progressListeners.push(listener)
}

router.beforeEach((to) => {
  // 页面标题 / meta 由各视图的 useSeo / usePageSeo 设置（响应语言与异步数据）。
  // 独立页面自行调用 useHead，这里只负责进度条、旧链接兜底与地址归一化。
  const redirect = legacyHashRedirect(to)
  if (redirect !== true) return redirect

  const normalized = normalizeToolDetailPath(to)
  if (normalized !== true) return normalized

  progressListeners.forEach(l => l.onStart())
  return true
})

router.afterEach((to) => {
  progressListeners.forEach(l => l.onDone())

  // 记录路由访问（成就系统）
  if (to.name && typeof to.name === 'string') {
    const achievements = useAchievements()
    achievements.handleRouteVisit(to.name)
  }

  // 百度统计：SPA（history 路由）的站内跳转不触发页面加载，hm.js 不会自动记录，
  // 因此除首次外手动补报一条 PV；等 nextTick 让各视图的 useSeo 先更新 document.title，
  // 否则该条 PV 记录到的是上一页的标题。
  if (to === START_LOCATION) return
  if (!hasTrackedInitialPageview) {
    hasTrackedInitialPageview = true
  } else {
    nextTick(() => {
      window._hmt?.push(['_trackPageview', to.fullPath])
    })
  }
})

export default router
