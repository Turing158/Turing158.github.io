/**
 * 路由元数据（单一事实来源）
 *
 * 同时被三处使用：
 *   1. `src/router/index.ts` —— 生成 vue-router 路由表（组件映射在本文件之外）
 *   2. `src/plugins/prerender-plugin.ts` —— 构建时为每条路由产出真实 HTML
 *   3. `src/plugins/prerender-plugin.ts` 生成 sitemap.xml 的静态页部分
 *
 * 新增页面时只改这里 + 在 router 的 VIEWS 映射里补上组件，
 * 避免清单各写一遍导致漂移 —— 历史上 sitemap 就漏掉了 /achievements
 * 与 3 个独立落地页。
 *
 * `titleKey` / `descriptionKey` 指向 i18n 的 `pageTitle.*` / `seo.*`，
 * 构建时直接读 `src/i18n/locales/zh-CN.json`（与运行时默认语言一致）。
 */

export interface StaticRouteMeta {
  /** 路由 path，动态段写成 `:param` */
  path: string
  /** 路由 name（同时是 router 里组件映射表的键） */
  name: string
  /** i18n 页面标题 key（pageTitle.*） */
  titleKey: string
  /** i18n 描述 key（seo.*），缺省则用站点默认描述 */
  descriptionKey?: string
  /** 独立布局（不渲染 MainLayout） */
  standalone?: boolean
  /** 需要 props: true 透传路由参数 */
  props?: boolean
  /** sitemap 条目；不填则不进 sitemap */
  sitemap?: { priority: string; changefreq: string }
  /** 是否允许搜索引擎索引；false 时预渲染页写入 noindex */
  indexable?: boolean
  /**
   * 动态路由中可选参数对应的额外具体路径。
   * 例：`/commits/:repo?` 的 `['/commits']` —— 该地址需要一个真实文件。
   */
  prerenderExtraPaths?: string[]
}

/** 主布局静态页 */
export const MAIN_ROUTES: readonly StaticRouteMeta[] = [
  {
    path: '/',
    name: 'home',
    titleKey: 'pageTitle.home',
    descriptionKey: 'seo.home',
    sitemap: { priority: '1.0', changefreq: 'daily' },
    indexable: true,
  },
  {
    path: '/articles',
    name: 'articles',
    titleKey: 'pageTitle.articles',
    descriptionKey: 'seo.articles',
    sitemap: { priority: '0.9', changefreq: 'daily' },
    indexable: true,
  },
  {
    path: '/projects',
    name: 'projects',
    titleKey: 'pageTitle.projects',
    descriptionKey: 'seo.projects',
    sitemap: { priority: '0.8', changefreq: 'weekly' },
    indexable: true,
  },
  {
    path: '/releases',
    name: 'releases',
    titleKey: 'pageTitle.releases',
    descriptionKey: 'seo.releases',
    sitemap: { priority: '0.6', changefreq: 'weekly' },
    indexable: true,
  },
  {
    path: '/tools',
    name: 'tools',
    titleKey: 'pageTitle.tools',
    descriptionKey: 'seo.tools',
    sitemap: { priority: '0.8', changefreq: 'weekly' },
    indexable: true,
  },
  {
    path: '/achievements',
    name: 'achievements',
    titleKey: 'pageTitle.achievements',
    descriptionKey: 'seo.achievements',
    sitemap: { priority: '0.5', changefreq: 'monthly' },
    indexable: true,
  },
  {
    path: '/friends',
    name: 'friends',
    titleKey: 'pageTitle.friends',
    descriptionKey: 'seo.friends',
    sitemap: { priority: '0.6', changefreq: 'monthly' },
    indexable: true,
  },
  {
    path: '/about',
    name: 'about',
    titleKey: 'pageTitle.about',
    descriptionKey: 'seo.about',
    sitemap: { priority: '0.7', changefreq: 'monthly' },
    indexable: true,
  },
  {
    // 可选参数：/commits 与 /commits/<repo> 同一个视图，name 必须是带参记录，
    // 因为多处 `router.push({ name: 'commits', params: { repo } })` 依赖它。
    path: '/commits/:repo?',
    name: 'commits',
    titleKey: 'pageTitle.commits',
    props: true,
    sitemap: { priority: '0.5', changefreq: 'daily' },
    indexable: true,
    prerenderExtraPaths: ['/commits'],
  },
] as const

/** 独立落地页（不渲染 MainLayout） */
export const STANDALONE_ROUTES: readonly StaticRouteMeta[] = [
  {
    path: '/sfmc',
    name: 'sfmc',
    titleKey: 'pageTitle.sfmc',
    standalone: true,
    sitemap: { priority: '0.8', changefreq: 'weekly' },
    indexable: true,
  },
  {
    path: '/starfall-forum',
    name: 'starfall-forum',
    titleKey: 'pageTitle.starfallForum',
    standalone: true,
    sitemap: { priority: '0.7', changefreq: 'weekly' },
    indexable: true,
  },
  {
    path: '/sfmc-jar',
    name: 'sfmc-jar',
    titleKey: 'pageTitle.sfmcJar',
    standalone: true,
    sitemap: { priority: '0.7', changefreq: 'weekly' },
    indexable: true,
  },
] as const

/** 错误页：预渲染但禁止索引，不进 sitemap */
export const ERROR_ROUTES: readonly StaticRouteMeta[] = [
  { path: '/not-found', name: 'not-found', titleKey: 'pageTitle.notFound', indexable: false },
  { path: '/error', name: 'error', titleKey: 'pageTitle.error', props: true, indexable: false },
] as const

/** 动态路由模板：真实实例由 prerender-plugin 按各自数据源展开 */
export const DYNAMIC_ROUTE_TEMPLATES: readonly StaticRouteMeta[] = [
  {
    path: '/article/:slug',
    name: 'article-detail',
    titleKey: 'pageTitle.articleDetail',
    indexable: true,
  },
  {
    path: '/release/:repo',
    name: 'release-detail',
    titleKey: 'pageTitle.releaseDetail',
    props: true,
    indexable: true,
  },
  {
    // 尾斜杠是刻意为之：GitHub Pages 会把无斜杠路径 301 到目录形式
    // （/tools/x → /tools/x/），站内导航必须产出同样的地址，
    // 否则「弹窗切换」（/tools/x）与「跳转新标签页」（301 后的 /tools/x/）
    // 地址栏不一致；无斜杠路径靠 router 守卫归一化（见 router/index.ts）。
    path: '/tools/:id/',
    name: 'tool-detail',
    titleKey: 'pageTitle.toolDetail',
    indexable: true,
  },
] as const

/** 全部路由元数据（router 直接按此建表；组件映射在 router 内） */
export const ALL_ROUTES: readonly StaticRouteMeta[] = [
  ...MAIN_ROUTES,
  ...DYNAMIC_ROUTE_TEMPLATES,
  ...ERROR_ROUTES,
  ...STANDALONE_ROUTES,
] as const

/** 需要预渲染的静态路由（不含动态模板） */
export const PRERENDER_STATIC_ROUTES: readonly StaticRouteMeta[] = [
  ...MAIN_ROUTES,
  ...STANDALONE_ROUTES,
  ...ERROR_ROUTES,
] as const
