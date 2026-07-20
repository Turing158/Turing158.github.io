import type { TokenUsageRow } from '../../utils/sqlLogParser'

export type StatsChartType = 'line' | 'area' | 'bar' | 'stacked'

export interface TokenUsageStyleOptions {
  primaryColor: string
  bgColor: string
  fontColor: string
  cardBgColor: string
  cardOpacity: string
  width: string
  height: string
  padding: string
  showTotal: boolean
  showInput: boolean
  showOutput: boolean
  showCacheInput: boolean
  showCacheCreation: boolean
  showTotalCost: boolean
  statsChartType: StatsChartType
  colorTotal: string
  colorInput: string
  colorOutput: string
  colorTotalCost: string
  colorCacheInput: string
  colorCacheCreation: string
  axisLabelColor: string
  gridEmptyColor: string
}

interface BadgeItem {
  label: string
  value: string
  visible: boolean
  kind: 'primary' | 'metric' | 'unit'
}

export interface DailyBucket {
  date: Date
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheInputTokens: number
  cacheCreationTokens: number
  totalCost: number
}

export interface AggregatedUsage {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheInputTokens: number
  cacheCreationTokens: number
  totalCost: number
  unit: string
  minDate: Date | null
  maxDate: Date | null
  dailyBuckets: DailyBucket[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MAIN_CARD = { x: 40, y: 244 }
const BADGE = { w: 100, h: 32, gap: 10 }
const GRID = { x: 72, y: 340, cell: 36, gap: 4, labelX: 60 }

const MONTH_LABEL_Y = 332
const LEGEND_Y = 298

const CELL_COLORS = {
  low: '#F3F4F6',
  midLow: '#E0E7FF',
  mid: '#A5B4FC',
  midHigh: '#818CF8',
  high: '#4F46E5',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function escapeXml(input: string) {
  return input
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&apos;')
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const normalized = value.replace(/[$,\s]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCompactTokens(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(2).replace(/\.00$/, '')}K`
  return `${sign}${Math.round(abs)}`
}

export function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function parseDate(value: string | null): Date | null {
  if (!value) return null
  const m = /^(\d{4})\/(\d{2})\/(\d{2})/.exec(value.trim())
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2]) - 1
    const day = Number(m[3])
    return new Date(year, month, day)
  }
  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function getLocalDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: (date.getDay() + 6) % 7,
  }
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatMonthLabel(date: Date): string {
  return `${date.getMonth() + 1}月`
}

export function formatRangeLabel(minDate: Date | null, maxDate: Date | null): string {
  if (!minDate || !maxDate) return '/ -- - --'
  const start = `${minDate.getFullYear()}.${pad(minDate.getMonth() + 1)}.${pad(minDate.getDate())}`
  const end = `${maxDate.getFullYear()}.${pad(maxDate.getMonth() + 1)}.${pad(maxDate.getDate())}`
  return `${start} - ${end}`
}

export function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date)
  const weekday = (copy.getDay() + 6) % 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() - weekday)
  return copy
}

export function endOfWeekSunday(date: Date): Date {
  const copy = new Date(date)
  const weekday = (copy.getDay() + 6) % 7
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + (6 - weekday))
  return copy
}

export function addDays(date: Date, count: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + count)
  return copy
}

function parseHexColor(hex: string) {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized
  const int = Number.parseInt(full, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function toHexChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value))).toString(16).padStart(2, '0')
}

/** 将 from 向 to 混合 ratio（0=from, 1=to），返回 #rrggbb */
export function mixColorsHex(from: string, to: string, ratio: number): string {
  const a = parseHexColor(from)
  const b = parseHexColor(to)
  const r = a.r + (b.r - a.r) * ratio
  const g = a.g + (b.g - a.g) * ratio
  const b2 = a.b + (b.b - a.b) * ratio
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b2)}`
}

export function mixColors(from: string, to: string, ratio: number): string {
  const hex = mixColorsHex(from, to, ratio)
  const { r, g, b } = parseHexColor(hex)
  return `rgb(${r} ${g} ${b})`
}

export function deriveAccentLight(primaryColor: string, bgColor: string) {
  return mixColors(primaryColor, bgColor, 0.9)
}

/**
 * forest 主题下主色 #4a7c59 与背景 #d6e6da 的白混比约为 0.78。
 * 任意主题主色按同一比例生成对应浅色背景；forest 精确返回 #d6e6da。
 */
export const THEME_BG_WHITE_MIX = 0.78

export function deriveThemeBgColor(primaryColor: string): string {
  const normalized = primaryColor.trim().toLowerCase()
  // 与 forest 主色完全一致时，返回用户指定的默认背景色
  if (normalized === '#4a7c59') return '#d6e6da'
  return mixColorsHex(primaryColor, '#ffffff', THEME_BG_WHITE_MIX)
}

export function scoreToLevel(score: number, maxScore: number): number {
  if (score <= 0 || maxScore <= 0) return 0
  const level = Math.ceil((score / maxScore) * 9)
  return clamp(level, 1, 9)
}

/**
 * 将 1~9 档位映射到主色的深浅：
 * 1 = 最浅（最低档），9 = 主色本体。
 * level <= 0 返回 transparent（数据为 0 时不着色）。
 */
export function levelToColor(level: number, primaryColor: string = '#4F46E5'): string {
  if (level <= 0) return 'transparent'
  // 与白色混合的比例：越大越浅（整体比原版更深一档）
  const whiteMix = [0.72, 0.58, 0.45, 0.34, 0.24, 0.15, 0.08, 0.03, 0]
  const ratio = whiteMix[Math.min(9, Math.max(1, level)) - 1] ?? 0
  return mixColors(primaryColor, '#FFFFFF', ratio)
}

export function levelTextColor(level: number): string {
  // 深色格子用白字，浅色/无色用深字
  return level >= 5 ? '#FFFFFF' : '#1A1A2E'
}

export function aggregateRows(rows: TokenUsageRow[]): AggregatedUsage {
  let totalTokens = 0
  let inputTokens = 0
  let outputTokens = 0
  let cacheInputTokens = 0
  let cacheCreationTokens = 0
  let totalCost = 0
  let unit = 'USD'
  let minDate: Date | null = null
  let maxDate: Date | null = null

  const dayMap = new Map<string, DailyBucket>()

  for (const row of rows) {
    inputTokens += row.tokens.input
    outputTokens += row.tokens.output
    cacheInputTokens += row.tokens.cache_read
    cacheCreationTokens += row.tokens.cache_creation
    totalTokens += row.tokens.input + row.tokens.output

    const rowCost = toNumber(row.costs.total)
    totalCost += rowCost
    unit = row.costs.unit || unit

    if (row.date != null) {
      const date = parseDate(row.date)
      if (date != null) {
        const key = dateKey(date)
        const bucket = dayMap.get(key)
        const dayTotal =
          row.tokens.input + row.tokens.output + row.tokens.cache_read + row.tokens.cache_creation
        if (bucket) {
          bucket.totalTokens += dayTotal
          bucket.inputTokens += row.tokens.input
          bucket.outputTokens += row.tokens.output
          bucket.cacheInputTokens += row.tokens.cache_read
          bucket.cacheCreationTokens += row.tokens.cache_creation
          bucket.totalCost += rowCost
        } else {
          dayMap.set(key, {
            date,
            totalTokens: dayTotal,
            inputTokens: row.tokens.input,
            outputTokens: row.tokens.output,
            cacheInputTokens: row.tokens.cache_read,
            cacheCreationTokens: row.tokens.cache_creation,
            totalCost: rowCost,
          })
        }

        if (!minDate || date < minDate) minDate = new Date(date)
        if (!maxDate || date > maxDate) maxDate = new Date(date)
      }
    }
  }

  const dailyBuckets = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime())

  return {
    totalTokens,
    inputTokens,
    outputTokens,
    cacheInputTokens,
    cacheCreationTokens,
    totalCost,
    unit,
    minDate,
    maxDate,
    dailyBuckets,
  }
}

function buildBadges(agg: AggregatedUsage, style: TokenUsageStyleOptions): BadgeItem[] {
  const totalConsumed = agg.totalTokens + agg.cacheInputTokens + agg.cacheCreationTokens
  const vibeDays = agg.dailyBuckets.length
  return [
    {
      label: '总消耗Token',
      value: formatCompactTokens(totalConsumed),
      visible: true,
      kind: 'primary',
    },
    {
      label: 'Vibe Coding',
      value: `${vibeDays}天`,
      visible: true,
      kind: 'primary',
    },
    {
      label: '总用量',
      value: formatCompactTokens(agg.totalTokens),
      visible: style.showTotal,
      kind: 'primary',
    },
    {
      label: '输入',
      value: formatCompactTokens(agg.inputTokens),
      visible: style.showInput,
      kind: 'metric',
    },
    {
      label: '输出',
      value: formatCompactTokens(agg.outputTokens),
      visible: style.showOutput,
      kind: 'metric',
    },
    {
      label: '总花费',
      value: formatMoney(agg.totalCost),
      visible: style.showTotalCost,
      kind: 'metric',
    },
    {
      label: '缓存输入',
      value: formatCompactTokens(agg.cacheInputTokens),
      visible: style.showCacheInput,
      kind: 'metric',
    },
    {
      label: '缓存创建',
      value: formatCompactTokens(agg.cacheCreationTokens),
      visible: style.showCacheCreation,
      kind: 'metric',
    },
  ]
}

function buildBadgeText(
  badge: BadgeItem,
  x: number,
  y: number,
  width: number,
  height: number,
  fontColor: string,
  primaryColor: string,
  accentLight: string,
) {
  const valueColor = badge.kind === 'primary' ? primaryColor : primaryColor
  const labelFill = fontColor
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${accentLight}" />
      <text x="${x + 10}" y="${y + 14}" font-size="11" font-weight="400" fill="${labelFill}">${escapeXml(badge.label)}</text>
      <text x="${x + width - 10}" y="${y + 22}" text-anchor="end" font-size="14" font-weight="600" fill="${valueColor}">${escapeXml(badge.value)}</text>
    </g>`
}

function buildGrid(agg: AggregatedUsage, width: number, fontColor: string) {
  const buckets = agg.dailyBuckets
  if (buckets.length === 0) {
    return ''
  }

  const gridStart = startOfWeekMonday(buckets[0].date)
  const gridEnd = endOfWeekSunday(buckets[buckets.length - 1].date)
  const totalDays = Math.max(1, Math.round((gridEnd.getTime() - gridStart.getTime()) / MS_PER_DAY) + 1)
  const weekCount = Math.max(1, Math.ceil(totalDays / 7))
  const availableWidth = width - GRID.x - 72
  const cellSize = Math.max(22, Math.min(GRID.cell, Math.floor(availableWidth / weekCount)))
  const cellGap = 4
  const step = cellSize + cellGap
  const gridHeight = step * 7 - cellGap
  const dayMap = new Map(buckets.map((bucket) => [dateKey(bucket.date), bucket.totalTokens]))
  const maxScore = Math.max(...buckets.map((bucket) => bucket.totalTokens), 1)

  const weekMonthLabels = new Map<number, { month: string; x: number }>()
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(gridStart, i)
    if (date.getDate() !== 1 && i !== 0) continue
    const weekIndex = Math.floor(i / 7)
    const x = GRID.x + weekIndex * step
    weekMonthLabels.set(weekIndex, { month: formatMonthLabel(date), x })
  }

  const monthLabelEntries = Array.from(weekMonthLabels.entries())
  const monthLabels = monthLabelEntries.map(([, entry], index) => {
    const nextX = monthLabelEntries[index + 1]?.[1].x ?? (GRID.x + weekCount * step)
    const center = (entry.x + nextX) / 2
    return `<text x="${center}" y="${MONTH_LABEL_Y}" text-anchor="middle" font-size="12" font-weight="400" fill="${fontColor}">${escapeXml(entry.month)}</text>`
  }).join('')

  const rowLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    .map((label, index) => {
      const y = GRID.y + index * step + cellSize / 2 + 4
      return `<text x="${GRID.labelX}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="12" font-weight="400" fill="${fontColor}">${label}</text>`
    })
    .join('')

  const cells: string[] = []
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(gridStart, i)
    const weekday = getLocalDateParts(date).weekday
    const weekIndex = Math.floor(i / 7)
    const x = GRID.x + weekIndex * step
    const y = GRID.y + weekday * step
    const score = dayMap.get(dateKey(date)) ?? 0
    const level = scoreToLevel(score, maxScore)
    const fill = level === 0 ? CELL_COLORS.low : levelToColor(level)
    const textColor = levelTextColor(level)
    const dayNumber = String(date.getDate())
    cells.push(`
      <g>
        <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="6" fill="${fill}" stroke="rgba(255,255,255,0.9)" stroke-width="1" />
        <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="600" fill="${textColor}">${escapeXml(dayNumber)}</text>
      </g>`)
  }

