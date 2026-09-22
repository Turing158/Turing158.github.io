/**
 * 后端域名池（backend pool）
 *
 * 背景：多个域名各自部署了同一个合并后的 Worker，分属不同 Cloudflare 账号，
 * 每账号每天 10 万次免费额度（官方文档：Accounts on the Workers Free plan have a
 * daily request limit of 100,000 requests, resetting at midnight UTC）。
 * 任一域名额度耗尽（Error 1027）、被墙或宕机时，自动切到下一个域名继续服务。
 *
 * 为什么不用 /health 或任何专用探针：
 *   1027 由 Cloudflare 平台层返回，发生在 Worker 代码执行【之前】，
 *   因此该响应【没有】CORS 头（正常情况下业务路由都带 ACAO，实测）。
 *   浏览器跨域 fetch 拿到无 ACAO 的响应时不会把 status 交给 JS，只抛 TypeError。
 *   也就是说「额度耗尽」和「用户断网」在代码里长得一模一样 ——
 *   探针（含 OPTIONS：它在 Worker 内执行、同样吃额度、同样被 1027 拦）绕不开这一点。
 *
 * 改用「对照组」判据（一次重试同时完成切换与死亡确认）：
 *   请求 A 域名失败 → 用 B 域名重试同一个实质请求。
 *     B 成功 → A 被「确认失败」；累计到 DEAD_THRESHOLD 次才封禁到次日 00:00 UTC
 *     B 也失败 → 更可能是本地/全局网络问题，【不】计入，继续试下一个
 *   由此天然区分「这个域名坏了」与「我这边断网了」。
 *
 * 为什么切换与判死要分开：
 *   切换廉价且可逆，判死昂贵（封到次日，白扔一整天的 10 万额度）。
 *   gitee 这类上游偶发慢/抖会让【单个端点】失败，而该域名其余端点全正常 ——
 *   实测出现过首页 9 个请求成功、仅 gitee/contribution 失败。若据此判死就是误伤。
 *   额度真耗尽时该域名【所有】请求齐刷刷失败，一屏十几个并发请求足以迅速越过阈值。
 *
 * 设计取向：多个域名功能完全等价、数据同源（同一 Supabase + 同一 PAT），
 *   误切的代价极低（切过去一样能用），真正的灾难是「全部标记死亡、站点锁死」。
 *   所以策略是【宁可多切，绝不锁死】。
 *
 * 三条安全网：
 *   1. navigator.onLine === false 时不轮转，直接失败
 *   2. markDead 拒绝标记最后一个存活域名
 *   3. 一轮内全部失败 → 清空所有死亡标记后抛出
 */

import { config } from '@/config'

export interface PoolEntry {
  /** 远端绝对基址（无尾斜杠） */
  base: string
  /** 本地同源代理前缀，必须与 vite.config.ts 的 API_PROXY 键一致 */
  proxy: string
}

const STORAGE_KEY = 'blog-backend-pool'
const STATE_VERSION = 1

/** 索引 0 用 /api/turing158，其余用 /api/turing158-<i>（映射见 vite.config.ts） */
export function proxyPrefixFor(index: number): string {
  return index === 0 ? '/api/turing158' : `/api/turing158-${index}`
}

/** 域名池（顺序即优先级，由 config.backendPool 决定） */
export const poolEntries: readonly PoolEntry[] = config.backendPool.map((base, i) => ({
  base: String(base).replace(/\/+$/, ''),
  proxy: proxyPrefixFor(i),
}))

interface PoolState {
  version: number
  active: number
  /** 索引 → 复活时刻（epoch ms）；缺失或已过期视为存活 */
  deadUntil: Record<string, number>
}

function emptyState(): PoolState {
  return { version: STATE_VERSION, active: 0, deadUntil: {} }
}

function readState(): PoolState {
  if (typeof localStorage === 'undefined') return emptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as PoolState
    if (!parsed || parsed.version !== STATE_VERSION) return emptyState()
    const active = Number(parsed.active)
    return {
      version: STATE_VERSION,
      active: Number.isInteger(active) && active >= 0 && active < poolEntries.length ? active : 0,
      deadUntil: parsed.deadUntil && typeof parsed.deadUntil === 'object' ? parsed.deadUntil : {},
    }
  } catch {
    // localStorage 不可用（隐私模式 / 配额满）或数据损坏 → 退化为内存态
    return emptyState()
  }
}

function writeState(state: PoolState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略：写失败只影响跨页持久化，不影响本次会话
  }
}

