/**
 * GitHub API 统一入口
 *
 * 背景：浏览器直连 api.github.com 是**匿名**调用，额度只有 60 次/小时，而且是按
 * 访客出口 IP 计算的 —— 站点上十来处调用（发行列表、提交记录、issues、contents…）
 * 几分钟就能把额度打满，于是出现
 *   "API rate limit exceeded for <ip>"
 *
 * 方案：全部改走合并后的自建 Worker 代理（路径前缀 `/github/api`）：
 *   - 只放行 GET；owner（`Turing158`）写死在 Worker 里并自动插入第一段之后，
 *     所以调用方路径里**不写 owner / login**；
 *   - Worker 侧注入 PAT，额度 60 → 5000 次/小时，并在边缘缓存响应；
 *   - CORS 白名单由 Worker 的 NORMAL_OPERATE_ALLOW_ORIGIN 控制，合并后已从
 *     `*` 收窄为显式名单（线上域名 + localhost:3000）。因此本地**必须**经
 *     apiUrl 走 Vite 同源代理，否则用 127.0.0.1 / 局域网 IP / 非 3000 端口
 *     打开时会被浏览器拦截。见下方「为什么本地要改写」。
 *
 * 用法（⚠️ owner 由 Worker 注入，路径里**不能**再写 owner / login）：
 *   githubUrl('repos/SFMC/releases?per_page=1')
 *     → https://api.turing158.dpdns.org/github/api/repos/SFMC/releases?per_page=1
 *     → Worker 转发到 api.github.com/repos/Turing158/SFMC/releases?per_page=1
 *   githubFetch('users/events?per_page=10')
 *     → Worker 转发到 api.github.com/users/Turing158/events?per_page=10
 *   githubOptions()                                      // 传给 axios 的 { params, headers }
 *
 * 为什么本地要改写：
 *   合并前 github-proxy 的 CORS 放行 `*`，本地直连绝对地址即可；合并后 CORS 语义
 *   以 api worker 为准（名单为空则不下发 ACAO），只有列进白名单的 Origin 才通得过。
 *   白名单虽含 localhost:3000，但 127.0.0.1、局域网 IP、其它端口都会挂，故与其余
 *   后端接口一视同仁，统一走 apiUrl 的同源代理。
 *
 * 仍需直连 api.github.com 的场景：
 *   Worker 只代理 GET、且 owner 固定。gitalk 评论组件内部会发
 *   `/user`、`/graphql`、`/markdown`（匿名 GraphQL 额度恒为 0）等非 GET / 非固定
 *   owner 形态的请求，故保持原样、不经过本模块。
 */

import { config } from '@/config'
import { buildPoolUrl, getActiveIndex, runWithPool, splitPoolUrl } from '@/utils/backendPool'
import { isLocalEnv } from '@/utils/apiEndpoint'

/** 默认请求头；与 Worker 侧 buildGithubHeaders 的语义对齐 */
export const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
} as const

/**
 * 由「不含域名的资源路径」拼出当前 active 域名下的可请求地址。
 *
 * @param path 以 `/repos/...` 或 `/users/...` 开头的资源路径，**不要包含 owner / login**。
 *             前导斜杠可有可无；query string 直接跟在后面。
 */
function activeGithubPath(path: string): string {
  const rest = path.replace(/^\/+/, '')
  // config.github.apiBase 形如 <BASE>/github/api → 取其中的路径部分
  const split = splitPoolUrl(config.github.apiBase)
  const prefix = split ? split.path.replace(/\/+$/, '') : '/github/api'
  return `${prefix}/${rest}`
}

/**
 * 拼接一条经 Worker 转发的 GitHub API 地址（已按环境完成本地代理改写）。
 *
 * 返回值可直接交给 axios / fetch 使用：本地会得到 `/api/turing158/github/api/...`
 * 这样的同源路径，线上则是完整绝对地址。改写在这里做（而非各调用点），
 * 这样 7 处 `axios.get(githubUrl(...), githubOptions())` 都自动受益。
 *
 * @param path 以 `/repos/...` 或 `/users/...` 开头的资源路径，**不要包含 owner / login**。
 *             前导斜杠可有可无；query string 直接跟在后面。
 */
export function githubUrl(path: string): string {
  return buildPoolUrl(getActiveIndex(), activeGithubPath(path), isLocalEnv ? 'proxy' : 'remote')
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
 * 带兜底的 GitHub 请求。降级顺序：
 *   ① 池内轮转 —— 当前 active 域名的同源代理（本地）/ 绝对地址（线上）
 *   ② 池内下一个域名（额度耗尽 / 被墙 / 宕机时自动切换）
 *   ③ 最后才回退直连 api.github.com（按 Worker 规则补回 owner）
 *
 * ⚠️ 与改造前的区别：旧版在**第一个域名**失败时就跳去 api.github.com，
 * 而匿名直连只有 60 次/小时，等于把请求丢进了必死的通道。现在先把域名池
 * 用完，直连仅作为最终兜底。
 *
 * @param path 以 `/repos/...` 或 `/users/...` 开头的路径（不含 owner / login）
 * @param init 同 fetch 的 RequestInit
 */
export async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = { ...GITHUB_API_HEADERS, ...((init?.headers as Record<string, string>) ?? {}) }
  const resourcePath = activeGithubPath(path)

  try {
    return await runWithPool(
      async (_entry, index) => {
        const target = buildPoolUrl(index, resourcePath, isLocalEnv ? 'proxy' : 'remote')
        const res = await fetch(target, { ...init, headers })
        // 拿到响应即为成功；5xx 表示该域名确实有问题 → 抛出以触发轮转
        if (res.status < 500) return res
        throw new Error(`GitHub proxy ${res.status}`)
      },
      { callerSignal: init?.signal ?? undefined }
    )
  } catch (err) {
    // 池内全部失败 → 最终兜底：直连 api.github.com（匿名，仅 60 次/小时）
    if (init?.signal?.aborted) throw err
    return fetch(fallbackUrl(path), { ...init, headers })
  }
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
