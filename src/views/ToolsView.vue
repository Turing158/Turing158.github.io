<template>
  <div class="tools-view">
    <h1 class="page-title">{{ $t('tools.title') }}</h1>
    <p class="page-desc">{{ $t('tools.description') }}</p>

    <div v-if="showCards" class="tools-grid">
      <div
        v-for="(tool, index) in tools"
        :key="tool.component"
        class="tool-card"
        :style="{ '--animation-delay': index * 80 + 'ms' }"
        :class="{ 'card-visible': cardVisibleStates[tool.component] }"
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

      <template v-if="activeTool">
        <!-- JSON 格式化工具 -->
        <template v-if="activeTool.component === 'JsonFormatter'">
          <div class="tool-form">
            <label class="tool-label">{{ $t('tools.jsonFormatter.inputLabel') }}</label>
            <BlogInput
              v-model="jsonInput"
              type="textarea"
              :placeholder="$t('tools.jsonFormatter.placeholder')"
              :rows="8"
            />
            <div class="tool-actions">
              <Button type="primary" size="small" @click="formatJson">{{ $t('tools.jsonFormatter.format') }}</Button>
              <Button size="small" @click="minifyJson">{{ $t('tools.jsonFormatter.minify') }}</Button>
              <Button size="small" @click="copyJson">{{ $t('tools.jsonFormatter.copy') }}</Button>
              <Button danger size="small" @click="jsonInput = ''; jsonOutput = ''">{{ $t('tools.jsonFormatter.clear') }}</Button>
            </div>
            <label class="tool-label">{{ $t('tools.jsonFormatter.outputLabel') }}</label>
            <pre class="tool-output">{{ jsonOutput }}</pre>
          </div>
        </template>

        <!-- Base64 编解码 -->
        <template v-else-if="activeTool.component === 'Base64Tool'">
          <div class="tool-form">
            <label class="tool-label">{{ $t('tools.base64.inputLabel') }}</label>
            <BlogInput
              v-model="base64Input"
              type="textarea"
              :placeholder="$t('tools.base64.placeholder')"
              :rows="6"
            />
            <div class="tool-actions">
              <Button type="primary" size="small" @click="encodeBase64">{{ $t('tools.base64.encode') }}</Button>
              <Button size="small" @click="decodeBase64">{{ $t('tools.base64.decode') }}</Button>
              <Button size="small" @click="swapBase64">{{ $t('tools.base64.swap') }}</Button>
              <Button size="small" @click="copyBase64">{{ $t('tools.base64.copy') }}</Button>
              <Button danger size="small" @click="base64Input = ''; base64Output = ''">{{ $t('tools.base64.clear') }}</Button>
            </div>
            <label class="tool-label">{{ $t('tools.base64.outputLabel') }}</label>
            <pre class="tool-output">{{ base64Output }}</pre>
          </div>
        </template>

        <!-- 正则表达式测试 -->
        <template v-else-if="activeTool.component === 'RegexTester'">
          <div class="tool-form">
            <label class="tool-label">{{ $t('tools.regex.patternLabel') }}</label>
            <BlogInput
              v-model="regexPattern"
              :placeholder="$t('tools.regex.patternPlaceholder')"
            />
            <label class="tool-label">{{ $t('tools.regex.flagsLabel') }}</label>
            <Checkbox v-model="regexSelectedFlags" :options="regexFlagOptions" direction="horizontal" />
            <label class="tool-label">{{ $t('tools.regex.testLabel') }}</label>
            <BlogInput
              v-model="regexTest"
              type="textarea"
              :placeholder="$t('tools.regex.testPlaceholder')"
              :rows="5"
            />
            <div class="tool-actions">
              <Button type="primary" size="small" @click="testRegex">{{ $t('tools.regex.test') }}</Button>
              <Button danger size="small" @click="regexPattern = ''; regexTest = ''; regexResult = []; regexError = ''; regexSelectedFlags = ['g']">{{ $t('tools.regex.clear') }}</Button>
            </div>
            <label class="tool-label">{{ $t('tools.regex.resultLabel') }}</label>
            <pre class="tool-output regex-output">
              <span v-if="regexError" class="error-text">{{ regexError }}</span>
              <template v-else>
                <div v-for="(match, i) in regexResult" :key="i" class="regex-match">
                  <span class="match-index">#{{ i + 1 }}</span>
                  <span class="match-group">{{ match.fullMatch }}
                    <template v-if="match.groups">
                      <span v-for="(g, k) in match.groups" :key="k" class="named-group">{{ k }}: {{ g }}</span>
                    </template>
                  </span>
                </div>
                <span v-if="regexResult.length === 0" class="no-match">{{ $t('tools.regex.noMatch') }}</span>
              </template>
            </pre>
          </div>
        </template>

        <!-- 颜色转换器 -->
        <template v-else-if="activeTool.component === 'ColorConverter'">
          <div class="tool-form color-converter">
            <div class="color-picker-section">
              <div class="color-picker-wrapper">
                <input type="color" v-model="colorValue" class="color-picker" />
                <div class="color-swatch" :style="{ backgroundColor: colorValue }"></div>
              </div>
            </div>
            <div class="color-previews">
              <div class="color-item">
                <span class="color-label">HEX</span>
                <div class="color-input-wrapper">
                  <BlogInput
                    v-model="colorHexInput"
                    placeholder="#000000"
                    @input="onHexInput"
                  />
                  <Button size="small" @click="copyColor('hex')">{{ $t('tools.copy') }}</Button>
                </div>
              </div>
              <div class="color-item">
                <span class="color-label">RGB</span>
                <div class="color-input-wrapper">
                  <BlogInput
                    v-model="colorRgbInput"
                    placeholder="rgb(0, 0, 0)"
                    @input="onRgbInput"
                  />
                  <Button size="small" @click="copyColor('rgb')">{{ $t('tools.copy') }}</Button>
                </div>
              </div>
              <div class="color-item">
                <span class="color-label">HSL</span>
                <div class="color-input-wrapper">
                  <BlogInput
                    v-model="colorHslInput"
                    placeholder="hsl(0, 0%, 0%)"
                    @input="onHslInput"
                  />
                  <Button size="small" @click="copyColor('hsl')">{{ $t('tools.copy') }}</Button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 时间戳转换 -->
        <template v-else-if="activeTool.component === 'TimestampConverter'">
          <div class="tool-form">
            <div class="timestamp-now">
              <span class="ts-label">{{ $t('tools.timestamp.current') }}</span>
              <span class="ts-value">{{ currentTimestamp }}</span>
              <span class="ts-date">{{ currentDateStr }}</span>
            </div>
            <div class="timestamp-quick-actions">
              <Button size="small" @click="copyTimestamp">{{ $t('tools.timestamp.copyTimestamp') }}</Button>
              <Button size="small" @click="copyCurrentDate">{{ $t('tools.timestamp.copyDate') }}</Button>
            </div>
            <label class="tool-label">{{ $t('tools.timestamp.inputLabel') }}</label>
            <BlogInput
              v-model="timestampInput"
              :placeholder="$t('tools.timestamp.placeholder')"
            />
            <div class="tool-actions">
              <Button type="primary" size="small" @click="timestampToDate">{{ $t('tools.timestamp.toDate') }}</Button>
              <Button size="small" @click="dateToTimestamp">{{ $t('tools.timestamp.toTimestamp') }}</Button>
              <Button danger size="small" @click="timestampInput = ''; timestampOutput = ''">{{ $t('tools.timestamp.clear') }}</Button>
            </div>
            <label class="tool-label">{{ $t('tools.timestamp.outputLabel') }}</label>
            <pre class="tool-output">{{ timestampOutput }}</pre>
          </div>
        </template>

        <!-- 文本统计 -->
        <template v-else-if="activeTool.component === 'TextCounter'">
          <div class="tool-form">
            <label class="tool-label">{{ $t('tools.textCounter.inputLabel') }}</label>
            <BlogInput
              v-model="counterInput"
              type="textarea"
              :placeholder="$t('tools.textCounter.placeholder')"
              :rows="8"
            />
            <div class="counter-stats">
              <div class="stat-item">
                <span class="stat-value">{{ textStats.chars }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.chars') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ textStats.charsNoSpace }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.charsNoSpace') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ textStats.words }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.words') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ textStats.lines }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.lines') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ textStats.paragraphs }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.paragraphs') }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ textStats.bytes }}</span>
                <span class="stat-label">{{ $t('tools.textCounter.bytes') }}</span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </BlogDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogDialog from '@/components/common/BlogDialog.vue'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'

