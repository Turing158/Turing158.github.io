<template>
  <svg
    ref="rootSvgRef"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="token-usage-title token-usage-desc"
  >
    <title id="token-usage-title">Token用量</title>
    <desc id="token-usage-desc">Token usage summary and calendar-style heatmap generated from uploaded logs.</desc>

    <defs>
      <linearGradient id="token-usage-gradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#E0E7FF" />
        <stop offset="100%" :stop-color="styleOptions.primaryColor" />
      </linearGradient>
      <filter id="token-usage-shadow" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.08)" />
      </filter>
      <!-- 毛玻璃：轻微高斯模糊 + 提亮 -->
      <filter id="token-usage-glass" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0.02
                  0 1 0 0 0.02
                  0 0 1 0 0.03
                  0 0 0 0.78 0"
          result="glass"
        />
      </filter>
    </defs>

    <rect x="0" y="0" :width="width" :height="height" :fill="styleOptions.bgColor" />

    <!-- ── 用量数据卡片 ── -->
    <template v-if="styleOptions.showUsageModule">
      <g filter="url(#token-usage-shadow)">
        <rect
          :x="padding"
          :y="padding"
          :width="width - 2 * padding"
          :height="topCardHeight"
          rx="16"
          :fill="styleOptions.cardBgColor"
          :fill-opacity="cardOpacity"
          stroke="rgba(255,255,255,0.8)"
          stroke-width="1"
          filter="url(#token-usage-glass)"
        />
      </g>
      <text
        :x="cardTitleX"
        :y="padding + 45"
        :text-anchor="cardTitleAnchor"
        font-size="30"
        font-weight="700"
        :fill="styleOptions.fontColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ cardTitleText }}</text>

      <g v-for="badge in badgeLayouts" :key="badge.label">
        <rect
          :x="badge.x"
          :y="badge.y"
          :width="badge.width"
          :height="badge.height"
          rx="20"
          :fill="styleOptions.primaryColor"
          fill-opacity="0.12"
        />
        <!-- 标题（胶囊左上/中/右） -->
        <text
          :x="badgeLabelX(badge)"
          :y="badge.y + (badge.large ? 35 : 30)"
          :text-anchor="badgeLabelAnchor"
          :font-size="badge.large ? 24 : 22"
          font-weight="700"
          :fill="styleOptions.fontColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >{{ badge.label }}</text>
        <!-- 数据（胶囊左下/中/右） -->
        <text
          :x="badgeValueX(badge)"
          :y="badge.y + badge.height - 18"
          :text-anchor="badgeValueAnchor"
          :font-size="badge.large ? 26 : 24"
          font-weight="700"
          :fill="styleOptions.primaryColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >{{ badge.value }}</text>
      </g>
    </template>

    <!-- ── 贡献图卡片 ── -->
    <template v-if="styleOptions.showContributionModule">
      <g filter="url(#token-usage-shadow)">
        <rect
          :x="padding"
          :y="mainCardY"
          :width="width - 2 * padding"
          :height="mainCardHeight"
          rx="16"
          :fill="styleOptions.cardBgColor"
          :fill-opacity="cardOpacity"
          stroke="rgba(255,255,255,0.8)"
          stroke-width="1"
          filter="url(#token-usage-glass)"
        />
      </g>
      <text
        :x="contributionTitleX"
        :y="mainCardY + 40"
        :text-anchor="contributionTitleAnchor"
        font-size="20"
        font-weight="600"
        :fill="styleOptions.fontColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ contributionTitleText }}</text>
      <text
        v-if="styleOptions.showDateRange"
        :x="width - padding * 2"
        :y="mainCardY + 40"
        text-anchor="end"
        font-size="14"
        font-weight="400"
        :fill="styleOptions.dateRangeFontColor || styleOptions.axisLabelColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ rangeLabel }}</text>

      <!-- 月份行：轻量标签 -->
      <g v-for="month in grid.monthLabels" :key="month.key">
        <text
          :x="month.x"
          :y="monthLabelY"
          text-anchor="middle"
          font-size="11"
          font-weight="500"
          letter-spacing="0.04em"
          :fill="styleOptions.monthLabelColor || styleOptions.axisLabelColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >
          {{ month.label }}
        </text>
      </g>

      <!-- 周一~周日列：弱化辅助标签 -->
      <g v-for="row in grid.rowLabels" :key="row.label">
        <text
          :x="padding + 15 + gridLabelWidth / 2"
          :y="row.y"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="11"
          font-weight="500"
          letter-spacing="0.02em"
          :fill="styleOptions.weekdayLabelColor || styleOptions.axisLabelColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >
          {{ row.shortLabel }}
        </text>
      </g>

      <g v-for="cell in grid.cells" :key="cell.key">
        <rect
          :x="cell.x"
          :y="cell.y"
          :width="cell.size"
          :height="cell.size"
          rx="6"
          :fill="cell.fill"
        />
      </g>

      <!-- 贡献图图例 -->
      <g v-if="styleOptions.showContributionLegend" :transform="`translate(${contributionLegendX}, ${contributionLegendY})`">
        <text
          x="0"
          y="12"
          font-size="11"
          font-weight="400"
          :fill="styleOptions.axisLabelColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >{{ contributionLegendLessText }}</text>
        <g v-for="(item, i) in contributionLegendItems" :key="'legend-' + i">
          <rect
            :x="contributionLegendSwatchX + i * (contributionLegendSwatchSize + 4)"
            :y="0"
            :width="contributionLegendSwatchSize"
            :height="contributionLegendSwatchSize"
            rx="3"
            :fill="item.color"
          />
        </g>
        <text
          :x="contributionLegendMoreX"
          y="12"
          font-size="11"
          font-weight="400"
          :fill="styleOptions.axisLabelColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >{{ contributionLegendMoreText }}</text>
      </g>
    </template>

    <!-- ── 统计图卡片 ── -->
    <template v-if="styleOptions.showChartModule">
    <g filter="url(#token-usage-shadow)">
      <rect
        :x="padding"
        :y="statsTop"
        :width="width - 2 * padding"
        :height="statsChartHeight"
        rx="16"
        :fill="styleOptions.cardBgColor"
        :fill-opacity="cardOpacity"
        stroke="rgba(255,255,255,0.8)"
        stroke-width="1"
        filter="url(#token-usage-glass)"
      />
    </g>
    <text
      :x="chartTitleX"
      :y="statsTop + 38"
      :text-anchor="chartTitleAnchor"
      font-size="20"
      font-weight="600"
      :fill="styleOptions.fontColor"
      font-family="'Segoe UI',Arial, sans-serif"
    >{{ chartTitleText }}</text>

    <!-- 网格背景 -->
    <g>
      <line
        v-for="gridLine in statsChart.yLabels"
        :key="'g-' + gridLine.label"
        :x1="statsChart.chartLeft"
        :y1="gridLine.y"
        :x2="statsChart.chartRight"
        :y2="gridLine.y"
        stroke="#E5E7EB"
        stroke-width="1"
      />
    </g>

    <!-- 柱状/面积/折线 -->
    <g v-for="s in statsChart.points" :key="s.key">
      <path
        v-if="s.path"
        :d="s.path"
        :fill="statsChart.fillColor(s)"
        :stroke="statsChart.strokeColor(s)"
        :fill-opacity="statsChart.fillOpacity"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </g>

    <!-- x 轴标签 -->
    <text
      v-for="(label, i) in statsChart.xLabels"
      :key="'x-' + i"
      :x="label.x"
      :y="statsTop + statsChartHeight - 35 + 12"
      text-anchor="middle"
      font-size="10"
      font-weight="400"
      :fill="styleOptions.chartDateFontColor || styleOptions.axisLabelColor"
      font-family="'Segoe UI', Arial, sans-serif"
    >{{ label.label }}</text>

    <!-- y 轴标签 -->
    <text
      v-for="(label, i) in statsChart.yLabels"
      :key="'y-' + i"
      :x="statsChart.chartLeft - 6"
      :y="label.y + 3"
      text-anchor="end"
      font-size="10"
      font-weight="400"
      :fill="styleOptions.chartValueFontColor || styleOptions.axisLabelColor"
      font-family="'Segoe UI', Arial, sans-serif"
    >{{ label.label }}</text>

    <!-- 图例 -->
    <template v-if="styleOptions.showLegend">
      <g v-for="item in statsChart.legend" :key="'legend-' + item.key">
        <rect
          :x="item.x"
          :y="item.y"
          width="12"
          height="12"
          rx="2"
          :fill="item.color"
        />
        <text
          :x="item.x + 18"
          :y="item.y + 10"
          font-size="11"
          font-weight="400"
          :fill="styleOptions.legendFontColor || styleOptions.fontColor"
          font-family="'Segoe UI', Arial, sans-serif"
        >{{ item.label }}</text>
      </g>
    </template>
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TokenUsageRow } from '@/utils/sqlLogParser'
import {
  addDays,
  aggregateRows,
  dateKey,
  formatCompactTokens,
  formatMoney,
  formatMonthLabel,
  formatRangeLabel,
  levelTextColor,
  levelToColor,
  scoreToLevel,
  type TokenUsageStyleOptions,
} from './tokenUsageSvg'

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return Math.round(value).toString()
}

