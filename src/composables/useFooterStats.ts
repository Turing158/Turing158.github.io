import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useArticles } from '@/composables/useArticles'
import { getTotalViews } from '@/api/viewCount'

// 博客起始日期（用于计算运行天数）
const BLOG_START_DATE = new Date('2022-06-01')

/**
 * Footer 趣味统计 composable
 *
 * 提供以下动态数据：
 * - 博客运行天数
 * - 文章总数
 * - 总字数（中文字符 + 英文单词）
 * - 总浏览量（LeanCloud）
 * - 趣味换算：相当于喝了多少杯咖啡 / 能绕地球多少圈
 */
export function useFooterStats() {
  const store = useAppStore()
  const { fetchArticles } = useArticles()

  const totalViews = ref(0)
  const loadingViews = ref(false)

  // 运行天数（从博客起始日期算起）
  const runningDays = computed(() => {
    const now = new Date()
    const diff = now.getTime() - BLOG_START_DATE.getTime()
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))
  })

  // 文章总数
  const articleCount = computed(() => store.articles.length)

  // 总字数（中文字符 + 英文单词）
  const totalWords = computed(() => {
    const articles = store.articles
    if (articles.length === 0) return 0

    let count = 0
    for (const article of articles) {
      const content = article.content || ''
      // 统计中文字符
      const chineseChars = content.match(/[一-鿿]/g) || []
      // 统计英文单词（排除代码块中的内容）
      const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
      const englishWords = withoutCode.match(/[a-zA-Z]+/g) || []
      count += chineseChars.length + englishWords.length
    }
    return count
  })

  // 总阅读时间（分钟）
  const totalReadingMinutes = computed(() => {
    const articles = store.articles
    if (articles.length === 0) return 0
    return articles.reduce((sum, a) => sum + (a.readingTime || 0), 0)
  })

  // 趣味统计：阅读时间相当于多少杯咖啡（每杯咖啡 15 分钟）
  const coffeeCups = computed(() => {
    return Math.max(1, Math.round(totalReadingMinutes.value / 15))
  })

  // 趣味统计：所有文章首尾相接能绕操场多少圈（每圈 400 米，每字约 0.3 米）
  const playgroundLaps = computed(() => {
    const meters = totalWords.value * 0.3
    return (meters / 400).toFixed(1)
  })

  // 趣味统计：相当于多高的一本书（按每页 500 字算）
  const bookHeight = computed(() => {
    const pages = totalWords.value / 500
    const cm = pages * 0.1 // 每页约 0.1cm
    if (cm >= 100) return (cm / 100).toFixed(1) + ' m'
    return cm.toFixed(1) + ' cm'
  })

  // 获取总浏览量（从 Worker 代理获取）
  const fetchTotalViews = async () => {
    loadingViews.value = true
    try {
      totalViews.value = await getTotalViews()
    } catch {
      // 不可用时使用本地估算
      totalViews.value = store.articles.length * 42
    } finally {
      loadingViews.value = false
    }
  }

  // 确保文章已加载
  const ensureArticlesLoaded = async () => {
    if (store.articles.length === 0) {
      await fetchArticles()
    }
  }

  onMounted(async () => {
    await ensureArticlesLoaded()
    await fetchTotalViews()
  })

  return {
    runningDays,
    articleCount,
    totalWords,
    totalViews,
    totalReadingMinutes,
    coffeeCups,
    playgroundLaps,
    bookHeight,
    loadingViews,
  }
}
