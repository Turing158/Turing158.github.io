/**
 * 搜索 composable
 * 跨文章（articles）、项目（projects）、发行版（releases）进行文本搜索
 * 由 SearchDialog 调用
 */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useArticles } from '@/composables/useArticles'
import { useReleases } from '@/composables/useReleases'
import { categories as projectCategories } from '@/data/projects'
import type { SearchResult, ArticleResult, ProjectResult, ReleaseResult } from '@/types/search'
import type { Project } from '@/data/projects'

export function useSearch() {
  const store = useAppStore()
  const { articles } = storeToRefs(store)
  const { fetchArticles } = useArticles()
  const { releases, fetchReleases } = useReleases()

  const query = ref('')
  const loading = ref(false)
  const dataReady = ref(false)

  // 扁平化所有项目（去重：按 name）
  const allProjects = computed<Project[]>(() => {
    const seen = new Set<string>()
    const flat: Project[] = []
    for (const cat of projectCategories) {
      for (const proj of cat.projects) {
        if (!seen.has(proj.name)) {
          seen.add(proj.name)
          flat.push(proj)
        }
      }
    }
    return flat
  })

  // 搜索结果：实时响应 query 变化
  const results = computed<SearchResult[]>(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []

    const matched: SearchResult[] = []

    // --- 搜索文章 ---
    for (const article of articles.value) {
      const searchText = [
        article.title,
        article.description,
        ...(article.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) {
        matched.push({
          type: 'article',
          id: article.slug,
          title: article.title,
          description: article.description,
          date: article.date,
          tags: article.tags ?? [],
          slug: article.slug,
        } as ArticleResult)
      }
    }

    // --- 搜索项目 ---
    for (const proj of allProjects.value) {
      const searchText = [proj.name, proj.description, ...(proj.tech ?? [])]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) {
        matched.push({
          type: 'project',
          id: proj.name,
          name: proj.name,
          description: proj.description,
          tech: proj.tech ?? [],
          url: proj.url,
        } as ProjectResult)
      }
    }

    // --- 搜索发行版 ---
    for (const rel of releases.value) {
      const searchText = [rel.repo, rel.tag_name, rel.author.login]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) {
        matched.push({
          type: 'release',
          id: rel.repo,
          repo: rel.repo,
          tag_name: rel.tag_name,
          prerelease: rel.prerelease,
          published_at: rel.published_at,
          html_url: rel.html_url,
          author: rel.author,
          assets: rel.assets,
        } as ReleaseResult)
      }
    }

    return matched
  })

  // 弹窗打开时初始化数据（预加载 articles + releases）
  async function initialize() {
    if (dataReady.value) return
    loading.value = true
    try {
      await Promise.all([fetchArticles(), fetchReleases()])
      dataReady.value = true
    } finally {
      loading.value = false
    }
  }

  return { query, loading, results, dataReady, initialize }
}
