import { ref, onMounted } from 'vue'
import AV from 'leancloud-storage'
import { config } from '@/config'

// 初始化 LeanCloud
const initLeanCloud = () => {
  AV.init({
    appId: config.leancloud.appId,
    appKey: config.leancloud.appKey,
    serverURL: config.leancloud.serverURL,
  })
}

// 确保只初始化一次
let initialized = false
const ensureInit = () => {
  if (!initialized) {
    initLeanCloud()
    initialized = true
  }
}

// 缓存浏览量，避免重复请求
const viewCountCache = new Map<string, number>()

/**
 * 获取文章浏览量
 * 使用 LeanCloud 作为后端存储
 */
export function useViewCount(slug: string) {
  const viewCount = ref<number>(0)
  const loading = ref(false)

  const fetchViewCount = async () => {
    // 检查缓存
    if (viewCountCache.has(slug)) {
      viewCount.value = viewCountCache.get(slug)!
      return
    }

    loading.value = true
    ensureInit()

    try {
      const query = new AV.Query('ArticleViewCount')
      query.equalTo('slug', slug)
      const result = await query.first()

      if (result) {
        const count = result.get('count') || 0
        viewCount.value = count
        viewCountCache.set(slug, count)
      } else {
        viewCount.value = 0
        viewCountCache.set(slug, 0)
      }
    } catch (err: any) {
      console.error('[ViewCount] 获取浏览量失败:', err.message)
      viewCount.value = 0
    } finally {
      loading.value = false
    }
  }

  const incrementViewCount = async () => {
    ensureInit()

    try {
      const query = new AV.Query('ArticleViewCount')
      query.equalTo('slug', slug)
      const result = await query.first()

      if (result) {
        // 已存在，增加计数
        const currentCount = result.get('count') || 0
        result.set('count', currentCount + 1)
        await result.save()
        viewCount.value = currentCount + 1
      } else {
        // 不存在，创建新记录
        const ArticleViewCount = AV.Object.extend('ArticleViewCount')
        const newRecord = new ArticleViewCount()
        newRecord.set('slug', slug)
        newRecord.set('count', 1)
        await newRecord.save()
        viewCount.value = 1
      }

      // 更新缓存
      viewCountCache.set(slug, viewCount.value)
    } catch (err: any) {
      console.error('[ViewCount] 增加浏览量失败:', err.message)
    }
  }

  onMounted(() => {
    fetchViewCount()
  })

  return {
    viewCount,
    loading,
    fetchViewCount,
    incrementViewCount,
  }
}

/**
 * 批量获取多篇文章的浏览量
 */
export function useViewCounts(slugs: string[]) {
  const counts = ref<Record<string, number>>({})
  const loading = ref(false)

  const fetchAllCounts = async () => {
    loading.value = true
    ensureInit()

    try {
      const query = new AV.Query('ArticleViewCount')
      query.containedIn('slug', slugs)
      const results = await query.find()

      const countMap: Record<string, number> = {}
      for (const item of results) {
        const slug = item.get('slug')
        const count = item.get('count') || 0
        countMap[slug] = count
      }

      // 填充未找到的记录为 0
      for (const slug of slugs) {
        if (!(slug in countMap)) {
          countMap[slug] = 0
        }
      }

      counts.value = countMap

      // 更新缓存
      for (const [slug, count] of Object.entries(countMap)) {
        viewCountCache.set(slug, count)
      }
    } catch (err: any) {
      console.error('[ViewCounts] 批量获取浏览量失败:', err.message)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void slugs
    fetchAllCounts()
  })

  return {
    counts,
    loading,
    fetchAllCounts,
  }
}
