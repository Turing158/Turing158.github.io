/**
 * Cron 表达式编辑器 / 可视化
 *
 * 支持标准 5 字段 cron 表达式的编辑、解析、描述和下次执行时间计算。
 * 纯前端实现，无外部依赖。
 */
<template>
  <div class="tool-form">
    <!-- 5 字段可视化编辑 -->
    <div class="cron-fields">
      <div class="cron-field" v-for="(field, idx) in fields" :key="field.key">
        <label class="cron-field-label">{{ field.label }}</label>
        <BlogInput
          v-model="fieldValues[idx]"
          type="text"
          :placeholder="field.placeholder"
          class="cron-field-input"
          @input="onFieldChange"
        />
      </div>
    </div>

    <!-- 常用预设 -->
    <label class="tool-label">{{ $t('tools.cronEditor.presetsLabel') }}</label>
    <div class="cron-presets">
      <Button
        v-for="preset in presets"
        :key="preset.key"
        size="small"
        :type="activePreset === preset.key ? 'primary' : undefined"
        @click="applyPreset(preset)"
      >
        {{ preset.label }}
      </Button>
    </div>

    <!-- Cron 表达式 -->
    <label class="tool-label">{{ $t('tools.cronEditor.expressionLabel') }}</label>
    <BlogInput
      v-model="expression"
      type="text"
      :placeholder="$t('tools.cronEditor.expressionPlaceholder')"
      @input="onExpressionInput"
    />

    <!-- 执行说明 -->
    <label class="tool-label">{{ $t('tools.cronEditor.descriptionLabel') }}</label>
    <div class="cron-description" :class="{ 'cron-description--error': parseError }">
      {{ parseError || description }}
    </div>

    <!-- 下次执行时间 -->
    <label class="tool-label">{{ $t('tools.cronEditor.nextTimesLabel', { n: NEXT_COUNT }) }}</label>
    <div class="cron-next-times">
      <div
        v-for="(time, idx) in nextTimes"
        :key="idx"
        class="cron-next-item"
      >
        <span class="cron-next-idx">#{{ idx + 1 }}</span>
        <span class="cron-next-date">{{ formatDate(time) }}</span>
        <span class="cron-next-relative">{{ formatRelative(time) }}</span>
      </div>
      <div v-if="nextTimes.length === 0 && !parseError" class="cron-next-empty">
        {{ expression ? description : '' }}
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button size="small" @click="copyExpression">
        {{ $t('tools.cronEditor.copy') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.cronEditor.clear') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

const NEXT_COUNT = 5

// 字段定义
interface FieldDef {
  key: string
  label: string
  placeholder: string
  min: number
  max: number
}

const fields: FieldDef[] = [
  { key: 'minute', label: t('tools.cronEditor.fieldMinute'), placeholder: '*', min: 0, max: 59 },
  { key: 'hour', label: t('tools.cronEditor.fieldHour'), placeholder: '*', min: 0, max: 23 },
  { key: 'day', label: t('tools.cronEditor.fieldDay'), placeholder: '*', min: 1, max: 31 },
  { key: 'month', label: t('tools.cronEditor.fieldMonth'), placeholder: '*', min: 1, max: 12 },
  { key: 'week', label: t('tools.cronEditor.fieldWeek'), placeholder: '*', min: 0, max: 7 },
]

const fieldValues = ref<string[]>(['*', '*', '*', '*', '*'])
const expression = ref('* * * * *')
const parseError = ref('')
const description = ref('')
const nextTimes = ref<Date[]>([])
const activePreset = ref<string>('')

// 预设
interface Preset {
  key: string
  label: string
  expr: string
}

const presets = computed<Preset[]>(() => [
  { key: 'everyMin', label: t('tools.cronEditor.everyMinute'), expr: '* * * * *' },
  { key: 'everyHour', label: t('tools.cronEditor.everyHour'), expr: '0 * * * *' },
  { key: 'daily', label: t('tools.cronEditor.daily'), expr: '0 0 * * *' },
  { key: 'weekdays', label: t('tools.cronEditor.weekdays'), expr: '0 9 * * 1-5' },
  { key: 'monthly', label: t('tools.cronEditor.monthly'), expr: '0 0 1 * *' },
])

function applyPreset(preset: Preset) {
  expression.value = preset.expr
  activePreset.value = preset.key
  syncFieldsFromExpression()
  updateResults()
}

// ---------- 字段 ↔ 表达式同步 ----------
function syncExpressionFromFields() {
  expression.value = fieldValues.value.join(' ')
  activePreset.value = ''
}

function syncFieldsFromExpression() {
  const parts = expression.value.trim().split(/\s+/)
  if (parts.length === 5) {
    fieldValues.value = parts.map((p) => p.trim())
  }
}

function onFieldChange() {
  syncExpressionFromFields()
  updateResults()
}

function onExpressionInput() {
  syncFieldsFromExpression()
  updateResults()
}

// ---------- Cron 解析 ----------
interface CronFields {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

function parseCron(expr: string): CronFields | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  }
}

/**
 * 解析 cron 字段为有效值集合
 */
function parseFieldValue(field: string, min: number, max: number): Set<number> | null {
  const values = new Set<number>()

  const items = field.split(',')
  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed) return null

    // 范围 + 步进: N-M/P
    const stepMatch = trimmed.match(/^(\d+)(?:-(\d+))?\/(\d+)$/)
    if (stepMatch) {
      const start = parseInt(stepMatch[1], 10)
      const end = stepMatch[2] ? parseInt(stepMatch[2], 10) : max
      const step = parseInt(stepMatch[3], 10)
      if (step < 1) return null
      for (let v = start; v <= end; v += step) {
        if (v >= min && v <= max) values.add(v)
      }
      continue
    }

    // 范围: N-M
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      for (let v = start; v <= end; v++) {
        if (v >= min && v <= max) values.add(v)
      }
      continue
    }

    // 通配符
    if (trimmed === '*') {
      for (let v = min; v <= max; v++) values.add(v)
      if (field === 'week' && max === 7) values.add(0)
      continue
    }

    // 单数字
    const num = parseInt(trimmed, 10)
    if (isNaN(num) || num < min || num > max) return null
    values.add(num)
    if (field === 'week' && num === 7) values.add(0)
    if (field === 'week' && num === 0) values.add(7)
  }

  return values.size > 0 ? values : null
}

