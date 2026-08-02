/**
 * 工具视图
 *
 * 卡片网格 + 弹窗 + 动态组件渲染
 * 每个工具的具体逻辑分散到 src/components/tools/*.vue
 *
 * 性能策略：
 * 1. 工具组件 defineAsyncComponent 按需加载，避免进入页面时全量同步 import
 * 2. Dialog 先出壳，内容延后到下一帧再挂载，避免挂载与进场动画抢主线程
 */
<template>
  <div class="tools-view">
    <h1 class="page-title">{{ $t('tools.title') }}</h1>
    <div class="page-header">
      <p class="page-desc">{{ $t('tools.description') }}</p>
      <button
        v-if="orderChanged"
        class="tools-reset-btn"
        :title="$t('tools.resetOrder')"
        @click="resetOrder"
      >{{ $t('tools.resetOrder') }}</button>
    </div>

    <div v-if="showCards" class="tools-grid">
      <div
        v-for="(tool, index) in tools"
        :key="tool.component"
        class="tool-card"
        :class="{
          'card-visible': cardVisibleStates[tool.component],
          'is-dragging': draggingComponent === tool.component,
        }"
        :style="{ '--card-index': index }"
        @click="openTool(tool)"
      >
        <span
          class="tool-drag-handle"
          :title="$t('tools.dragToReorder')"
          @pointerdown.stop="onHandlePointerDown($event, tool.component)"
        >
          <SidebarIcon name="gripVertical" :size="14" />
        </span>
        <div class="tool-icon">{{ tool.icon }}</div>
        <h3 class="tool-name">{{ tool.name }}</h3>
        <p class="tool-desc">{{ tool.description }}</p>
        <div class="tool-tags">
          <span v-for="tag in tool.tags" :key="tag" class="tool-tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <!-- 拖拽浮动副本（跟随光标） -->
    <div
      v-if="draggingComponent"
      class="tool-card drag-ghost"
      :style="{ left: dragPos.x + 'px', top: dragPos.y + 'px' }"
    >
      <span class="tool-drag-handle tool-drag-handle--active">
        <SidebarIcon name="gripVertical" :size="14" />
      </span>
      <div class="tool-icon">{{ tools.find((t) => t.component === draggingComponent)?.icon }}</div>
      <h3 class="tool-name">{{ tools.find((t) => t.component === draggingComponent)?.name }}</h3>
      <p class="tool-desc">{{ tools.find((t) => t.component === draggingComponent)?.description }}</p>
    </div>

    <!-- 工具弹窗 -->
    <BlogDialog
      v-model="dialogOpen"
      width="640px"
      max-width="90vw"
      max-height="80vh"
      @open="onDialogOpen"
      @close="onDialogClose"
    >
      <template v-if="activeTool" #title>
        <span class="modal-icon">{{ activeTool.icon }}</span>
        <span class="modal-title-text">{{ activeTool.name }}</span>
      </template>

      <!-- 延迟挂载：先让 Dialog 壳完成首帧，再加载工具内容 -->
      <div v-if="activeTool && !contentReady" class="tool-content-placeholder" aria-hidden="true">
        <div class="tool-content-spinner" />
      </div>
      <component
        :is="currentComponent"
        v-else-if="activeTool && contentReady"
        :separator="randomSeparator"
        @request-separator-edit="onToolRequestSeparatorEdit"
      />
    </BlogDialog>

    <!-- 分隔符编辑弹窗（随机数 / 随机字符串 共用） -->
    <SeparatorEditorDialog
      v-model="showSeparatorEditor"
      :value="randomSeparator"
      :preview-samples="separatorPreviewSamples"
      @confirm="onSeparatorConfirm"
      @cancel="onSeparatorCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, defineAsyncComponent, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogDialog from '@/components/common/BlogDialog.vue'
import SidebarIcon from '@/components/sidebar/SidebarIcon.vue'
import { usePageSeo } from '@/composables/useSeo'
import { useAchievements } from '@/composables/useAchievements'
import { registerContextProvider } from '@/composables/contextMenuRegistry'

