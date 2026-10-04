/**
 * 预渲染插件：为每条路由产出**真实存在的 HTML 文件**
 *
 * 为什么必须做这一步：
 *   GitHub Pages 是纯静态托管，**不会**把未知路径交给 index.html
 *   （实测 `/tools`、`/about` 均返回 GitHub Pages 自己的 404 页）。
 *   hash 路由之所以能跑，是因为 `#` 之后的内容根本不发给服务器。
 *   一旦改成 history 路由，`/articles` 这类地址就必须有一个真实文件，
 *   否则直接访问（刷新、外链、爬虫）一律 404。
 *
 * 产物：
 *   dist/<route>/index.html   —— 每条静态路由 + 每篇文章 + 每个工具详情
 *   dist/404.html             —— 未知路径的兜底页（保留真实 404 状态码）
 *   dist/sitemap.xml          —— 单一编码函数生成，与 canonical 逐字节一致
 *
 * 关于注入位置：正文注入到 `#app` 容器内。
 * Vue 3 非水合挂载会先清空容器（runtime-dom 的 `app.mount` 里
 * `container.textContent = ""`），所以爬虫（不执行 JS）能看到完整正文，
 * 而真实用户不会看到重复内容 —— 无需修改任何组件。
 *
 * meta 去重：@unhead 初始化时会扫描 head 中已有标签并按 data-hid / hashTag 建索引
 * （见 @unhead/dom 的 renderDOMHead），props 命中的标签会被复用而非重复插入。
 * 因此这里注入的 title / meta:property:og:* / link:rel:canonical 在客户端接管后
 * 不会出现重复标签。
 */

import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { getBuildArticles, type BuildArticle } from './articles-store'
import { PRERENDER_STATIC_ROUTES } from '../data/routes'
import { toolKeys } from '../data/tools'
import { RELEASE_REPOS } from '../data/releases'
import { DEFAULT_SITE_URL, absoluteUrl } from '../utils/siteUrl'
import { buildJsonLd, resolveImage } from '../utils/structuredData'
import { verifyBuildOutput } from './build-verify'

/** 站点默认描述，与 src/composables/useSeo.ts 的 DEFAULT_DESCRIPTION 保持一致 */
const DEFAULT_DESCRIPTION = 'Turing_ICE 的个人博客，分享技术文章、开发工具和学习笔记'
const DEFAULT_IMAGE = '/icons/icon-512.png'
const BLOG_TITLE = 'Turing_ICE'
const BLOG_AUTHOR = 'Turing158'
const TITLE_TEMPLATE = '{current_page} | Blog - {blog_title}'

/** 预渲染页的正文容器：挂载时会被 Vue 清空，不产生重复内容 */
const PRERENDER_STYLE = `
    <style id="prerender-style">
      /* 预渲染正文仅供不执行 JS 的爬虫阅读；JS 一执行就被 Vue 清空。
         脚本会在 head 末尾移除 no-js，因此正文不会闪现。 */
      #app > .prerender-content { display: none; }
      html.no-js #app > .prerender-content { display: block; }
    </style>`

/**
 * /commits 无参时运行时的默认仓库
 * （见 src/views/CommitsView.vue 的 `props.repo || 'StarFall-Minecraft-Launcher'`）
 */
const DEFAULT_COMMITS_REPO = 'StarFall-Minecraft-Launcher'

/**
 * 独立落地页的 head 取值。
 *
 * 这三页自行调用 useHead（不走标题模板），标题与 og:title 是写死的英文名、
 * 描述取自各自的 i18n key —— 预渲染必须逐字对齐，否则 SPA 接管后
 * title / og:title / description 会出现两个标签。
 */
const STANDALONE_HEAD: Record<
  string,
  {
    title: (m: Record<string, any>) => string
    description: (m: Record<string, any>) => string
    ogTitle: (m: Record<string, any>) => string
  }
