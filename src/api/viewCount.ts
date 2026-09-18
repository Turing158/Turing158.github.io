/**
 * 文章浏览量 API 模块
 *
 * 通过 Cloudflare Worker 代理请求 Supabase，
 * 缓存全量文章数据（slug、uuid、count），对外提供高层 API。
 */

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import SecretKeyInputDialog from '@/components/common/SecretKeyInputDialog.vue'
import blogTip from '@/plugins/blog-tip'
import zhCN from '@/i18n/locales/zh-CN.json'
import enUS from '@/i18n/locales/en-US.json'

// API 基址：浏览器直连后端绝对地址（后端为 Cloudflare Worker，CORS 白名单含站点域名）
// 优先从环境变量读取，未配置时使用默认地址
const API_BASE = import.meta.env.VITE_API_BASE
  ?? 'https://api.turing158.dpdns.org/article'

// ==================== 缓存结构 ====================

interface ArticleCacheItem {
  uuid: string  // Supabase 中的 id
  count: number
}

const articleCache = new Map<string, ArticleCacheItem>()
let cacheBuilt = false
let cacheBuilding = false
let cacheBuildPromise: Promise<void> | null = null

// ==================== 底层请求 ====================

async function request(path: string, body?: unknown, extraHeaders?: Record<string, string>) {
  let requestBody: string | undefined
  if (body !== undefined) {
    requestBody = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: requestBody,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json()
}

// ==================== 缓存管理 ====================

/**
 * 建立全量文章缓存（slug → { uuid, count }）
 */
async function buildCache(): Promise<void> {
  if (cacheBuilt) return
  if (cacheBuilding) return cacheBuildPromise!

  cacheBuilding = true
  cacheBuildPromise = (async () => {
    try {
      const data = await request('/find/all') as Array<{ id: string; slug: string; count: number }>

      for (const item of data) {
        articleCache.set(item.slug, { uuid: item.id, count: item.count })
      }

      cacheBuilt = true
    } catch {
      cacheBuilt = false
    } finally {
      cacheBuilding = false
    }
  })()

  return cacheBuildPromise
}

/**
 * 重置缓存
 */
export function resetCache(): void {
  articleCache.clear()
  cacheBuilt = false
  cacheBuilding = false
  cacheBuildPromise = null
}

// ==================== Secret Key 输入 ====================

// 为动态 Dialog 创建独立的 i18n 实例（与主应用隔离，避免冲突）
const dialogI18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('blog-lang') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

/**
 * 弹出 SecretKeyInputDialog 获取用户输入的 secret_key
 */
function requestSecretKey(): Promise<string | null> {
  return new Promise((resolve) => {
    const mountPoint = document.createElement('div')
    document.body.appendChild(mountPoint)

    const app = createApp(SecretKeyInputDialog, {
      onConfirm: (secretKey: string) => {
        app.unmount()
        mountPoint.remove()
        resolve(secretKey)
      },
      onCancel: () => {
        app.unmount()
        mountPoint.remove()
        resolve(null)
      },
    })
    app.use(dialogI18n)
    app.mount(mountPoint)
  })
}

// ==================== 内部辅助 ====================

/**
 * 创建新文章记录（仅本地开发环境）
 */
async function createRecord(slug: string): Promise<string> {
  // 仅在本地环境允许创建记录
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  if (!isLocal) {
    console.warn('[ViewCount] createRecord is only allowed in local environment')
    return ''
  }

  const secretKey = await requestSecretKey()
  if (!secretKey) {
    console.warn('[ViewCount] 用户取消输入 secret_key')
    return ''
  }

  try {
    const secretKeyBase64 = btoa(secretKey)
    const created = await request('/create', { article_slug: slug }, { secret_key: secretKeyBase64 }) as {
      id: string
      slug: string
      count: number
    }

    // 写入缓存
    articleCache.set(slug, { uuid: created.id, count: created.count })
    blogTip.show('文章记录创建成功', { type: 'success' })
    return created.id
  } catch (err: any) {
    blogTip.show('创建失败: ' + err.message, { type: 'error' })
    throw err
  }
}

// ==================== 高层 API ====================

/**
 * 获取单篇文章浏览量（内存读取，零网络请求）
 */
export async function getViewCount(slug: string): Promise<number> {
  try {
    if (!articleCache.has(slug)) {
      await buildCache()
    }
    return articleCache.get(slug)?.count ?? 0
  } catch (err: any) {
    console.error('[ViewCount] 获取浏览量失败:', err.message)
    return 0
  }
}

/**
 * 递增文章浏览量
 */
export async function incrementViewCount(slug: string): Promise<number> {
  try {
    // 确保缓存已初始化
    await buildCache()

    let cached = articleCache.get(slug)
    if (!cached) {
      // 缓存中不存在，创建新记录
      await createRecord(slug)
      cached = articleCache.get(slug)
      if (!cached) return 0
    }

    const record = await request('/view', { article_id: cached.uuid }) as {
      id: string
      slug: string
      count: number
    }

    // 同步更新缓存
    articleCache.set(slug, { uuid: cached.uuid, count: record.count })
    return record.count
  } catch (err: any) {
    console.error('[ViewCount] 增加浏览量失败:', err.message)
    return 0
  }
}

/**
 * 批量获取文章浏览量（内存读取，零网络请求）
 */
export async function getViewCounts(slugs: string[]): Promise<Record<string, number>> {
  try {
    await buildCache()

    const counts: Record<string, number> = {}
    for (const slug of slugs) {
      const cached = articleCache.get(slug)
      if (cached) {
        counts[slug] = cached.count
      }
    }
    return counts
  } catch (err: any) {
    console.error('[ViewCounts] 批量获取浏览量失败:', err.message)
    return {}
  }
}

/**
 * 获取所有文章的总浏览量
 */
export async function getTotalViews(): Promise<number> {
  try {
    const total = await request('/sum/count') as number
    return total
  } catch (err: any) {
    console.error('[ViewCount] 获取总浏览量失败:', err.message)
    return 0
  }
}
