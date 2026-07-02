import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Article } from '@/types/article'

export const useAppStore = defineStore('app', () => {
  const articles = ref<Article[]>([])
  const articlesLoadedAt = ref<number>(0)
  const recentCommits = ref<any[]>([])

  const ARTICLES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  const isArticlesCacheValid = (): boolean => {
    if (articles.value.length === 0) return false
    return Date.now() - articlesLoadedAt.value < ARTICLES_CACHE_TTL
  }

  const setArticles = (data: Article[]) => {
    articles.value = data
    articlesLoadedAt.value = Date.now()
  }

  const setRecentCommits = (data: any[]) => {
    recentCommits.value = data
  }

  // 按需加载 HTML 后回填到 store，触发下游组件更新
  const setArticleHtml = (slug: string, html: string) => {
    const target = articles.value.find((a) => a.slug === slug)
    if (target) {
      target.html = html
    }
  }

  return {
    articles,
    articlesLoadedAt,
    recentCommits,
    isArticlesCacheValid,
    setArticles,
    setRecentCommits,
    setArticleHtml,
  }
})