interface Tool {
  name: string
  icon: string
  description: string
  tags: string[]
  component: string
}

interface RegexMatch {
  fullMatch: string
  index: number
  groups?: Record<string, string>
}

const { locale, t, tm } = useI18n()

const toolKeys = [
  { key: 'jsonFormatter', component: 'JsonFormatter', icon: '📋' },
  { key: 'base64', component: 'Base64Tool', icon: '🔐' },
  { key: 'regex', component: 'RegexTester', icon: '🔍' },
  { key: 'color', component: 'ColorConverter', icon: '🎨' },
  { key: 'timestamp', component: 'TimestampConverter', icon: '⏰' },
  { key: 'textCounter', component: 'TextCounter', icon: '📊' },
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

// JSON formatter
const jsonInput = ref('')
const jsonOutput = ref('')

// Base64
const base64Input = ref('')
const base64Output = ref('')

// Regex
const regexPattern = ref('')
const regexFlags = ['g', 'i', 'm', 's', 'u', 'y']
const regexFlagOptions = computed(() => regexFlags.map(f => ({ label: f, value: f })))
const regexSelectedFlags = ref<string[]>(['g'])
const regexTest = ref('')
const regexResult = ref<RegexMatch[]>([])
const regexError = ref('')

// Color
const colorValue = ref('#4a90d9')
const colorHexInput = ref('#4A90D9')
const colorRgbInput = ref('rgb(74, 144, 217)')
const colorHslInput = ref('hsl(209, 66%, 57%)')

// Timestamp
const timestampInput = ref('')
const timestampOutput = ref('')
const currentTimestamp = ref(0)
const currentDateStr = ref('')
let timer: ReturnType<typeof setInterval> | undefined

// Text counter
const counterInput = ref('')
const textStats = ref({ chars: 0, charsNoSpace: 0, words: 0, lines: 0, paragraphs: 0, bytes: 0 })

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    BlogTip.show('已复制', { type: 'success' })
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    BlogTip.show('已复制', { type: 'success' })
  }
}

