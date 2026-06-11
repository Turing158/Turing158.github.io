/**
 * 获取仓库最新稳定 Release 的 composable
 * 使用 /releases/latest 端点（天然排除 prerelease 和 draft），含 5 分钟模块级缓存
 * 供独立页面（如 SFMC 落地页）展示下载按钮使用
 */

import { ref } from 'vue'
import axios from 'axios'
import { config } from '@/config'

export interface LatestReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

export interface LatestRelease {
  tag_name: string
  html_url: string
  published_at: string
  assets: LatestReleaseAsset[]
}

const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

// 模块级缓存（按仓库名区分）
const cache = new Map<string, { data: LatestRelease; loadedAt: number }>()

export function useLatestRelease(repo: string) {
  const cached = cache.get(repo)
  const loading = ref(false)
  const error = ref(false)
  const release = ref<LatestRelease | null>(cached?.data ?? null)

  async function fetchLatest(): Promise<LatestRelease | null> {
    const hit = cache.get(repo)
    if (hit && Date.now() - hit.loadedAt < CACHE_TTL) {
      release.value = hit.data
      return hit.data
    }

    loading.value = true
    error.value = false

    try {
      const res = await axios.get<any>(
        `https://api.github.com/repos/${config.github.owner}/${repo}/releases/latest`
      )
      const data: LatestRelease = {
        tag_name: res.data.tag_name,
        html_url: res.data.html_url,
        published_at: res.data.published_at,
        assets: (res.data.assets ?? []).map((a: any) => ({
          name: a.name,
          browser_download_url: a.browser_download_url,
          size: a.size,
        })),
      }
      cache.set(repo, { data, loadedAt: Date.now() })
      release.value = data
      return data
    } catch {
      error.value = true
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, release, fetchLatest }
}