// 分隔符编辑弹窗：低频使用，异步加载
const SeparatorEditorDialog = defineAsyncComponent(
  () => import('@/components/tools/SeparatorEditorDialog.vue')
)

// SEO
usePageSeo('工具', '开发者工具集：JSON格式化、Base64编解码、正则测试、颜色转换等', '#/tools')

interface Tool {
  name: string
  icon: string
  description: string
  tags: string[]
  component: string
}

const { t, tm } = useI18n()

// 组件映射：字符串名 → 异步组件（按需加载，避免 Tools 页全量同步导入）
const componentMap: Record<string, Component> = {
  JsonFormatter: defineAsyncComponent(() => import('@/components/tools/JsonFormatterTool.vue')),
  Base64Tool: defineAsyncComponent(() => import('@/components/tools/Base64Tool.vue')),
  RegexTool: defineAsyncComponent(() => import('@/components/tools/RegexTool.vue')),
  ColorConverter: defineAsyncComponent(() => import('@/components/tools/ColorConverterTool.vue')),
  TimestampConverter: defineAsyncComponent(() => import('@/components/tools/TimestampConverterTool.vue')),
  TextCounter: defineAsyncComponent(() => import('@/components/tools/TextCounterTool.vue')),
  RandomGenerator: defineAsyncComponent(() => import('@/components/tools/RandomGeneratorTool.vue')),
  RandomStringGenerator: defineAsyncComponent(() => import('@/components/tools/RandomStringGeneratorTool.vue')),
  HolidayQueryTool: defineAsyncComponent(() => import('@/components/tools/HolidayQueryTool.vue')),
  Md5Tool: defineAsyncComponent(() => import('@/components/tools/Md5Tool.vue')),
  ShaTool: defineAsyncComponent(() => import('@/components/tools/ShaTool.vue')),
  DiffCheckerTool: defineAsyncComponent(() => import('@/components/tools/DiffCheckerTool.vue')),
  CodeRunnerTool: defineAsyncComponent(() => import('@/components/tools/CodeRunnerTool.vue')),
  ApiTestTool: defineAsyncComponent(() => import('@/components/tools/ApiTestTool.vue')),
  SqlFormatterTool: defineAsyncComponent(() => import('@/components/tools/SqlFormatterTool.vue')),
  CronEditorTool: defineAsyncComponent(() => import('@/components/tools/CronEditorTool.vue')),
  TokenUsageChartTool: defineAsyncComponent(() => import('@/components/tools/TokenUsageChartTool.vue')),
  PasswordStrengthTool: defineAsyncComponent(() => import('@/components/tools/PasswordStrengthTool.vue')),
  LoremIpsumTool: defineAsyncComponent(() => import('@/components/tools/LoremIpsumTool.vue')),
  ClineModelsTool: defineAsyncComponent(() => import('@/components/tools/ClineModelsTool.vue')),
}

// 工具元数据
const toolKeys = [
  { key: 'jsonFormatter', component: 'JsonFormatter', icon: '📋' },
  { key: 'base64', component: 'Base64Tool', icon: '🔐' },
  { key: 'regex', component: 'RegexTool', icon: '🔍' },
  { key: 'color', component: 'ColorConverter', icon: '🎨' },
  { key: 'timestamp', component: 'TimestampConverter', icon: '⏰' },
  { key: 'textCounter', component: 'TextCounter', icon: '📊' },
  { key: 'randomGenerator', component: 'RandomGenerator', icon: '🎲' },
  { key: 'randomString', component: 'RandomStringGenerator', icon: '🔤' },
  { key: 'holidayQuery', component: 'HolidayQueryTool', icon: '🎉' },
  { key: 'md5', component: 'Md5Tool', icon: '🔑' },
  { key: 'sha', component: 'ShaTool', icon: '🔒' },
  { key: 'diff', component: 'DiffCheckerTool', icon: '📑' },
  { key: 'codeRunner', component: 'CodeRunnerTool', icon: '▶' },
  { key: 'apiTest', component: 'ApiTestTool', icon: '🌐' },
  { key: 'sqlFormatter', component: 'SqlFormatterTool', icon: '🗃️' },
  { key: 'cronEditor', component: 'CronEditorTool', icon: '⏱️' },
  { key: 'tokenUsageChart', component: 'TokenUsageChartTool', icon: '📈' },
  { key: 'passwordStrength', component: 'PasswordStrengthTool', icon: '🔒' },
  { key: 'loremIpsum', component: 'LoremIpsumTool', icon: '📝' },
  { key: 'clineModels', component: 'ClineModelsTool', icon: '🤖' },
] as const