/**
 * 次日 00:00 UTC + 30~120s 抖动。
 *
 * 额度在 00:00 UTC 重置，所以直接用「重置时刻」当解封时间比固定冷却时长准确；
 * 抖动是为了避免大量客户端在同一秒涌回同一个域名。
 */
function nextUtcMidnight(): number {
  const now = new Date()
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return midnight + 30_000 + Math.floor(Math.random() * 90_000)
}

function isDead(state: PoolState, index: number): boolean {
  const until = state.deadUntil[String(index)]
  return typeof until === 'number' && until > Date.now()
}

/** 清掉已过期的死亡标记（顺带让状态不至于无限增长） */
function prune(state: PoolState): void {
  for (const key of Object.keys(state.deadUntil)) {
    if (!(state.deadUntil[key] > Date.now())) delete state.deadUntil[key]
  }
}

// ── 对外状态读取 ──

/** 当前应使用的域名索引（已跳过死亡域名；全部死亡时回到 active） */
export function getActiveIndex(): number {
  const state = readState()
  prune(state)
  if (!isDead(state, state.active)) return state.active
  for (let i = 0; i < poolEntries.length; i++) {
    if (!isDead(state, i)) return i
  }
  return state.active
}

/** 当前应使用的远端基址 */
export function getActiveBase(): string {
  return poolEntries[getActiveIndex()]?.base ?? poolEntries[0].base
}

/** 当前应使用的本地代理前缀 */
export function getActiveProxy(): string {
  return poolEntries[getActiveIndex()]?.proxy ?? poolEntries[0].proxy
}

// ── 地址改写 ──

/** 定位一个 URL 属于池内第几个域名；不属于任何池内域名时返回 -1 */
export function findPoolIndexByUrl(url: string): number {
  return splitPoolUrl(url)?.index ?? -1
}

/**
 * 拆解一条 URL：找出它属于池内哪个域名，并返回域名之后的路径部分（含前导 `/`）。
 * 不属于任何池内域名时返回 null。
 *
 * 边界判断（`/` 或结尾）保证 `/api/turing158-1` 不会被 `/api/turing158` 误吃；
 * 由于索引 0 的前缀是其余索引的前缀串，这里按「最长前缀优先」匹配以彻底避免歧义。
 */
export function splitPoolUrl(url: string): { index: number; path: string } | null {
  let best: { index: number; path: string; len: number } | null = null
  for (let i = 0; i < poolEntries.length; i++) {
    for (const prefix of [poolEntries[i].base, poolEntries[i].proxy]) {
      if (url !== prefix && !url.startsWith(prefix + '/')) continue
      const path = url.slice(prefix.length)
      if (!best || prefix.length > best.len) best = { index: i, path, len: prefix.length }
    }
  }
  return best ? { index: best.index, path: best.path } : null
}

/**
 * 用指定域名的前缀重建一条 URL。
 * @param form 'remote' = 远端绝对地址（线上直连）；'proxy' = 本地同源代理路径
 */
export function buildPoolUrl(index: number, path: string, form: 'remote' | 'proxy'): string {
  const entry = poolEntries[index] ?? poolEntries[0]
  const prefix = form === 'remote' ? entry.base : entry.proxy
  return prefix + (path.startsWith('/') || path === '' ? path : `/${path}`)
}

/**
 * 把一条池内 URL 改写到指定域名的地址上，保留路径、query 与片段，**形态不变**
 * （base 形态仍是 base，proxy 形态仍是 proxy）。非池内地址原样返回。
 */
export function retargetUrl(url: string, index: number): string {
  const split = splitPoolUrl(url)
  if (!split) return url
  // 形态沿用原 url：命中 base 前缀 → remote，命中 proxy 前缀 → proxy
  const form = url.startsWith(poolEntries[split.index].proxy) ? 'proxy' : 'remote'
  return buildPoolUrl(index, split.path, form)
}

/** 把池内 URL 统一转为「本地同源代理」形态；非池内地址不变 */
export function toProxyForm(url: string): string {
  const split = splitPoolUrl(url)
  return split ? buildPoolUrl(split.index, split.path, 'proxy') : url
}

/** 把池内 URL 统一转为「远端绝对地址」形态；非池内地址不变 */
export function toRemoteForm(url: string): string {
  const split = splitPoolUrl(url)
  return split ? buildPoolUrl(split.index, split.path, 'remote') : url
}

// ── 状态变更 ──

