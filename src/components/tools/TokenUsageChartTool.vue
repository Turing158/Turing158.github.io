/**
 * Token 用量图工具
 *
 * 上传 Token 日志文件（文件仅留在浏览器中，不上传到服务器），
 * 解析后生成可视化的 SVG 用量图表。
 *
 * 布局分为 3 个部分：
 *   1. 文件上传区（支持拖拽 + 点击选择）
 *   2. 操作按钮（生成 / 自定义样式 / 重置 / 下载）
 *   3. 预览区（展示生成的 SVG）
 *
 * 注：本次仅实现布局与样式，文件解析 / SVG 生成 / 下载逻辑以空桩函数占位。
 */
<template>
  <div class="tool-form token-usage-chart">
    <!-- 支持格式提示 -->
    <div class="tool-info-banner">
      <svg class="tool-info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6" />
        <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
      <span class="tool-info-text">{{ $t('tools.tokenUsageChart.formatHint') }}</span>
      <span class="tool-info-spacer" />
      <span class="tool-info-download-label">{{ $t('tools.tokenUsageChart.downloadScript') }}</span>
      <button type="button" class="tool-info-btn" @click="downloadScript('py')">py</button>
      <button type="button" class="tool-info-btn" @click="downloadScript('js')">js</button>
    </div>

    <!-- ── Part 1: 文件上传区 ── -->
    <label class="tool-label">{{ $t('tools.tokenUsageChart.uploadLabel') }}</label>
    <div
      class="upload-zone"
      :class="{ 'is-dragover': isDragover, 'has-files': files.length > 0 }"
      @click="triggerFileInput"
      @dragenter.prevent="isDragover = true"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept=".json,.sql"
        class="upload-input"
        @change="handleFileSelect"
      />

      <!-- 空态占位 -->
      <div v-if="files.length === 0" class="upload-placeholder">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="17 8 12 3 7 8"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="15"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="upload-title">{{ $t('tools.tokenUsageChart.uploadTitle') }}</p>
        <p class="upload-hint">{{ $t('tools.tokenUsageChart.uploadHint') }}</p>
      </div>

      <!-- 文件列表 -->
      <div v-else class="file-list">
        <div v-for="file in files" :key="file.name" class="file-item">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="14 2 14 8 20 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
          <button
            class="file-remove"
            :aria-label="$t('tools.tokenUsageChart.removeFile')"
            @click.stop="removeFile(file)"
          >
            <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Part 2: 操作按钮 ── -->
    <div class="tool-actions">
      <Button type="primary" size="small" :loading="isGenerating" @click="generate">
        {{ $t('tools.tokenUsageChart.generate') }}
      </Button>
      <Button size="small" @click="openStyleDialog">
        {{ $t('tools.tokenUsageChart.customStyle') }}
      </Button>
      <Button danger size="small" @click="reset">
        {{ $t('tools.tokenUsageChart.reset') }}
      </Button>
      <Button v-if="hasPreview" type="primary" size="small" @click="download">
        {{ $t('tools.tokenUsageChart.download') }}
      </Button>
    </div>

    <!-- ── Part 3: 预览区 ── -->
    <label class="tool-label">{{ $t('tools.tokenUsageChart.previewLabel') }}</label>
    <div class="preview-zone">
      <div v-if="!hasPreview" class="preview-empty">
        <svg class="preview-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <p>{{ $t('tools.tokenUsageChart.previewEmpty') }}</p>
      </div>
      <div v-else class="preview-svg">
        <TokenUsageChartSvg ref="previewComponentRef" :rows="parsedRows" :style-options="styleOptions" />
      </div>
    </div>
    <p v-if="hasPreview" class="preview-status">
      {{ $t('tools.tokenUsageChart.parsedCount', { count: parsedRows.length }) }}
    </p>
  </div>

  <!-- ── 自定义样式弹窗 ── -->
  <BlogDialog
    v-model="showStyleDialog"
    width="480px"
    max-width="90vw"
    :title="$t('tools.tokenUsageChart.styleDialogTitle')"
  >
    <div class="style-form">
      <!-- 颜色 -->
      <div class="style-row">
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.primaryColor') }}</label>
          <input type="color" v-model="styleOptions.primaryColor" class="color-input" />
        </div>
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.bgColor') }}</label>
          <input type="color" v-model="styleOptions.bgColor" class="color-input" />
        </div>
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.fontColor') }}</label>
          <input type="color" v-model="styleOptions.fontColor" class="color-input" />
        </div>
      </div>

      <!-- 卡片背景色 / 透明度 -->
      <div class="style-row style-row--2">
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.cardBgColor') }}</label>
          <input type="color" v-model="styleOptions.cardBgColor" class="color-input" />
        </div>
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.cardOpacity') }}</label>
          <BlogInput
            v-model="styleCardOpacity"
            type="number"
            :min="0"
            :max="100"
            :step="1"
          />
        </div>
      </div>

      <!-- 统计图样式 -->
      <div class="style-field">
        <label class="tool-label">{{ $t('tools.tokenUsageChart.statsChartType') }}</label>
        <BlogSelect
          v-model="statsChartTypeOption"
          :options="statsChartTypeOptions"
          :placeholder="$t('tools.tokenUsageChart.statsChartType')"
          :clearable="false"
        />
      </div>

      <!-- 显示项开关 + 标注颜色 -->
      <div class="style-switches">
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showTotal" />
          <span>{{ $t('tools.tokenUsageChart.showTotal') }}</span>
          <input v-if="styleOptions.showTotal" type="color" v-model="styleOptions.colorTotal" class="color-input color-input--inline" />
        </label>
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showInput" />
          <span>{{ $t('tools.tokenUsageChart.showInput') }}</span>
          <input v-if="styleOptions.showInput" type="color" v-model="styleOptions.colorInput" class="color-input color-input--inline" />
        </label>
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showOutput" />
          <span>{{ $t('tools.tokenUsageChart.showOutput') }}</span>
          <input v-if="styleOptions.showOutput" type="color" v-model="styleOptions.colorOutput" class="color-input color-input--inline" />
        </label>
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showTotalCost" />
          <span>{{ $t('tools.tokenUsageChart.showTotalCost') }}</span>
          <input v-if="styleOptions.showTotalCost" type="color" v-model="styleOptions.colorTotalCost" class="color-input color-input--inline" />
        </label>
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showCacheInput" />
          <span>{{ $t('tools.tokenUsageChart.showCacheInput') }}</span>
          <input v-if="styleOptions.showCacheInput" type="color" v-model="styleOptions.colorCacheInput" class="color-input color-input--inline" />
        </label>
        <label class="style-switch">
          <input type="checkbox" v-model="styleOptions.showCacheCreation" />
          <span>{{ $t('tools.tokenUsageChart.showCacheCreation') }}</span>
          <input v-if="styleOptions.showCacheCreation" type="color" v-model="styleOptions.colorCacheCreation" class="color-input color-input--inline" />
        </label>
      </div>

      <!-- 轴标签色 / 网格空白色 -->
      <div class="style-row style-row--2">
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.axisLabelColor') }}</label>
          <input type="color" v-model="styleOptions.axisLabelColor" class="color-input" />
        </div>
        <div class="style-field">
          <label class="tool-label">{{ $t('tools.tokenUsageChart.gridEmptyColor') }}</label>
          <input type="color" v-model="styleOptions.gridEmptyColor" class="color-input" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <Button size="small" @click="showStyleDialog = false">
          {{ $t('tools.tokenUsageChart.cancel') }}
        </Button>
        <Button type="primary" size="small" @click="applyStyle">
          {{ $t('tools.tokenUsageChart.confirm') }}
        </Button>
      </div>
    </template>
  </BlogDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, onMounted } from 'vue'
