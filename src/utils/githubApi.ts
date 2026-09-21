/**
 * GitHub API 统一入口
 *
 * 背景：浏览器直连 api.github.com 是**匿名**调用，额度只有 60 次/小时，而且是按
 * 访客出口 IP 计算的 —— 站点上十来处调用（发行列表、提交记录、issues、contents…）
 * 几分钟就能把额度打满，于是出现
 *   "API rate limit exceeded for <ip>"
 *
 * 方案：全部改走自建 Cloudflare Worker 代理 `github-proxy`：
 *   - 只放行 GET；owner（`Turing158`）写死在 Worker 里并自动插入第一段之后，
 *     所以调用方路径里**不写 owner / login**；
 *   - Worker 侧注入 PAT，额度 60 → 5000 次/小时，并在边缘缓存响应；
 *   - CORS 白名单已放行线上域名与 localhost，因此本地与线上都直接请求绝对地址，
 *     不经过 Vite 代理（见下方「为什么不做本地 /api 改写」）。
 *
 * 用法（⚠️ owner 由 Worker 注入，路径里**不能**再写 owner / login）：
 *   githubUrl('repos/SFMC/releases?per_page=1')
 *     → https://turing158.github-proxy.de5.net/repos/SFMC/releases?per_page=1
 *     → Worker 转发到 api.github.com/repos/Turing158/SFMC/releases?per_page=1
 *   githubFetch('users/events?per_page=10')
 *     → Worker 转发到 api.github.com/users/Turing158/events?per_page=10
 *   githubOptions()                                      // 传给 axios 的 { params, headers }
 *
 * 为什么不做本地 /api 改写：
 *   `apiFetch` 那套同源代理是给「CORS 白名单只放行线上域名」的后端准备的。
 *   github-proxy 的 CORS 已放行 localhost / 127.0.0.1，再套一层 Vite 代理只会
 *   让本地与线上多一套分支、多一处出错点，因此这里统一直连绝对地址。
 *
 * 仍需直连 api.github.com 的场景：
 *   Worker 只代理 GET、且 owner 固定。gitalk 评论组件内部会发
 *   `/user`、`/graphql`、`/markdown`（匿名 GraphQL 额度恒为 0）等非 GET / 非固定
 *   owner 形态的请求，故保持原样、不经过本模块。
 */

import { config } from '@/config'

/** 默认请求头；与 Worker 侧 buildGithubHeaders 的语义对齐 */
export const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
} as const

/**
 * 拼接一条经 github-proxy 转发的 GitHub API 地址。
 *
 * @param path 以 `/repos/...` 或 `/users/...` 开头的资源路径，**不要包含 owner / login**。
 *             前导斜杠可有可无；query string 直接跟在后面。
 */
export function githubUrl(path: string): string {
  const base = config.github.apiBase.replace(/\/+$/, '')
  const rest = path.replace(/^\/+/, '')
  return `${base}/${rest}`
}

/**
 * axios 用的请求配置：自动补 Accept 头。
 * 例如 `axios.get(githubUrl('repos/SFMC/releases'), githubOptions())`
 */
export function githubOptions(init?: {
  params?: Record<string, unknown>
  headers?: Record<string, string>
}): { params?: Record<string, unknown>; headers: Record<string, string> } {
  return {
    params: init?.params,
    headers: { ...GITHUB_API_HEADERS, ...(init?.headers ?? {}) },
  }
}

/**
 * 带兜底的 GitHub 请求：优先走 github-proxy，代理不可用（Worker 未部署、被墙、
 * 网络抖动）时自动回退直连 api.github.com，回退时按 Worker 的规则补回 owner。
 *
 * @param path 以 `/repos/...` 或 `/users/...` 开头的路径（不含 owner / login）
 * @param init 同 fetch 的 RequestInit
 */
export async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const proxied = githubUrl(path)
  const headers = { ...GITHUB_API_HEADERS, ...((init?.headers as Record<string, string>) ?? {}) }

  try {
    const res = await fetch(proxied, { ...init, headers })
    // 代理正常工作时直接返回；5xx 才值得回退，4xx 是 GitHub 的真实答复
    if (res.status < 500) return res
  } catch {
    // 落到下面的直连兜底
  }

  return fetch(fallbackUrl(path), { ...init, headers })
}

/**
 * 直连 api.github.com 的兜底地址。
 *
 * github-proxy 会把写死的 owner 插在**第一段之后**（`repos/SFMC/...` →
 * `repos/Turing158/SFMC/...`；`users/events` → `users/Turing158/events`），
 * 所以兜底时按同样的位置补上 owner 即可。
 * 仅用于 githubFetch 的降级路径。
 */
function fallbackUrl(path: string): string {
  const rest = path.replace(/^\/+/, '')
  const [head, ...tail] = rest.split('/')
  return `https://api.github.com/${[head, config.github.owner, ...tail].join('/')}`
}
