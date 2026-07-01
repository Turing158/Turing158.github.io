/**
 * 成就/徽章系统 — 状态管理
 *
 * 采用 singleton 模式（类似 useTheme.ts），
 * 通过 localStorage 持久化已解锁成就和系统状态。
 */
import { computed, ref, watch } from 'vue'
import confetti from 'canvas-confetti'
import { ACHIEVEMENTS } from '@/data/achievements'
import type { Achievement, AchievementCategory } from '@/data/achievements'

// ===== 常量 =====
const STORAGE_KEY = 'blog-achievements'

// ===== 持久化状态接口 =====
interface PersistedState {
  /** 已解锁的成就 ID 列表 */
  unlockedIds: string[]
  /** 彩蛋导航是否已解锁 */
  navUnlocked: boolean
  /** 已访问过的路由名 */
  visitedRoutes: string[]
  /** 已使用过的主题名 */
  usedThemes: string[]
  /** 已访问过的发行页 ID（用于 release-two-visit 成就） */
  visitedReleases: string[]
  /** 已使用过的工具 ID（用于 tool-master 成就） */
  usedTools: string[]
  /** 已访问过的文章 slug（用于 bookworm 成就） */
  visitedArticles: string[]
  /** 已访问过的项目提交页 repo（用于 project-explorer 成就） */
  visitedProjectRepos: string[]
}

// ===== 默认持久化状态 =====
function defaultState(): PersistedState {
  return {
    unlockedIds: [],
    navUnlocked: false,
    visitedRoutes: [],
    usedThemes: [],
    visitedReleases: [],
    usedTools: [],
    visitedArticles: [],
    visitedProjectRepos: [],
  }
}

// ===== 带解锁状态的成就类型 =====
export interface AchievementWithState extends Achievement {
  unlocked: boolean
  unlockedAt: number | null
}

// ===== 从 localStorage 加载持久化状态 =====
function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      return {
        unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
        navUnlocked: !!parsed.navUnlocked,
        visitedRoutes: Array.isArray(parsed.visitedRoutes) ? parsed.visitedRoutes : [],
        usedThemes: Array.isArray(parsed.usedThemes) ? parsed.usedThemes : [],
        visitedReleases: Array.isArray(parsed.visitedReleases) ? parsed.visitedReleases : [],
        usedTools: Array.isArray(parsed.usedTools) ? parsed.usedTools : [],
        visitedArticles: Array.isArray(parsed.visitedArticles) ? parsed.visitedArticles : [],
        visitedProjectRepos: Array.isArray(parsed.visitedProjectRepos) ? parsed.visitedProjectRepos : [],
      }
    }
  } catch {
    // JSON 解析失败时忽略
  }
  return defaultState()
}

// ===== 持久化到 localStorage =====
function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage 不可用时忽略
  }
}

// ===== 解锁时间记录（非持久化，仅会话内跟踪最新解锁）=====
const unlockTimestamps = new Map<string, number>()

// ===== 模块级状态（singleton）=====
const state = ref<PersistedState>(loadState())

// ===== 找到最新的解锁 ID =====
function findLatestUnlockId(): string | null {
  let latestId: string | null = null
  let latestTime = 0
  for (const id of state.value.unlockedIds) {
    const ts = unlockTimestamps.get(id) ?? 0
    if (ts > latestTime) {
      latestTime = ts
      latestId = id
    }
  }
  return latestId
}

// ===== 所有成就及其解锁状态 =====
const achievements = computed<AchievementWithState[]>(() => {
  const unlockedIds = state.value.unlockedIds
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
    unlockedAt: unlockTimestamps.get(a.id) ?? null,
  }))
})

const unlockedCount = computed(() => state.value.unlockedIds.length)
const totalCount = ACHIEVEMENTS.length
const progress = computed(() =>
  totalCount > 0 ? Math.round((unlockedCount.value / totalCount) * 100) : 0
)
const isNavUnlocked = computed(() => state.value.navUnlocked)

const latestUnlocked = computed<AchievementWithState | null>(() => {
  const id = findLatestUnlockId()
  if (!id) return null
  return achievements.value.find((a) => a.id === id) ?? null
})