  return {
    gridHeight,
    monthLabels,
    rowLabels,
    cells: cells.join(''),
    weekCount,
    cellSize,
  }
}

export function generateTokenUsageSvg(
  rows: TokenUsageRow[],
  style: TokenUsageStyleOptions,
): string {
  const width = Number(style.width) || 1200
  const height = Number(style.height) || 720
  const padding = Number(style.padding) || 40
  const agg = aggregateRows(rows)
  const badges = buildBadges(agg, style).filter((badge) => badge.visible)
  const accentLight = deriveAccentLight(style.primaryColor, style.bgColor)
  const grid = buildGrid(agg, width, style.fontColor)

  const contentX = 72 + (padding - 40)
  const badgeMarkup = badges
    .map((badge, index) => {
      const x = contentX + index * (BADGE.w + BADGE.gap)
      const y = 96
      return buildBadgeText(badge, x, y, BADGE.w, BADGE.h, style.fontColor, style.primaryColor, accentLight)
    })
    .join('')

  const rangeLabel = formatRangeLabel(agg.minDate, agg.maxDate)

  const mainCardHeight = Math.max(280, height - MAIN_CARD.y)
  const legendRightX = contentX + 200
  const svgParts = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="token-usage-title token-usage-desc">`,
    `<title id="token-usage-title">Token用量</title>`,
    `<desc id="token-usage-desc">Token usage summary and calendar-style heatmap generated from uploaded logs.</desc>`,
    `<defs>`,
    `  <linearGradient id="token-usage-gradient" x1="0" y1="0" x2="1" y2="0">`,
    `    <stop offset="0%" stop-color="#E0E7FF" />`,
    `    <stop offset="100%" stop-color="${style.primaryColor}" />`,
    `  </linearGradient>`,
    `  <filter id="token-usage-shadow" x="-10%" y="-10%" width="120%" height="140%">`,
    `    <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.08)" />`,
    `  </filter>`,
    `</defs>`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${style.bgColor}" />`,
    `<g filter="url(#token-usage-shadow)">`,
    `  <rect x="40" y="40" width="${width - 80}" height="180" rx="16" fill="#FFFFFF" />`,
    `</g>`,
    `<text x="${contentX}" y="68" font-size="30" font-weight="700" fill="${style.fontColor}" font-family="'Segoe UI', Arial, sans-serif">Token用量</text>`,
    badgeMarkup,
    `<g filter="url(#token-usage-shadow)">`,
    `  <rect x="40" y="244" width="${width - 80}" height="${mainCardHeight}" rx="16" fill="#FFFFFF" />`,
    `</g>`,
    `<text x="${contentX}" y="268" font-size="20" font-weight="600" fill="${style.fontColor}" font-family="'Segoe UI', Arial, sans-serif">Token 贡献图</text>`,
    `<text x="${contentX + 118}" y="268" font-size="14" font-weight="400" fill="#6B7280" font-family="'Segoe UI', Arial, sans-serif">${escapeXml(rangeLabel)}</text>`,
    `<rect x="${contentX}" y="${LEGEND_Y}" width="200" height="12" rx="6" fill="url(#token-usage-gradient)" />`,
    `<text x="${contentX}" y="318" font-size="12" font-weight="400" fill="#6B7280" font-family="'Segoe UI', Arial, sans-serif">用量低</text>`,
    `<text x="${legendRightX}" y="318" text-anchor="end" font-size="12" font-weight="400" fill="#6B7280" font-family="'Segoe UI', Arial, sans-serif">用量高</text>`,
  ]

  if (grid) {
    svgParts.push(
      grid.monthLabels,
      grid.rowLabels,
      grid.cells,
    )
  }

  svgParts.push(`</svg>`)

  return svgParts.join('\n')
}