// 工具卡片自定义顺序（持久化到 localStorage）
const ORDER_KEY = 'blog-tools-order'

// 读取持久化顺序,与当前 toolKeys 合并:剔除失效 key,补齐新增 key 到末尾
function loadOrderedComponents(): string[] {
  const defaults = toolKeys.map((k) => k.component) // 默认顺序
  let saved: string[] = []
  try {
    const raw = localStorage.getItem(ORDER_KEY)
    if (raw) saved = JSON.parse(raw)
    if (!Array.isArray(saved)) saved = []
  } catch {
    saved = []
  }

  const validSet = new Set<string>(defaults)
  const valid = saved.filter((k) => validSet.has(k)) // 剔除失效 key
  const seen = new Set(valid)
  defaults.forEach((k) => {
    if (!seen.has(k)) valid.push(k) // 补齐新增 key 到末尾
  })
  return valid
}

const orderedComponents = ref<string[]>(loadOrderedComponents())

function persistOrder() {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(orderedComponents.value))
  } catch {
    /* 忽略 localStorage 异常 */
  }
}

// 重置为默认顺序
function resetOrder() {
  orderedComponents.value = toolKeys.map((k) => k.component)
  persistOrder()
}

// 是否已偏离默认顺序（决定「重置顺序」按钮是否显示）
const orderChanged = computed(
  () =>
    orderedComponents.value.length !== toolKeys.length ||
    orderedComponents.value.some((c, i) => c !== toolKeys[i].component),
)

const tools = computed<Tool[]>(() =>
  orderedComponents.value
    .map((component) => {
      const meta = toolKeys.find((k) => k.component === component)
      if (!meta) return null
      return {
        name: t(`tools.${meta.key}Name`),
        icon: meta.icon,
        description: t(`tools.${meta.key}Desc`),
        tags: tm(`tools.${meta.key}Tags`) as string[],
        component: meta.component,
      } as Tool
    })
    .filter((x): x is Tool => x !== null),
)

const activeTool = ref<Tool | null>(null)
const dialogOpen = ref(false)
const contentReady = ref(false)
const showCards = ref(false)
const cardVisibleStates = ref<Record<string, boolean>>({})

// 成就系统：setup 中取一次，避免每次 openTool 重复调用 composable
const achievements = useAchievements()

let contentReadyRaf = 0
let contentReadyTimer: ReturnType<typeof setTimeout> | null = null

const currentComponent = computed(() => {
  if (!activeTool.value) return null
  return componentMap[activeTool.value.component] || null
})

// ── 拖拽重排（长按 0.5s 进入,松手按落点插入并持久化）──
// 范式参照 MainLayout.vue 的折叠按钮拖拽 + RandomGeneratorTool 的 pointer 长按
const draggingComponent = ref<string | null>(null)
const dragPos = ref({ x: 0, y: 0 }) // 浮动副本跟随光标的位置
const LONG_PRESS_MS = 500
const MOVE_THRESHOLD = 4

let pressStartX = 0
let pressStartY = 0
let dragStartIndex = -1
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let hasMoved = false