function markDead(index: number): void {
  const state = readState()
  prune(state)
  // 安全网 2：绝不标记最后一个存活域名（否则全部死亡 → 站点锁死）
  const aliveOthers = poolEntries.filter((_, i) => i !== index && !isDead(state, i)).length
  if (aliveOthers === 0) return
  state.deadUntil[String(index)] = nextUtcMidnight()
  writeState(state)
}

/**
 * 判定「域名已死」所需的独立失败次数，以及失败计数的滑动窗口。
 *
 * 为什么不一次失败就判死：gitee 这类上游偶发慢/抖会让【单个端点】失败，而该域名
 * 其它端点全都正常 —— 实测出现过首页 9 个请求成功、仅 gitee/contribution 失败，
 * 若据此把整个域名封到次日 UTC，等于白白浪费它一整天的额度。
 * 额度真正耗尽时该域名【所有】请求都会失败，一屏十几个并发请求足以迅速越过阈值。
 *
 * 注意：只有「对照组确认过」的失败才计入（即：A 失败后换 B 成功）。
 * 因此全站断网时不会累积计数，安全网 1/3 依然生效。
 */
const DEAD_THRESHOLD = 2
const FAILURE_WINDOW_MS = 60_000

/** 域名索引 → 最近确认失败的时刻列表（内存态，不持久化） */
const failureLog = new Map<number, number[]>()

/** 记录一次「经对照组确认」的失败；越过阈值才真正判死 */
function recordConfirmedFailure(index: number): void {
  const now = Date.now()
  const list = (failureLog.get(index) ?? []).filter((t) => now - t < FAILURE_WINDOW_MS)
  list.push(now)
  failureLog.set(index, list)
  if (list.length >= DEAD_THRESHOLD) markDead(index)
}

/** 成功访问某域名 → 证明它是活的，清掉其失败记录 */
function recordSuccess(index: number): void {
  failureLog.delete(index)
}

function clearAllDead(): void {
  const state = readState()
  if (Object.keys(state.deadUntil).length === 0) return
  state.deadUntil = {}
  writeState(state)
}

function setActive(index: number): void {
  const state = readState()
  if (state.active === index) return
  state.active = index
  writeState(state)
}

/**
 * 切换决策的互斥锁。
 *
 * 为什么必须有：一次页面加载会并发十几个请求，它们几乎同时撞上同一个坏域名。
 * 「读 active → 判断 → 前进」若不加锁，多个请求会各自前进一格：
 * 实测出现过 active 从 0 直接跳到 2、请求分散到 -1 与 -2 的情况。
 * 加锁后，同一时刻只有一个请求能做切换决策，其余复用它的结果。
 */
let switchChain: Promise<unknown> = Promise.resolve()

function withSwitchLock<T>(fn: () => T): Promise<T> {
  const next = switchChain.then(fn, fn)
  // 链上挂错误吞噬，避免某次失败让后续等待者全部 reject
  switchChain = next.then(
    () => undefined,
    () => undefined
  )
  return next
}

/**
 * 从当前 active 往后找一个「没试过」的域名并设为 active。
 * 优先选存活的；若存活的都被试过了，退化为忽略死亡标记继续试（安全网 3 的局部版）。
 *
 * ⚠️ 只应在 withSwitchLock 内调用（读-改-写需要原子性）。
 */
function advanceToNextAlive(tried: ReadonlySet<number>): boolean {
  const state = readState()
  const n = poolEntries.length
  const from = getActiveIndex()
  for (let step = 1; step <= n; step++) {
    const cand = (from + step) % n
    if (tried.has(cand) || isDead(state, cand)) continue
    setActive(cand)
    return true
  }
  for (let step = 1; step <= n; step++) {
    const cand = (from + step) % n
    if (tried.has(cand)) continue
    setActive(cand)
    return true
  }
  return false
}

// ── 主流程 ──

export interface RunWithPoolOptions {
  /**
   * 判定「网络层失败」（决定是否轮转）。
   * 默认：任何异常都算。axios 场景应传入 `!err.response`，
   * 否则会把「服务端真实答复的 4xx/5xx」误判为域名故障。
   */
  isNetworkError?: (err: unknown) => boolean
  /** 调用方自己的 signal；若它已 abort，说明是主动取消，不轮转 */
  callerSignal?: AbortSignal
  /** 本次调用内不再尝试的域名索引（例如刚失败的那个） */
  exclude?: Iterable<number>
}

