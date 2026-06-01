export interface ArticleFrontmatter {
  title: string
  date: string
  tags: string[]
  description: string
  cover?: string
}

export interface Article extends ArticleFrontmatter {
  slug: string
  content: string
  html: string
}
