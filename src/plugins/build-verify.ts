/**
 * 构建产物自检
 *
 * 由 `prerender-plugin` 在写完全部产物后调用（**必须放在源码目录里**：
 * `.gitignore` 忽略了 `/scripts`，把自检放在那里会导致 CI 上文件不存在）。
 *
 * 覆盖 history 路由 + 预渲染迁移中最容易「静默出错」的四点 ——
 * 它们都不会让构建失败，但会让线上一片 404 或让搜索引擎重复收录：
 *
 *   1. 深层路由的真实文件缺失（GitHub Pages 不会回退到 index.html → 404）
 *   2. 文章目录名被写成了百分号编码（GH Pages 先解码再查文件 → 反而不匹配）
 *   3. 预渲染注入的 meta 未被 @unhead 复用（同一属性出现两份）
 *   4. sitemap 的 <loc> 含裸空格/方括号等非法字符，或残留 `#/` 旧地址
 *
 * 纯 Node 实现，无外部依赖。
 */

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export interface VerifyResult {
  failures: string[]
  notes: string[]
}

/** 静态路由 → 该页正文里必须出现的片段（用于确认返回的是「对应页面」而非首页兜底） */
const STATIC_ROUTE_EXPECTATIONS: Array<[string, string]> = [
  ['index.html', '<h1>主页</h1>'],
  ['articles/index.html', '<h1>文章</h1>'],
  ['projects/index.html', '<h1>项目</h1>'],
  ['releases/index.html', '<h1>发行</h1>'],
  ['tools/index.html', '<h1>工具</h1>'],
  ['achievements/index.html', '成就'],
  ['friends/index.html', '友情链接'],
  ['about/index.html', '<h1>关于</h1>'],
  // /commits 的可见 <h1> 是仓库名（CommitsView 渲染 {{ repoName }}，无参时回退默认仓库）
  ['commits/index.html', '<h1>StarFall-Minecraft-Launcher</h1>'],
  ['sfmc/index.html', 'StarFall'],
  ['starfall-forum/index.html', 'StarFall'],
  ['sfmc-jar/index.html', 'Java'],
  ['tools/jsonFormatter/index.html', '<h1>'],
  ['release/SFMC/index.html', '<h1>'],
]

/** 预渲染页里每类 meta 必须恰好出现 1 次 */
const UNIQUE_META: Array<[string, RegExp]> = [
  ['<title>', /<title[ >]/g],
  ['meta[name=description]', /<meta\s+name="description"/g],
  ['link[rel=canonical]', /<link\s+rel="canonical"/g],
  ['meta[property=og:title]', /<meta\s+property="og:title"/g],
  ['meta[property=og:url]', /<meta\s+property="og:url"/g],
  ['meta[name=robots]', /<meta\s+name="robots"/g],
  ['application/ld+json', /<script type="application\/ld\+json">/g],
]

