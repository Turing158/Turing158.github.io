/**
 * axios 的域名池适配
 *
 * 站点上 5 处 `axios.get(githubUrl(...))` / `axios.get(apiUrl(...))` 直接调用 axios，
 * 不走 apiFetch，因此拿不到「额度耗尽自动换域名」的能力。这里用全局响应拦截器
 * 统一补上：请求失败且属于池内地址时，换池内下一个域名重试。
 *
 * 为什么在 main.ts 里 import 一次即可：
 *   axios 的拦截器挂在模块级默认实例上，全站共用；各调用点无需任何改动。
 *
 * 判定要点：
 *   - 只对「网络层失败」（error.response 为空）轮转。带 response 的 4xx/5xx 是
 *     后端真实答复（例如 GitHub 的 403 限流），换域名没有意义，且 5 个域名共用
 *     同一把 PAT，换了也一样 —— 不该误判为域名故障。
 *   - 本地断网（navigator.onLine === false）、请求被主动取消 → 不轮转。
 *   - 非池内地址（date.nager.at 等）原样抛出，行为不变。
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  findPoolIndexByUrl,
  retargetUrl,
  runWithPool,
} from '@/utils/backendPool'

/** 标记重试过的请求，避免拦截器与 runWithPool 相互递归 */
const RETRY_FLAG = '__backendPoolRetried'

type RetriableConfig = InternalAxiosRequestConfig & { [RETRY_FLAG]?: boolean }

function isNetworkError(error: AxiosError): boolean {
  // 无 response = 请求没到达 / 响应被 CORS 挡掉（1027 正是这种）
  if (error.response) return false
  // 主动取消不算故障
  if (axios.isCancel(error)) return false
  return true
}

export function installAxiosPoolInterceptor(): void {
  axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    if (!config || config[RETRY_FLAG]) throw error

    const url = config.url
    if (!url || findPoolIndexByUrl(url) < 0) throw error
    if (!isNetworkError(error)) throw error
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw error

    // 该 URL 当前所属域名（用于告诉轮转逻辑「这个已经试过了」）
    const currentIndex = findPoolIndexByUrl(url)

    return runWithPool(
      async (_entry, index) => {
        const retryConfig: RetriableConfig = {
          ...config,
          url: retargetUrl(url, index),
          [RETRY_FLAG]: true,
        }
        const res = await axios.request(retryConfig)
        return res
      },
      { exclude: [currentIndex] }
    )
  })
}