// ===== 按分类获取成就 =====
function getByCategory(category: AchievementCategory | 'all'): AchievementWithState[] {
  if (category === 'all') return achievements.value
  return achievements.value.filter((a) => a.category === category)
}

// ===== 添加已访问路由 =====
function addVisitedRoute(routeName: string) {
  if (!state.value.visitedRoutes.includes(routeName)) {
    state.value.visitedRoutes = [...state.value.visitedRoutes, routeName]
    persist()
  }
}

// ===== 添加已使用主题 =====
function addUsedTheme(theme: string) {
  if (!state.value.usedThemes.includes(theme)) {
    state.value.usedThemes = [...state.value.usedThemes, theme]
    persist()
  }
}

// ===== 添加已使用工具 =====
function addUsedTool(toolId: string) {
  if (!state.value.usedTools.includes(toolId)) {
    state.value.usedTools = [...state.value.usedTools, toolId]
    persist()
    checkToolMaster()
    checkConditionalAchievements()
  }
}

// ===== 添加已访问文章 =====
function addVisitedArticle(slug: string) {
  if (!state.value.visitedArticles.includes(slug)) {
    state.value.visitedArticles = [...state.value.visitedArticles, slug]
    persist()
    checkBookworm()
    checkConditionalAchievements()
  }
}

// ===== 添加已访问发行页 =====
function addVisitedRelease(repo: string) {
  if (!state.value.visitedReleases.includes(repo)) {
    state.value.visitedReleases = [...state.value.visitedReleases, repo]
    persist()
    checkReleaseTwoVisit()
    checkConditionalAchievements()
  }
}

// ===== 添加已访问项目提交页 =====
function addVisitedProjectRepo(repo: string) {
  if (!state.value.visitedProjectRepos.includes(repo)) {
    state.value.visitedProjectRepos = [...state.value.visitedProjectRepos, repo]
    persist()
    checkProjectExplorer()
    checkConditionalAchievements()
  }
}

// ===== 检查 tool-master 成就（使用全部 17 个工具）=====
function checkToolMaster() {
  if (isUnlocked('tool-master')) return
  // 工具总数为 17，全部使用过即解锁
  if (state.value.usedTools.length >= 17) {
    doUnlock('tool-master')
  }
}

// ===== 检查 bookworm 成就（访问 5 篇不同文章）=====
function checkBookworm() {
  if (isUnlocked('bookworm')) return
  if (state.value.visitedArticles.length >= 5) {
    doUnlock('bookworm')
  }
}

// ===== 检查 project-explorer 成就（访问 3 个不同项目提交页）=====
function checkProjectExplorer() {
  if (isUnlocked('project-explorer')) return
  if (state.value.visitedProjectRepos.length >= 3) {
    doUnlock('project-explorer')
  }
}

// ===== 检查 release-two-visit 成就（查看 2 个发行页）=====
function checkReleaseTwoVisit() {
  if (isUnlocked('release-two-visit')) return
  if (state.value.visitedReleases.length >= 2) {
    doUnlock('release-two-visit')
  }
}

// ===== 检查成就是否已解锁 =====
function isUnlocked(id: string): boolean {
  return state.value.unlockedIds.includes(id)
}

// ===== 检查条件型成就（主题跳跳虎、成就收藏家）=====
function checkConditionalAchievements() {
  // 主题跳跳虎：使用过所有主题
  if (!isUnlocked('theme-hopper')) {
    const allThemes = ['forest', 'ocean', 'sunset', 'dark']
    const allUsed = allThemes.every((t) => state.value.usedThemes.includes(t))
    if (allUsed) {
      doUnlock('theme-hopper')
    }
  }

  // 成就收藏家：解锁所有其他成就
  if (!isUnlocked('achievement-collector')) {
    const otherAchievements = ACHIEVEMENTS.filter((a) => a.id !== 'achievement-collector')
    const allUnlocked = otherAchievements.every((a) => state.value.unlockedIds.includes(a.id))
    if (allUnlocked) {
      doUnlock('achievement-collector')
    }
  }
}

