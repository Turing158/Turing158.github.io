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
    <text :x="padding * 2" :y="padding + 45" font-size="30" font-weight="700" :fill="styleOptions.fontColor" font-family="'Segoe UI', Arial, sans-serif">Token用量</text>

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
      <!-- 左上角标签 -->
      <text
        :x="badge.x + (badge.large ? 20 : 15)"
        :y="badge.y + (badge.large ? 35 : 30)"
        :font-size="badge.large ? 24 : 22"
        font-weight="700"
        :fill="styleOptions.fontColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ badge.label }}</text>
      <!-- 右下角数值 -->
      <text
        :x="badge.x + badge.width - 15"
        :y="badge.y + badge.height - 18"
        text-anchor="end"
        :font-size="badge.large ? 26 : 24"
        font-weight="700"
        :fill="styleOptions.primaryColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ badge.value }}</text>
    </g>

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
    <text :x="padding * 2" :y="mainCardY + 40" font-size="20" font-weight="600" :fill="styleOptions.fontColor" font-family="'Segoe UI', Arial, sans-serif">Token 贡献图</text>
    <text :x="width - padding * 2" :y="mainCardY + 40" text-anchor="end" font-size="14" font-weight="400" :fill="styleOptions.axisLabelColor" font-family="'Segoe UI', Arial, sans-serif">{{ rangeLabel }}</text>

    <!-- 月份行：轻量标签 -->
    <g v-for="month in grid.monthLabels" :key="month.key">
      <text
        :x="month.x"
        :y="monthLabelY"
        text-anchor="middle"
        font-size="11"
        font-weight="500"
        letter-spacing="0.04em"
        fill={styleOptions.axisLabelColor}
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
        fill={styleOptions.axisLabelColor}
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

  
    <!-- ── 统计图卡片 ── -->
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
    <text :x="padding * 2" :y="statsTop + 38" font-size="20" font-weight="600" :fill="styleOptions.fontColor" font-family="'Segoe UI',Arial, sans-serif">Token 图表</text>

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
      :fill="styleOptions.axisLabelColor"
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
      :fill="styleOptions.axisLabelColor"
      font-family="'Segoe UI', Arial, sans-serif"
    >{{ label.label }}</text>

    <!-- 图例 -->
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
        :fill="styleOptions.fontColor"
        font-family="'Segoe UI', Arial, sans-serif"
      >{{ item.label }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TokenUsageRow } from '@/utils/sqlLogParser'
import {
  addDays,
  aggregateRows,
  dateKey,
  endOfWeekSunday,
  formatCompactTokens,
  formatMoney,
  formatMonthLabel,
  formatRangeLabel,
  getLocalDateParts,
  levelTextColor,
  levelToColor,
  scoreToLevel,
  startOfWeekMonday,
  type TokenUsageStyleOptions,
} from './tokenUsageSvg'

function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return Math.round(value).toString()
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
const badgeWidth = 180
const badgeHeight = 100
const badgeGap = 12

const width = computed(() => Number(props.styleOptions.width) || 720)
const height = computed(() => Math.max(Number(props.styleOptions.height) || 1200, wholeHeight.value))
const padding = computed(() => Number(props.styleOptions.padding) || 40)
const cardOpacity = computed(() => {
  const raw = Number(props.styleOptions.cardOpacity)
  if (!Number.isFinite(raw)) return 0.48
  // 百分比 0-100
  return Math.min(1, Math.max(0, raw / 100))
})
const contentWidth = computed(() => width.value - 2 * padding.value)

