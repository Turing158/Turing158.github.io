/**
 * 发行版数据获取 composable
 * 从 GitHub API 获取两个仓库的最新发行版，含 5 分钟缓存
 * 供 ReleasesView 和 SearchDialog 共用
 */

import { ref } from 'vue'
import axios from 'axios'
import type { Release } from '@/types/search'
import { config } from '@/config'

const GITHUB_OWNER = config.github.owner
const RELEASE_REPOS = ['StarFall-Minecraft-Launcher', 'SFMC', 'StarFall-Vue', 'StarFall-SpringBoot']
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

// 模块级缓存
let cachedReleases: Release[] | null = null
let cacheLoadedAt = 0

export function useReleases() {
  const loading = ref(false)
  const error = ref(false)
  const releases = ref<Release[]>(cachedReleases ?? [])

  async function fetchReleases(): Promise<Release[]> {
    // 缓存有效则直接返回
    if (cachedReleases && Date.now() - cacheLoadedAt < CACHE_TTL) {
      releases.value = cachedReleases
      return cachedReleases
    }

    loading.value = true
    error.value = false

    try {
      const results = await Promise.allSettled(
        RELEASE_REPOS.map(repo =>
          axios
            .get<any[]>(
              `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/releases?per_page=1`
            )
            .then(res => {
              const data = res.data?.[0]
              if (!data) return null
              return {
                repo,
                tag_name: data.tag_name,
                prerelease: data.prerelease,
                published_at: data.published_at,
                html_url: data.html_url,
                author: {
                  login: data.author.login,
                  avatar_url: data.author.avatar_url,
                  html_url: data.author.html_url,
                },
                assets: (data.assets ?? []).map((a: any) => ({
                  browser_download_url: a.browser_download_url,
                })),
              } as Release
            })
        )
      )

      const successful = results
        .filter((r): r is PromiseFulfilledResult<Release | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((r): r is Release => r !== null)

      if (successful.length === 0) {
        error.value = true
      } else {
        cachedReleases = successful
        cacheLoadedAt = Date.now()
        releases.value = successful
      }

      return successful
    } catch {
      error.value = true
      return []
    } finally {
      loading.value = false
    }
  }

  return { loading, error, releases, fetchReleases }
}