function onHandlePointerDown(e: PointerEvent, component: string) {
  if (!showCards.value) return
  if (e.pointerType === 'mouse' && e.button !== 0) return // 仅左键
  pressStartX = e.clientX
  pressStartY = e.clientY
  hasMoved = false
  dragStartIndex = orderedComponents.value.indexOf(component)
  longPressTimer = setTimeout(() => {
    if (!hasMoved) {
      draggingComponent.value = component
      dragPos.value = { x: pressStartX, y: pressStartY }
    }
  }, LONG_PRESS_MS)
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (
    Math.abs(e.clientX - pressStartX) > MOVE_THRESHOLD ||
    Math.abs(e.clientY - pressStartY) > MOVE_THRESHOLD
  ) {
    hasMoved = true
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }
  if (draggingComponent.value) {
    e.preventDefault() // 仅拖拽中阻止滚动,不影响长按计时
    dragPos.value = { x: e.clientX, y: e.clientY }
  }
}

function onPointerUp(e: PointerEvent) {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (draggingComponent.value) {
    const targetIndex = computeDropIndex(e.clientX, e.clientY)
    if (targetIndex !== -1 && targetIndex !== dragStartIndex && dragStartIndex !== -1) {
      const arr = [...orderedComponents.value]
      const [moved] = arr.splice(dragStartIndex, 1)
      arr.splice(targetIndex, 0, moved)
      orderedComponents.value = arr
      persistOrder()
    }
    draggingComponent.value = null
  }
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
}

// 落点 → 目标插入索引（遍历卡片,落在哪张的范围内,再按中线判断插 i 或 i+1）
function computeDropIndex(x: number, y: number): number {
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.tool-card:not(.drag-ghost)'))
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect()
    const inCol = x >= r.left - 8 && x <= r.right + 8
    const inRow = y >= r.top - 8 && y <= r.bottom + 8
    if (inCol && inRow) {
      const midX = r.left + r.width / 2
      // 水平网格:auto-fill,落点偏左则插 i,偏右则 i+1
      const before = x < midX
      return before ? i : i + 1
    }
  }
  return -1
}

function cancelDrag() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  draggingComponent.value = null
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
}

function cancelDeferredContent() {
  if (contentReadyRaf) {
    cancelAnimationFrame(contentReadyRaf)
    contentReadyRaf = 0
  }
  if (contentReadyTimer !== null) {
    clearTimeout(contentReadyTimer)
    contentReadyTimer = null
  }
}

function scheduleContentMount() {
  cancelDeferredContent()
  contentReady.value = false
  // 双 rAF：等 Dialog 壳完成布局/进场启动后再挂工具，避免同帧长任务
  contentReadyRaf = requestAnimationFrame(() => {
    contentReadyRaf = requestAnimationFrame(() => {
      contentReadyRaf = 0
      // 再让出一次事件循环，给 Transition 启动留出空隙
      contentReadyTimer = setTimeout(() => {
        contentReadyTimer = null
        if (dialogOpen.value && activeTool.value) {
          contentReady.value = true
        }
      }, 0)
    })
  })
}

// 分隔符编辑（随机数 / 随机字符串 共用）
const SEPARATOR_KEY = 'blog-random-separator'
const localStorageVal = typeof localStorage !== 'undefined' ? localStorage.getItem(SEPARATOR_KEY) : null
const randomSeparator = ref<string>(localStorageVal ?? ' ')
const showSeparatorEditor = ref(false)
const separatorSource = ref<'number' | 'string'>('number')
const separatorPreviewSamples = ref<string[]>([])

function onToolRequestSeparatorEdit() {
  // 从当前激活的工具推断来源
  if (activeTool.value?.component === 'RandomStringGenerator') {
    onRequestSeparatorEdit('string')
  } else {
    onRequestSeparatorEdit('number')
  }
}

function onRequestSeparatorEdit(source: 'number' | 'string') {
  separatorSource.value = source
  separatorPreviewSamples.value = []
  showSeparatorEditor.value = true
  // 成就系统：第一次打开分隔符设置即解锁
  achievements.unlock('find-sperate-option')
}

function onSeparatorConfirm(separator: string) {
  randomSeparator.value = separator
  try { localStorage.setItem(SEPARATOR_KEY, separator) } catch {}
}

function onSeparatorCancel() {
  // noop
}