/**
 * 估算一段文本在给定字号下的渲染宽度（px）。
 * 中文（及全角）按 1 个字号宽，其余（数字/字母/符号）按 0.6 个字号宽。
 */
function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0
  for (const ch of text) {
    units += /[一-鿿＀-￯]/.test(ch) ? 1 : 0.6
  }
  return units * fontSize
}

interface Props {
  rows: TokenUsageRow[]
  styleOptions: TokenUsageStyleOptions
}

interface BadgeLayout {
  label: string
  value: string
  x: number
  y: number
  width: number
  height: number
  large?: boolean
}

interface GridMonthLabel {
  key: string
  label: string
  x: number
}

interface GridRowLabel {
  label: string
  shortLabel: string
  y: number
}

interface GridCell {
  key: string
  x: number
  y: number
  size: number
  day: string
  level: number
  fill: string
  textColor: string
}

const props = defineProps<Props>()

const rootSvgRef = ref<SVGSVGElement | null>(null)

defineExpose({
  getSvgElement: () => rootSvgRef.value,
})

// 相对 168×86 的基准按 180/168 等比放大（宽 +12）
const badgeHeight = 100
const badgeGap = 12
const badgeInnerInset = 15

const orientation = computed(() => props.styleOptions.orientation || 'portrait')
const padding = computed(() => Number(props.styleOptions.padding) || 40)