onMounted(async () => {
  const update = () => {
    currentTimestamp.value = Math.floor(Date.now() / 1000)
    currentDateStr.value = new Date().toLocaleString(locale.value)
  }
  update()
  timer = setInterval(update, 1000)

  await nextTick()
  showCards.value = true

  // 逐个显示卡片
  tools.value.forEach((tool, index) => {
    setTimeout(() => {
      cardVisibleStates.value[tool.component] = true
    }, index * 80) // 每个卡片间隔80ms
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// 打开工具时重置所有状态
function openTool(tool: Tool) {
  jsonInput.value = ''
  jsonOutput.value = ''
  base64Input.value = ''
  base64Output.value = ''
  regexPattern.value = ''
  regexTest.value = ''
  regexResult.value = []
  regexError.value = ''
  regexSelectedFlags.value = ['g']
  timestampInput.value = ''
  timestampOutput.value = ''
  counterInput.value = ''
  textStats.value = { chars: 0, charsNoSpace: 0, words: 0, lines: 0, paragraphs: 0, bytes: 0 }
  activeTool.value = tool
  dialogOpen.value = true
}

function onDialogOpen() {
  nextTick(() => {
    // dialog opened
  })
}

function onDialogClose() {
  activeTool.value = null
}

// JSON
function formatJson() {
  if (!jsonInput.value.trim()) {
    BlogTip.show(t('tools.jsonFormatter.empty'), { type: 'warning' })
    return
  }
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(parsed, null, 2)
  } catch {
    BlogTip.show(t('tools.jsonFormatter.invalid'), { type: 'error' })
  }
}

function minifyJson() {
  if (!jsonInput.value.trim()) {
    BlogTip.show(t('tools.jsonFormatter.empty'), { type: 'warning' })
    return
  }
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonOutput.value = JSON.stringify(parsed)
  } catch {
    BlogTip.show(t('tools.jsonFormatter.invalid'), { type: 'error' })
  }
}

function copyJson() {
  if (!jsonOutput.value) {
    BlogTip.show(t('tools.jsonFormatter.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(jsonOutput.value)
}

// Base64 — 使用 TextEncoder/TextDecoder 正确处理 Unicode
function encodeBase64() {
  try {
    const bytes = new TextEncoder().encode(base64Input.value)
    const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('')
    base64Output.value = btoa(binString)
  } catch (e: any) {
    base64Output.value = `Error: ${e.message}`
  }
}

function decodeBase64() {
  try {
    const binString = atob(base64Input.value.trim())
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!)
    base64Output.value = new TextDecoder().decode(bytes)
  } catch (e: any) {
    base64Output.value = `Error: ${e.message}`
  }
}

function copyBase64() {
  copyText(base64Output.value)
}

function swapBase64() {
  const temp = base64Input.value
  base64Input.value = base64Output.value
  base64Output.value = temp
}

// Regex — 使用 matchAll 避免零宽匹配死循环
function testRegex() {
  regexError.value = ''
  regexResult.value = []
  if (!regexPattern.value) return
  try {
    const flags = regexSelectedFlags.value.join('')
    const re = new RegExp(regexPattern.value, flags)
    if (flags.includes('g')) {
      const matches = [...regexTest.value.matchAll(new RegExp(re.source, re.flags))]
      regexResult.value = matches.map(m => ({
        fullMatch: m[0],
        index: m.index,
        groups: m.groups,
      }))
    } else {
      const match = re.exec(regexTest.value)
      if (match) {
        regexResult.value.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.groups,
        })
      }
    }
  } catch (e: any) {
    regexError.value = e.message
  }
}

// Color — 辅助：将 hex 统一为 6 位
function normalizeHex(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  return h
}

const colorHex = computed(() => colorValue.value.toUpperCase())

const colorRgb = computed(() => {
  const hex = normalizeHex(colorValue.value)
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 'rgb(?, ?, ?)'
  return `rgb(${r}, ${g}, ${b})`
})

const colorHsl = computed(() => {
  const hex = normalizeHex(colorValue.value)
  const rVal = parseInt(hex.substring(0, 2), 16)
  const gVal = parseInt(hex.substring(2, 4), 16)
  const bVal = parseInt(hex.substring(4, 6), 16)
  if (isNaN(rVal) || isNaN(gVal) || isNaN(bVal)) return 'hsl(?, ?, ?)'
  let r = rVal / 255, g = gVal / 255, b = bVal / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
})

// 监听 colorValue 变化，同步更新输入框
watch(colorValue, () => {
  colorHexInput.value = colorHex.value
  colorRgbInput.value = colorRgb.value
  colorHslInput.value = colorHsl.value
})

// HEX 输入处理
function onHexInput() {
  const hex = colorHexInput.value.trim()
  if (/^#?[0-9A-Fa-f]{6}$/.test(hex) || /^#?[0-9A-Fa-f]{3}$/.test(hex)) {
    colorValue.value = hex.startsWith('#') ? hex : `#${hex}`
  }
}

// RGB 输入处理
function onRgbInput() {
  const match = colorRgbInput.value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      colorValue.value = hex
    }
  }
}

