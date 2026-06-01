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

  return {
    articles,
    articlesLoadedAt,
    recentCommits,
    isArticlesCacheValid,
    setArticles,
    setRecentCommits,
  }
})
