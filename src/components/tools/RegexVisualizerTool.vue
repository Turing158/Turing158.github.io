/**
 * 正则表达式可视化工具（Regex Visualizer）
 *
 * 解析正则表达式，生成 SVG 铁路图（Railroad Diagram）和逐段说明。
 * 纯前端实现，无需外部依赖。
 */
<template>
  <div class="tool-form">
    <!-- 正则输入 -->
    <label class="tool-label">{{ $t('tools.regexVis.patternLabel') }}</label>
    <div class="regex-vis-pattern-row">
      <span class="regex-vis-delimiter">/</span>
      <BlogInput
        v-model="pattern"
        type="text"
        :placeholder="$t('tools.regexVis.patternPlaceholder')"
        class="regex-vis-pattern-input"
        @input="onInput"
      />
      <span class="regex-vis-delimiter">/</span>
      <BlogInput
        v-model="flagsStr"
        type="text"
        class="regex-vis-flags-input"
        placeholder="gimsu"
        :max-length="5"
        @input="onInput"
      />
    </div>

    <!-- 错误提示 -->
    <div v-if="parseError" class="regex-vis-error">
      ⚠ {{ parseError }}
    </div>

    <!-- SVG 铁路图 -->
    <div v-if="svgContent" class="regex-vis-svg-wrapper">
      <label class="tool-label">{{ $t('tools.regexVis.diagramLabel') }}</label>
      <div class="regex-vis-svg-scroll" v-html="svgContent"></div>
    </div>

    <!-- 节点说明 -->
    <div v-if="explanations.length > 0" class="regex-vis-explanations">
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

    <!-- 测试输入区 -->
    <label class="tool-label">{{ $t('tools.regexVis.testLabel') }}</label>
    <BlogInput
      v-model="testInput"
      type="textarea"
      :placeholder="$t('tools.regexVis.testPlaceholder')"
      :rows="4"
      @input="runTest"
    />

    <!-- 匹配结果 -->
    <div v-if="testResults.length > 0" class="regex-vis-test-results">
      <div
        v-for="(m, idx) in testResults"
        :key="idx"
        class="regex-vis-test-match"
      >
        <span class="regex-vis-test-idx">#{{ idx + 1 }}</span>
        <span class="regex-vis-test-text">{{ m.text }}</span>
        <span v-if="m.pos !== undefined" class="regex-vis-test-pos">@{{ m.pos }}</span>
      </div>
    </div>
    <div v-else-if="testInput && !parseError" class="regex-vis-test-empty">
      {{ $t('tools.regexVis.noMatch') }}
    </div>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button size="small" @click="copyDiagram">
        {{ $t('tools.regexVis.copy') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.regexVis.clear') }}
      </Button>
    </div>
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

const pattern = ref('')
const flagsStr = ref('g')
const testInput = ref('')
const parseError = ref('')
const svgContent = ref('')
const testResults = ref<{ text: string; pos?: number }[]>([])

// ---------- 颜色调色板 ----------
const COLORS = [
  '#4A90D9', '#E67E22', '#27AE60', '#8E44AD',
  '#E74C3C', '#1ABC9C', '#F39C12', '#2ECC71',
]

// ---------- SVG 铁路图渲染 ----------

const explanations = ref<{ label: string; description: string; color: string }[]>([])

/**
 * 生成 SVG 铁路图
 *
 * 将解析后的 regex 段转换为 SVG 图形，显示每个组件及其连接关系。
 */
function renderRailroad(segments: RegexSeg[]): string {
  const gapX = 14
  const boxPadX = 10
  const fontSize = 13
  const lineColor = '#888'
  const BASELINE_Y = 30
  const BOX_HEIGHT = 28

  let cx = 10
  let svgW = 20
  let lines: string[] = []
  let items: { label: string; color: string; type: string; description: string }[] = []
  let colorIdx = 0

  function allocColor(): string {
    return COLORS[colorIdx++ % COLORS.length]
  }

  function measureText(text: string): number {
    if (!text) return boxPadX * 2
    // 粗略估算：每个字符 ~0.6em
    return text.length * fontSize * 0.6 + boxPadX * 2
  }

  function drawBox(x: number, y: number, w: number, h: number,
                    color: string, label: string, radius = 4): string {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}"
      rx="${radius}" ry="${radius}" fill="${color}20" stroke="${color}"
      stroke-width="1.5" />`
      + `<text x="${x + w / 2}" y="${y + h / 2 + 1}"
      text-anchor="middle" dominant-baseline="central"
      font-family="Consolas,Monaco,monospace" font-size="${fontSize}"
      fill="${color}" font-weight="600">${escapeSvg(label)}</text>`
  }

  function drawShorthand(x: number, y: number, color: string, label: string): string {
    return `<rect x="${x}" y="${y}" width="30" height="28" rx="14" ry="14"
      fill="${color}20" stroke="${color}" stroke-width="1.5" stroke-dasharray="3" />`
      + `<text x="${x + 15}" y="${y + 15}"
      text-anchor="middle" dominant-baseline="central"
      font-family="Consolas,Monaco,monospace" font-size="12"
      fill="${color}" font-weight="600">${escapeSvg(label)}</text>`
  }

  function drawAnchor(x: number, y: number, label: string): string {
    const color = '#999'
    return `<polygon points="${x + 6},${y} ${x + 6},${y + 28} ${x},${y + 14}"
      fill="${color}40" stroke="${color}" stroke-width="1" />`
      + `<text x="${x + 14}" y="${y + 8}"
      font-family="Consolas,Monaco,monospace" font-size="10"
      fill="${color}">${escapeSvg(label)}</text>`
  }

  function drawConnector(x1: number, y1: number, x2: number, y2: number): string {
    if (x2 > x1) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
        stroke="${lineColor}" stroke-width="1.5" />`
    }
    // 需要拐弯
    const midX = (x1 + x2) / 2
    return `<polyline points="${x1},${y1} ${midX},${y1} ${midX},${y2} ${x2},${y2}"
      stroke="${lineColor}" stroke-width="1.5" fill="none" />`
  }

  function drawLoop(x: number, y: number, w: number, label: string, color: string): string {
    const loopY = y - 16
    const loopX = x + w / 2
    return `<path d="M ${loopX} ${y} C ${loopX} ${loopY}, ${loopX} ${loopY}, ${loopX} ${y}"
      stroke="${color}" stroke-width="1.5" fill="none"
      marker-end="url(#arrow-${escapeSvg(color)})" />`
      + `<text x="${loopX}" y="${loopY - 4}"
      text-anchor="middle" font-family="sans-serif" font-size="10"
      fill="${color}">${escapeSvg(label)}</text>`
  }

  // 为每个 segment 生成图形
  for (const seg of segments) {
    const color = allocColor()
    const label = seg.text || seg.type
    const w = Math.max(measureText(label), seg.type === 'anchor' ? 24 : 28)
    const h = BOX_HEIGHT

    let svgPart = ''

    // 连接线
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
        // 在上方画循环箭头
        svgPart += drawLoop(cx, BASELINE_Y, w, seg.detail || '', color)
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

  // 生成箭头标记定义
  const defs = `<defs>
    <marker id="arrow-${escapeSvg(COLORS[0])}" markerWidth="8" markerHeight="6"
      refX="8" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="${COLORS[0]}" />
    </marker>
  </defs>`

  const totalH = BASELINE_Y + BOX_HEIGHT + 16

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${svgW} ${totalH}" width="100%"
    style="min-width: ${Math.max(svgW, 200)}px;">
    ${defs}
    <rect width="100%" height="100%" fill="transparent" />
    ${lines.join('\n')}
  </svg>`

  // 更新说明
  explanations.value = items.map((item, i) => ({
    label: `#${i + 1}`,
    description: `${item.description} (${item.type})`,
    color: item.color,
  }))

  return svg
}

