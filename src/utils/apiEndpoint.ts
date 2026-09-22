/**
 * 外部 API 端点解析（域名池 + 本地代理 / 线上直连）
 *
 * 背景一（CORS）：后端 Worker 的 CORS 白名单由 NORMAL_OPERATE_ALLOW_ORIGIN 控制，
 * 只放行线上站点域名与 localhost:3000。本地用 127.0.0.1、局域网 IP 或其它端口
 * 打开时会被浏览器拦截，因此本地把远端绝对地址改写成 Vite 代理的同源路径
 * （映射见 vite.config.ts 的 API_PROXY）；线上（GitHub Pages 纯静态托管）直连绝对地址。
 *
 * 背景二（额度轮换）：多个域名分属不同 Cloudflare 账号，各有 10 万次/天免费额度。
 * 任一域名耗尽（Error 1027）时自动切到下一个 —— 判定与状态机全在
 * src/utils/backendPool.ts；本模块只负责「按 active 域名拼地址」并接上轮转重试。
 *
 * CORS 本身放行的第三方接口（如 https://date.nager.at）不在此列，保持直连。
 */

import {
  buildPoolUrl,
  runWithPool,
  splitPoolUrl,
} from '@/utils/backendPool'

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
 * 把远端绝对地址解析为当前环境应使用的地址。
 *
 * - 本地：池内地址 → 同源代理路径；其余原样返回
 * - 线上：原样返回（直连绝对地址）
 */
export function apiUrl(url: string): string {
  if (!isLocalEnv) return url
  const split = splitPoolUrl(url)
  if (!split) return url
  return buildPoolUrl(split.index, split.path, 'proxy')
}

/**
 * 带兜底的 fetch。
 *
 * 池内地址（后端 Worker）：接上「额度耗尽自动换域名」的轮转 —— 某个域名网络层
 * 失败时改用池内下一个域名重试同一个请求。同时保留既有的「本地代理不可用
 * （404/405/501，例如用普通静态服务器打开构建产物）则回退远端直连」行为。
 *
 * 非池内地址（date.nager.at、corsproxy.io 等）：行为与改造前完全一致。
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const split = splitPoolUrl(url)

  if (!split) {
    // 非池内地址（第三方接口）：保持改造前的行为 —— 本地代理不可用时回退直连
    const proxied = apiUrl(url)
    if (proxied === url) return fetch(url, init)
    return fetchNonPoolWithFallback(proxied, url, init)
  }

  const path = split.path
  return runWithPool(
    async (entry, index) => {
      const direct = `${entry.base}${path}`
      // 线上：直接请求该域名；失败由 runWithPool 接管轮转
      if (!isLocalEnv) return fetch(direct, init)
      // 本地：先走同源代理；仅在「代理本身不存在」时才直连（见下）
      return fetchViaLocalProxy(buildPoolUrl(index, path, 'proxy'), direct, init)
    },
    { callerSignal: init?.signal ?? undefined }
  )
}

/**
 * 非池内地址的兜底：代理不可用（网络层失败，或返回 404/405/501 表示服务器未配代理）
 * 时回退直连。这些地址不属于域名池，没有「换域名」可谈，因此保持改造前的宽松行为。
 */
async function fetchNonPoolWithFallback(
  proxied: string,
  fallback: string,
  init?: RequestInit
): Promise<Response> {
  if (proxied === fallback) return fetch(proxied, init)

  let res: Response | null = null
  try {
    res = await fetch(proxied, init)
  } catch {
    res = null
  }

  if (res && res.status !== 404 && res.status !== 405 && res.status !== 501) {
    return res
  }
  return fetch(fallback, init)
}

/**
 * 本地环境的池内请求：优先同源代理。
 *
 * ⚠️ 与改造前的关键差别 —— 只有当代理【返回了 404/405/501】（说明当前服务器压根没配代理，
 * 例如直接用普通静态服务器打开构建产物）才回退直连；若代理是【网络层失败】（抛异常），
 * 则原样抛出，交给 runWithPool 去轮转域名。
 *
 * 改造前无论何种失败都回退直连，等于把请求打向同一个（可能已额度耗尽的）域名，
 * 使域名池形同虚设。
 */
async function fetchViaLocalProxy(
  proxied: string,
  direct: string,
  init?: RequestInit
): Promise<Response> {
  if (proxied === direct) return fetch(proxied, init)

  let res: Response
  try {
    res = await fetch(proxied, init)
  } catch (err) {
    // 代理不可达 → 不盲目直连，让上层换域名重试
    throw err
  }

  // 404/405/501 通常意味着当前服务器没有配置代理，此时才回退该域名的直连地址
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    return fetch(direct, init)
  }
  return res
}