> = {
  sfmc: {
    title: (m) => pick(m, 'pageTitle.sfmc') || 'StarFall Minecraft Launcher',
    description: (m) => pick(m, 'sfmc.subTagline') || DEFAULT_DESCRIPTION,
    ogTitle: () => 'StarFall Minecraft Launcher',
  },
  'starfall-forum': {
    title: () => 'StarFall Minecraft Forum',
    description: (m) => pick(m, 'forum.subTagline') || DEFAULT_DESCRIPTION,
    ogTitle: () => 'StarFall Minecraft Forum',
  },
  'sfmc-jar': {
    title: () => 'SFMC - Java Edition',
    description: (m) => pick(m, 'sfmcJar.description') || DEFAULT_DESCRIPTION,
    ogTitle: () => 'SFMC - Java Edition',
  },
}

interface PageMeta {
  /** 站内路径，如 /articles、（文章）/article/xxx */
  path: string
  title: string
  description: string
  /** 展示在正文里的标题 */
  heading: string
  /** 正文 HTML（已渲染的片段或简述段落） */
  bodyHtml: string
  /** JSON-LD 类型 */
  type: 'website' | 'article'
  /**
   * og:title 的覆盖值。
   * 独立落地页运行时用的是写死的英文名（如 'SFMC - Java Edition'），
   * 与 <title> 不同，这里必须跟着走，否则 SPA 接管后同一属性会出现两个标签。
   */
  ogTitle?: string
  /** og:type 的覆盖值（独立页运行时写的是 website） */
  ogType?: string
  /** 文章封面（原始值，可相对路径；由 buildJsonLd / resolveImage 统一处理） */
  cover?: string
  /** 文章专用 */
  publishedTime?: string
  tags?: string[]
  noIndex?: boolean
  lastmod?: string
}

/** sitemap 条目：页面元信息 + crawl 提示 */
interface SitemapEntry extends PageMeta {
  changefreq: string
  priority: string
}

/** 读取 i18n 语言包（构建时取默认语言的中文文案，与运行时首屏一致） */
function loadLocaleMessages(rootDir: string): Record<string, any> {
  const file = resolve(rootDir, 'src', 'i18n', 'locales', 'zh-CN.json')
  if (!existsSync(file)) {
    console.warn('[prerender-plugin] zh-CN.json not found, falling back to empty messages')
    return {}
  }
  return JSON.parse(readFileSync(file, 'utf-8'))
}

/** 按 `pageTitle.home` 形式取值 */
function pick(messages: Record<string, any>, key: string | undefined): string | undefined {
  if (!key) return undefined
  return key.split('.').reduce<any>((acc, k) => (acc == null ? undefined : acc[k]), messages)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTitle(pageTitle: string): string {
  return TITLE_TEMPLATE.replace('{current_page}', pageTitle).replace('{blog_title}', BLOG_TITLE)
}

/**
 * 构造 JSON-LD。
 *
 * ⚠️ 必须与运行时 useSeo 算出的 JSON **逐字节一致** —— @unhead 按内容哈希匹配
 * script 标签，不一致就会同时留下两份 ld+json。因此共用 buildJsonLd，
 * 且入参（title / description / url / cover / 时间 / 标签）与运行时完全对齐。
 *
 * 注意 `image` 传的是**原始 cover**（可能为相对路径），由 buildJsonLd 内部按
 * 与运行时相同的规则补前缀；这里不能先 absoluteUrl 再传入，否则遇到
 * `cover: undefined` 时会算出不同的 image。
 */
function renderJsonLd(meta: PageMeta, siteUrl: string): string {
  return buildJsonLd({
    type: meta.type,
    title: meta.title,
    description: meta.description,
    url: absoluteUrl(meta.path, siteUrl),
    siteUrl,
    defaultImage: DEFAULT_IMAGE,
    blogTitle: BLOG_TITLE,
    author: BLOG_AUTHOR,
    cover: meta.cover,
    publishedTime: meta.publishedTime,
    modifiedTime: meta.publishedTime,
    tags: meta.tags,
  })
}

/** 把一页的 <head> 替换掉，并注入正文 */
function renderPage(template: string, meta: PageMeta, siteUrl: string): string {
  const url = absoluteUrl(meta.path, siteUrl)
  const image = resolveImage(meta.cover, siteUrl, DEFAULT_IMAGE)
  const robots = meta.noIndex ? 'noindex, nofollow' : 'index, follow'

  const head = `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}" />
    <meta name="robots" content="${robots}" />
    <meta name="googlebot" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(url)}" />

    <meta property="og:type" content="${meta.ogType || meta.type}" />
    <meta property="og:title" content="${escapeHtml(meta.ogTitle || meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="${BLOG_TITLE}" />
    <meta property="og:locale" content="zh_CN" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    <script type="application/ld+json">${renderJsonLd(meta, siteUrl)}</script>`

  let html = template

  // 1) 移除模板中写死的 title / meta / og / twitter / canonical，避免与注入的重复
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '')
  html = html.replace(/\s*<meta\s+(?:name|property)="(?:description|keywords|author|robots|googlebot|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, '')
  html = html.replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '')

  // 2) 注入本页 head（放在预连接之后、统计脚本之前）
  html = html.replace('</head>', `${head}\n${PRERENDER_STYLE}\n  </head>`)

  // 3) 注入正文到 #app 内（挂载时被清空，仅供爬虫阅读）
  html = html.replace(
    /<div id="app"><\/div>/,
    `<div id="app"><div class="prerender-content"><h1>${escapeHtml(meta.heading)}</h1>${meta.bodyHtml}</div></div>`
  )

  // 4) 给 <html> 加 no-js 类；脚本一执行就移除，从而显示真实应用而隐藏预渲染正文
  html = html.replace('<html lang="zh-CN">', '<html lang="zh-CN" class="no-js">')
  html = html.replace(
    '</head>',
    `  <script>document.documentElement.classList.remove('no-js')</script>\n  </head>`
  )

  return html
}