function escapeSvg(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
}

// ---------- Regex 解析 ----------
interface RegexSeg {
  text: string
  type: 'literal' | 'charset' | 'shorthand' | 'anchor'
      | 'group' | 'quantifier' | 'alternation' | 'dot'
  detail?: string
  description?: string
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
      segs.push({
        text: '.',
        type: 'dot',
        description: t('tools.regexVis.dotDesc'),
      })
      i++
      continue
    }

    if (ch === '|') {
      segs.push({
        text: '|',
        type: 'alternation',
        description: t('tools.regexVis.alternationDesc'),
      })
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
      const shorthand = 'dDwWsSbBtrnvf'
      if (shorthand.includes(next)) {
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
        if (pattern[end] === ']') {
          depth--
          if (depth === 0) break
        }
        end++
      }
      if (depth === 0) {
        const cls = pattern.slice(i, end + 1)
        const negated = cls.startsWith('[^')
        segs.push({
          text: cls,
          type: 'charset',
          description: negated ? t('tools.regexVis.negatedClassDesc') : t('tools.regexVis.charsetDesc'),
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
        if (pattern[end] === ')') {
          depth--
          if (depth === 0) break
        }
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

    // 量词
    if ('*+?'.includes(ch)) {
      if (segs.length > 0) {
        const prev = segs[segs.length - 1]
        const quantMap: Record<string, string> = {
          '*': t('tools.regexVis.zeroOrMoreDesc'),
          '+': t('tools.regexVis.oneOrMoreDesc'),
          '?': t('tools.regexVis.zeroOrOneDesc'),
        }
        segs.push({
          text: ch,
          type: 'quantifier',
          detail: prev.text,
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
        const qDesc = t('tools.regexVis.repeatDesc') + ' ' + quant
        segs.push({
          text: quant,
          type: 'quantifier',
          detail: (segs.length > 0 ? segs[segs.length - 1].text : 'x') + quant,
          description: qDesc,
        })
        i = end + 1
      } else {
        segs.push({ text: ch, type: 'literal', description: t('tools.regexVis.literalDesc') })
        i++
      }
      continue
    }

    // 普通字符
    segs.push({
      text: ch,
      type: 'literal',
      description: `${t('tools.regexVis.literalDesc')} "${ch}"`,
    })
    i++
  }

  return segs
}

// ---------- 更新 ----------
function onInput() {
  parseError.value = ''
  svgContent.value = ''
  explanations.value = []
  testResults.value = []

  if (!pattern.value.trim()) return

  try {
    // 验证 regex
    new RegExp(pattern.value, flagsStr.value)

    const segs = parseRegex(pattern.value)
    if (segs.length > 0) {
      svgContent.value = renderRailroad(segs)
    }

    if (testInput.value) {
      runTest()
    }
  } catch (e: any) {
    parseError.value = e.message
  }
}

function runTest() {
  testResults.value = []
  if (!pattern.value.trim() || !testInput.value) return

  try {
    const flags = flagsStr.value.includes('g') ? flagsStr.value : flagsStr.value + 'g'
    const re = new RegExp(pattern.value, flags)
    const matches = [...testInput.value.matchAll(re)]
    testResults.value = matches.map((m) => ({
      text: m[0],
      pos: m.index,
    }))
  } catch {
    // ignore
  }
}

function copyDiagram() {
  if (!svgContent.value) {
    BlogTip.show(t('tools.regexVis.nothingToCopy'), { type: 'warning' })
    return
  }
  // 复制 SVG 源码
  copyText(svgContent.value, t('tools.copied'))
}

function clear() {
  pattern.value = ''
  flagsStr.value = 'g'
  testInput.value = ''
  parseError.value = ''
  svgContent.value = ''
  explanations.value = []
  testResults.value = []
}
</script>

<style scoped>
/* 模式行 */
.regex-vis-pattern-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.regex-vis-delimiter {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  padding: 0 2px;
}

.regex-vis-pattern-input {
  flex: 1;
  min-width: 0;
}

.regex-vis-flags-input {
  width: 70px;
  flex-shrink: 0;
}

/* 错误提示 */
.regex-vis-error {
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(220, 53, 69, 0.08);
  color: #dc3545;
  font-size: 0.8rem;
  font-family: 'Consolas', 'Monaco', monospace;
}

/* SVG 容器 */
.regex-vis-svg-wrapper {
  margin-top: 4px;
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

/* 节点说明 */
.regex-vis-explanations {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* 测试结果 */
.regex-vis-test-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.regex-vis-test-match {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.82rem;
}

.regex-vis-test-match:last-child {
  border-bottom: none;
}

.regex-vis-test-idx {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--accent);
  font-size: 0.75rem;
}

.regex-vis-test-text {
  flex: 1;
  color: var(--text-primary);
  word-break: break-all;
}

.regex-vis-test-pos {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.regex-vis-test-empty {
  padding: 12px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}
</style>
