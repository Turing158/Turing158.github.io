import { ref, onMounted, watch } from 'vue'
import { getViewCount, incrementViewCount, getViewCounts } from '@/api/viewCount'

// 缓存浏览量，避免重复请求
const viewCountCache = new Map()

/**
 * 获取文章浏览量
 */
export function useViewCount(slug: string) {
  const viewCount = ref(0)
  const loading = ref(false)

  const fetchViewCount = async () => {
    // 检查缓存
    if (viewCountCache.has(slug)) {
      viewCount.value = viewCountCache.get(slug)
      return
    }

    loading.value = true
    try {
      const count = await getViewCount(slug)
      viewCount.value = count
      viewCountCache.set(slug, count)
    } finally {
      loading.value = false
    }
  }

  const increment = async () => {
    try {
      const count = await incrementViewCount(slug)
      viewCount.value = count
      viewCountCache.set(slug, count)
    } catch {
      // 静默处理
    }
  }

  onMounted(() => {
    // 进入文章时直接调用 view 接口（递增并返回最新值）
    void increment()
  })

  return {
    viewCount,
    loading,
    fetchViewCount,
    incrementViewCount: increment,
  }
}

/**
 * 批量获取多篇文章的浏览量
 * @param slugsGetter - 返回 slug 数组的函数（用于响应式追踪）
 */
export function useViewCounts(slugsGetter: () => string[]) {
  const counts = ref<Record<string, number>>({})
  const loading = ref(false)

  const fetchAllCounts = async () => {
    const slugs = slugsGetter()
    if (!slugs || slugs.length === 0) return
    loading.value = true
    try {
      const result = await getViewCounts(slugs)
      counts.value = result
      for (const [slug, count] of Object.entries(result)) {
        viewCountCache.set(slug, count)
      }
    } finally {
      loading.value = false
    }
  }

  // 监听 slugs 变化，有数据时自动获取
  watch(slugsGetter, (newSlugs) => {
    if (newSlugs && newSlugs.length > 0) {
      void fetchAllCounts()
    }
  }, { immediate: true })

  return {
    counts,
    loading,
    fetchAllCounts,
  }
}