/** 用量卡片标题文本 */
const cardTitleText = computed(() => props.styleOptions.usageCardTitleText || 'Token用量')

/** 用量卡片标题对齐 */
const cardTitleAnchor = computed(() => {
  const align = props.styleOptions.usageCardTitleAlign || 'left'
  return align === 'left' ? 'start' as const : align === 'right' ? 'end' as const : 'middle' as const
})
const cardTitleX = computed(() => {
  const align = props.styleOptions.usageCardTitleAlign || 'left'
  const p = padding.value
  if (align === 'center') return width.value / 2
  if (align === 'right') return width.value - p * 2
  return p * 2
})

/** 贡献图卡片标题文本 */
const contributionTitleText = computed(() => props.styleOptions.contributionCardTitleText || 'Token 贡献图')

/** 贡献图卡片标题对齐 */
const contributionTitleAnchor = computed(() => {
  const align = props.styleOptions.contributionCardTitleAlign || 'left'
  return align === 'left' ? 'start' as const : align === 'right' ? 'end' as const : 'middle' as const
})
const contributionTitleX = computed(() => {
  const align = props.styleOptions.contributionCardTitleAlign || 'left'
  const p = padding.value
  if (align === 'center') return width.value / 2
  if (align === 'right') return width.value - p * 2
  return p * 2
})

/** 图表卡片标题文本 */
const chartTitleText = computed(() => props.styleOptions.chartCardTitleText || 'Token 图表')

/** 图表卡片标题对齐 */
const chartTitleAnchor = computed(() => {
  const align = props.styleOptions.chartCardTitleAlign || 'left'
  return align === 'left' ? 'start' as const : align === 'right' ? 'end' as const : 'middle' as const
})
const chartTitleX = computed(() => {
  const align = props.styleOptions.chartCardTitleAlign || 'left'
  const p = padding.value
  if (align === 'center') return width.value / 2
  if (align === 'right') return width.value - p * 2
  return p * 2
})

/** 胶囊标题（label）的水平对齐：返回 { x, anchor } */
const badgeLabelAnchor = computed(() => {
  const align = props.styleOptions.usageTitleAlign || 'left'
  return align === 'left' ? 'start' as const : align === 'right' ? 'end' as const : 'middle' as const
})
function badgeLabelX(badge: BadgeLayout): number {
  const align = props.styleOptions.usageTitleAlign || 'left'
  if (align === 'center') return badge.x + badge.width / 2
  if (align === 'right') return badge.x + badge.width - badgeInnerInset
  return badge.x + badgeInnerInset
}

/** 胶囊数据（value）的水平对齐：返回 { x, anchor } */
const badgeValueAnchor = computed(() => {
  const align = props.styleOptions.usageDataAlign || 'left'
  return align === 'left' ? 'start' as const : align === 'right' ? 'end' as const : 'middle' as const
})
function badgeValueX(badge: BadgeLayout): number {
  const align = props.styleOptions.usageDataAlign || 'left'
  if (align === 'center') return badge.x + badge.width / 2
  if (align === 'right') return badge.x + badge.width - badgeInnerInset
  return badge.x + badgeInnerInset
}

const gridGap = 8
const gridLabelWidth = 30
const cellSize = 28
const step = cellSize + gridGap
const statsChartHeight = 300
const moduleGap = 24


/**
 * 画布宽度：
 * - 横版/自定义：取设置值（styleOptions.width）
 * - 竖版：固定 720，不再随内容撑开
 */
const width = computed(() => {
  if (orientation.value === 'portrait') {
    return 720
  }
  if (orientation.value === 'landscape') {
    return 1280
  }
  // 自定义：使用设置值
  return Math.max(320, Number(props.styleOptions.width) || 1280)
})