import { Button } from 'animal-island-vue'
import BlogDialog from '@/components/common/BlogDialog.vue'
import BlogInput from '@/components/common/BlogInput.vue'
import BlogSelect from '@/components/common/BlogSelect.vue'
import { parseSqlFile, type TokenUsageRow } from '@/utils/sqlLogParser'
import TokenUsageChartSvg from './TokenUsageChartSvg.vue'
import { deriveThemeBgColor, type StatsChartType, type TokenUsageStyleOptions } from './tokenUsageSvg'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeName } from '@/composables/useTheme'

interface UploadFile {
  name: string
  size: number
  raw: File
}

// ── 状态 ──
const files = ref<UploadFile[]>([])
const isDragover = ref(false)
const hasPreview = ref(false)
const showStyleDialog = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewComponentRef = ref<InstanceType<typeof TokenUsageChartSvg> | null>(null)
const isGenerating = ref(false)
const parsedRows = ref<TokenUsageRow[]>([])

const { t } = useI18n()
const { theme, systemMode, systemLightTheme, systemDarkTheme, isSystemDark } = useTheme()

/** 与 useTheme / variables.css 保持一致的主题主色 */
const THEME_ACCENT: Record<ThemeName, string> = {
  forest: '#4a7c59',
  ocean: '#2a6f97',
  sunset: '#c05533',
  dark: '#2eaadc',
}