// 打开工具
function openTool(tool: Tool) {
  activeTool.value = tool
  contentReady.value = false
  dialogOpen.value = true
  scheduleContentMount()

  // 成就系统：记录工具使用（用于 tool-master 成就：使用全部 17 个工具）
  // 延后到下一宏任务，避免与 Dialog 打开同帧竞争
  setTimeout(() => {
    achievements.handleToolUse(tool.component)
  }, 0)
}

function onDialogOpen() {
  // BlogDialog 打开回调：若内容尚未调度，补一次
  if (activeTool.value && !contentReady.value) {
    scheduleContentMount()
  }
}

function onDialogClose() {
  cancelDeferredContent()
  contentReady.value = false
  activeTool.value = null
  // 分隔符编辑在关闭时已被销毁，无需手动清理
}

onMounted(async () => {
  await nextTick()
  showCards.value = true
  tools.value.forEach((tool, index) => {
    setTimeout(() => {
      cardVisibleStates.value[tool.component] = true
    }, index * 80)
  })
})

// ── 右键菜单上下文提供者 ──
const unregisterContextMenu = registerContextProvider((target) => {
  // 仅在工具卡片上右键时提供
  const card = target.closest('.tool-card') as HTMLElement | null
  if (!card) return []

  // 从卡片中查找对应的工具
  const toolName = card.querySelector('.tool-name')?.textContent || ''
  const tool = tools.value.find(t => t.name === toolName)
  if (!tool) return []

  const items = []

  // 打开工具
  items.push({
    id: 'open-tool',
    label: t('contextMenu.openTool'),
    icon: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    action: () => {
      openTool(tool)
    },
  })

  return items
})

onUnmounted(() => {
  cancelDeferredContent()
  unregisterContextMenu()
  cancelDrag()
})
</script>

<style>
/* 以下样式由 ToolsView 父作用域提供，子组件通过非 scoped 选择器继承 */
.tools-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.page-desc {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 0.95rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  position: relative;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  cursor: pointer;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tool-card.card-visible {
  opacity: 1;
  transform: translateY(0);
}

.tool-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px var(--shadow);
  border-color: var(--accent);
}

.tool-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.tool-name {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.tool-desc {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.6;
  margin-bottom: 12px;
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tool-tag {
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
  cursor: default;
}

.tool-tag:hover {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
  transform: scale(1.08);
}

/* 工具内容延迟挂载占位 */
.tool-content-placeholder {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-content-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: tool-spin 0.7s linear infinite;
}

@keyframes tool-spin {
  to { transform: rotate(360deg); }
}

/* Modal title */
.modal-icon {
  font-size: 1.5rem;
}

.modal-title-text {
  font-size: 1.2rem;
  color: var(--text-primary);
}

/* 工具表单共享样式 —— 子组件继承 */
.tool-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.tool-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tool-output {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow-y: auto;
  color: var(--text-primary);
  margin: 0;
}

/* 标题区 + 重置顺序按钮 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 32px;
}

.page-header .page-desc {
  margin-bottom: 0;
}

.tools-reset-btn {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.tools-reset-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg-secondary);
}

/* 拖拽手柄（右上角，hover 卡片时显示） */
.tool-drag-handle {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s, color 0.2s;
  touch-action: none; /* 让 pointer 事件不被滚动抢占 */
}

.tool-card:hover .tool-drag-handle {
  opacity: 0.55;
}

.tool-drag-handle:hover {
  opacity: 1;
  background: var(--bg-secondary);
  color: var(--accent);
}

.tool-drag-handle:active {
  cursor: grabbing;
}

.tool-drag-handle--active {
  opacity: 1;
}

/* 拖拽中：原位卡片半透明 */
.tool-card.is-dragging {
  opacity: 0.3;
  transform: scale(0.98);
}

/* 拖拽浮动副本（跟随光标） */
.tool-card.drag-ghost {
  position: fixed;
  margin: 0;
  width: 280px;
  transform: translate(-50%, -50%) scale(0.96) rotate(-1.5deg);
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 12px 32px var(--shadow-strong);
  opacity: 0.95;
  transition: none;
  cursor: grabbing;
}
</style>
