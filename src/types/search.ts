/**
 * 搜索功能的统一类型定义
 * 供 useSearch、SearchCard、SearchDialog 和 useReleases 使用
 */

// 发行版（与 ReleasesView 使用的结构一致）
export interface Release {
  repo: string
  tag_name: string
  prerelease: boolean
  published_at: string
  html_url: string
  author: ReleaseAuthor
  assets: ReleaseAsset[]
}

export interface ReleaseAuthor {
  login: string
  avatar_url: string
  html_url: string
}

export interface ReleaseAsset {
  browser_download_url: string
}

// 文章搜索结果
export interface ArticleResult {
  type: 'article'
  id: string // = slug
  title: string
  description: string
  date: string
  tags: string[]
  slug: string
}

// 项目搜索结果
export interface ProjectResult {
  type: 'project'
  id: string // = name
  name: string
  description: string
  tech: string[]
  url: string
}

// 发行版搜索结果
export interface ReleaseResult {
  type: 'release'
  id: string // = repo
  repo: string
  tag_name: string
  prerelease: boolean
  published_at: string
  html_url: string
  author: ReleaseAuthor
  assets: ReleaseAsset[]
}

// 统一搜索结果类型
export type SearchResult = ArticleResult | ProjectResult | ReleaseResult
