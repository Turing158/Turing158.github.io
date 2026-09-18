export interface FriendLink {
  /** 友链名称 */
  name: string | null
  /** 头像图片地址 */
  head: string | null
  /** 站点链接 */
  link: string | null
  /** 站点描述（接口返回，页面不展示） */
  desc: string | null
  /** 标签（后端为 json 列，通常为 string[]，空值时可能是 {}） */
  label: unknown
  /** 创建时间（接口返回，页面不展示） */
  created_at: string
  /** 权重（接口返回，页面不展示） */
  weight: number
}

// 跨域直连（API 的 CORS 白名单包含站点域名）
const API_BASE = 'https://blog.friendlink.de5.net'

/** 拉取全部友情链接（接口要求 POST，无需请求体，避免预检请求） */
export async function fetchFriendLinks(): Promise<FriendLink[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${API_BASE}/friend-link/find/all`, {
      method: 'POST',
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? (data as FriendLink[]) : []
  } finally {
    clearTimeout(timer)
  }
}

/** label 列归一化为字符串数组（后端空值默认 '{}':json，而非数组） */
export function friendLabels(label: unknown): string[] {
  return Array.isArray(label) ? label.filter((item): item is string => typeof item === 'string') : []
}

// ── 申请友链 ──

export interface ApplyFriendLinkPayload {
  /** 站点名称（必填） */
  name: string
  /** 头像图片地址（必填） */
  head: string
  /** 站点链接（必填，重复提交会返回"链接已存在"） */
  link: string
  /** 站点介绍（选填，接口限制 50 字） */
  desc: string
  /** 标签（选填，接口限制最多 5 个、每个 10 字） */
  label: string[]
}

export interface ApplyFriendLinkResult {
  success: boolean
  data?: unknown
  error?: string
}

// 跨域直连（Worker 的 CORS 白名单包含站点域名）
const APPLY_API_BASE = 'https://blog.add-friendlink.de5.net'

/** 提交友链申请（业务校验失败时 HTTP 仍为 200，以返回体 success/error 为准） */
export async function applyFriendLink(payload: ApplyFriendLinkPayload): Promise<ApplyFriendLinkResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${APPLY_API_BASE}/friend-link/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as ApplyFriendLinkResult
  } finally {
    clearTimeout(timer)
  }
}
