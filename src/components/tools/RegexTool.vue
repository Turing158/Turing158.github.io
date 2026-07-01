/**
 * 正则表达式工具（Regex Tool）
 *
 * 合并正则表达式测试与可视化功能。
 * 通过「可视化」按钮切换显示 SVG 铁路图（Railroad Diagram）和逐段说明。
 */
<template>
  <div class="tool-form">
    <!-- 正则输入：/pattern/flags 样式 -->
    <label class="tool-label">{{ $t('tools.regex.patternLabel') }}</label>
    <div class="regex-pattern-row">
      <span class="regex-delimiter">/</span>
      <BlogInput
        v-model="pattern"
        type="text"
        :placeholder="$t('tools.regex.patternPlaceholder')"
        class="regex-pattern-input"
        @input="onPatternInput"
      />
      <span class="regex-delimiter">/</span>
      <div class="regex-flags-group">
        <span
          v-for="flag in availableFlags"
          :key="flag"
          class="regex-flag-chip"
          :class="{ active: selectedFlags.includes(flag) }"
          @click="toggleFlag(flag)"
        >{{ flag }}</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="parseError" class="regex-error">
      ⚠ {{ parseError }}
    </div>

    <!-- 测试文本 -->
    <label class="tool-label">{{ $t('tools.regex.testLabel') }}</label>
    <BlogInput
      v-model="testInput"
      type="textarea"
      :placeholder="$t('tools.regex.testPlaceholder')"
      :rows="5"
      @input="onTestInput"
    />

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button type="primary" size="small" @click="testRegex">
        {{ $t('tools.regex.test') }}
      </Button>
      <Button
        size="small"
        :class="{ 'btn-active': showVisualizer }"
        @click="toggleVisualizer"
      >
        🔬 {{ $t('tools.regex.visualize') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.regex.clear') }}
      </Button>
    </div>

    <!-- 匹配结果 -->
    <label class="tool-label">{{ $t('tools.regex.resultLabel') }}</label>
    <pre class="tool-output regex-output">
      <span v-if="error" class="error-text">{{ error }}</span>
      <template v-else>
        <div v-for="(match, i) in results" :key="i" class="regex-match-item">
          <span class="match-index">#{{ i + 1 }}</span>
          <span class="match-group">{{ match.fullMatch }}
            <template v-if="match.groups">
              <span v-for="(g, k) in match.groups" :key="k" class="named-group">{{ k }}: {{ g }}</span>
            </template>
          </span>
        </div>
        <span v-if="results.length === 0" class="no-match">{{ $t('tools.regex.noMatch') }}</span>
      </template>
    </pre>

    <!-- ====== 可视化区域（可切换） ====== -->
    <template v-if="showVisualizer">
      <!-- SVG 铁路图 -->
      <div v-if="svgContent" class="regex-vis-section">
        <div class="regex-vis-label-row">
          <label class="tool-label">{{ $t('tools.regexVis.diagramLabel') }}</label>
          <Button size="small" class="regex-vis-copy-btn" @click="copyDiagram">
            {{ $t('tools.regexVis.copy') }}
          </Button>
        </div>
        <div class="regex-vis-svg-scroll" v-html="svgContent"></div>
      </div>

      <!-- 节点说明 -->
      <div v-if="explanations.length > 0" class="regex-vis-section">
        <label class="tool-label">{{ $t('tools.regexVis.breakdownLabel') }}</label>
        <div
          v-for="(item, idx) in explanations"
          :key="idx"
          class="regex-vis-explain-item"
        >
          <span
            class="regex-vis-explain-badge"
            :style="{ background: item.color }"
          >{{ item.label }}</span>
          <span class="regex-vis-explain-desc">{{ item.description }}</span>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

// ---------- 状态 ----------

const availableFlags = ['g', 'i', 'm', 's', 'u', 'y'] as const
const selectedFlags = ref<string[]>(['g'])
const pattern = ref('')
const testInput = ref('')
const parseError = ref('')
const results = ref<{ fullMatch: string; index: number; groups?: Record<string, string> }[]>([])
const error = ref('')
const showVisualizer = ref(false)
const svgContent = ref('')
const explanations = ref<{ label: string; description: string; color: string }[]>([])

// ---------- 标志选择 ----------

function toggleFlag(flag: string) {
  const idx = selectedFlags.value.indexOf(flag)
  if (idx >= 0) {
    selectedFlags.value.splice(idx, 1)
  } else {
    selectedFlags.value.push(flag)
  }
  onPatternChange()
}

// ---------- 可视化切换 ----------

function toggleVisualizer() {
  showVisualizer.value = !showVisualizer.value
  if (showVisualizer.value && pattern.value.trim()) {
    updateVisualizer()
  }
}

// ---------- 正则测试 ----------

function onPatternInput() {
  onPatternChange()
}

function onPatternChange() {
  parseError.value = ''
  svgContent.value = ''
  explanations.value = []

  if (!pattern.value.trim()) return

  try {
    new RegExp(pattern.value, selectedFlags.value.join(''))
    if (showVisualizer.value) {
      updateVisualizer()
    }
  } catch (e: any) {
    parseError.value = e.message
  }
}

function onTestInput() {
  if (!pattern.value.trim()) return
  runTests()
}

function testRegex() {
  if (!pattern.value.trim()) return
  parseError.value = ''
  runTests()
}

function runTests() {
  error.value = ''
  results.value = []

  if (!pattern.value || !testInput.value) return

  try {
    const flagsStr = selectedFlags.value.join('')
    const re = new RegExp(pattern.value, flagsStr)

    if (flagsStr.includes('g')) {
      const matches = [...testInput.value.matchAll(re)]
      results.value = matches.map(m => ({
        fullMatch: m[0],
        index: m.index!,
        groups: m.groups,
      }))
    } else {
      const match = re.exec(testInput.value)
      if (match) {
        results.value.push({
          fullMatch: match[0],
          index: match.index!,
          groups: match.groups,
        })
      }
    }
  } catch (e: any) {
    error.value = e.message
  }
}

// ---------- 可视化 ----------

const COLORS = [
  '#4A90D9', '#E67E22', '#27AE60', '#8E44AD',
  '#E74C3C', '#1ABC9C', '#F39C12', '#2ECC71',
]

interface RegexSeg {
  text: string
  type: 'literal' | 'charset' | 'shorthand' | 'anchor'
      | 'group' | 'quantifier' | 'alternation' | 'dot'
  detail?: string
  description?: string
}

function updateVisualizer() {
  svgContent.value = ''
  explanations.value = []
  if (!pattern.value.trim()) return

  const segs = parseRegex(pattern.value)
  if (segs.length > 0) {
    svgContent.value = renderRailroad(segs)
  }
}

function parseRegex(pattern: string): RegexSeg[] {
  const segs: RegexSeg[] = []
  let i = 0

  while (i < pattern.length) {
    const ch = pattern[i]

    if (ch === '^' || ch === '$') {
      segs.push({
        text: ch,
        type: 'anchor',
        description: ch === '^' ? t('tools.regexVis.anchorStart') : t('tools.regexVis.anchorEnd'),
      })
      i++
      continue
    }

    if (ch === '.') {
      segs.push({ text: '.', type: 'dot', description: t('tools.regexVis.dotDesc') })
      i++
      continue
    }

    if (ch === '|') {
      segs.push({ text: '|', type: 'alternation', description: t('tools.regexVis.alternationDesc') })
      i++
      continue
    }

    if (ch === '\\') {
      if (i + 1 >= pattern.length) {
        segs.push({ text: '\\', type: 'literal', description: t('tools.regexVis.literalDesc') })
        i++
        continue
      }
      const next = pattern[i + 1]
      const shorthandChars = 'dDwWsSbBtrnvf'
      if (shorthandChars.includes(next)) {
        const descMap: Record<string, string> = {
          d: t('tools.regexVis.digitDesc'),
          D: t('tools.regexVis.nonDigitDesc'),
          w: t('tools.regexVis.wordDesc'),
          W: t('tools.regexVis.nonWordDesc'),
          s: t('tools.regexVis.whitespaceDesc'),
          S: t('tools.regexVis.nonWhitespaceDesc'),
        }
        segs.push({
          text: `\\${next}`,
          type: 'shorthand',
          description: descMap[next] || t('tools.regexVis.escapedDesc'),
        })
      } else {
        segs.push({
          text: `\\${next}`,
          type: 'literal',
          description: `${t('tools.regexVis.escapedDesc')} "${next}"`,
        })
      }
      i += 2
      continue
    }

    if (ch === '[') {
      let end = i + 1
      let depth = 1
      while (end < pattern.length) {
        if (pattern[end] === '\\') { end += 2; continue }
        if (pattern[end] === '[') depth++
        if (pattern[end] === ']') { depth--; if (depth === 0) break }
        end++
      }
      if (depth === 0) {
        const cls = pattern.slice(i, end + 1)
        segs.push({
          text: cls,
          type: 'charset',
          description: cls.startsWith('[^') ? t('tools.regexVis.negatedClassDesc') : t('tools.regexVis.charsetDesc'),
        })
        i = end + 1
      } else {
        segs.push({ text: ch, type: 'literal', description: t('tools.regexVis.literalDesc') })
        i++
      }
      continue
    }

    if (ch === '(') {
      let end = i + 1
      let depth = 1
      while (end < pattern.length) {
        if (pattern[end] === '\\') { end += 2; continue }
        if (pattern[end] === '(') depth++
        if (pattern[end] === ')') { depth--; if (depth === 0) break }
        end++
      }
      if (depth === 0) {
        const inner = pattern.slice(i + 1, end)
        let groupDesc = t('tools.regexVis.groupDesc')
        let groupLabel = ''
        if (inner.startsWith('?:')) {
          groupDesc = t('tools.regexVis.nonCapGroupDesc')
          const rest = inner.slice(2)
          groupLabel = `(?:${rest.length > 10 ? rest.slice(0, 10) + '…' : rest})`
        } else if (inner.startsWith('?=')) {
          groupDesc = t('tools.regexVis.lookaheadDesc')
          groupLabel = `(?=${inner.slice(2, 12)})`
        } else if (inner.startsWith('?!')) {
          groupDesc = t('tools.regexVis.negLookaheadDesc')
          groupLabel = `(?!${inner.slice(2, 12)})`
        } else if (inner.startsWith('?<=')) {
          groupDesc = t('tools.regexVis.lookbehindDesc')
          groupLabel = `(?<=${inner.slice(3, 12)})`
        } else if (inner.startsWith('?<!')) {
          groupDesc = t('tools.regexVis.negLookbehindDesc')
          groupLabel = `(?<!${inner.slice(3, 12)})`
        } else {
          groupLabel = `(${inner.length > 12 ? inner.slice(0, 12) + '…' : inner})`
        }
        segs.push({
          text: groupLabel || `(${inner})`,
          type: 'group',
          description: groupDesc,
        })
        i = end + 1
      } else {
        segs.push({ text: ch, type: 'literal', description: t('tools.regexVis.literalDesc') })
        i++
      }
      continue
    }

    if ('*+?'.includes(ch)) {
      if (segs.length > 0) {
        const quantMap: Record<string, string> = {
          '*': t('tools.regexVis.zeroOrMoreDesc'),
          '+': t('tools.regexVis.oneOrMoreDesc'),
          '?': t('tools.regexVis.zeroOrOneDesc'),
        }
        segs.push({
          text: ch,
          type: 'quantifier',
          detail: segs[segs.length - 1].text,
          description: quantMap[ch] || ch,
        })
      }
      i++
      continue
    }

    if (ch === '{') {
      let end = i + 1
      while (end < pattern.length && pattern[end] !== '}') end++
      if (end < pattern.length) {
        const quant = pattern.slice(i, end + 1)
        segs.push({
          text: quant,
          type: 'quantifier',
          detail: (segs.length > 0 ? segs[segs.length - 1].text : 'x') + quant,
          description: `${t('tools.regexVis.repeatDesc')} ${quant}`,
        })
        i = end + 1
      } else {
        segs.push({ text: ch, type: 'literal', description: t('tools.regexVis.literalDesc') })
        i++
      }
      continue
    }

    segs.push({
      text: ch,
      type: 'literal',
      description: `${t('tools.regexVis.literalDesc')} "${ch}"`,
    })
    i++
  }

  return segs
}

function renderRailroad(segments: RegexSeg[]): string {
  const gapX = 14
  const boxPadX = 10
  const fontSize = 13
  const lineColor = '#888'
  const BASELINE_Y = 30
  const BOX_HEIGHT = 28

  let cx = 10
  let svgW = 20
  const lines: string[] = []
  const items: { label: string; color: string; type: string; description: string }[] = []
  let colorIdx = 0

  function allocColor(): string {
    return COLORS[colorIdx++ % COLORS.length]
  }

  function measureText(text: string): number {
    if (!text) return boxPadX * 2
    return text.length * fontSize * 0.6 + boxPadX * 2
  }

  function escapeSvg(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function drawBox(x: number, y: number, w: number, h: number, color: string, label: string, radius = 4): string {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${color}20" stroke="${color}" stroke-width="1.5" />`
      + `<text x="${x + w / 2}" y="${y + h / 2 + 1}" text-anchor="middle" dominant-baseline="central" font-family="Consolas,Monaco,monospace" font-size="${fontSize}" fill="${color}" font-weight="600">${escapeSvg(label)}</text>`
  }

  function drawShorthand(x: number, y: number, color: string, label: string): string {
    return `<rect x="${x}" y="${y}" width="30" height="28" rx="14" ry="14" fill="${color}20" stroke="${color}" stroke-width="1.5" stroke-dasharray="3" />`
      + `<text x="${x + 15}" y="${y + 15}" text-anchor="middle" dominant-baseline="central" font-family="Consolas,Monaco,monospace" font-size="12" fill="${color}" font-weight="600">${escapeSvg(label)}</text>`
  }

  function drawAnchor(x: number, y: number, label: string): string {
    const color = '#999'
    return `<polygon points="${x + 6},${y} ${x + 6},${y + 28} ${x},${y + 14}" fill="${color}40" stroke="${color}" stroke-width="1" />`
      + `<text x="${x + 14}" y="${y + 8}" font-family="Consolas,Monaco,monospace" font-size="10" fill="${color}">${escapeSvg(label)}</text>`
  }

  function drawConnector(x1: number, y1: number, x2: number, y2: number): string {
    if (x2 > x1) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineColor}" stroke-width="1.5" />`
    }
    const midX = (x1 + x2) / 2
    return `<polyline points="${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}" stroke="${lineColor}" stroke-width="1.5" fill="none" />`
  }

  function drawLoop(x: number, y: number, w: number, label: string): string {
    const loopY = y - 16
    const loopX = x + w / 2
    return `<path d="M ${loopX} ${y} C ${loopX} ${loopY}, ${loopX} ${loopY}, ${loopX} ${y}" stroke="#888" stroke-width="1.5" fill="none" marker-end="url(#arrow)" />`
      + `<text x="${loopX}" y="${loopY - 4}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#888">${escapeSvg(label)}</text>`
  }

  for (const seg of segments) {
    const color = allocColor()
    const label = seg.text || seg.type
    const w = Math.max(measureText(label), seg.type === 'anchor' ? 24 : 28)
    const h = BOX_HEIGHT

    let svgPart = ''

    if (cx > 10) {
      svgPart += drawConnector(cx - gapX, BASELINE_Y + h / 2, cx, BASELINE_Y + h / 2)
    }

    switch (seg.type) {
      case 'anchor':
        svgPart += drawAnchor(cx, BASELINE_Y, label)
        break
      case 'shorthand':
        svgPart += drawShorthand(cx, BASELINE_Y, color, label)
        break
      case 'charset':
        svgPart += drawBox(cx, BASELINE_Y, w, h, color, label, 2)
        break
      case 'group':
        svgPart += drawBox(cx, BASELINE_Y, w, h, color, label)
        break
      case 'quantifier':
        svgPart += drawBox(cx, BASELINE_Y, w, h, color, label)
        svgPart += drawLoop(cx, BASELINE_Y, w, seg.detail || '')
        break
      case 'alternation':
        svgPart += drawBox(cx, BASELINE_Y, w, h, color, '|', 2)
        break
      case 'literal':
      default:
        svgPart += drawBox(cx, BASELINE_Y, w, h, color, label)
        break
    }

    lines.push(svgPart)

    items.push({
      label,
      color,
      type: seg.type,
      description: seg.description || label,
    })

    cx += w + gapX
    svgW = cx + 10
  }

  const defs = `<defs>
    <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#888" />
    </marker>
  </defs>`

  const totalH = BASELINE_Y + BOX_HEIGHT + 16
  const totalW = Math.max(svgW, 200)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="100%" style="min-width: ${totalW}px;">
    ${defs}
    <rect width="100%" height="100%" fill="transparent" />
    ${lines.join('\n')}
  </svg>`

  explanations.value = items.map((item, i) => ({
    label: `#${i + 1}`,
    description: `${item.description} (${item.type})`,
    color: item.color,
  }))

  return svg
}