/** 网格可用宽度（扣除左右 padding 与标签列） */
const gridAvailableWidth = computed(() => {
  const p = padding.value
  return Math.max(0, width.value - 2 * p - 15 - gridLabelWidth - 15)
})

/** 根据画布宽度动态计算最多能放多少周（至少 1 周） */
const maxWeeks = computed(() => Math.max(1, Math.floor(gridAvailableWidth.value / step)))

const topCardHeight = computed(() => {
  if (!props.styleOptions.showUsageModule) return 0
  const rowsCount = badgeRows.value.length
  const badgeBlockHeight = rowsCount * badgeHeight + Math.max(0, rowsCount - 1) * badgeGap
  // 标题下移 17px（28→45）后，顶部区域与底部留白同步修正
  return Math.max(157, 73 + badgeBlockHeight + 28)
})

const badgeRows = computed(() => {
  const badges = visibleBadges.value
  const rows: typeof badges[] = []
  let currentRow: typeof badges = []
  let currentWidth = 0
  const badgeContainerPadding = 32
  // 卡片内可用宽度（卡片左右各留 padding + badgeContainerPadding + badgeGap）
  const available = Math.max(0, width.value - 2 * padding.value - 2 * badgeContainerPadding - badgeGap)

  for (const badge of badges) {
    const w = badge.width
    if (currentRow.length > 0 && currentWidth + badgeGap + w > available) {
      rows.push(currentRow)
      currentRow = []
      currentWidth = 0
    }
    currentRow.push(badge)
    currentWidth += (currentRow.length > 1 ? badgeGap : 0) + w
  }
  if (currentRow.length > 0) rows.push(currentRow)
  return rows
})

const badgeLayouts = computed<BadgeLayout[]>(() => {
  if (!props.styleOptions.showUsageModule) return []
  const layouts: BadgeLayout[] = []
  // 与标题同步下移 17px（52→69）
  let y = padding.value + 69
  const p = padding.value
  const badgeContainerPadding = 32
  // 卡片内可用宽度（卡片左右各留 padding + badgeContainerPadding）
  const areaWidth = Math.max(0, width.value - 2 * p - 2 * badgeContainerPadding - badgeGap)
  // 胶囊始终居中于卡片
  const forceCenter = true
  for (const row of badgeRows.value) {
    // 当前行实际宽度
    const rowWidth = row.reduce((sum, badge, i) => sum + badge.width + (i > 0 ? badgeGap : 0), 0)
    let x = p + badgeContainerPadding + badgeGap
    if (forceCenter || props.styleOptions.usageDataAlign === 'center') {
      x = p + badgeContainerPadding + badgeGap + Math.max(0, (areaWidth - rowWidth) / 2) - 6
    } else if (props.styleOptions.usageDataAlign === 'right') {
      x = p + badgeContainerPadding + badgeGap + Math.max(0, areaWidth - rowWidth)
    }
    for (const badge of row) {
      layouts.push({
        label: badge.label,
        value: badge.value,
        x,
        y,
        width: badge.width,
        height: badgeHeight,
        large: badge.large,
      })
      x += badge.width + badgeGap
    }
    y += badgeHeight + badgeGap
  }
  return layouts
})

const mainCardY = computed(() => {
  if (!props.styleOptions.showUsageModule) return padding.value
  return padding.value + topCardHeight.value + moduleGap
})

/** 贡献图图例位置 */
const contributionLegendY = computed(() => {
  const gridBlockHeight = cellSize * 7 + gridGap * 6
  return gridStartY.value + gridBlockHeight + 12
})

/** 贡献图图例色块大小与间距 */
const contributionLegendSwatchSize = 14
const contributionLegendSwatchCount = 5

/** 贡献图图例色块颜色（从少到多取 5 档） */
const contributionLegendItems = computed(() => {
  const primary = props.styleOptions.primaryColor
  const levels = [1, 3, 5, 7, 9]
  return levels.map((level) => ({
    color: levelToColor(level, primary),
  }))
})

const contributionLegendSwatchX = 28
const contributionLegendMoreX = computed(
  () => contributionLegendSwatchX + contributionLegendSwatchCount * (contributionLegendSwatchSize + 4) + 6,
)

/** 贡献图图例文本 */
const contributionLegendLessText = '少'
const contributionLegendMoreText = '多'

/** 贡献图图例总宽度 */
const contributionLegendWidth = computed(
  () => contributionLegendMoreX.value + 18,
)

