import { apiFetch } from '@/utils/apiEndpoint'
import { config } from '@/config'

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

// 后端绝对地址：派生自统一后端基址（合并后的单个 Worker，见 src/config.ts）。
// 本地由 apiFetch 自动改走 Vite 代理（同源，绕开 CORS 白名单），线上直连
const API_BASE = `${config.backendBase}/friend-link`

/** 拉取全部友情链接（接口要求 POST，无需请求体，避免预检请求） */
export async function fetchFriendLinks(): Promise<FriendLink[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await apiFetch(`${API_BASE}/find/all`, {
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

// 与读取同域（合并后读 / 写由同一 Worker 的 /friend-link/* 承担），
// 仅路径不同：/friend-link/find/all 与 /friend-link/apply
const APPLY_API_BASE = API_BASE

/** 提交友链申请（业务校验失败时 HTTP 仍为 200，以返回体 success/error 为准） */
export async function applyFriendLink(payload: ApplyFriendLinkPayload): Promise<ApplyFriendLinkResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await apiFetch(`${APPLY_API_BASE}/apply`, {
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