// ===== 内部解锁逻辑（含彩带 + toast 通知）=====
function doUnlock(id: string) {
  if (state.value.unlockedIds.includes(id)) return
  state.value.unlockedIds = [...state.value.unlockedIds, id]
  unlockTimestamps.set(id, Date.now())
  persist()
  fireConfetti()
  // 通过自定义事件通知 App 显示 toast
  const achievement = ACHIEVEMENTS.find((a) => a.id === id)
  if (achievement && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('achievement-unlock', {
        detail: { id: achievement.id, name: achievement.name, nameEn: achievement.nameEn },
      })
    )
  }
  checkConditionalAchievements()
}

// ===== 外部解锁接口 =====
function unlock(id: string) {
  if (isUnlocked(id)) return
  doUnlock(id)
}

// ===== 解锁隐藏导航 =====
function unlockNav() {
  if (state.value.navUnlocked) return
  state.value.navUnlocked = true
  persist()
}

// ===== 小规模 confetti 庆祝 =====
function fireConfetti() {
  const defaults = {
    spread: 60,
    ticks: 80,
    gravity: 0.5,
    decay: 0.94,
    startVelocity: 25,
    colors: ['#FFD700', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c084fc'],
  }
  confetti({
    ...defaults,
    angle: 90,
    origin: { x: 0.5, y: 0.3 },
    particleCount: 60,
    spread: 100,
  })
  setTimeout(() => {
    confetti({
      ...defaults,
      angle: 90,
      origin: { x: 0.5, y: 0.3 },
      particleCount: 30,
      spread: 60,
      startVelocity: 20,
    })
  }, 150)
}

// ===== 持久化 =====
function persist() {
  persistState(state.value)
}

// ===== 时间检查（夜猫子、早起鸟）=====
function checkTimeAchievements() {
  const hour = new Date().getHours()
  // 夜猫子：0-5 点
  if (hour >= 0 && hour < 6 && !isUnlocked('night-owl')) {
    doUnlock('night-owl')
  }
  // 早起鸟：6-7 点（6:00–6:59）
  if (hour === 6 && !isUnlocked('early-bird')) {
    doUnlock('early-bird')
  }
}

// ===== 触发一次访问页面的成就检查 =====
function handleRouteVisit(routeName: string) {
  // 记录访问
  addVisitedRoute(routeName)

  // 检查页面级成就（如果是首次访问该页面）
  if (routeName === 'home' && !isUnlocked('first-steps')) {
    unlock('first-steps')
  }
}

// ===== 处理工具使用 =====
function handleToolUse(toolId: string) {
  addUsedTool(toolId)
}

// ==================== 导出（singleton composable）====================
export function useAchievements() {
  // 初始化时检查时间成就
  checkTimeAchievements()

  // 响应式监听 state 的变化（写给 watcher 用）
  watch(state.value, () => persist(), { deep: true })

  return {
    /** 所有成就及其解锁状态 */
    achievements,
    /** 已解锁数量 */
    unlockedCount,
    /** 成就总数 */
    totalCount,
    /** 进度百分比（0-100） */
    progress,
    /** 导航是否已解锁 */
    isNavUnlocked,
    /** 最近解锁的成就 */
    latestUnlocked,
    /** 持久化状态（只读，外部用于检查 visitedRoutes/usedThemes） */
    state,

    /** 按分类筛选成就 */
    getByCategory,
    /** 解锁成就（带 confetti 庆祝 + toast 通知） */
    unlock,
    /** 尝试解锁，已解锁则忽略 */
    tryUnlock: unlock,
    /** 检查是否已解锁 */
    isUnlocked,
    /** 解锁隐藏导航入口 */
    unlockNav,
    /** 记录路由访问（触发页面级成就检查） */
    handleRouteVisit,
    /** 记录工具使用（触发工具类成就） */
    handleToolUse,
    /** 添加已使用主题 */
    addUsedTheme,
    /** 添加已访问文章 */
    addVisitedArticle,
    /** 添加已访问发行页 */
    addVisitedRelease,
    /** 添加已访问项目提交页 */
    addVisitedProjectRepo,
    /** 检查条件型成就 */
    checkConditionalAchievements,
  }
}