const topCardHeight = computed(() => {
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

  for (const badge of badges) {
    const w = badge.width
    if (currentRow.length > 0 && currentWidth + badgeGap + w > contentWidth.value) {
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
  const layouts: BadgeLayout[] = []
  // 与标题同步下移 17px（52→69）
  let y = padding.value + 69
  for (const row of badgeRows.value) {
    let x = padding.value * 2
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

const mainCardY = computed(() => padding.value + topCardHeight.value + 24)
const monthLabelY = computed(() => mainCardY.value + 40 + 20 + 16)
const maxWeeks = 16
const gridGap = 8
const gridLabelWidth = 30
const cellSize = 28
const step = cellSize + gridGap
const gridLeft = computed(() => padding.value + 15 + gridLabelWidth)
const gridStartY = computed(() => monthLabelY.value + 18)
const mainCardHeight = computed(() => {
  const gridBlockHeight = cellSize * 7 + gridGap * 6
  return Math.max(280, 44 + 32 + 18 + gridBlockHeight + 36)
})

const aggregate = computed(() => aggregateRows(props.rows))
const rangeLabel = computed(() => formatRangeLabel(aggregate.value.minDate, aggregate.value.maxDate))

const visibleBadges = computed(() => {
  const agg = aggregate.value
  const totalConsumed =
    agg.totalTokens + agg.cacheInputTokens + agg.cacheCreationTokens
  const vibeDays = agg.dailyBuckets.length

  return [
    {
      label: '总消耗Token',
      value: formatCompactTokens(totalConsumed),
      visible: true,
      width: Math.round(badgeWidth * 1.5) + 6,
      large: true,
    },
    {
      label: 'Vibe Coding',
      value: `${vibeDays}天`,
      visible: true,
      width: Math.round(badgeWidth * 1.5) + 6,
      large: true,
    },
    { label: '总用量', value: formatCompactTokens(agg.totalTokens), visible: props.styleOptions.showTotal, width: badgeWidth, large: false },
    { label: '输入', value: formatCompactTokens(agg.inputTokens), visible: props.styleOptions.showInput, width: badgeWidth, large: false },
    { label: '输出', value: formatCompactTokens(agg.outputTokens), visible: props.styleOptions.showOutput, width: badgeWidth, large: false },
    { label: '总花费', value: formatMoney(agg.totalCost), visible: props.styleOptions.showTotalCost, width: badgeWidth, large: false },
    { label: '缓存输入', value: formatCompactTokens(agg.cacheInputTokens), visible: props.styleOptions.showCacheInput, width: badgeWidth, large: false },
    { label: '缓存创建', value: formatCompactTokens(agg.cacheCreationTokens), visible: props.styleOptions.showCacheCreation, width: badgeWidth, large: false },
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

const rowLabels = computed<GridRowLabel[]>(() =>
  WEEKDAY_LABELS.map((item, index) => ({
    label: item.label,
    shortLabel: item.shortLabel,
    y: gridStartY.value + index * step + cellSize / 2,
  })),
)

const grid = computed(() => {
  const buckets = aggregate.value.dailyBuckets
  const wCount = maxWeeks
  const left = gridLeft.value

  if (buckets.length === 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startWeekday = (today.getDay() + 6) % 7
    const gridStart = new Date(today)
    gridStart.setDate(gridStart.getDate() - startWeekday - (wCount - 1) * 7)

    const cells: GridCell[] = []
    for (let i = 0; i < wCount * 7; i++) {
      const date = addDays(gridStart, i)
      const weekday = getLocalDateParts(date).weekday
      const x = left + Math.floor(i / 7) * step
      const y = gridStartY.value + weekday * step
      cells.push({
        key: dateKey(date),
        x,
        y,
        size: cellSize,
        day: String(date.getDate()),
        level: 0,
        fill: props.styleOptions.gridEmptyColor,
        textColor: props.styleOptions.axisLabelColor,
      })
    }
    return { monthLabels: [], rowLabels: rowLabels.value, cells }
  }

  const dataStart = startOfWeekMonday(buckets[0].date)
  const dataEnd = endOfWeekSunday(buckets[buckets.length - 1].date)
  const dataDays = Math.max(1, Math.round((dataEnd.getTime() - dataStart.getTime()) / 86_400_000) + 1)
  const dataWeeks = Math.max(1, Math.ceil(dataDays / 7))

  let gridStart = dataStart
  if (dataWeeks <= wCount) {
    const diff = wCount - dataWeeks
    gridStart = new Date(dataStart)
    gridStart.setDate(gridStart.getDate() - diff * 7)
  } else {
    gridStart = new Date(dataEnd)
    gridStart.setDate(gridStart.getDate() - (wCount * 7 - 1))
    gridStart = startOfWeekMonday(gridStart)
  }

  const maxScore = Math.max(...buckets.map((bucket) => bucket.totalTokens), 1)
  const dayMap = new Map(buckets.map((bucket) => [dateKey(bucket.date), bucket.totalTokens]))
  const primaryColor = props.styleOptions.primaryColor

  const monthMap = new Map<string, GridMonthLabel>()
  for (let weekIndex = 0; weekIndex < wCount; weekIndex++) {
    const monday = new Date(gridStart)
    monday.setDate(monday.getDate() + weekIndex * 7)
    const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) {
      const x = left + weekIndex * step
      monthMap.set(key, { key, label: formatMonthLabel(monday), x })
    }
  }

  const monthEntries = Array.from(monthMap.entries())
  const monthLabels = monthEntries.map(([, entry], index) => {
    const nextX = monthEntries[index + 1]?.[1].x ?? (left + wCount * step)
    return { ...entry, x: (entry.x + nextX) / 2 }
  })

  const cells: GridCell[] = []
  for (let i = 0; i < wCount * 7; i++) {
    const date = addDays(gridStart, i)
    const weekday = getLocalDateParts(date).weekday
    const weekIndex = Math.floor(i / 7)
    const x = left + weekIndex * step
    const y = gridStartY.value + weekday * step
    const score = dayMap.get(dateKey(date)) ?? 0
    // score > 0 至少 1 档；score = 0 不着色
    const level = scoreToLevel(score, maxScore)
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

  return { monthLabels, rowLabels: rowLabels.value, cells }
})

const statsTop = computed(() => mainCardY.value + mainCardHeight.value + 24)
const statsChartHeight = 300

const visibleSeries = computed(() => {
  const c = props.styleOptions
  const series = [
    { key: 'totalTokens', label: '总用量', color: c.colorTotal, visible: c.showTotal },
    { key: 'inputTokens', label: '输入', color: c.colorInput, visible: c.showInput },
    { key: 'outputTokens', label: '输出', color: c.colorOutput, visible: c.showOutput },
    { key: 'totalCost', label: '总花费', color: c.colorTotalCost, visible: c.showTotalCost, isCost: true },
    { key: 'cacheInputTokens', label: '缓存输入', color: c.colorCacheInput, visible: c.showCacheInput },
    { key: 'cacheCreationTokens', label: '缓存创建', color: c.colorCacheCreation, visible: c.showCacheCreation },
  ]
  return series.filter((s) => s.visible)
})

const wholeHeight = computed(() => statsTop.value + statsChartHeight + 40)


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