/** 站点地图：静态页 + 文章 + 工具 + 发行 */
function generateSitemap(pages: SitemapEntry[], siteUrl: string): string {
  const today = new Date().toISOString().split('T')[0]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`
  for (const page of pages) {
    // absoluteUrl 内部逐段 encodeURIComponent，中文 / 空格 / 方括号 slug 不会
    // 产出裸空格与方括号（旧版 sitemap 因此校验不通过）
    xml += `  <url>
    <loc>${absoluteUrl(page.path, siteUrl)}</loc>
    <lastmod>${(page.lastmod || today).split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`
  }
  xml += '</urlset>'
  return xml
}

export function prerenderPlugin(): Plugin {
  let rootDir = ''
  let isBuild = false
  let siteUrl = DEFAULT_SITE_URL

  return {
    name: 'vite-plugin-prerender',
    // 必须晚于 articles-plugin 的 configResolved（要读它写入的文章数据），
    // 同时 closeBundle 也要在 dist 落盘之后运行 —— 用 enforce: 'post' 保证顺序。
    enforce: 'post',

    configResolved(config: ResolvedConfig) {
      rootDir = config.root
      isBuild = config.command === 'build'
      siteUrl = (process.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
    },

    closeBundle() {
      if (!isBuild) return

      const distDir = resolve(rootDir, 'dist')
      const templatePath = join(distDir, 'index.html')
      if (!existsSync(templatePath)) {
        console.warn('[prerender-plugin] dist/index.html not found, skip prerender')
        return
      }

      const template = readFileSync(templatePath, 'utf-8')
      const messages = loadLocaleMessages(rootDir)
      const articles = getBuildArticles()

      const written: string[] = []
      const sitemapEntries: SitemapEntry[] = []

      const writePage = (meta: PageMeta, outPath: string) => {
        const html = renderPage(template, meta, siteUrl)
        const file = join(distDir, outPath, 'index.html')
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, html, 'utf-8')
        written.push(outPath)
      }

      // ── 1. 静态路由 ──
      for (const route of PRERENDER_STATIC_ROUTES) {
        const pageTitle = pick(messages, route.titleKey) || BLOG_TITLE
        const description = pick(messages, route.descriptionKey) || DEFAULT_DESCRIPTION
        // 含 `:param` 的模板本身不是可访问地址，只产出它的具体路径
        // （如 /commits/:repo? → /commits）
        const concretePaths = route.path.includes(':')
          ? (route.prerenderExtraPaths ?? [])
          : [route.path, ...(route.prerenderExtraPaths ?? [])]

        if (concretePaths.length === 0) {
          console.warn(`[prerender-plugin] 路由 ${route.path} 无具体路径可预渲染，已跳过`)
          continue
        }

        // 独立落地页自行调用 useHead，标题不走模板、描述与 og:title 也各不相同，
        // 这里逐页对齐运行时的实际取值（见 src/views/standalone/*.vue 的 useHead）
        const standaloneHead = STANDALONE_HEAD[route.name]

        for (const [index, concretePath] of concretePaths.entries()) {
          // /commits 无参时运行时的 repoName 默认值（见 CommitsView 的 props.repo 回退）
          const isCommits = route.name === 'commits'
          // 首页运行时传的是 config.blog.title（'Turing_ICE'）而非 i18n 的 pageTitle.home，
          // 因此 <title> 是「Turing_ICE | Blog - Turing_ICE」—— 必须跟着走
          const isHome = route.name === 'home'
          const heading = isCommits ? DEFAULT_COMMITS_REPO : pageTitle

          const meta: PageMeta = standaloneHead
            ? {
                path: concretePath,
                title: standaloneHead.title(messages),
                description: standaloneHead.description(messages),
                ogTitle: standaloneHead.ogTitle(messages),
                ogType: 'website',
                heading: pageTitle,
                bodyHtml: `<p>${escapeHtml(standaloneHead.description(messages))}</p>`,
                type: 'website',
                noIndex: !route.indexable,
              }
            : {
                path: concretePath,
                title: buildTitle(isHome ? BLOG_TITLE : heading),
                description: isCommits
                  ? (pick(messages, 'pageCommits.seoDescription') || description).replace('{repo}', DEFAULT_COMMITS_REPO)
                  : description,
                heading,
                bodyHtml: `<p>${escapeHtml(description)}</p>`,
                type: 'website',
                noIndex: !route.indexable,
              }

          writePage(meta, concretePath === '/' ? '' : concretePath)

          // sitemap 只收第一条具体路径（同一视图的别名地址不重复提交）
          if (route.sitemap && index === 0) {
            sitemapEntries.push({
              ...meta,
              changefreq: route.sitemap.changefreq,
              priority: route.sitemap.priority,
            })
          }
        }
      }

      // ── 2. 文章页：复用 articles-plugin 已渲染好的正文 HTML ──
      const articleHtmlDir = resolve(rootDir, 'public', 'articles')
      for (const article of articles) {
        let body = ''
        if (article.htmlFile) {
          const fragment = join(articleHtmlDir, article.htmlFile)
          if (existsSync(fragment)) body = readFileSync(fragment, 'utf-8')
        }
        // 运行时 useArticleSeo 的 description 直接取 frontmatter 的 description
        // （为空时回落到 DEFAULT_DESCRIPTION），不截取正文 —— 必须一致才不会重复标签
        const meta: PageMeta = {
          path: `/article/${article.slug}`,
          title: buildTitle(article.title),
          description: article.description || DEFAULT_DESCRIPTION,
          heading: article.title,
          // 正文直接复用 md5(slug).html 片段的内容（不含 <html> 包裹）
          bodyHtml: body || `<p>${escapeHtml(article.description || '')}</p>`,
          type: 'article',
          cover: article.cover,
          publishedTime: article.date,
          tags: article.tags,
          lastmod: article.date,
        }
        // 磁盘上的目录名用**原始 slug**（含中文、空格、方括号），URL 里才做百分号编码。
        // GitHub Pages 会先把请求路径解码，再按解码结果查文件 —— 若磁盘上是
        // %E6%8F%90... 这种编码名，浏览器发的 /article/%E6%8F%90... 解码后反而不匹配。
        writePage(meta, `/article/${article.slug}`)
        sitemapEntries.push({
          ...meta,
          changefreq: 'monthly',
          priority: '0.9',
        })
      }

      // ── 3. 工具详情页 ──
      // 运行时标题是工具名本身（usePageSeo 的第一参），描述取自 tools.<key>Desc
      // canonical 用带尾斜杠的目录形式（/tools/<key>/），与路由模板 /tools/:id/
      // 及 GitHub Pages 的 301 归一化方向一致（见 routes.ts 的说明）；
      // writePage 的落盘路径仍是不带斜杠的目录名。
      for (const tool of toolKeys) {
        const name = pick(messages, `tools.${tool.key}Name`) || tool.key
        const description = pick(messages, `tools.${tool.key}Desc`) || DEFAULT_DESCRIPTION
        const meta: PageMeta = {
          path: `/tools/${tool.key}/`,
          title: buildTitle(name),
          description,
          heading: name,
          bodyHtml: `<p>${escapeHtml(description)}</p>`,
          type: 'website',
        }
        writePage(meta, `/tools/${tool.key}`)
        sitemapEntries.push({ ...meta, changefreq: 'monthly', priority: '0.7' })
      }

      // ── 4. 发行详情页（壳页：真实数据由客户端拉取） ──
      // 运行时标题就是仓库名（usePageSeo(repoName, ...)），描述是带 {repo} 的模板
      for (const repo of RELEASE_REPOS) {
        const seoDesc = (pick(messages, 'pageRelease.seoDescription') || '{repo} 的发行版本').replace('{repo}', repo)
        const meta: PageMeta = {
          path: `/release/${repo}`,
          title: buildTitle(repo),
          description: seoDesc,
          heading: repo,
          bodyHtml: `<p>${escapeHtml(seoDesc)}</p>`,
          type: 'website',
        }
        writePage(meta, `/release/${repo}`)
        sitemapEntries.push({ ...meta, changefreq: 'weekly', priority: '0.6' })
      }

      // ── 5. 404.html：真实 404 状态码 + 引导回首页，禁止索引 ──
      // 运行时 NotFoundView 用 useSeo({ title: t('pageTitle.notFound'), url: '/not-found' })，
      // description 未传则取 DEFAULT_DESCRIPTION —— 这里保持一致以免重复标签
      const notFoundTitle = pick(messages, 'pageTitle.notFound') || '页面未找到'
      const notFoundDesc = pick(messages, 'notFound.description') || DEFAULT_DESCRIPTION
      const notFoundHtml = renderPage(
        template,
        {
          path: '/not-found',
          title: buildTitle(notFoundTitle),
          description: DEFAULT_DESCRIPTION,
          heading: notFoundTitle,
          bodyHtml: `<p>${escapeHtml(notFoundDesc)}</p><p><a href="/">${escapeHtml(pick(messages, 'notFound.goHome') || '返回首页')}</a></p>`,
          type: 'website',
          noIndex: true,
        },
        siteUrl
      )
      writeFileSync(join(distDir, '404.html'), notFoundHtml, 'utf-8')

      // ── 6. sitemap.xml ──
      writeFileSync(join(distDir, 'sitemap.xml'), generateSitemap(sitemapEntries, siteUrl), 'utf-8')

      console.log(
        `[prerender-plugin] Generated ${written.length} HTML pages + 404.html + sitemap.xml (${sitemapEntries.length} URLs)`
      )

      // ── 7. 自检：产物缺失/编码错误/重复 meta 都在这里拦住 ──
      // 这些错误不会让构建失败，但会让线上一片 404 或被搜索引擎重复收录，必须显式报错
      const { failures, notes } = verifyBuildOutput(distDir)
      if (process.env.VERBOSE_BUILD) {
        for (const n of notes) console.log(`[prerender-plugin]   · ${n}`)
      }
      if (failures.length > 0) {
        console.error(`\n[prerender-plugin] ❌ 构建产物自检失败 ${failures.length} 项：`)
        for (const f of failures) console.error(`  - ${f}`)
        throw new Error('构建产物自检未通过（详见上方列表）')
      }
      console.log('[prerender-plugin] ✅ 构建产物自检通过（路由文件 / 文章 slug / meta 唯一性 / sitemap / 资源路径）')
    },
  }
}

export type { BuildArticle }