function copyDiagram() {
  if (!svgContent.value) {
    BlogTip.show(t('tools.regexVis.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(svgContent.value, t('tools.copied'))
}

function clear() {
  pattern.value = ''
  selectedFlags.value = ['g']
  testInput.value = ''
  parseError.value = ''
  error.value = ''
  results.value = []
  svgContent.value = ''
  explanations.value = []
  showVisualizer.value = false
}
</script>

<style scoped>
/* 模式行：/pattern/flags */
.regex-pattern-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-delimiter {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  padding: 0 2px;
}

.regex-pattern-input {
  flex: 1;
  min-width: 0;
}

.regex-flags-group {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.regex-flag-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all 0.15s;
  user-select: none;
}

.regex-flag-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.regex-flag-chip.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* 错误提示 */
.regex-error {
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  font-size: 0.8rem;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* 按钮激活状态 */
.btn-active {
  background: var(--accent) !important;
  color: #fff !important;
  border-color: var(--accent) !important;
}

/* 匹配结果 */
.regex-output {
  .regex-match-item {
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

/* 可视化区域 */
.regex-vis-section {
  margin-top: 4px;
}

.regex-vis-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.regex-vis-copy-btn {
  flex-shrink: 0;
}

.regex-vis-svg-scroll {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  padding: 12px;
}

.regex-vis-svg-scroll :deep(svg) {
  display: block;
}

.regex-vis-explain-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--bg-secondary);
  font-size: 0.8rem;
}

.regex-vis-explain-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 20px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
}

.regex-vis-explain-desc {
  color: var(--text-primary);
}
</style>
