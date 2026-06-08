/**
 * 搜索 composable
 * 跨文章（articles）、项目（projects）、发行版（releases）进行文本搜索
 * 由 SearchDialog 调用
 *
 * 文章搜索使用 Fuse.js 实现模糊匹配 + 相关度排序
 * 项目/发行版使用简单 includes（数据量小，无需索引）
 */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useArticles } from '@/composables/useArticles'
import { useReleases } from '@/composables/useReleases'
import { useSearchIndex } from '@/composables/useSearchIndex'
import { categories as projectCategories } from '@/data/projects'
import type { SearchResult, ArticleResult, ProjectResult, ReleaseResult } from '@/types/search'
import type { Project } from '@/data/projects'

/** 搜索结果类型筛选 */
export type SearchTab = 'all' | 'article' | 'project' | 'release'

/** 带分数的搜索结果（内部排序用） */
interface ScoredResult {
  result: SearchResult
  score: number
}

export function useSearch() {
  const store = useAppStore()
  const { articles } = storeToRefs(store)
  const { fetchArticles } = useArticles()
  const { releases, fetchReleases } = useReleases()
  const { build: buildIndex, search: fuseSearch } = useSearchIndex()

  const query = ref('')
  const loading = ref(false)
  const dataReady = ref(false)
  const activeTab = ref<SearchTab>('all')

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

    const matched: ScoredResult[] = []

    // --- 搜索文章（Fuse.js 模糊匹配） ---
    const fuseResults = fuseSearch(q)
    for (const { item, score } of fuseResults) {
      matched.push({
        result: {
          type: 'article',
          id: item.slug,
          title: item.title,
          description: item.description,
          date: item.date,
          tags: item.tags ?? [],
          slug: item.slug,
        } as ArticleResult,
        score: score ?? 999,
      })
    }

    // --- 搜索项目 ---
    for (const proj of allProjects.value) {
      const searchText = [proj.name, proj.description, ...(proj.tech ?? [])]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) {
        matched.push({
          result: {
            type: 'project',
            id: proj.name,
            name: proj.name,
            description: proj.description,
            tech: proj.tech ?? [],
            url: proj.url,
          } as ProjectResult,
          score: 999,
        })
      }
    }

    // --- 搜索发行版 ---
    for (const rel of releases.value) {
      const searchText = [rel.repo, rel.tag_name, rel.author.login]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) {
        matched.push({
          result: {
            type: 'release',
            id: rel.repo,
            repo: rel.repo,
            tag_name: rel.tag_name,
            prerelease: rel.prerelease,
            published_at: rel.published_at,
            html_url: rel.html_url,
            author: rel.author,
            assets: rel.assets,
          } as ReleaseResult,
          score: 999,
        })
      }
    }

    // 按 score 排序（分数越低越匹配）
    matched.sort((a, b) => a.score - b.score)

    // 提取结果
    let filtered = matched.map(m => m.result)

    // 按类型筛选
    if (activeTab.value !== 'all') {
      filtered = filtered.filter(r => r.type === activeTab.value)
    }

    return filtered
  })

  // 各类型结果计数
  const counts = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return { all: 0, article: 0, project: 0, release: 0 }

    const fuseResults = fuseSearch(q)
    let projectCount = 0
    let releaseCount = 0

    for (const proj of allProjects.value) {
      const searchText = [proj.name, proj.description, ...(proj.tech ?? [])]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) projectCount++
    }

    for (const rel of releases.value) {
      const searchText = [rel.repo, rel.tag_name, rel.author.login]
        .join(' ')
        .toLowerCase()
      if (searchText.includes(q)) releaseCount++
    }

    return {
      all: fuseResults.length + projectCount + releaseCount,
      article: fuseResults.length,
      project: projectCount,
      release: releaseCount,
    }
  })

  // 弹窗打开时初始化数据（预加载 articles + releases）
  async function initialize() {
    if (dataReady.value) return
    loading.value = true
    try {
      await Promise.all([fetchArticles(), fetchReleases()])
      // 数据加载完成后构建 Fuse.js 索引
      buildIndex(articles.value)
      dataReady.value = true
    } finally {
      loading.value = false
    }
  }

  return { query, loading, results, counts, activeTab, dataReady, initialize }
}