// HSL 输入处理
function onHslInput() {
  const match = colorHslInput.value.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (match) {
    const h = parseInt(match[1]) / 360
    const s = parseInt(match[2]) / 100
    const l = parseInt(match[3]) / 100

    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    const hex = '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
    colorValue.value = hex
  }
}

function copyColor(type: string) {
  const map: Record<string, string> = { hex: colorHexInput.value, rgb: colorRgbInput.value, hsl: colorHslInput.value }
  copyText(map[type])
}

// Timestamp — 使用 1e10 作为秒/毫秒分界
function timestampToDate() {
  const ts = parseInt(timestampInput.value.trim())
  if (isNaN(ts)) {
    BlogTip.show(t('tools.timestamp.invalidTimestamp'), { type: 'error' })
    return
  }
  const ms = ts > 1e10 ? ts : ts * 1000
  const d = new Date(ms)
  timestampOutput.value = `${d.toLocaleString(locale.value)}\nUTC: ${d.toUTCString()}\nISO: ${d.toISOString()}`
}

function copyTimestamp() {
  copyText(String(currentTimestamp.value))
}

function copyCurrentDate() {
  copyText(currentDateStr.value)
}

function dateToTimestamp() {
  const d = new Date(timestampInput.value.trim())
  if (isNaN(d.getTime())) {
    BlogTip.show(t('tools.timestamp.invalidDate'), { type: 'error' })
    return
  }
  timestampOutput.value = `Seconds: ${Math.floor(d.getTime() / 1000)}\nMilliseconds: ${d.getTime()}`
}