/** 贡献图图例 X 位置（居右，右侧留 20px 间距） */
const contributionLegendX = computed(
  () => width.value - padding.value - contributionLegendWidth.value - 20,
)
const monthLabelY = computed(() => mainCardY.value + 40 + 20 + 16)
const gridLeft = computed(() => padding.value + 15 + gridLabelWidth)
const gridStartY = computed(() => monthLabelY.value + 18)
const mainCardHeight = computed(() => {
  if (!props.styleOptions.showContributionModule) return 0
  const gridBlockHeight = cellSize * 7 + gridGap * 6
  const legendHeight = props.styleOptions.showContributionLegend ? 36 : 0
  return Math.max(280, 44 + 32 + 18 + gridBlockHeight + 12 + legendHeight + 16)
})

const aggregate = computed(() => aggregateRows(props.rows))
const rangeLabel = computed(() => formatRangeLabel(aggregate.value.minDate, aggregate.value.maxDate))

const visibleBadges = computed(() => {
  const agg = aggregate.value
  const totalConsumed =
    agg.totalTokens + agg.cacheInputTokens + agg.cacheCreationTokens
  const vibeDays = agg.dailyBuckets.length
  const opts = props.styleOptions

  // 普通徽章：标签字号 22、数值字号 24，左右各留 badgeInnerInset 内边距
  const minBadgeWidth = (label: string, value: string) => {
    const contentWidth = Math.max(
      estimateTextWidth(label, 22),
      estimateTextWidth(value, 24),
    )
    return Math.ceil(contentWidth + badgeInnerInset * 2)
  }
  // 大徽章：标签字号 24、数值字号 26
  const minLargeBadgeWidth = (label: string, value: string) => {
    const contentWidth = Math.max(
      estimateTextWidth(label, 24),
      estimateTextWidth(value, 26),
    )
    return Math.ceil(contentWidth + badgeInnerInset * 2)
  }
  // 用户设置宽度与最小宽度取较大值（留空/非法时按最小宽度）
  const resolveWidth = (raw: string, _label: string, _value: string, minWidth: number) => {
    const user = Number(raw)
    return Number.isFinite(user) && user > 0 ? Math.max(user, minWidth) : minWidth
  }

  return [
    {
      label: '总消耗Token',
      value: formatCompactTokens(totalConsumed),
      visible: true,
      width: resolveWidth(opts.widthLargeTotal, '总消耗Token', formatCompactTokens(totalConsumed), minLargeBadgeWidth('总消耗Token', formatCompactTokens(totalConsumed))),
      large: true,
    },
    {
      label: 'Vibe Coding',
      value: `${vibeDays}天`,
      visible: true,
      width: resolveWidth(opts.widthLargeVibe, 'Vibe Coding', `${vibeDays}天`, minLargeBadgeWidth('Vibe Coding', `${vibeDays}天`)),
      large: true,
    },
    { label: '总用量', value: formatCompactTokens(agg.totalTokens), visible: opts.showTotal, width: resolveWidth(opts.widthTotal, '总用量', formatCompactTokens(agg.totalTokens), minBadgeWidth('总用量', formatCompactTokens(agg.totalTokens))), large: false },
    { label: '输入', value: formatCompactTokens(agg.inputTokens), visible: opts.showInput, width: resolveWidth(opts.widthInput, '输入', formatCompactTokens(agg.inputTokens), minBadgeWidth('输入', formatCompactTokens(agg.inputTokens))), large: false },
    { label: '输出', value: formatCompactTokens(agg.outputTokens), visible: opts.showOutput, width: resolveWidth(opts.widthOutput, '输出', formatCompactTokens(agg.outputTokens), minBadgeWidth('输出', formatCompactTokens(agg.outputTokens))), large: false },
    { label: '总花费', value: formatMoney(agg.totalCost), visible: opts.showTotalCost, width: resolveWidth(opts.widthTotalCost, '总花费', formatMoney(agg.totalCost), minBadgeWidth('总花费', formatMoney(agg.totalCost))), large: false },
    { label: '缓存输入', value: formatCompactTokens(agg.cacheInputTokens), visible: opts.showCacheInput, width: resolveWidth(opts.widthCacheInput, '缓存输入', formatCompactTokens(agg.cacheInputTokens), minBadgeWidth('缓存输入', formatCompactTokens(agg.cacheInputTokens))), large: false },
    { label: '缓存创建', value: formatCompactTokens(agg.cacheCreationTokens), visible: opts.showCacheCreation, width: resolveWidth(opts.widthCacheCreation, '缓存创建', formatCompactTokens(agg.cacheCreationTokens), minBadgeWidth('缓存创建', formatCompactTokens(agg.cacheCreationTokens))), large: false },
  ].filter(item => item.visible)
})

const WEEKDAY_LABELS = [
  { label: '周一', shortLabel: '一' },
  { label: '周二', shortLabel: '二' },
  { label: '周三', shortLabel: '三' },
  { label: '周四', shortLabel: '四' },
  { label: '周五', shortLabel: '五' },
  { label: '周六', shortLabel: '六' },
  { label: '周日', shortLabel: '日' },
] as const

