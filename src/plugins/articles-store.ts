/**
 * 文章数据（构建时单一事实来源）
 *
 * articles-plugin 扫描 `content/*.md` 后把结果存进这里，供后续阶段复用：
 *   - articles-plugin：写 `src/generated/_articles-index.ts` 与 `public/articles/<md5>.html`
 *   - prerender-plugin：为每篇文章产出 `dist/article/<slug>/index.html`，并写入 sitemap
 *
 * 放在独立模块而非 articles-plugin 内部，是因为 Vite 插件的 `configResolved` 与
 * `closeBundle` 之间存在时序耦合，而 prerender-plugin 又必须排在 articles-plugin
 * 之后运行 —— 用模块级单例传递数据比依赖插件实例引用更直观。
 */

export interface BuildArticle {
  slug: string
  /** 渲染后的正文 HTML（含代码块复制按钮、外链 target） */
  html: string
  /** Markdown 原文，用于生成索引与阅读时间 */
  content: string
  title: string
  /** ISO 字符串；YAML 日期在解析阶段已归一化 */
  date: string
  tags: string[]
  description: string
  cover?: string
  /** md5(slug) + '.html'，指向 public/articles/ 下的正文片段 */
  htmlFile?: string
}

let articles: BuildArticle[] = []

export function setBuildArticles(next: BuildArticle[]): void {
  articles = next
}

export function getBuildArticles(): BuildArticle[] {
  return articles
}