// Text counter — 使用 TextEncoder 统计 UTF-8 字节数
function countText() {
  const text = counterInput.value
  const cjkCount = (text.match(/[一-鿿぀-ゟ゠-ヿ가-힯]/g) || []).length
  const latinWords = text.trim() ? text.trim().split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length : 0
  textStats.value = {
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, '').length,
    words: cjkCount + latinWords,
    lines: text ? text.split(/\n/).length : 0,
    paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).filter(p => p.trim()).length : 0,
    bytes: new TextEncoder().encode(text).length,
  }
}

// 语言切换时更新时间显示
watch(locale, () => {
  currentDateStr.value = new Date().toLocaleString(locale.value)
})

// 监听文本输入，实时更新统计
watch(counterInput, () => {
  countText()
})

countText()
</script>

<style lang="less" scoped>
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

// 工具卡片逐个下落动画
.tool-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  opacity: 0;
  transform: translateY(-20px);
  animation: cardDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: var(--animation-delay, 0ms);

  &.card-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px var(--shadow);
    border-color: var(--accent);
  }
}

@keyframes cardDrop {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
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

  &:hover {
    background: var(--accent);
    color: var(--bg-card);
    border-color: var(--accent);
    transform: scale(1.08);
  }
}

// Modal title slot
.modal-icon {
  font-size: 1.5rem;
}

.modal-title-text {
  font-size: 1.2rem;
  color: var(--text-primary);
}

// Tool form elements
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

.tool-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
}

.tool-textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
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

// Regex
.regex-output {
  .regex-match {
    padding: 4px 0;
    border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; }
  }

  .match-index {
    color: var(--accent);
    font-weight: 600;
    margin-right: 8px;
  }

  .match-group {
    color: var(--text-primary);
  }

  .named-group {
    display: block;
    padding-left: 16px;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .no-match {
    color: var(--text-secondary);
  }

  .error-text {
    color: #e74c3c;
  }
}

// Color
.color-converter {
  gap: 20px;
}

.color-picker-section {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.color-picker-wrapper {
  position: relative;
  display: inline-block;
}

.color-picker {
  width: 120px;
  height: 120px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: none;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.color-swatch {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--border);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.16),
      0 0 0 1px rgba(0, 0, 0, 0.08),
      inset 0 2px 4px rgba(255, 255, 255, 0.15);
    border-color: var(--accent);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.color-previews {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.color-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  width: 48px;
  text-align: right;
  letter-spacing: 0.5px;
}

.color-input-wrapper {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;

  :deep(.animal-input) {
    flex: 1;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
  }

  :deep(.animal-button) {
    flex-shrink: 0;
    min-width: 64px;
  }
}

// Timestamp
.timestamp-now {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
}

.ts-label {
  color: var(--text-secondary);
  font-weight: 600;
}

.ts-value {
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
}

.ts-date {
  color: var(--text-secondary);
  margin-left: auto;
}

.timestamp-quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// Counter stats
.counter-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

</style>