// ---------- 描述生成 ----------
function generateDescription(cron: CronFields): string {
  const desc: string[] = []

  const minValues = parseFieldValue(cron.minute, 0, 59)
  const hourValues = parseFieldValue(cron.hour, 0, 23)
  const dayValues = parseFieldValue(cron.dayOfMonth, 1, 31)
  const monthValues = parseFieldValue(cron.month, 1, 12)
  const weekValues = parseFieldValue(cron.dayOfWeek, 0, 7)

  if (!minValues || !hourValues || !dayValues || !monthValues || !weekValues) {
    return t('tools.cronEditor.invalidExpression')
  }

  const isEveryMin = minValues.size >= 60
  const isEveryHour = hourValues.size >= 24
  const isEveryDay = dayValues.size >= 31
  const isEveryMonth = monthValues.size >= 12
  const isEveryWeek = weekValues.size >= 7

  if (isEveryMin) {
    desc.push(t('tools.cronEditor.everyMinute'))
  } else if (isEveryHour && minValues.size === 1) {
    const min = [...minValues][0]
    desc.push(`${String(min).padStart(2, '0')}:00`)
  } else if (isEveryHour) {
    const mins = [...minValues].sort((a, b) => a - b).slice(0, 3).map((m) => String(m).padStart(2, '0'))
    desc.push(`${t('tools.cronEditor.atMinute')} ${mins.join(', ')}`)
  } else {
    const mins = [...minValues].sort((a, b) => a - b).slice(0, 5).map((m) => String(m).padStart(2, '0'))
    desc.push(`${t('tools.cronEditor.atMinute')} ${mins.join(', ')}`)
  }

  if (!isEveryHour) {
    const hrs = [...hourValues].sort((a, b) => a - b).slice(0, 5)
    desc.push(`${t('tools.cronEditor.atHour')} ${hrs.join(', ')}`)
  }

  if (!isEveryDay) {
    const dys = [...dayValues].sort((a, b) => a - b)
    if (dys.length <= 15) {
      desc.push(`${t('tools.cronEditor.onDay')} ${dys.join(', ')}`)
    }
  }

  if (!isEveryMonth) {
    const mons = [...monthValues].sort((a, b) => a - b)
    desc.push(`${t('tools.cronEditor.inMonth')} ${mons.join(', ')}`)
  }

  if (!isEveryWeek) {
    const dayNames = [t('tools.cronEditor.sun'), t('tools.cronEditor.mon'), t('tools.cronEditor.tue'), t('tools.cronEditor.wed'), t('tools.cronEditor.thu'), t('tools.cronEditor.fri'), t('tools.cronEditor.sat')]
    const dys = [...weekValues].filter((d) => d <= 6).sort().map((d) => dayNames[d])
    if (dys.length > 0 && dys.length < 7) {
      desc.push(`${t('tools.cronEditor.onWeekday')} ${dys.join(', ')}`)
    }
  }

  return desc.join(' · ') || t('tools.cronEditor.invalidExpression')
}

