/**
 * 文章浏览量 API 模块
 *
 * 通过 Cloudflare Worker 代理请求 LeanCloud，
 * 维护 slug ↔ objectId 映射缓存，对外提供高层 API。
 */

const API_BASE = 'https://api.turing158.dpdns.org/leancloud'

// ==================== 映射缓存 ====================

const slugToObjectMap = new Map<string, string>()
const objectToSlugMap = new Map<string, string>()
let mappingBuilt = false
let mappingBuilding = false
let mappingPromise: Promise<void> | null = null

// ==================== 底层请求 ====================

async function request(path: string, body?: unknown) {
  // /find 接口：空 body 传 undefined（查全部），数组直接传
  let requestBody: string | undefined
  if (path === '/find' && body === undefined) {
    requestBody = undefined
  } else if (body !== undefined) {
    requestBody = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: requestBody,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json()
}

// ==================== 映射管理 ====================

/**
 * 建立 slug ↔ objectId 映射
 */
async function buildMapping(): Promise<void> {
  if (mappingBuilt) return
  if (mappingBuilding) return mappingPromise!

  mappingBuilding = true
  mappingPromise = (async () => {
    try {
      const data = await request('/find') as { results?: Array<{ slug: string; objectId: string }> }
      const results = data.results || []

      for (const item of results) {
        slugToObjectMap.set(item.slug, item.objectId)
        objectToSlugMap.set(item.objectId, item.slug)
      }

      mappingBuilt = true
    } catch {
      mappingBuilt = false
    } finally {
      mappingBuilding = false
    }
  })()

  return mappingPromise
}

/**
 * 重置映射缓存
 */
export function resetMapping(): void {
  slugToObjectMap.clear()
  objectToSlugMap.clear()
  mappingBuilt = false
  mappingBuilding = false
  mappingPromise = null
}

// ==================== 内部辅助 ====================

async function getObjectId(slug: string): Promise<string | undefined> {
  if (slugToObjectMap.has(slug)) return slugToObjectMap.get(slug)
  await buildMapping()
  return slugToObjectMap.get(slug)
}

async function createRecord(slug: string): Promise<string> {
  // 仅在本地环境允许创建记录
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  if (!isLocal) {
    console.warn('[ViewCount] createRecord is only allowed in local environment')
    return ''
  }
  const { token } = await request('/request-create-token', { slug }) as { token: string }
  const created = await request('/create', { slug, createToken: token }) as { objectId: string }
  const objectId = created.objectId
  if (objectId) {
    slugToObjectMap.set(slug, objectId)
    objectToSlugMap.set(objectId, slug)
  }
  return objectId
}

// ==================== 高层 API ====================

/**
 * 获取单篇文章浏览量
 */
export async function getViewCount(slug: string): Promise<number> {
  try {
    const objectId = await getObjectId(slug)
    if (!objectId) return 0
    const record = await request(`/find/${objectId}`) as { count?: number }
    return record.count || 0
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
    let objectId = await getObjectId(slug)
    if (!objectId) {
      objectId = await createRecord(slug)
    }
    const record = await request(`/view/${objectId}`) as { count?: number }
    return record.count || 0
  } catch (err: any) {
    console.error('[ViewCount] 增加浏览量失败:', err.message)
    return 0
  }
}

/**
 * 批量获取文章浏览量
 */
export async function getViewCounts(slugs: string[]): Promise<Record<string, number>> {
  try {
    await buildMapping()
    const objectIds = slugs
      .map((s) => slugToObjectMap.get(s))
      .filter((id): id is string => Boolean(id))
    if (objectIds.length === 0) return {}

    const result = await request('/find', objectIds) as { results?: Array<{ objectId: string; count?: number }> }
    const counts: Record<string, number> = {}
    for (const item of result.results || []) {
      const slug = objectToSlugMap.get(item.objectId)
      if (slug) counts[slug] = item.count || 0
    }
    for (const slug of slugs) {
      if (!(slug in counts) && slugToObjectMap.has(slug)) {
        counts[slug] = 0
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
    const allRecords = await request('/find') as { results?: Array<{ count?: number }> }
    let total = 0
    for (const item of allRecords.results || []) {
      total += item.count || 0
    }
    return total
  } catch (err: any) {
    console.error('[ViewCount] 获取总浏览量失败:', err.message)
    return 0
  }
}