/**
 * 网格的锚点日期（最新有数据的日期，锁定在右下角）。
 * 无数据时用今天。
 */
const gridAnchorDate = computed(() => {
  const buckets = aggregate.value.dailyBuckets
  const base = buckets.length > 0 ? buckets[buckets.length - 1].date : new Date()
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  return d
})

/**
 * 每一行对应的星期（0=周一 … 6=周日）。
 * 以锚点日期所在行为最后一行（索引 6），往上倒推。
 * 例如锚点是周一，则行顺序为：周二、周三、周四、周五、周六、周日、周一。
 */
const rowWeekdays = computed<number[]>(() => {
  const anchorWeekday = (gridAnchorDate.value.getDay() + 6) % 7
  // 第 rowIndex 行（0 在顶部，6 在底部）对应的星期
  // 底部（rowIndex=6）= anchorWeekday，往上每行 -1 天
  return Array.from({ length: 7 }, (_, rowIndex) => {
    return ((anchorWeekday - (6 - rowIndex)) % 7 + 7) % 7
  })
})

const rowLabels = computed<GridRowLabel[]>(() =>
  rowWeekdays.value.map((weekday, index) => ({
    label: WEEKDAY_LABELS[weekday].label,
    shortLabel: WEEKDAY_LABELS[weekday].shortLabel,
    y: gridStartY.value + index * step + cellSize / 2,
  })),
)