export function verifyBuildOutput(distDir: string): VerifyResult {
  const failures: string[] = []
  const notes: string[] = []
  const raw = (rel: string) => readFileSync(join(distDir, rel), 'utf-8')

  const expectFile = (rel: string, needles?: string[]): string | null => {
    const full = join(distDir, rel)
    if (!existsSync(full)) {
      failures.push(`缺少文件：${rel}`)
      return null
    }
    const html = raw(rel)
    for (const needle of needles ?? []) {
      if (!html.includes(needle)) failures.push(`${rel} 正文未包含 ${JSON.stringify(needle)}`)
    }
    return html
  }

  // ── 1. 静态路由的真实文件 ──
  for (const [rel, needle] of STATIC_ROUTE_EXPECTATIONS) expectFile(rel, [needle])

  // ── 2. 错误页：文件存在且带 noindex（真实 404 状态码由托管方给出） ──
  expectFile('404.html', ['noindex, nofollow'])
  expectFile('not-found/index.html', ['noindex, nofollow'])

  // ── 3. 文章页：目录名必须是原始 slug ──
  const articleDir = join(distDir, 'article')
  if (!existsSync(articleDir)) {
    failures.push('缺少 dist/article/ 目录')
  } else {
    const dirs = readdirSync(articleDir)
    if (dirs.length === 0) failures.push('dist/article/ 下没有任何文章目录')

    // GH Pages 先把请求路径解码再查文件：磁盘上若是编码名，浏览器请求解码后反而不匹配
    const encodedDir = dirs.find((d) => /%[0-9A-Fa-f]{2}/.test(d))
    if (encodedDir) failures.push(`文章目录名疑似百分号编码（应为原始 slug）：${encodedDir}`)

    // 至少要有一个含中文的目录，证明中文 slug 的编码/解码链路真的被走到
    if (!dirs.some((d) => /[\u4e00-\u9fff]/.test(d))) {
      failures.push('没有含中文的文章目录 —— 中文 slug 路径未被覆盖')
    }

    for (const dir of dirs) {
      const html = expectFile(join('article', dir, 'index.html'), ['<h1>'])
      if (!html) continue
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
      if (!canonical) {
        failures.push(`article/${dir} 缺少 canonical`)
        continue
      }
      if (/[[\] ]/.test(canonical.replace(/%5B|%5D|%20/gi, ''))) {
        failures.push(`article/${dir} canonical 含非法字符：${canonical}`)
      }
    }
    notes.push(`文章页 ${dirs.length} 个，目录名均为原始 slug`)
  }

  // ── 4. meta 唯一性（预渲染注入的标签必须被 @unhead 复用） ──
  for (const rel of [
    'index.html',
    'articles/index.html',
    'about/index.html',
    'tools/jsonFormatter/index.html',
  ]) {
    if (!existsSync(join(distDir, rel))) continue
    const html = raw(rel)
    for (const [name, re] of UNIQUE_META) {
      const count = (html.match(re) || []).length
      if (count !== 1) failures.push(`${rel} 的 ${name} 出现 ${count} 次（应为 1 次）`)
    }
  }

  // ── 5. sitemap 合法性 ──
  if (!existsSync(join(distDir, 'sitemap.xml'))) {
    failures.push('缺少 sitemap.xml')
  } else {
    const xml = raw('sitemap.xml')
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
    if (locs.length === 0) failures.push('sitemap 中没有任何 <loc>')

    const illegal = locs.filter((l) => /[ <>[\]{}|\\^"`]/.test(l))
    if (illegal.length) {
      failures.push(`sitemap 含非法 URL（裸空格/方括号等）：${illegal.slice(0, 3).join(', ')}`)
    }
    if (locs.some((l) => l.includes('#/'))) failures.push('sitemap 里仍残留 hash 路由 URL')
    if (locs.some((l) => l.includes('/not-found') || l.includes('/error'))) {
      failures.push('sitemap 不应包含 noindex 错误页')
    }

    // canonical 与 sitemap 必须用同一套拼接规则（同一编码函数）——用文章 URL 抽样比对
    const articleLoc = locs.find((l) => l.includes('/article/'))
    if (articleLoc && existsSync(articleDir)) {
      const encodedSlug = articleLoc.split('/article/')[1]
      const matched = readdirSync(articleDir).some((d) => encodeURIComponent(d) === encodedSlug)
      if (!matched) failures.push(`sitemap 的文章 URL 与磁盘目录对不上：${articleLoc}`)
      else notes.push('sitemap 与磁盘文章目录编码一致')
    }
    notes.push(`sitemap ${locs.length} 条 URL`)
  }

  // ── 6. 资源必须是绝对路径（相对路径会随深层 URL 解析成 /article/x/assets/...） ──
  for (const rel of ['index.html', 'articles/index.html']) {
    if (!existsSync(join(distDir, rel))) continue
    const html = raw(rel)
    const relative = [...html.matchAll(/(?:src|href)="(\.\/[^"]*)"/g)].map((m) => m[1])
    if (relative.length) {
      failures.push(`${rel} 含相对资源路径（会随深层 URL 解析错误）：${relative.slice(0, 3).join(', ')}`)
    }
    if (!/src="\/assets\//.test(html)) failures.push(`${rel} 的入口脚本不是绝对路径 /assets/`)
  }

  return { failures, notes }
}
