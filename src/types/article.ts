export interface ArticleFrontmatter {
  title: string
  date: string
  tags: string[]
  description: string
  cover?: string
}

/**
 * 文章完整元数据（构建时生成 + 运行时按需加载 html）
 *
 * - 构建时产物（_articles-index.ts）填充 slug、content、html 不含渲染 HTML
 * - htmlFile 指向 public/articles/<md5(slug)>.html，运行时按需 fetch
 * - html 在首次阅读后由 composable 填入，未加载前为 undefined
 * - readingTime 在列表加载时由 useReadingTime 计算后填入
 */
export interface ArticleMeta extends ArticleFrontmatter {
  slug: string
  content: string          // 原始 Markdown（搜索、阅读时间、页脚统计）
  htmlFile: string         // md5(slug) + '.html'，按需加载入口
  html?: string            // 运行时填充，未加载前 undefined
  readingTime?: number
}

/**
 * 向后兼容旧类型别名。
 * 使用 Article 的地方默认已获取由本接口描述的 shape。
 */
export type Article = ArticleMeta
