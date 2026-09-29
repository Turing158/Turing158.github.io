/**
 * 结构化数据（JSON-LD）构造
 *
 * 运行时（useSeo）与构建时（prerender-plugin）**共用同一实现**。
 *
 * ⚠️ 这不是为了少写几行：@unhead 接管 head 时按「内容哈希」匹配 script 标签
 * （`hashTag` = tag 名 + innerHTML + props 的哈希），一旦构建时注入的 JSON-LD
 * 与运行时算出来的不一致，就会**同时留下两份** <script type="application/ld+json">。
 * 因此调用方必须传入与运行时完全相同的 title / description / url 等入参。
 *
 * 纯函数、无 Vue 依赖，可被 Node 侧的构建插件直接 import。
 */

export interface JsonLdInput {
  type: 'website' | 'article' | 'blog'
  /** 完整标题（已套用标题模板），与运行时 `useSeo` 的 title 一致 */
  title: string
  description: string
  /** 绝对 URL */
  url: string
  /** 站点根地址，不带尾斜杠 */
  siteUrl: string
  /** 站点默认图，拼相对路径用 */
  defaultImage: string
  /** 博客名，作为 publisher / name */
  blogTitle: string
  /** 作者名 */
  author: string
  /** 封面（可为相对路径或绝对 URL，可空） */
  cover?: string
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
}

/** 与 useSeo 的 image 计算保持一致：相对路径补站点前缀 */
export function resolveImage(cover: string | undefined, siteUrl: string, defaultImage: string): string {
  if (!cover) return siteUrl + defaultImage
  if (cover.startsWith('http')) return cover
  return siteUrl + cover
}

export function buildJsonLd(input: JsonLdInput): string {
  const { type, title, description, url, siteUrl, defaultImage, blogTitle, author } = input
  const data: Record<string, any> = { '@context': 'https://schema.org' }

  if (type === 'article') {
    data['@type'] = 'Article'
    data.headline = title
    data.description = description
    data.image = resolveImage(input.cover, siteUrl, defaultImage)
    data.author = { '@type': 'Person', name: author, url: siteUrl }
    data.publisher = {
      '@type': 'Organization',
      name: blogTitle,
      logo: { '@type': 'ImageObject', url: siteUrl + defaultImage },
    }
    if (input.publishedTime) data.datePublished = input.publishedTime
    if (input.modifiedTime) data.dateModified = input.modifiedTime
    if (input.tags?.length) data.keywords = input.tags.join(', ')
    data.mainEntityOfPage = { '@type': 'WebPage', '@id': url }
  } else if (type === 'blog') {
    data['@type'] = 'Blog'
    data.name = title
    data.description = description
    data.url = url
  } else {
    data['@type'] = 'WebSite'
    data.name = title
    data.description = description
    data.url = url
    // 不输出 SearchAction：站点没有 /search 路由（搜索是弹窗 SearchDialog），
    // 声明一个不存在的 target 会让 Rich Results 报「目标无效」。
  }

  return JSON.stringify(data)
}
