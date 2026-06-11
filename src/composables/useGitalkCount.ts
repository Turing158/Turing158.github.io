import { ref, onMounted } from 'vue'
import axios from 'axios'
import { config } from '@/config'

// 缓存评论计数，避免重复请求
const commentCountCache = new Map<string, number>()

/**
 * 获取 Gitalk 评论数
 * 通过 GitHub Issues API 获取对应文章的评论数量
 */
export function useGitalkCount(slug: string) {
  const commentCount = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCommentCount = async () => {
    // 检查缓存
    if (commentCountCache.has(slug)) {
      commentCount.value = commentCountCache.get(slug)!
      return
    }

    loading.value = true
    error.value = null

    try {
      // Gitalk 使用 GitHub Issues 存储评论
      // 通过 GitHub API 获取 issue 的评论数
      const repo = config.github.repo
      const owner = config.github.owner

      // 构建搜索查询，查找对应 slug 的 issue
      // Gitalk 的 issue id 就是文章的 slug
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          params: {
            labels: 'gitalk',
            state: 'all',
            per_page: 100,
          },
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      // 查找匹配的 issue
      const issue = response.data.find((item: any) => {
        // Gitalk 在 issue body 中包含文章 slug
        return item.body?.includes(slug) || item.title?.includes(slug)
      })

      if (issue) {
        const count = issue.comments || 0
        commentCount.value = count
        commentCountCache.set(slug, count)
      } else {
        commentCount.value = 0
        commentCountCache.set(slug, 0)
      }
    } catch (err: any) {
      console.error('[GitalkCount] 获取评论数失败:', err.message)
      error.value = err.message
      commentCount.value = null
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchCommentCount()
  })

  return {
    commentCount,
    loading,
    error,
    fetchCommentCount,
  }
}

/**
 * 批量获取多篇文章的评论数
 */
export function useGitalkCounts(slugs: string[]) {
  const counts = ref<Record<string, number>>({})
  const loading = ref(false)

  const fetchAllCounts = async () => {
    loading.value = true

    try {
      const repo = config.github.repo
      const owner = config.github.owner

      // 获取所有 gitalk 标签的 issues
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        {
          params: {
            labels: 'gitalk',
            state: 'all',
            per_page: 100,
          },
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      // 构建 slug -> comments 的映射
      const countMap: Record<string, number> = {}

      for (const issue of response.data) {
        // 从 issue body 中提取 slug
        const body = issue.body || ''
        const match = body.match(/slug:\s*([^\s\n]+)/i)
        if (match) {
          const slug = match[1]
          countMap[slug] = issue.comments || 0
        }
      }

      counts.value = countMap
    } catch (err: any) {
      console.error('[GitalkCounts] 批量获取评论数失败:', err.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    // slugs 参数用于未来扩展，目前不需要使用
    void slugs
    fetchAllCounts()
  })

  return {
    counts,
    loading,
    fetchAllCounts,
  }
}
