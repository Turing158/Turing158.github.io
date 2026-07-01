/**
 * 工具视图
 *
 * 卡片网格 + 弹窗 + 动态组件渲染
 * 每个工具的具体逻辑分散到 src/components/tools/*.vue
 */
<template>
  <div class="tools-view">
    <h1 class="page-title">{{ $t('tools.title') }}</h1>
    <p class="page-desc">{{ $t('tools.description') }}</p>

    <div v-if="showCards" class="tools-grid">
      <div
        v-for="(tool, index) in tools"
        :key="tool.component"
        class="tool-card"
        :class="{ 'card-visible': cardVisibleStates[tool.component] }"
        :style="{ '--card-index': index }"
        @click="openTool(tool)"
      >
        <div class="tool-icon">{{ tool.icon }}</div>
        <h3 class="tool-name">{{ tool.name }}</h3>
        <p class="tool-desc">{{ tool.description }}</p>
        <div class="tool-tags">
          <span v-for="tag in tool.tags" :key="tag" class="tool-tag">{{ tag }}</span>
        </div>
      </div>
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

      <component
        :is="currentComponent"
        v-if="activeTool"
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
import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogDialog from '@/components/common/BlogDialog.vue'
import {
  JsonFormatterTool,
  Base64Tool,
  RegexTool,
  ColorConverterTool,
  TimestampConverterTool,
  TextCounterTool,
  RandomGeneratorTool,
  RandomStringGeneratorTool,
  HolidayQueryTool,
  Md5Tool,
  ShaTool,
  DiffCheckerTool,
  CodeRunnerTool,
  ApiTestTool,
  SqlFormatterTool,
  CronEditorTool,
  PasswordStrengthTool,
  LoremIpsumTool,
  SeparatorEditorDialog,
} from '@/components/tools'
import { usePageSeo } from '@/composables/useSeo'
import { useAchievements } from '@/composables/useAchievements'

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

// 组件映射：字符串名 → Vue 组件
const componentMap: Record<string, any> = {
  JsonFormatter: JsonFormatterTool,
  Base64Tool,
  RegexTool,
  ColorConverter: ColorConverterTool,
  TimestampConverter: TimestampConverterTool,
  TextCounter: TextCounterTool,
  RandomGenerator: RandomGeneratorTool,
  RandomStringGenerator: RandomStringGeneratorTool,
  HolidayQueryTool,
  Md5Tool,
  ShaTool,
  DiffCheckerTool,
  CodeRunnerTool,
  ApiTestTool,
  SqlFormatterTool,
  CronEditorTool,
  PasswordStrengthTool,
  LoremIpsumTool,
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
  { key: 'passwordStrength', component: 'PasswordStrengthTool', icon: '🔒' },
  { key: 'loremIpsum', component: 'LoremIpsumTool', icon: '📝' },
] as const

const tools = computed<Tool[]>(() =>
  toolKeys.map(({ key, component, icon }) => ({
    name: t(`tools.${key}Name`),
    icon,
    description: t(`tools.${key}Desc`),
    tags: tm(`tools.${key}Tags`) as string[],
    component,
  }))
)

const activeTool = ref<Tool | null>(null)
const dialogOpen = ref(false)
const showCards = ref(false)
const cardVisibleStates = ref<Record<string, boolean>>({})

const currentComponent = computed(() => {
  if (!activeTool.value) return null
  return componentMap[activeTool.value.component] || null
})

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
  useAchievements().unlock('find-sperate-option')
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
  dialogOpen.value = true

  // 成就系统：记录工具使用（用于 tool-master 成就：使用全部 17 个工具）
  useAchievements().handleToolUse(tool.component)
}

function onDialogOpen() {
  nextTick(() => {
    // dialog opened
  })
}

function onDialogClose() {
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
</style>