// ---------- 下次执行时间计算 ----------
function getValidValues(field: string, min: number, max: number): number[] {
  const set = parseFieldValue(field, min, max)
  return set ? [...set].sort((a, b) => a - b) : []
}

function calculateNextTimes(cron: CronFields, count: number): Date[] {
  const minutes = getValidValues(cron.minute, 0, 59)
  const hours = getValidValues(cron.hour, 0, 23)
  const days = getValidValues(cron.dayOfMonth, 1, 31)
  const months = getValidValues(cron.month, 1, 12)
  const weekValues = getValidValues(cron.dayOfWeek, 0, 7)

  const weekSet = new Set(weekValues)
  if (weekValues.includes(7)) weekSet.add(0)
  if (weekValues.includes(0)) weekSet.add(7)

  if (!minutes.length || !hours.length || !days.length || !months.length || !weekSet.size) {
    return []
  }

  const results: Date[] = []
  const now = new Date()
  let candidate = new Date(now)
  candidate.setSeconds(0, 0)

  const maxIterations = 525600
  let iterations = 0

  while (results.length < count && iterations < maxIterations) {
    iterations++

    const month = candidate.getMonth() + 1
    if (!months.includes(month)) {
      if (candidate.getMonth() === 11) {
        candidate.setFullYear(candidate.getFullYear() + 1, 0, 1)
      } else {
        candidate.setMonth(candidate.getMonth() + 1, 1)
      }
      candidate.setHours(0, 0, 0, 0)
      continue
    }

    const dom = candidate.getDate()
    const dow = candidate.getDay()
    const domMatch = days.includes(dom)
    const dowMatch = weekSet.has(dow) || weekSet.has(7)

    const dayIsAll = days.length >= 31
    const weekIsAll = weekSet.size >= 7
    let dayOk: boolean

    if (dayIsAll && weekIsAll) {
      dayOk = true
    } else if (!dayIsAll && !weekIsAll) {
      dayOk = domMatch || dowMatch
    } else if (!dayIsAll) {
      dayOk = domMatch
    } else {
      dayOk = dowMatch
    }

    if (!dayOk) {
      candidate.setDate(candidate.getDate() + 1)
      candidate.setHours(0, 0, 0, 0)
      continue
    }

    const hour = candidate.getHours()
    if (!hours.includes(hour)) {
      candidate.setHours(hour + 1, 0, 0, 0)
      continue
    }

    const minute = candidate.getMinutes()
    if (!minutes.includes(minute)) {
      candidate.setMinutes(minute + 1, 0, 0)
      continue
    }

    results.push(new Date(candidate))
    candidate.setMinutes(minute + 1, 0, 0)
  }

  return results
}

// ---------- 日期格式化 ----------
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function formatRelative(date: Date): string {
  const now = Date.now()
  const diff = date.getTime() - now
  if (diff < 0) return ''
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}min`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

// ---------- 更新结果 ----------
function updateResults() {
  const cron = parseCron(expression.value)
  if (!cron) {
    parseError.value = t('tools.cronEditor.invalidExpression')
    description.value = ''
    nextTimes.value = []
    return
  }

  parseError.value = ''
  description.value = generateDescription(cron)
  nextTimes.value = calculateNextTimes(cron, NEXT_COUNT)
}

// ---------- 工具方法 ----------
function copyExpression() {
  if (!expression.value.trim()) {
    BlogTip.show(t('tools.cronEditor.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(expression.value, t('tools.copied'))
}

function clear() {
  fieldValues.value = ['*', '*', '*', '*', '*']
  expression.value = '* * * * *'
  parseError.value = ''
  description.value = ''
  nextTimes.value = []
  activePreset.value = 'everyMin'
  updateResults()
}

// 初始化
onMounted(() => {
  activePreset.value = 'everyMin'
  updateResults()
})
</script>

<style scoped>
.cron-fields {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cron-field {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cron-field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
}

.cron-field-input {
  text-align: center;
}

.cron-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cron-description {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.5;
}

.cron-description--error {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.3);
}

.cron-next-times {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.cron-next-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  transition: background 0.15s;
}

.cron-next-item:last-child {
  border-bottom: none;
}

.cron-next-item:hover {
  background: rgba(128, 128, 128, 0.05);
}

.cron-next-idx {
  flex-shrink: 0;
  width: 24px;
  font-weight: 700;
  color: var(--accent);
  font-size: 0.75rem;
}

.cron-next-date {
  flex: 1;
  color: var(--text-primary);
}

.cron-next-relative {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.cron-next-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

@media (max-width: 640px) {
  .cron-field {
    min-width: calc(20% - 8px);
  }

  .cron-field-label {
    font-size: 0.7rem;
  }
}
</style>
