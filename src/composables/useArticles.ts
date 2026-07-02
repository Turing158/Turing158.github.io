import { ref } from 'vue'
import matter from 'gray-matter'
import { renderMarkdownAsync } from '@/utils/highlight'
import { useAppStore } from '@/stores/app'
import type { Article } from '@/types/article'
import localArticles from '@/generated/_articles-index'
import { developingProjects } from '@/data/projects'
import { config } from '@/config'
import { calculateReadingTime } from '@/composables/useReadingTime'
import {
  addBlankTargetToLinks,
  enhanceCodeBlocks,
} from '@/utils/htmlPostProcess'

const GITHUB_OWNER = config.github.owner
const GITHUB_REPO = config.github.repo

// 运行时 markdown 渲染的后处理（与构建时插件保持一致）
async function renderMarkdown(content: string): Promise<string> {
  let html = await renderMarkdownAsync(content)
  html = addBlankTargetToLinks(html)
  html = enhanceCodeBlocks(html)
  return html
}

// 内存缓存：会话级，避免重复 fetch
const htmlCache = new Map<string, string>()

function loadLocalArticles(): Article[] {
  // 为每篇文章计算阅读时间（html 不再预填，按需加载）
  return localArticles.map((article) => ({
    ...article,
    readingTime: calculateReadingTime(article.content),
  })) as Article[]
}

async function loadGitHubArticles(): Promise<Article[]> {
  if (!GITHUB_OWNER || !GITHUB_REPO) return []

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content`
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const files = (await res.json()) as { name: string; download_url: string }[]

  const mdFiles = files.filter((f) => f.name.endsWith('.md'))
  const articles: Article[] = []

  for (const file of mdFiles) {
    const raw = await fetch(file.download_url).then((r) => r.text())
    const { data, content } = matter(raw)
    const slug = file.name.replace(/\.md$/, '')

    // GitHub 文章没有预渲染 HTML，htmlFile 留空，
    // 首次阅读时由 loadArticleHtml 兜底渲染
    articles.push({
      slug,
      content,
      htmlFile: '',
      title: data.title || slug,
      date: typeof data.date === 'object' ? String(data.date) : (data.date || ''),
      tags: data.tags || [],
      description: data.description || '',
      cover: data.cover,
      readingTime: calculateReadingTime(content),
    })
  }

  articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return articles
}

/**
 * 按需加载单篇文章的渲染 HTML。
 *
 * 1. 优先从内存缓存返回
 * 2. 尝试 fetch 预渲染 HTML 文件（public/articles/<md5>.html）
 * 3. 兜底：从 content 运行时渲染（GitHub 文章或文件缺失）
 *
 * 加载成功后写入 Pinia store，触发下游组件更新。
 */
export async function loadArticleHtml(slug: string): Promise<string> {
  if (htmlCache.has(slug)) return htmlCache.get(slug)!

  const store = useAppStore()
  const article = store.articles.find((a) => a.slug === slug)
  if (!article) return ''

  // 1. 尝试 fetch 预渲染 HTML（本地文章）
  if (article.htmlFile) {
    try {
      const res = await fetch(`/articles/${article.htmlFile}`)
      if (res.ok) {
        const html = await res.text()
        htmlCache.set(slug, html)
        store.setArticleHtml(slug, html)
        return html
      }
    } catch {
      // 离线或网络错误，继续兜底
    }
  }

  // 2. 兜底：从 content 运行时渲染（GitHub 文章或文件缺失）
  if (article.content) {
    const html = await renderMarkdown(article.content)
    htmlCache.set(slug, html)
    store.setArticleHtml(slug, html)
    return html
  }

  return ''
}

export function useArticles() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const store = useAppStore()

  const fetchArticles = async (): Promise<Article[]> => {
    if (store.isArticlesCacheValid()) {
      return store.articles
    }

    loading.value = true
    error.value = null

    // 1. Always load local articles first (most reliable)
    const articles = loadLocalArticles()
    if (articles.length > 0) {
      store.setArticles(articles)
    }

    // 2. If GitHub is configured, also try to fetch from GitHub and merge
    if (GITHUB_OWNER && GITHUB_REPO) {
      try {
        const githubArticles = await loadGitHubArticles()
        if (githubArticles.length > 0) {
          const merged = new Map<string, Article>()
          for (const a of articles) merged.set(a.slug, a)
          for (const a of githubArticles) merged.set(a.slug, a)
          const result = Array.from(merged.values())
          result.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
          store.setArticles(result)
        }
      } catch (e: any) {
        console.warn('GitHub API fetch failed, using local articles:', e.message)
      }
    }

    loading.value = false
    return store.articles
  }

  // 从开发中项目动态获取仓库名列表
  const developingRepos = developingProjects
    .map((p) => {
      const match = p.url.match(/github\.com\/[^/]+\/([^/?#]+)/)
      return match ? match[1] : null
    })
    .filter(Boolean) as string[]

  const fetchRecentCommits = async () => {
    if (store.recentCommits.length > 0) return store.recentCommits
    if (!GITHUB_OWNER) return []

    try {
      const commits = await Promise.all(
        developingRepos.map(async (repo) => {
          try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?per_page=1`
            const res = await fetch(url)
            if (!res.ok) return null
            const data = (await res.json()) as any[]
            if (!data || data.length === 0) return null
            const commit = data[0]
            const fullMessage = commit.commit?.message || 'Update'
            const firstLine = fullMessage.split('\n')[0]
            return {
              repo,
              message: firstLine,
              fullMessage,
              date: commit.commit?.committer?.date || commit.commit?.author?.date || '',
              sha: commit.sha?.slice(0, 7) || '',
              url: commit.html_url || `https://github.com/${GITHUB_OWNER}/${repo}/commit/${commit.sha}`,
            }
          } catch {
            return null
          }
        })
      )
      const result = commits.filter(Boolean) as any[]
      store.setRecentCommits(result)
      return result
    } catch {
      return []
    }
  }

  return { loading, error, fetchArticles, fetchRecentCommits }
}
