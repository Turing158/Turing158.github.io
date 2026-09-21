/**
 * 外部 API 端点解析（本地走代理 / 线上直连）
 *
 * 背景：本站后端（Cloudflare Worker、友链服务、tool-proxy）的 CORS 白名单只放行
 * 线上站点域名。本地用 127.0.0.1、局域网 IP 或其它端口打开时，浏览器会直接拦截跨域请求。
 *
 * 方案：本地（dev server / vite preview）把远端绝对地址改写成 Vite 代理的同源路径
 * （代理映射见 vite.config.ts 的 API_PROXY），浏览器视角下是同源请求，不再受 CORS 限制；
 * 线上（GitHub Pages，纯静态托管没有代理能力）仍直连原来的绝对地址，请求方式与现状完全一致。
 *
 * CORS 本身放行的接口（如 https://date.nager.at）不在此列，保持直连；
 * GitHub 用户信息虽然 api.github.com 自身放行 CORS，但改由 tool-proxy 转发
 * （/github/user/<login>，Worker 侧带 PAT 规避匿名限流），因此同样走代理映射。
 */

/** 远端地址 → 本地同源代理前缀；必须与 vite.config.ts 的 API_PROXY 保持一致 */
const PROXY_ROUTES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^https:\/\/api\.turing158\.dpdns\.org(?=\/|$)/i, '/api/turing158'],
  [/^https:\/\/blog\.add-friendlink\.de5\.net(?=\/|$)/i, '/api/friend-apply'],
  [/^https:\/\/blog\.friendlink\.de5\.net(?=\/|$)/i, '/api/friends'],
  // tool-proxy：Cline 模型目录（/cline/model/*）+ Gitalk OAuth token（/github_access_token）
  //              + GitHub 用户信息（/github/user/*）
  [/^https:\/\/tool-proxy\.turing158\.de5\.net(?=\/|$)/i, '/api/tool-proxy'],
  // github-proxy：GitHub REST 代理。它的 CORS 已放行 localhost / 线上域名，
  // 原则上可以直连；映射在此只是为了在 dev 环境可视作同源、便于排查，
  // 前端调用统一走 src/utils/githubApi.ts（直连绝对地址，不做同源改写）。
  [/^https:\/\/turing158\.github-proxy\.de5\.net(?=\/|$)/i, '/api/github'],
]

/** 本地 / 内网主机名：命中时走代理（dev server 与 preview 均适用） */
const LOCAL_HOST_PATTERN =
  /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false
  const { protocol, hostname } = window.location
  // file:// 等非 http(s) 协议不做代理
  if (!protocol.startsWith('http')) return false
  return LOCAL_HOST_PATTERN.test(hostname) || hostname.endsWith('.local')
}

/** 是否处于本地环境：dev server 一定为真；构建产物在本地/内网访问（vite preview）同样为真 */
export const isLocalEnv = import.meta.env.DEV || isLocalHost()

/**
 * 把远端绝对地址解析为当前环境应使用的地址
 *
 * - 本地：命中代理映射则返回同源代理路径，未命中原样返回
 * - 线上：原样返回（与现在的直连方式一致）
 */
export function apiUrl(url: string): string {
  if (!isLocalEnv) return url
  for (const [pattern, prefix] of PROXY_ROUTES) {
    if (pattern.test(url)) return url.replace(pattern, prefix)
  }
  return url
}

/**
 * 带兜底的 fetch：优先走本地代理；代理不可用时（例如直接用普通静态服务器打开构建产物）
 * 自动回退到远端直连，行为与改造前一致。
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxied = apiUrl(url)
  if (proxied === url) return fetch(url, init)

  let res: Response | null = null
  try {
    res = await fetch(proxied, init)
  } catch {
    res = null
  }

  // 404/405/501 通常意味着当前服务器没有配置代理，回退直连
  if (res && res.status !== 404 && res.status !== 405 && res.status !== 501) {
    return res
  }
  return fetch(url, init)
}
