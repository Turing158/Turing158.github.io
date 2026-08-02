/**
 * Cline 推荐模型数据获取 composable
 * 从 Cline API 获取免费模型与推荐模型列表，含 5 分钟模块级缓存
 * 供 ClineModelsTool 组件使用
 */

import { ref } from 'vue'
import axios from 'axios'
import { config } from '@/config'

export interface ClineModel {
  id: string
  name: string
  description: string
  tags: string[]
}

interface ClineModelsResponse {
  recommended?: ClineModel[]
  free?: ClineModel[]
  clinePass?: ClineModel[]
}

const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

// 模块级缓存（单端点，无需 Map）
let cachedFree: ClineModel[] | null = null
let cachedRecommended: ClineModel[] | null = null
let cacheLoadedAt = 0

export function useClineModels() {
  const loading = ref(false)
  const error = ref(false)
  const freeModels = ref<ClineModel[]>(cachedFree ?? [])
  const recommendedModels = ref<ClineModel[]>(cachedRecommended ?? [])

  async function fetchClineModels(): Promise<void> {
    // 缓存有效则直接返回
    if (cachedFree && cachedRecommended && Date.now() - cacheLoadedAt < CACHE_TTL) {
      freeModels.value = cachedFree
      recommendedModels.value = cachedRecommended
      return
    }

    loading.value = true
    error.value = false

    try {
      const res = await axios.get<ClineModelsResponse>(config.cline.apiBase)
      const free = Array.isArray(res.data?.free) ? res.data.free : []
      const recommended = Array.isArray(res.data?.recommended) ? res.data.recommended : []

      cachedFree = free
      cachedRecommended = recommended
      cacheLoadedAt = Date.now()
      freeModels.value = free
      recommendedModels.value = recommended
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  return { loading, error, freeModels, recommendedModels, fetchClineModels }
}
