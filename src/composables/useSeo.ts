import { computed, unref, type MaybeRef } from 'vue'
import { useHead } from '@vueuse/head'
import { useI18n } from 'vue-i18n'
import { config } from '@/config'
import { absoluteUrl } from '@/utils/siteUrl'
import { buildJsonLd } from '@/utils/structuredData'

export interface SeoOptions {
  title?: MaybeRef<string>
  description?: MaybeRef<string>
  keywords?: MaybeRef<string[] | string>
  image?: MaybeRef<string | undefined>
  url?: MaybeRef<string>
  type?: MaybeRef<string>
  author?: MaybeRef<string>
  publishedTime?: MaybeRef<string>
  modifiedTime?: MaybeRef<string>
  tags?: MaybeRef<string[]>
  noIndex?: MaybeRef<boolean>
}

const SITE_URL = config.site.url
const DEFAULT_IMAGE = '/icons/icon-512.png'
const DEFAULT_DESCRIPTION = 'Turing_ICE 的个人博客，分享技术文章、开发工具和学习笔记'
const DEFAULT_KEYWORDS = ['博客', '技术', 'Vue', '前端', '开发']

export function useSeo(options: SeoOptions = {}) {
  const { locale } = useI18n()

  const title = computed(() => {
    const rawTitle = unref(options.title) || ''
    const { titleTemplate, title: blogTitle } = config.blog
    return titleTemplate
      .replace('{current_page}', rawTitle)
      .replace('{blog_title}', blogTitle)
  })

  const description = computed(() => unref(options.description) || DEFAULT_DESCRIPTION)

  const keywords = computed(() => {
    const kw = unref(options.keywords)
    if (!kw) return DEFAULT_KEYWORDS.join(', ')
    return Array.isArray(kw) ? kw.join(', ') : kw
  })

  const image = computed(() => {
    const img = unref(options.image)
    if (!img) return SITE_URL + DEFAULT_IMAGE
    if (img.startsWith('http')) return img
    return SITE_URL + img
  })

  // canonical / og:url：与构建时预渲染注入的值**必须逐字节一致**
  // （同一个 absoluteUrl 实现，逐段百分号编码，中文/空格/方括号 slug 不会漏编码）。
  // 旧实现用 `SITE_URL + '/' + path` 拼字符串，对 '' 产出 `https://site/`、
  // 对 '/article/x' 产出 `https://site//article/x`（双斜杠）。
  const url = computed(() => absoluteUrl(unref(options.url) || '/', SITE_URL))

  const type = computed(() => unref(options.type) || 'website')

  const author = computed(() => unref(options.author) || config.blog.author)

  const publishedTime = computed(() => unref(options.publishedTime) || '')

  const modifiedTime = computed(() => unref(options.modifiedTime) || '')

  const tags = computed(() => unref(options.tags) || [])

  const noIndex = computed(() => unref(options.noIndex) || false)

  // 构建 JSON-LD 结构化数据。
  // 与构建时预渲染共用 buildJsonLd：@unhead 按内容哈希匹配 script 标签，
  // 两侧算出的 JSON 必须逐字节一致，否则会留下两份 ld+json。
  const jsonLd = computed(() =>
    buildJsonLd({
      type: type.value as 'website' | 'article' | 'blog',
      title: title.value,
      description: description.value,
      url: url.value,
      siteUrl: SITE_URL,
      defaultImage: DEFAULT_IMAGE,
      blogTitle: config.blog.title,
      author: author.value,
      cover: unref(options.image),
      publishedTime: publishedTime.value,
      modifiedTime: modifiedTime.value,
      tags: tags.value,
    })
  )

  // 使用 @vueuse/head 设置 meta 标签
  useHead({
    title,
    meta: [
      // 基础 meta
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: author },

      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: config.blog.title },
      { property: 'og:locale', content: () => locale.value === 'zh-CN' ? 'zh_CN' : 'en_US' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:creator', content: '@turing_ice' },

      // 文章专用 OG 标签
      ...(type.value === 'article'
        ? [
            { property: 'article:author', content: author },
            { property: 'article:published_time', content: publishedTime },
            { property: 'article:modified_time', content: modifiedTime },
            ...(tags.value.map((tag) => ({ property: 'article:tag', content: tag }))),
          ]
        : []),

      // Robots
      { name: 'robots', content: noIndex.value ? 'noindex, nofollow' : 'index, follow' },
      { name: 'googlebot', content: noIndex.value ? 'noindex, nofollow' : 'index, follow' },

      // 移动端优化
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'theme-color', content: '#4a7c59' },
    ],
    link: [
      { rel: 'canonical', href: url },
    ],
    script: [
      {
        type: 'application/ld+json',
        children: jsonLd,
      },
    ],
  })

  return {
    title,
    description,
    image,
    url,
    jsonLd,
  }
}

/**
 * 为文章页设置 SEO
 *
 * `article` 可为 null（文章尚未加载时），所有字段安全降级为默认值。
 */
export function useArticleSeo(article: MaybeRef<{ title: string; description: string; date: string; tags: string[]; cover?: string; slug: string } | null>) {
  const a = computed(() => unref(article))

  return useSeo({
    title: computed(() => a.value?.title || ''),
    description: computed(() => a.value?.description || ''),
    image: computed(() => a.value?.cover),
    url: computed(() => `/article/${a.value?.slug || ''}`),
    type: 'article',
    publishedTime: computed(() => a.value?.date || ''),
    modifiedTime: computed(() => a.value?.date || ''),
    tags: computed(() => a.value?.tags || []),
  })
}

/**
 * 为列表页设置 SEO
 */
export function usePageSeo(title: MaybeRef<string>, description?: MaybeRef<string>, url?: MaybeRef<string>) {
  return useSeo({
    title,
    description: description || DEFAULT_DESCRIPTION,
    url: url || '',
    type: 'website',
  })
}