/**
 * 在域名池上执行一次请求：失败即轮转重试，直到成功或池内域名试完。
 *
 * - attempt 返回即视为成功（不看 HTTP 状态码）—— 能拿到响应就说明域名活着，
 *   4xx/5xx 是后端的真实答复，不该触发换域名。若调用方认为 5xx 也表示代理不可用，
 *   请在 attempt 内抛出，即会走轮转。
 * - 本地断网（navigator.onLine === false）或调用方主动取消 → 立即抛出，不轮转。
 * - 一轮内全部失败 → 清空死亡标记后抛出最后一个错误（安全网 3）。
 *
 * 并发安全：切换决策走 withSwitchLock 串行化，避免十几个并发请求各自前进一格。
 */
export async function runWithPool<T>(
  attempt: (entry: PoolEntry, index: number) => Promise<T>,
  options: RunWithPoolOptions = {}
): Promise<T> {
  const isNetworkError = options.isNetworkError ?? (() => true)
  /** 本次调用允许尝试的域名总数上限（防止误判导致无限循环） */
  const maxAttempts = poolEntries.length
  const localTried = new Set<number>(options.exclude ?? [])
  /** 本轮内网络失败的域名；一旦后面有域名成功，它们即被「对照确认」为死 */
  const failed: number[] = []
  let lastError: unknown

  // 安全网 1：已知本地断网 → 只试一次，不做无谓轮转
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const index = getActiveIndex()
    return attempt(poolEntries[index], index)
  }

  for (let n = 0; n < maxAttempts; n++) {
    // 取一个本次还没试过的域名（读当前 active，必要时在锁内推进）
    const index = await withSwitchLock(() => {
      let cur = getActiveIndex()
      if (localTried.has(cur)) {
        if (!advanceToNextAlive(localTried)) return -1
        cur = getActiveIndex()
      }
      return localTried.has(cur) ? -1 : cur
    })
    if (index < 0) break
    localTried.add(index)

    try {
      const result = await attempt(poolEntries[index], index)
      // 对照组确认：本轮失败过、且现在这个能通 → 之前那些确实失败了。
      // 但单次失败不足以判死（gitee 这类上游偶发慢会误伤），累计到阈值才封禁。
      await withSwitchLock(() => {
        recordSuccess(index)
        for (const dead of failed) {
          if (dead !== index) recordConfirmedFailure(dead)
        }
      })
      return result
    } catch (err) {
      lastError = err

      // 调用方主动取消（组件卸载等）→ 不算域名故障
      if (options.callerSignal?.aborted) throw err
      if (!isNetworkError(err)) throw err
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw err

      failed.push(index)
      // 在锁内推进：只有仍停留在该域名时才前进（并发时别的请求可能已切走）。
      // 注意这里【只切换、不判死】—— 切换是廉价且可逆的，判死要等对照组确认。
      const advanced = await withSwitchLock(() => {
        if (getActiveIndex() !== index) return true // 已被并发请求切换
        return advanceToNextAlive(localTried)
      })
      if (!advanced) break
    }
  }

  // 安全网 3：本轮全部失败 → 清空死亡标记并抛出。
  // 走到这里通常意味着本地/全局网络问题（真正额度耗尽时不会所有域名同时失败），
  // 清标记避免误判导致长期锁死。
  await withSwitchLock(() => {
    clearAllDead()
    failureLog.clear()
  })
  throw lastError
}

// ── 调试 / 测试接口 ──

export interface PoolSnapshot {
  active: number
  base: string
  entries: ReadonlyArray<{ base: string; proxy: string; dead: boolean; deadUntil: number | null }>
}

export function getPoolSnapshot(): PoolSnapshot {
  const state = readState()
  prune(state)
  return {
    active: getActiveIndex(),
    base: getActiveBase(),
    entries: poolEntries.map((e, i) => {
      const until = state.deadUntil[String(i)]
      const dead = isDead(state, i)
      return { base: e.base, proxy: e.proxy, dead, deadUntil: dead ? (until ?? null) : null }
    }),
  }
}

/** 手动重置（测试 / 排障用）：清空死亡标记并回到优先级最高的域名 */
export function resetPool(): void {
  writeState(emptyState())
}

/** 手动指定当前域名（测试 / 排障用） */
export function forceActive(index: number): void {
  if (index < 0 || index >= poolEntries.length) return
  const state = readState()
  state.active = index
  writeState(state)
}

/** 手动标记某个域名为死（测试 / 排障用；绕过失败阈值直接封禁） */
export function forceDead(index: number): void {
  if (index < 0 || index >= poolEntries.length) return
  markDead(index)
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__backendPool = {
    snapshot: getPoolSnapshot,
    reset: resetPool,
    forceActive,
    forceDead,
  }
}
