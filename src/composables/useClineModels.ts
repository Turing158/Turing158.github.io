/**
 * Cline 模型数据获取 composable
 *
 * 数据源（均经 tool-proxy 转发，规避浏览器 CORS）：
 * - `config.cline.apiBase`（/cline/model/recommended）：免费 + 推荐模型的精选列表，驱动「推荐」面板；
 * - `config.cline.allApi`（/cline/model/all）：OpenRouter 全量模型目录（{ data: [...] }），
 *   驱动搜索 Tab —— 目录一次加载后做本地过滤，无需后端搜索接口。
 *
 * 含 5 分钟模块级缓存，供 ClineModelsTool 组件使用。
 */

import { computed, ref } from 'vue'
import axios from 'axios'
import { config } from '@/config'
import { apiUrl } from '@/utils/apiEndpoint'

export interface ClineModel {
  id: string
  name: string
  description: string
  tags: string[]
}

interface ClineModelsResponse {
  recommended?: ClineModel[]
  free?: ClineModel[]
  clinePass?: ClineModel[]
  clineCloud?: ClineModel[]
}

/** 全量目录接口返回体：{ data: [...] }（也兼容直接返回数组） */
type ClineAllResponse = ClineModel[] | { data?: ClineModel[] }

/** 把目录条目（OpenRouter 风格）规范化为 ClineModel；无 id 的条目丢弃 */
function normalizeCatalogItem(item: unknown): ClineModel | null {
  if (!item || typeof item !== 'object') return null
  const raw = item as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id) return null
  return {
    id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : (id.split('/').pop() ?? id),
    description: typeof raw.description === 'string' ? raw.description : '',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
  }
}

const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

/** 搜索结果分页：每次「加载更多」多展示 SEARCH_PAGE_SIZE 个 */
export const SEARCH_PAGE_SIZE = 10

/**
 * 加载动画在「面板可见之后」的最短展示时长（ms）
 *
 * 本地过滤几乎是瞬时的，不设下限时 loading 会被跳过，内容只会「闪」一下。
 * 注意计时不能从请求发起时算起：进入搜索页时面板要走完 out-in 离场动画才挂载
 * （实测约 290ms），这段时间 loading 还没画到屏幕上，从发起时刻计时等于白等。
 */
const MIN_LOADING_MS = 350

/** 等待「搜索面板进场」的上限，避免面板始终不报告可见时把 promise 挂死 */
const PANEL_ENTER_TIMEOUT_MS = 700

// 模块级缓存（单端点，专用 `Map`）
let cachedFree: ClineModel[] | null = null
let cachedRecommended: ClineModel[] | null = null
let cachedClinePass: ClineModel[] | null = null
let cachedClineCloud: ClineModel[] | null = null
let cacheLoadedAt = 0
/** 进行中的推荐/免费/PASS/CLOUD 列表请求，避免组件挂载与进入搜索页时重复发请求 */
let inflightFetch: Promise<void> | null = null

// 全量目录缓存（搜索 Tab 数据源）
let cachedAll: ClineModel[] | null = null
let allLoadedAt = 0
/** 进行中的全量目录请求 */
let inflightAll: Promise<boolean> | null = null

// ── 搜索加载动画计时 ──
/** 搜索面板进场（loading 真正可见）的时刻，未进场为 0 */
let panelShownAt = 0
let panelShownTimer: ReturnType<typeof setTimeout> | null = null
let panelShownResolvers: Array<() => void> = []

/**
 * 面板可见性看门狗：组件切换 Tab 时通知计时起点；万一没通知（异常路径），
 * 超时后按「已可见」继续，保证加载流程不会卡死。
 */
function armPanelShownWatchdog(): void {
  clearPanelShownWatchdog()
  panelShownTimer = setTimeout(() => markSearchPanelShown(), PANEL_ENTER_TIMEOUT_MS)
}

function clearPanelShownWatchdog(): void {
  if (panelShownTimer) {
    clearTimeout(panelShownTimer)
    panelShownTimer = null
  }
}