function resolveActiveTheme(): ThemeName {
  if (systemMode.value) {
    return isSystemDark.value ? systemDarkTheme.value : systemLightTheme.value
  }
  return theme.value
}

function applyThemeColors(themeName: ThemeName) {
  const accent = THEME_ACCENT[themeName] || THEME_ACCENT.forest
  styleOptions.primaryColor = accent
  styleOptions.bgColor = deriveThemeBgColor(accent)
  // 总用量系列默认跟随主色
  styleOptions.colorTotal = accent
}

const styleOptions = reactive<TokenUsageStyleOptions>({
  primaryColor: '#4a7c59',
  bgColor: '#d6e6da',
  fontColor: '#2c2c2c',
  cardBgColor: '#ffffff',
  cardOpacity: '48',
  width: '720',
  height: '1200',
  padding: '40',
  showTotal: true,
  showInput: true,
  showOutput: true,
  showCacheInput: true,
  showCacheCreation: true,
  showTotalCost: true,
  statsChartType: 'line',
  colorTotal: '#4a7c59',
  colorInput: '#3b82f6',
  colorOutput: '#f59e0b',
  colorTotalCost: '#ef4444',
  colorCacheInput: '#8b5cf6',
  colorCacheCreation: '#14b8a6',
  axisLabelColor: '#9ca3af',
  gridEmptyColor: '#f3f4f6',
})

// 主题变化时同步主色与按比例生成的背景色
watch(
  [theme, systemMode, systemLightTheme, systemDarkTheme, isSystemDark],
  () => {
    applyThemeColors(resolveActiveTheme())
  },
  { immediate: true },
)

// 用户手动改主色时，背景色按同一比例跟随
watch(
  () => styleOptions.primaryColor,
  (primary) => {
    styleOptions.bgColor = deriveThemeBgColor(primary)
  },
)

onMounted(() => {
  applyThemeColors(resolveActiveTheme())
})

const statsChartTypeOptions = computed(() => [
  { label: t('tools.tokenUsageChart.chartTypeLine'), value: 'line' },
  { label: t('tools.tokenUsageChart.chartTypeArea'), value: 'area' },
  { label: t('tools.tokenUsageChart.chartTypeBar'), value: 'bar' },
  { label: t('tools.tokenUsageChart.chartTypeStacked'), value: 'stacked' },
])

const statsChartTypeOption = computed<{ label: string; value: string } | undefined>({
  get: () => statsChartTypeOptions.value.find((o) => o.value === styleOptions.statsChartType),
  set: (opt) => {
    if (!opt) return
    styleOptions.statsChartType = opt.value as StatsChartType
  },
})

const styleCardOpacity = computed<string>({
  get: () => styleOptions.cardOpacity,
  set: (value) => {
    const n = Number(value)
    if (!Number.isFinite(n)) {
      styleOptions.cardOpacity = '0'
      return
    }
    styleOptions.cardOpacity = String(Math.min(100, Math.max(0, Math.round(n))))
  },
})

// ── UI 交互（实现） ──
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  // 清空 input 的值，保证同一文件再次选择仍能触发 change
  input.value = ''
}

function handleDrop(e: DragEvent) {
  isDragover.value = false
  addFiles(e.dataTransfer?.files ?? null)
}

function addFiles(fileList: FileList | null) {
  if (!fileList) return
  for (const f of Array.from(fileList)) {
    if (!files.value.some((x) => x.name === f.name)) {
      files.value.push({ name: f.name, size: f.size, raw: f })
    }
  }
}