const grid = computed(() => {
  if (!props.styleOptions.showContributionModule) {
    return { monthLabels: [] as GridMonthLabel[], rowLabels: [] as GridRowLabel[], cells: [] as GridCell[] }
  }
  const buckets = aggregate.value.dailyBuckets
  const wCount = maxWeeks.value
  const left = gridLeft.value
  const anchor = gridAnchorDate.value

  // 网格总天数 = wCount 列 × 7 行；最新日期（anchor）锁定在右下角
  const totalCells = wCount * 7
  // 网格起始日期：从右下角 anchor 往前倒推 (totalCells - 1) 天
  const gridStart = addDays(anchor, -(totalCells - 1))

  const emptyData = buckets.length === 0
  const maxScore = emptyData
    ? 1
    : Math.max(...buckets.map((bucket) => bucket.totalTokens), 1)
  const dayMap = emptyData
    ? new Map<string, number>()
    : new Map(buckets.map((bucket) => [dateKey(bucket.date), bucket.totalTokens]))
  const primaryColor = props.styleOptions.primaryColor

  // 月份标签：每列首格（顶部，row=0）的日期决定该列所属月份
  const monthMap = new Map<string, GridMonthLabel>()
  for (let weekIndex = 0; weekIndex < wCount; weekIndex++) {
    const colTopDate = addDays(gridStart, weekIndex * 7)
    const key = `${colTopDate.getFullYear()}-${String(colTopDate.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) {
      const x = left + weekIndex * step
      monthMap.set(key, { key, label: formatMonthLabel(colTopDate), x })
    }
  }

  const monthEntries = Array.from(monthMap.entries())
  const monthLabels = monthEntries.map(([, entry], index) => {
    const nextX = monthEntries[index + 1]?.[1].x ?? (left + wCount * step)
    return { ...entry, x: (entry.x + nextX) / 2 }
  })

  const cells: GridCell[] = []
  for (let i = 0; i < totalCells; i++) {
    const date = addDays(gridStart, i)
    const weekIndex = Math.floor(i / 7)
    const rowIndex = i % 7
    const x = left + weekIndex * step
    const y = gridStartY.value + rowIndex * step
    const score = dayMap.get(dateKey(date)) ?? 0
    const level = emptyData ? 0 : scoreToLevel(score, maxScore)
    cells.push({
      key: dateKey(date),
      x,
      y,
      size: cellSize,
      day: String(date.getDate()),
      level,
      fill: level === 0 ? props.styleOptions.gridEmptyColor : levelToColor(level, primaryColor),
      textColor: level === 0 ? props.styleOptions.axisLabelColor : levelTextColor(level),
    })
  }

  return { monthLabels: emptyData ? [] : monthLabels, rowLabels: rowLabels.value, cells }
})

const statsTop = computed(() => {
  if (!props.styleOptions.showContributionModule) {
    if (!props.styleOptions.showUsageModule) return padding.value
    return padding.value + topCardHeight.value + moduleGap
  }
  return mainCardY.value + mainCardHeight.value + moduleGap
})

const visibleSeries = computed(() => {
  const c = props.styleOptions
  const series = [
    { key: 'totalTokens', label: '总用量', color: c.colorTotal, visible: c.chartShowTotal },
    { key: 'inputTokens', label: '输入', color: c.colorInput, visible: c.chartShowInput },
    { key: 'outputTokens', label: '输出', color: c.colorOutput, visible: c.chartShowOutput },
    { key: 'totalCost', label: '总花费', color: c.colorTotalCost, visible: c.chartShowTotalCost, isCost: true },
    { key: 'cacheInputTokens', label: '缓存输入', color: c.colorCacheInput, visible: c.chartShowCacheInput },
    { key: 'cacheCreationTokens', label: '缓存创建', color: c.colorCacheCreation, visible: c.chartShowCacheCreation },
  ]
  return series.filter((s) => s.visible)
})

/** 内容总高度（含底部边距），仅用于竖版高度计算 */
const wholeHeight = computed(() => {
  const p = padding.value
  let y = p
  if (props.styleOptions.showUsageModule) {
    y += topCardHeight.value
  }
  if (props.styleOptions.showContributionModule) {
    if (props.styleOptions.showUsageModule) y += moduleGap
    y += mainCardHeight.value
  }
  if (props.styleOptions.showChartModule) {
    if (props.styleOptions.showUsageModule || props.styleOptions.showContributionModule) y += moduleGap
    y += statsChartHeight
  }
  y += p
  return y
})

/**
 * 画布高度：
 * - 横版：由内容 + 边距决定（自适应）
 * - 竖版：由内容 + 边距决定
 */
const height = computed(() => Math.ceil(wholeHeight.value))

const cardOpacity = computed(() => {
  const raw = Number(props.styleOptions.cardOpacity)
  if (!Number.isFinite(raw)) return 0.48
  // 百分比 0-100
  return Math.min(1, Math.max(0, raw / 100))
})



interface StatsPoint {
  key: string
  label: string
  color: string
  path: string
  isCost: boolean
}

const statsChart = computed(() => {
  const series = visibleSeries.value as Array<{
    key: 'totalTokens' | 'inputTokens' | 'outputTokens' | 'cacheInputTokens' | 'cacheCreationTokens' | 'totalCost'
    label: string
    color: string
    visible: boolean
    isCost?: boolean
  }>
  const chartType = props.styleOptions.statsChartType
  const isFilled = chartType === 'area' || chartType === 'bar' || chartType === 'stacked'
  const strokeColor = (s: StatsPoint) => isFilled ? 'none' : s.color
  const fillColor = (s: StatsPoint) => isFilled ? s.color : 'none'
  const fillOpacity = isFilled ? 0.85 : 1

  interface EmptyStats {
    points: StatsPoint[]
    xLabels: { x: number; label: string }[]
    yLabels: { y: number; label: string }[]
    chartLeft: number
    chartRight: number
    titleHeight: number
    plotTop: number
    plotHeight: number
    baseLine: number
    xAxisBottomOffset: number
    legend: LegendItem[]
    strokeColor: (s: StatsPoint) => string
    fillColor: (s: StatsPoint) => string
    fillOpacity: number
  }
  interface LegendItem {
    key: string
    label: string
    color: string
    x: number
    y: number
  }
  const empty: EmptyStats = {
    points: [],
    xLabels: [],
    yLabels: [],
    chartLeft: 0,
    chartRight: 0,
    titleHeight: 0,
    plotTop: 0,
    plotHeight: 0,
    baseLine: 0,
    xAxisBottomOffset: 0,
    legend: [],
    strokeColor: () => 'none',
    fillColor: () => 'none',
    fillOpacity: 1,
  }
  if (series.length === 0) return empty

  const buckets = aggregate.value.dailyBuckets
  const n = buckets.length
  const chartLeft = padding.value + 50
  const chartRight = width.value - padding.value * 2 + 10
  const chartInnerWidth = chartRight - chartLeft
  const titleHeight = 40
  const chartOffsetY = 10
  const xAxisBottomOffset = 40
  const xAxisToPlotGap = 5

  const padTop = 16
  const xAxisY = statsTop.value + statsChartHeight - xAxisBottomOffset
  const plotBottomY = xAxisY - xAxisToPlotGap
  const plotTopY = statsTop.value + chartOffsetY + titleHeight + padTop
  const plotHeight = Math.max(40, plotBottomY - plotTopY)

  // 图例布局：放在「Token 图表」标题行，居右显示
  const legendItemHeight = 18
  const legendItemWidth = 18
  const legendGapX = 8
  const legendGapY = 6
  const swatchSize = 12
  const legendItems = series.map((s) => ({
    key: s.key,
    color: s.color,
    label: s.label,
    itemWidth: swatchSize + legendItemWidth + s.label.length * 6 + 4,
  }))

  // 按行分组
  const rows: typeof legendItems[] = []
  let currentRow: typeof legendItems = []
  let currentRowWidth = 0
  for (const item of legendItems) {
    const w = item.itemWidth + (currentRow.length > 0 ? legendGapX : 0)
    if (currentRow.length > 0 && currentRowWidth + w > chartInnerWidth) {
      rows.push(currentRow)
      currentRow = []
      currentRowWidth = 0
    }
    currentRow.push(item)
    currentRowWidth += w
  }
  if (currentRow.length > 0) rows.push(currentRow)

  // 逐行居右，与标题同行
  const legend: LegendItem[] = []
  rows.forEach((rowItems, rowIdx) => {
    const rowWidth = rowItems.reduce((sum, item, i) => sum + item.itemWidth + (i > 0 ? legendGapX : 0), 0)
    const startX = chartRight - rowWidth
    let x = startX
    rowItems.forEach((item) => {
      legend.push({
        key: item.key,
        color: item.color,
        label: item.label,
        x,
        y: statsTop.value + 38 + rowIdx * (legendItemHeight + legendGapY),
      })
      x += item.itemWidth + legendGapX
    })
  })

  const tokenSeries = series.filter((s) => !s.isCost)
  const costSeries = series.filter((s) => s.isCost)

  const tokenMax = tokenSeries.length
    ? Math.max(1, ...buckets.map((b) => Math.max(...tokenSeries.map((s) => b[s.key]))))
    : 1
  const costMax = costSeries.length
    ? Math.max(0.01, ...buckets.map((b) => Math.max(...costSeries.map((s) => b[s.key]))))
    : 0.01

  const xForIndex = (i: number) =>
    n <= 1 ? chartLeft + chartInnerWidth / 2 : chartLeft + (chartInnerWidth * i) / Math.max(n - 1, 1)
  const baseY = plotBottomY
  const yForToken = (v: number) => plotTopY + plotHeight * (1 - v / tokenMax)
  const yForCost = (v: number) => plotTopY + plotHeight * (1 - v / costMax)

  // Y 轴：4 档刻度 + 简短单位
  const yLabels = Array.from({ length: 4 }, (_, i) => ({
    y: plotTopY + (plotHeight * i) / 3,
    label: formatCompactNumber(Math.round(tokenMax * (1 - i / 3))),
  }))

  // X 轴：根据卡片宽度间隔抽取，防止叠在一起
  const maxXLabels = Math.max(2, Math.floor(chartInnerWidth / 60))
  const xStep = Math.max(1, Math.ceil(n / maxXLabels))
  const xLabels = buckets
    .map((b, i) => ({
      x: xForIndex(i),
      label: `${b.date.getMonth() + 1}/${b.date.getDate()}`,
      show: i % xStep === 0 || i === n - 1,
    }))
    .filter((l) => l.show)

  const buildPath = (s: typeof series[number]) => {
    if (n === 0) return ''
    const yFn = s.isCost ? yForCost : yForToken
    return buckets
      .map((b, i) => {
        const x = xForIndex(i)
        const y = yFn(b[s.key])
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const buildArea = (s: typeof series[number]) => {
    if (n === 0) return ''
    const yFn = s.isCost ? yForCost : yForToken
    const base = baseY
    const line = buckets
      .map((b, i) => {
        const x = xForIndex(i)
        const y = yFn(b[s.key])
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    const lastX = xForIndex(n - 1)
    const firstX = xForIndex(0)
    return `${line} L${lastX.toFixed(1)},${base} L${firstX.toFixed(1)},${base} Z`
  }

  const buildBars = (s: typeof series[number], idx: number, totalSlot: number) => {
    if (n === 0) return ''
    const yFn = s.isCost ? yForCost : yForToken
    const base = baseY
    const slot = chartInnerWidth / Math.max(n, 1)
    const barW = Math.max(4, (slot - 4) / totalSlot)
    return buckets
      .map((b, i) => {
        const cx = xForIndex(i)
        const y = yFn(b[s.key])
        const x = cx - slot / 2 + idx * barW + 2
        const h = Math.max(0, base - y)
        return `M${x.toFixed(1)},${y.toFixed(1)} h${barW.toFixed(1)} v${h.toFixed(1)} h${(-barW).toFixed(1)} Z`
      })
      .join('')
  }

  const pathChartType = props.styleOptions.statsChartType
  const points = series.map((s, idx) => {
    let path = ''
    if (pathChartType === 'bar' || pathChartType === 'stacked') {
      path = buildBars(s, idx, series.length)
    } else if (pathChartType === 'area') {
      path = buildArea(s)
    } else {
      path = buildPath(s)
    }
    return {
      key: s.key,
      label: s.label,
      color: s.color,
      path,
      isCost: !!s.isCost,
    }
  })

  return {
    points,
    xLabels,
    yLabels,
    chartLeft,
    chartRight,
    titleHeight,
    plotTop: plotTopY,
    plotHeight,
    baseLine: baseY,
    xAxisBottomOffset,
    legend,
    strokeColor,
    fillColor,
    fillOpacity,
  }
})
</script>