function settlePanelShown(): void {
  const waiters = panelShownResolvers
  panelShownResolvers = []
  waiters.forEach((resolve) => resolve())
}

/** 由组件在搜索面板进场动画结束时调用，标记 loading 已画到屏幕上 */
export function markSearchPanelShown(): void {
  if (panelShownAt) return
  clearPanelShownWatchdog()
  panelShownAt = Date.now()
  settlePanelShown()
}

function waitPanelShown(): Promise<void> {
  if (panelShownAt) return Promise.resolve()
  armPanelShownWatchdog()
  return new Promise((resolve) => panelShownResolvers.push(resolve))
}

function resetPanelShown(): void {
  clearPanelShownWatchdog()
  panelShownAt = 0
  panelShownResolvers = []
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 按 id 去重，保留先出现的一项 */
function dedupeById(models: ClineModel[]): ClineModel[] {
  const seen = new Set<string>()
  const result: ClineModel[] = []
  for (const model of models) {
    const key = model.id ?? model.name
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(model)
  }
  return result
}

/** 关键词（须已转小写）是否命中模型的 id / 名称 / 描述 / 标签 */
function matchesKeyword(model: ClineModel, keyword: string): boolean {
  const haystack = [
    model.id,
    model.name,
    model.description,
    ...(Array.isArray(model.tags) ? model.tags : []),
  ]
    .filter((field): field is string => typeof field === 'string')
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

export function useClineModels() {
  const loading = ref(false)
  const error = ref(false)
  const freeModels = ref<ClineModel[]>(cachedFree ?? [])
  const recommendedModels = ref<ClineModel[]>(cachedRecommended ?? [])
  const clinePassModels = ref<ClineModel[]>(cachedClinePass ?? [])
  const clineCloudModels = ref<ClineModel[]>(cachedClineCloud ?? [])

  // ── 搜索状态 ──
  /** 是否已至少完成一次加载（用于区分「暂无数据」与「尚未加载」） */
  const searched = ref(false)
  const searching = ref(false)
  const searchError = ref(false)
  /** 全量结果（展示数量由 visibleSearchResults 控制） */
  const searchResults = ref<ClineModel[]>([])
  /** 当前结果对应的关键词；空串表示进入搜索页时加载的默认列表 */
  const searchKeyword = ref('')
  /** 当前已展示的结果数（每次搜索重置为本页大小；「加载更多」每次累加 SEARCH_PAGE_SIZE） */
  const visibleCount = ref(SEARCH_PAGE_SIZE)

  /** 实际渲染的结果：只展示前 visibleCount 个 */
  const visibleSearchResults = computed(() => searchResults.value.slice(0, visibleCount.value))
  const hasMoreSearchResults = computed(() => searchResults.value.length > visibleCount.value)

  /** 真正发请求的推荐列表拉取（loading / error 只在这里翻转） */
  async function requestClineModels(): Promise<void> {
    loading.value = true
    error.value = false

    try {
      // 本地走 Vite 同源代理，线上直连 tool-proxy 绝对地址
      const res = await axios.get<ClineModelsResponse>(apiUrl(config.cline.apiBase))
      const free = Array.isArray(res.data?.free) ? res.data.free : []
      const recommended = Array.isArray(res.data?.recommended) ? res.data.recommended : []
      const clinePass = Array.isArray(res.data?.clinePass) ? res.data.clinePass : []
      const clineCloud = Array.isArray(res.data?.clineCloud) ? res.data.clineCloud : []

      cachedFree = free
      cachedRecommended = recommended
      cachedClinePass = clinePass
      cachedClineCloud = clineCloud
      cacheLoadedAt = Date.now()
      freeModels.value = free
      recommendedModels.value = recommended
      clinePassModels.value = clinePass
      clineCloudModels.value = clineCloud
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  async function fetchClineModels(): Promise<void> {
    // 缓存有效则直接复用
    if (
      cachedFree &&
      cachedRecommended &&
      cachedClinePass &&
      cachedClineCloud &&
      Date.now() - cacheLoadedAt < CACHE_TTL
    ) {
      freeModels.value = cachedFree
      recommendedModels.value = cachedRecommended
      clinePassModels.value = cachedClinePass
      clineCloudModels.value = cachedClineCloud
      return
    }

    // 已有同请求在飞则复用，避免并发重复拉取
    if (inflightFetch) return inflightFetch

    inflightFetch = requestClineModels()
    try {
      await inflightFetch
    } finally {
      inflightFetch = null
    }
  }

  /**
   * 全量目录（/cline/model/all）拉取，带缓存与并发复用。
   * 成功返回 true，失败返回 false（供搜索面板给出重试入口）。
   */
  async function fetchClineAll(): Promise<boolean> {
    // 缓存有效直接命中
    if (cachedAll && Date.now() - allLoadedAt < CACHE_TTL) return true

    // 复用正在进行的同请求
    if (!inflightAll) {
      inflightAll = (async () => {
        try {
          const res = await axios.get<ClineAllResponse>(apiUrl(config.cline.allApi))
          const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
          const normalized = raw.map(normalizeCatalogItem).filter((m): m is ClineModel => m !== null)
          cachedAll = dedupeById(normalized)
          allLoadedAt = Date.now()
          return true
        } catch {
          return false
        }
      })()
      const pending = inflightAll
      try {
        return await pending
      } finally {
        if (inflightAll === pending) inflightAll = null
      }
    }

    const ok = await inflightAll
    return ok && cachedAll !== null
  }

  /** 本地过滤：在全量目录里按关键词匹配（关键词为空则返回完整目录） */
  function filterAllModels(query: string): ClineModel[] {
    const needle = query.toLowerCase()
    const pool = cachedAll ?? []
    return needle ? pool.filter((model) => matchesKeyword(model, needle)) : pool
  }

  /**
   * 加载搜索结果
   * @param query 关键词，空串表示加载默认列表（完整目录）
   */
  async function loadSearchResults(query: string): Promise<void> {
    searching.value = true
    searchError.value = false
    searchResults.value = []
    searchKeyword.value = query
    // 每次搜索都重置展示数量，回到每页起始大小
    visibleCount.value = SEARCH_PAGE_SIZE

    try {
      // 全量目录是搜索的数据源；拉取失败时给出重试入口，而不是谎报「无结果」
      const ok = await fetchClineAll()
      if (!ok) {
        await waitPanelShown()
        searchError.value = true
        return
      }
      // 等 loading 真正可见再开始计算，否则动画会在离场过渡期间被白白耗掉
      await waitPanelShown()
      searchResults.value = filterAllModels(query)
    } finally {
      // 兜住过快的响应，避免 loading 一闪而过
      const elapsed = panelShownAt ? Date.now() - panelShownAt : MIN_LOADING_MS
      if (elapsed < MIN_LOADING_MS) await delay(MIN_LOADING_MS - elapsed)
      searching.value = false
      searched.value = true
    }
  }

  /** 进入搜索页时调用：立刻加载默认列表（完整目录） */
  async function loadDefaultSearch(): Promise<void> {
    await loadSearchResults('')
  }

  /** 按关键词搜索；关键词为空时回到默认列表 */
  async function searchModels(keyword: string): Promise<void> {
    await loadSearchResults(keyword.trim())
  }

  /** 「加载更多」：再多展示 SEARCH_PAGE_SIZE 个 */
  function showMoreSearchResults(): void {
    visibleCount.value += SEARCH_PAGE_SIZE
  }

  /** 离开搜索页：作废「面板已可见」状态，下次进入重新计时 */
  function resetSearchPanelShown(): void {
    resetPanelShown()
  }

  return {
    loading,
    error,
    freeModels,
    recommendedModels,
    clinePassModels,
    clineCloudModels,
    fetchClineModels,
    // 搜索
    searched,
    searching,
    searchError,
    searchResults,
    visibleSearchResults,
    hasMoreSearchResults,
    visibleCount,
    searchKeyword,
    loadDefaultSearch,
    searchModels,
    showMoreSearchResults,
    resetSearchPanelShown,
  }
}