function removeFile(file: UploadFile) {
  files.value = files.value.filter((f) => f !== file)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── 业务逻辑（空桩 / stub） ──

/**
 * 生成流程：
 *   1. 按文件后缀分流：.sql 走 parseSqlFile → .json 直接 JSON.parse
 *   2. 汇总后交给 generateSvg 生成预览（generateSvg 保留为 TODO）
 */
async function generate() {
  if (files.value.length === 0) return
  isGenerating.value = true
  try {
    const rows: TokenUsageRow[] = []
    for (const f of files.value) {
      const lower = f.name.toLowerCase()
      if (lower.endsWith('.sql')) {
        rows.push(...await parseSqlFile(f.raw))
      } else if (lower.endsWith('.json')) {
        const text = await f.raw.text()
        const data = await new Promise((resolve) => { setTimeout(() => resolve(JSON.parse(text)), 0) })
        if (Array.isArray(data)) {
          rows.push(...data)
        }
      }
    }
    parsedRows.value = rows
    hasPreview.value = true
  } finally {
    isGenerating.value = false
  }
}

function reset() {
  files.value = []
  parsedRows.value = []
  hasPreview.value = false
  isDragover.value = false
}

async function download() {
  await nextTick()
  const svgEl = previewComponentRef.value?.getSvgElement?.()
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const svgText = serializer.serializeToString(svgEl)
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = 'token-usage-chart.svg'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

const SCRIPT_FILES: Record<string, string> = {
  py: '/scripts/format_token_usage.py',
  js: '/scripts/format_token_usage.js',
}

function downloadScript(lang: 'py' | 'js') {
  const url = SCRIPT_FILES[lang]
  if (!url) {
    return
  }
  // 用 fetch + blob 触发浏览器下载，避免直接打开文件
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = url.split('/').pop()!
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    })
    .catch(() => {
      // 下载失败时回退为直接打开
      window.open(url, '_blank')
    })
}

function openStyleDialog() {
  showStyleDialog.value = true
}

function applyStyle() {
  // TODO: 应用样式并重绘
  showStyleDialog.value = false
}
</script>

<style lang="less" scoped>
.token-usage-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ── 支持格式提示 ──
.tool-info-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 8px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-secondary));
}

.tool-info-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: var(--accent);
}

.tool-info-text {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.tool-info-spacer {
  flex: 1;
}

.tool-info-download-label {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.tool-info-btn {
  flex-shrink: 0;
  padding: 3px 12px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
  color: var(--accent);
  background: var(--bg-card);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent);
    color: var(--bg-card);
    border-color: var(--accent);
  }

  &:active {
    transform: scale(0.95);
  }
}

// ── 上传区 ──
.upload-zone {
  position: relative;
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 48px 24px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;

  &:hover {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 6%, var(--bg-secondary));
  }

  &.is-dragover {
    border-color: var(--accent);
    border-style: solid;
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-secondary));
    transform: scale(1.01);
  }

  &.has-files {
    padding: 16px;
    min-height: 0;
  }
}

.upload-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  pointer-events: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--text-secondary);
}

.upload-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

// ── 文件列表 ──
.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
  }
}

.file-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.file-remove {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: color-mix(in srgb, #e05a5a 15%, transparent);
    color: #e05a5a;
  }
}

// ── 预览区 ──
.preview-zone {
  border: 1px solid var(--border);
  border-radius: 12px;
  min-height: 240px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  color: var(--text-secondary);

  p {
    margin: 0;
    font-size: 0.85rem;
  }
}

.preview-icon {
  width: 64px;
  height: 64px;
  color: var(--text-secondary);
  opacity: 0.5;
}

.preview-svg {
  width: 100%;
  padding: 16px;

  :deep(svg) {
    width: 100%;
    height: auto;
    display: block;
  }
}

.preview-status {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: right;
}

// ── 自定义样式弹窗 ──
.style-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.style-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.style-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  &--2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.style-switches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 12px;
}

.color-input {
  width: 100%;
  height: 38px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
  }

  &--inline {
    width: 22px;
    height: 22px;
    margin-left: auto;
    border-radius: 4px;
    flex-shrink: 0;
  }
}

.style-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px 0;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
  }
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

// ── 响应式 ──
@media (max-width: 640px) {
  .style-row,
  .style-switches {
    grid-template-columns: 1fr;
  }

  .upload-zone {
    padding: 32px 16px;
  }
}
</style>
