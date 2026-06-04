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
      :body-overflow="activeTool?.component === 'HolidayQueryTool' ? 'visible' : undefined"
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

        <!-- 随机数生成器 -->
        <template v-else-if="activeTool.component === 'RandomGenerator'">
          <div class="tool-form random-generator">
            <!-- 配置区 -->
            <div class="random-config">
              <div class="config-row">
                <div class="config-item">
                  <label class="config-label">{{ $t('tools.randomGenerator.min') }}</label>
                  <BlogInput
                    v-model.number="randomMin"
                    type="number"
                    :placeholder="'0'"
                  />
                </div>
                <div class="config-separator">
                  <span class="separator-line"></span>
                  <span class="separator-text">{{ $t('tools.randomGenerator.to') }}</span>
                  <span class="separator-line"></span>
                </div>
                <div class="config-item">
                  <label class="config-label">{{ $t('tools.randomGenerator.max') }}</label>
                  <BlogInput
                    v-model.number="randomMax"
                    type="number"
                    :placeholder="'100'"
                  />
                </div>
              </div>

              <div class="config-row">
                <div class="config-item">
                  <label class="config-label">{{ $t('tools.randomGenerator.count') }}</label>
                  <BlogInput
                    v-model.number="randomCount"
                    type="number"
                    min="1"
                    max="100"
                    :placeholder="'1'"
                  />
                </div>
                <div class="config-item checkbox-item">
                  <Checkbox
                    v-model="randomUniqueModel"
                    :options="randomUniqueOptions"
                  />
                </div>
              </div>
            </div>

            <!-- 操作按钮区 -->
            <div class="random-actions">
              <Button
                type="primary"
                size="small"
                @click="generateOnce"
                :disabled="isGenerating"
              >
                {{ $t('tools.randomGenerator.generate') }}
              </Button>
              <Button
                :type="isGenerating ? 'danger' : 'secondary'"
                size="small"
                @click="toggleContinuous"
              >
                <span v-if="isGenerating" class="btn-content">
                  <span class="stop-icon">■</span>
                  {{ $t('tools.randomGenerator.stop') }}
                </span>
                <span v-else class="btn-content">
                  <span class="play-icon">▶</span>
                  {{ $t('tools.randomGenerator.start') }}
                </span>
              </Button>
              <span
                class="copy-all-wrapper"
                @pointerdown="startCopyAllLongPress('number')"
                @pointerup="cancelCopyAllLongPress"
                @pointerleave="cancelCopyAllLongPress"
                @pointercancel="cancelCopyAllLongPress"
              >
                <Button
                  size="small"
                  @click="copyAllRandom"
                  :disabled="randomResults.length === 0"
                >
                  {{ $t('tools.randomGenerator.copyAll') }}
                </Button>
              </span>
              <Button
                size="small"
                @click="clearRandom"
                :disabled="isGenerating"
              >
                {{ $t('tools.randomGenerator.clear') }}
              </Button>
            </div>

            <!-- 结果展示区 -->
            <div class="random-results">
              <div class="results-header">
                <span class="results-title">{{ $t('tools.randomGenerator.results') }}</span>
                <span v-if="randomResults.length > 0" class="results-count">
                  {{ randomResults.length }} {{ $t('tools.randomGenerator.numbers') }}
                </span>
              </div>
              <div class="results-display" :class="{ 'is-generating': isGenerating }">
                <TransitionGroup name="number-pop" tag="div" class="numbers-grid">
                  <div
                    v-for="(num, index) in displayResults"
                    :key="`${num}-${index}`"
                    class="number-ball"
                    :title="$t('tools.randomGenerator.clickToCopy')"
                    :style="{ '--ball-index': index }"
                    @click="copyText(String(num))"
                  >
                    <span class="number-value">{{ num }}</span>
                  </div>
                </TransitionGroup>
                <div v-if="displayResults.length === 0" class="empty-state">
                  <span class="empty-icon">🎲</span>
                  <span class="empty-text">{{ $t('tools.randomGenerator.empty') }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 随机字符串生成器 -->
        <template v-else-if="activeTool.component === 'RandomStringGenerator'">
          <div class="tool-form random-generator">
            <!-- 配置区 -->
            <div class="random-config">
              <div class="config-row">
                <div class="config-item">
                  <label class="config-label">{{ $t('tools.randomString.length') }}</label>
                  <BlogInput
                    v-model.number="stringLength"
                    type="number"
                    min="1"
                    :placeholder="'16'"
                  />
                </div>
                <div class="config-item">
                  <label class="config-label">{{ $t('tools.randomString.count') }}</label>
                  <BlogInput
                    v-model.number="stringCount"
                    type="number"
                    min="1"
                    :placeholder="'1'"
                  />
                </div>
              </div>

              <div class="config-row charset-row">
                <label class="config-label">{{ $t('tools.randomString.charset') }}</label>
                <Checkbox
                  v-model="stringCharsets"
                  :options="stringCharsetOptions"
                  direction="horizontal"
                />
              </div>
            </div>

            <!-- 操作按钮区 -->
            <div class="random-actions">
              <Button
                type="primary"
                size="small"
                @click="generateStringOnce"
                :disabled="isStringGenerating"
              >
                {{ $t('tools.randomString.generate') }}
              </Button>
              <Button
                :type="isStringGenerating ? 'danger' : 'secondary'"
                size="small"
                @click="toggleStringContinuous"
              >
                <span v-if="isStringGenerating" class="btn-content">
                  <span class="stop-icon">■</span>
                  {{ $t('tools.randomString.stop') }}
                </span>
                <span v-else class="btn-content">
                  <span class="play-icon">▶</span>
                  {{ $t('tools.randomString.start') }}
                </span>
              </Button>
              <span
                class="copy-all-wrapper"
                @pointerdown="startCopyAllLongPress('string')"
                @pointerup="cancelCopyAllLongPress"
                @pointerleave="cancelCopyAllLongPress"
                @pointercancel="cancelCopyAllLongPress"
              >
                <Button
                  size="small"
                  @click="copyAllString"
                  :disabled="stringResults.length === 0"
                >
                  {{ $t('tools.randomString.copyAll') }}
                </Button>
              </span>
              <Button
                size="small"
                @click="clearString"
                :disabled="isStringGenerating"
              >
                {{ $t('tools.randomString.clear') }}
              </Button>
            </div>

            <!-- 结果展示区 -->
            <div class="random-results">
              <div class="results-header">
                <span class="results-title">{{ $t('tools.randomString.results') }}</span>
                <span v-if="stringResults.length > 0" class="results-count">
                  {{ stringResults.length }} {{ $t('tools.randomString.items') }}
                </span>
              </div>
              <div class="results-display" :class="{ 'is-generating': isStringGenerating }">
                <TransitionGroup name="number-pop" tag="div" class="strings-list">
                  <div
                    v-for="(str, index) in stringDisplayResults"
                    :key="`${str}-${index}`"
                    class="string-pill"
                    :title="$t('tools.randomGenerator.clickToCopy')"
                    @click="copyText(str)"
                  >
                    <span class="string-value">{{ str }}</span>
                  </div>
                </TransitionGroup>
                <div v-if="stringDisplayResults.length === 0" class="empty-state">
                  <span class="empty-icon">🔤</span>
                  <span class="empty-text">{{ $t('tools.randomString.empty') }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 节日查询 -->
        <template v-else-if="activeTool.component === 'HolidayQueryTool'">
          <div class="tool-form holiday-query">
            <div class="random-config">
              <div class="config-row">
                <div class="config-item config-item--country">
                  <label class="config-label">{{ $t('tools.holidayQuery.country') }}</label>
                  <BlogSelect
                    v-model="holidayCountry"
                    :options="countryOptions"
                    :placeholder="$t('tools.holidayQuery.country')"
                    :disabled="!countriesLoaded || holidayLoading"
                  />
                </div>
                <div class="config-item config-item--year">
                  <label class="config-label">{{ $t('tools.holidayQuery.year') }}</label>
                  <BlogInput
                    v-model.number="holidayYear"
                    type="number"
                    :min="1974"
                    :max="2100"
                    :step="1"
                  />
                </div>
              </div>

              <div class="config-row">
                <Button
                  type="primary"
                  size="small"
                  :disabled="holidayLoading || !holidayCountry"
                  @click="fetchHolidayList"
                >
                  {{ holidayLoading ? $t('tools.holidayQuery.loading') : $t('tools.holidayQuery.query') }}
                </Button>
              </div>
            </div>

            <div class="random-results holiday-results">
              <div class="results-header">
                <span class="results-title">{{ $t('tools.holidayQuery.results') }}</span>
                <span v-if="holidayList.length > 0" class="results-count">
                  {{ holidayList.length }} {{ $t('tools.holidayQuery.count') }}
                </span>
              </div>

              <div class="results-display holiday-display">
                <div v-if="holidayLoading" class="holiday-loading">
                  <span class="loading-spinner" />
                  <span>{{ $t('tools.holidayQuery.loading') }}</span>
                </div>

                <div v-else-if="holidayError" class="holiday-error">
                  <span class="empty-icon">⚠️</span>
                  <span class="empty-text">{{ $t('tools.holidayQuery.loadFailed') }}</span>
                  <Button size="small" @click="fetchHolidayList">
                    {{ $t('tools.holidayQuery.retry') }}
                  </Button>
                </div>

                <div v-else-if="holidayList.length === 0" class="empty-state">
                  <span class="empty-icon">🎉</span>
                  <span class="empty-text">{{ holidayQueried ? $t('tools.holidayQuery.noResults') : $t('tools.holidayQuery.empty') }}</span>
                </div>

                <div v-else class="holiday-list">
                  <div
                    v-for="(h, index) in holidayList"
                    :key="`${h.date}-${h.name}-${index}`"
                    class="holiday-row"
                    :class="{ 'is-passed': isPassed(h) }"
                  >
                    <span
                      class="holiday-name"
                      :title="$t('tools.holidayQuery.toggleNameTip')"
                      @click="toggleName(h)"
                    >{{ getDisplayName(h) }}</span>
                    <span class="holiday-date">{{ h.date }}</span>
                    <span class="holiday-status" :class="{ 'is-passed': isPassed(h) }">
                      {{ holidayStatusLabel(h) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </BlogDialog>

    <!-- 分隔符编辑弹窗（随机数 / 随机字符串 共用） -->
    <BlogDialog
      v-model="showSeparatorEditor"
      width="420px"
      max-width="90vw"
      :show-close="true"
      :close-on-click-overlay="false"
    >
      <template #title>
        <span class="modal-icon">✂️</span>
        <span class="modal-title-text">{{ $t('tools.randomGenerator.separatorTitle') }}</span>
      </template>

      <div class="separator-editor-body">
        <p class="separator-editor-hint">{{ $t('tools.randomGenerator.separatorHint') }}</p>
        <div class="separator-presets">
          <button
            v-for="preset in separatorPresets"
            :key="preset.label"
            type="button"
            class="separator-chip"
            :class="{ 'is-active': separatorInput === preset.value }"
            @click="separatorInput = preset.value"
          >{{ preset.label }}</button>
        </div>
        <BlogInput
          v-model="separatorInput"
          :placeholder="$t('tools.randomGenerator.separatorPlaceholder')"
        />
        <div v-if="separatorPreview" class="separator-preview">
          <span class="separator-preview-label">{{ $t('tools.randomGenerator.separatorPreview') }}</span>
          <code class="separator-preview-text">{{ separatorPreview }}</code>
        </div>
      </div>

      <template #footer>
        <div class="separator-actions">
          <Button size="small" @click="resetSeparator">{{ $t('tools.randomGenerator.separatorReset') }}</Button>
          <Button size="small" @click="cancelSeparatorEdit">{{ $t('tools.randomGenerator.separatorCancel') }}</Button>
          <Button type="primary" size="small" @click="confirmSeparator">{{ $t('tools.randomGenerator.separatorConfirm') }}</Button>
        </div>
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
import BlogSelect from '@/components/common/BlogSelect.vue'
import BlogTip from '@/plugins/blog-tip'

interface Tool {
  name: string
  icon: string
  description: string
  tags: string[]
  component: string
}

interface SelectOption {
  label: string
  value: string
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
  { key: 'randomGenerator', component: 'RandomGenerator', icon: '🎲' },
  { key: 'randomString', component: 'RandomStringGenerator', icon: '🔤' },
  { key: 'holidayQuery', component: 'HolidayQueryTool', icon: '🎉' },
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

// Random generator
const randomMin = ref<number>(0)
const randomMax = ref<number>(100)
const randomCount = ref<number>(1)
const randomUnique = ref(false)
const randomResults = ref<number[]>([])
const isGenerating = ref(false)
let randomTimer: ReturnType<typeof setInterval> | undefined

const MAX_DISPLAY = 100
const displayResults = computed(() => randomResults.value.slice(-MAX_DISPLAY))

const randomUniqueOptions = computed(() => [
  { label: t('tools.randomGenerator.unique'), value: 'unique' },
])
const randomUniqueModel = computed<(string | number | boolean)[]>({
  get: () => (randomUnique.value ? ['unique'] : []),
  set: (val) => {
    randomUnique.value = Array.isArray(val) && val.includes('unique')
  },
})

// Random string generator
const stringLength = ref<number>(16)
const stringCount = ref<number>(1)
const stringCharsets = ref<string[]>(['lower', 'upper', 'digit'])
const stringResults = ref<string[]>([])
const isStringGenerating = ref(false)
let stringTimer: ReturnType<typeof setInterval> | undefined

const stringDisplayResults = computed(() => stringResults.value.slice(-MAX_DISPLAY))

const stringCharsetOptions = computed(() => [
  { label: t('tools.randomString.lower'), value: 'lower' },
  { label: t('tools.randomString.upper'), value: 'upper' },
  { label: t('tools.randomString.digit'), value: 'digit' },
  { label: t('tools.randomString.symbol'), value: 'symbol' },
])

const CHARSET_MAP: Record<string, string> = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{}<>?/.,;:',
}

// 通用复制分隔符（随机数 + 随机字符串共用）
const SEPARATOR_KEY = 'blog-random-separator'
const randomSeparator = ref<string>(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(SEPARATOR_KEY) ?? ' '
    : ' '
)
const showSeparatorEditor = ref(false)
const separatorInput = ref('')
let longPressTimer: ReturnType<typeof setTimeout> | undefined
let longPressed = false
// 当前长按触发的工具：'number' | 'string'，确认后用于复制对应结果
const separatorSource = ref<'number' | 'string'>('number')

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    BlogTip.show(t('tools.copied'), { type: 'success' })
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    BlogTip.show(t('tools.copied'), { type: 'success' })
  }
}

onMounted(async () => {
  const update = () => {
    currentTimestamp.value = Math.floor(Date.now() / 1000)
    currentDateStr.value = new Date().toLocaleString(locale.value)
  }
  update()
  timer = setInterval(update, 1000)

  fetchCountries()

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
  stopRandomTimer()
  stopStringTimer()
  stopHolidayTick()
})

function stopRandomTimer() {
  if (randomTimer) {
    clearInterval(randomTimer)
    randomTimer = undefined
  }
  isGenerating.value = false
}

function stopStringTimer() {
  if (stringTimer) {
    clearInterval(stringTimer)
    stringTimer = undefined
  }
  isStringGenerating.value = false
}

function cleanupRandomState() {
  stopRandomTimer()
  stopStringTimer()
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = undefined
  }
  longPressed = false
  showSeparatorEditor.value = false
}

function generateBatch(): number[] | null {
  const min = Math.ceil(Number(randomMin.value))
  const max = Math.floor(Number(randomMax.value))
  const count = Math.floor(Number(randomCount.value))
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    BlogTip.show(t('tools.randomGenerator.invalidRange'), { type: 'error' })
    return null
  }
  if (!Number.isFinite(count) || count < 1) {
    BlogTip.show(t('tools.randomGenerator.invalidCount'), { type: 'error' })
    return null
  }
  const range = max - min + 1
  if (randomUnique.value && count > range) {
    BlogTip.show(t('tools.randomGenerator.uniqueError', { n: count }), { type: 'error' })
    return null
  }
  if (randomUnique.value) {
    const pool = new Set<number>()
    while (pool.size < count) {
      pool.add(Math.floor(Math.random() * range) + min)
    }
    return Array.from(pool)
  }
  const list: number[] = []
  for (let i = 0; i < count; i++) {
    list.push(Math.floor(Math.random() * range) + min)
  }
  return list
}

function generateOnce() {
  if (isGenerating.value) return
  const batch = generateBatch()
  if (!batch) return
  randomResults.value = batch
}

function toggleContinuous() {
  if (isGenerating.value) {
    stopRandomTimer()
    return
  }
  const first = generateBatch()
  if (!first) return
  randomResults.value = first
  isGenerating.value = true
  randomTimer = setInterval(() => {
    const next = generateBatch()
    if (!next) {
      stopRandomTimer()
      return
    }
    randomResults.value = next
  }, 200)
}

function clearRandom() {
  if (isGenerating.value) return
  randomResults.value = []
}

function copyAllRandom() {
  if (longPressed) return
  if (randomResults.value.length === 0) return
  copyText(randomResults.value.join(randomSeparator.value))
}

// Random string
function generateStringBatch(): string[] | null {
  const length = Math.floor(Number(stringLength.value))
  const count = Math.floor(Number(stringCount.value))
  if (!Number.isFinite(length) || length < 1) {
    BlogTip.show(t('tools.randomString.invalidLength'), { type: 'error' })
    return null
  }
  if (!Number.isFinite(count) || count < 1) {
    BlogTip.show(t('tools.randomString.invalidCount'), { type: 'error' })
    return null
  }
  if (stringCharsets.value.length === 0) {
    BlogTip.show(t('tools.randomString.invalidCharset'), { type: 'error' })
    return null
  }
  const pool = stringCharsets.value
    .map(k => CHARSET_MAP[k] ?? '')
    .join('')
  if (!pool) {
    BlogTip.show(t('tools.randomString.invalidCharset'), { type: 'error' })
    return null
  }
  const list: string[] = []
  // 优先使用 crypto.getRandomValues，避免可预测性
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined
  for (let i = 0; i < count; i++) {
    let s = ''
    if (cryptoObj?.getRandomValues) {
      const buf = new Uint32Array(length)
      cryptoObj.getRandomValues(buf)
      for (let j = 0; j < length; j++) {
        s += pool[buf[j] % pool.length]
      }
    } else {
      for (let j = 0; j < length; j++) {
        s += pool[Math.floor(Math.random() * pool.length)]
      }
    }
    list.push(s)
  }
  return list
}

function generateStringOnce() {
  if (isStringGenerating.value) return
  const batch = generateStringBatch()
  if (!batch) return
  stringResults.value = batch
}

function toggleStringContinuous() {
  if (isStringGenerating.value) {
    stopStringTimer()
    return
  }
  const first = generateStringBatch()
  if (!first) return
  stringResults.value = first
  isStringGenerating.value = true
  stringTimer = setInterval(() => {
    const next = generateStringBatch()
    if (!next) {
      stopStringTimer()
      return
    }
    stringResults.value = next
  }, 200)
}

function clearString() {
  if (isStringGenerating.value) return
  stringResults.value = []
}

function copyAllString() {
  if (longPressed) return
  if (stringResults.value.length === 0) return
  copyText(stringResults.value.join(randomSeparator.value))
}

function startCopyAllLongPress(source: 'number' | 'string' = 'number') {
  const list = source === 'string' ? stringResults.value : randomResults.value
  if (list.length === 0) return
  longPressed = false
  longPressTimer = setTimeout(() => {
    longPressed = true
    separatorSource.value = source
    openSeparatorEditor()
  }, 500)
}

function cancelCopyAllLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = undefined
  }
}

function openSeparatorEditor() {
  separatorInput.value = randomSeparator.value
  showSeparatorEditor.value = true
}

function confirmSeparator() {
  randomSeparator.value = separatorInput.value
  try {
    localStorage.setItem(SEPARATOR_KEY, randomSeparator.value)
  } catch {}
  showSeparatorEditor.value = false
  BlogTip.show(t('tools.randomGenerator.separatorSaved'), { type: 'success' })
  const list = separatorSource.value === 'string' ? stringResults.value : randomResults.value
  if (list.length > 0) {
    copyText(list.join(randomSeparator.value))
  }
}

function resetSeparator() {
  separatorInput.value = ' '
}

function cancelSeparatorEdit() {
  showSeparatorEditor.value = false
}

const separatorPreview = computed(() => {
  const list = separatorSource.value === 'string' ? stringResults.value : randomResults.value
  if (list.length === 0) return ''
  return list.slice(0, 5).join(separatorInput.value)
})

const separatorPresets = computed(() => [
  { label: t('tools.randomGenerator.sepSpace'), value: ' ' },
  { label: t('tools.randomGenerator.sepComma'), value: ',' },
  { label: t('tools.randomGenerator.sepNewline'), value: '\n' },
  { label: t('tools.randomGenerator.sepDash'), value: '-' },
  { label: t('tools.randomGenerator.sepPipe'), value: '|' },
  { label: t('tools.randomGenerator.sepEmpty'), value: '' },
])

// ── 节日查询 ──
interface NagerCountry {
  countryCode: string
  name: string
}
interface NagerHoliday {
  date: string
  localName: string
  name: string
  types: string[]
}

const holidayYear = ref<number>(new Date().getFullYear())
const holidayCountry = ref<SelectOption | undefined>(undefined)
const holidayList = ref<NagerHoliday[]>([])
const holidayLoading = ref(false)
const holidayError = ref(false)
const holidayQueried = ref(false)
const countryList = ref<NagerCountry[]>([])
const countriesLoaded = ref(false)
const nameDisplayMode = ref<Record<string, 'local' | 'name'>>({})
const nowTick = ref(Date.now())
let holidayTickTimer: ReturnType<typeof setInterval> | undefined

const countryOptions = computed(() => {
  const collator = new Intl.Collator(locale.value)
  return countryList.value
    .map((c) => {
      const key = `tools.holidayQuery.countries.${c.countryCode}`
      const translated = t(key)
      const label = translated === key ? c.name : translated
      return { value: c.countryCode, label }
    })
    .sort((a, b) => collator.compare(a.label, b.label))
})

async function fetchCountries() {
  if (countriesLoaded.value) return
  try {
    const res = await fetch('https://date.nager.at/api/v3/AvailableCountries')
    if (!res.ok) throw new Error()
    const data = (await res.json()) as NagerCountry[]
    countryList.value = data
    countriesLoaded.value = true
  } catch {
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
  }
}

function holidayKey(h: NagerHoliday): string {
  return `${h.date}__${h.name}`
}

function getDisplayName(h: NagerHoliday): string {
  const mode = nameDisplayMode.value[holidayKey(h)] ?? 'local'
  return mode === 'name' ? h.name : h.localName
}

function toggleName(h: NagerHoliday) {
  const k = holidayKey(h)
  nameDisplayMode.value[k] = (nameDisplayMode.value[k] ?? 'local') === 'local' ? 'name' : 'local'
}

function isPassed(h: NagerHoliday): boolean {
  const [y, m, d] = h.date.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime() + 86400000
  return nowTick.value >= target
}

function holidayStatusLabel(h: NagerHoliday): string {
  const [y, m, d] = h.date.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  const diff = target - nowTick.value
  if (diff < 0 && nowTick.value >= target + 86400000) return t('tools.holidayQuery.passed')
  const safeDiff = Math.max(0, diff)
  const days = Math.floor(safeDiff / 86400000)
  if (days >= 1) return t('tools.holidayQuery.daysLeft', { n: days })
  const hours = Math.floor(safeDiff / 3600000)
  if (hours >= 1) return t('tools.holidayQuery.hoursLeft', { n: hours })
  const minutes = Math.floor(safeDiff / 60000)
  if (minutes >= 1) return t('tools.holidayQuery.minutesLeft', { n: minutes })
  const seconds = Math.floor(safeDiff / 1000)
  return t('tools.holidayQuery.secondsLeft', { n: seconds })
}

async function fetchHolidayList() {
  const year = Math.floor(Number(holidayYear.value))
  const code = holidayCountry.value?.value
  if (!Number.isFinite(year) || year < 1974 || year > 2100) {
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
    return
  }
  if (!code) return
  holidayLoading.value = true
  holidayError.value = false
  try {
    const res = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${code}`)
    if (!res.ok) throw new Error()
    const data = (await res.json()) as NagerHoliday[]
    holidayList.value = data
    nameDisplayMode.value = {}
    holidayQueried.value = true
  } catch {
    holidayError.value = true
    holidayList.value = []
    BlogTip.show(t('tools.holidayQuery.loadFailed'), { type: 'error' })
  } finally {
    holidayLoading.value = false
  }
}

function startHolidayTick() {
  if (holidayTickTimer) return
  nowTick.value = Date.now()
  holidayTickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
}

function stopHolidayTick() {
  if (holidayTickTimer) {
    clearInterval(holidayTickTimer)
    holidayTickTimer = undefined
  }
}

// 打开工具时重置所有状态
function openTool(tool: Tool) {
  cleanupRandomState()
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
  randomMin.value = 0
  randomMax.value = 100
  randomCount.value = 1
  randomUnique.value = false
  randomResults.value = []
  stringLength.value = 16
  stringCount.value = 1
  stringCharsets.value = ['lower', 'upper', 'digit']
  stringResults.value = []
  holidayYear.value = new Date().getFullYear()
  holidayCountry.value = holidayCountry.value || undefined
  holidayList.value = []
  holidayError.value = false
  holidayQueried.value = false
  nameDisplayMode.value = {}
  if (tool.component === 'HolidayQueryTool') {
    startHolidayTick()
  } else {
    stopHolidayTick()
  }
  activeTool.value = tool
  dialogOpen.value = true
}

function onDialogOpen() {
  nextTick(() => {
    // dialog opened
  })
}

function onDialogClose() {
  cleanupRandomState()
  stopHolidayTick()
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
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--card-delay, 0ms);

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

// Random generator
.random-generator {
  gap: 18px;
}

.random-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.config-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.config-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.config-item.checkbox-item {
  flex: 0 0 auto;
  justify-content: flex-end;
  padding-bottom: 8px;
}

.config-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.3px;
}

.config-separator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-bottom: 10px;
  flex: 0 0 36px;
}

.separator-line {
  width: 1px;
  height: 8px;
  background: var(--border);
}

.separator-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}


.random-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stop-icon,
.play-icon {
  font-size: 0.7rem;
  line-height: 1;
}

.random-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.results-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.results-count {
  font-size: 0.75rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  padding: 2px 10px;
  border-radius: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.results-display {
  position: relative;
  min-height: 120px;
  max-height: 260px;
  padding: 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow-y: auto;
  transition: border-color 0.3s ease;

  &.is-generating {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
  }
}

.numbers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.number-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, border-color 0.2s ease,
              box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg-card);
    transform: translateY(-2px) scale(1.06);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 35%, transparent);
  }

  &:active {
    transform: translateY(0) scale(0.96);
    box-shadow: 0 2px 6px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 35%, transparent);
  }
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  pointer-events: none;
}

.empty-icon {
  font-size: 1.8rem;
  opacity: 0.7;
}

.empty-text {
  font-size: 0.85rem;
}

// 随机字符串
.charset-row {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.strings-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.string-pill {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
  word-break: break-all;
  transition: transform 0.2s ease, border-color 0.2s ease,
              box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg-card);
    transform: translateX(2px);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  &:active {
    transform: translateX(0) scale(0.99);
  }
}

.string-value {
  flex: 1;
}

// number-pop transition (TransitionGroup)
.number-pop-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.number-pop-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
  position: absolute;
}

.number-pop-enter-from {
  opacity: 0;
  transform: scale(0.6) translateY(-6px);
}

.number-pop-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .number-pop-enter-active,
  .number-pop-leave-active,
  .number-ball,
  .results-display {
    transition: none;
  }
}

// 复制全部按钮容器（用于绑定长按事件）
.copy-all-wrapper {
  display: inline-flex;
  touch-action: manipulation;
  user-select: none;
}

// 分隔符编辑弹窗内容
.separator-editor-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.separator-editor-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.separator-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.separator-chip {
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  &.is-active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg-card);
  }
}

.separator-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px dashed var(--border);
  border-radius: 8px;
  font-size: 0.8rem;
}

.separator-preview-label {
  color: var(--text-secondary);
  white-space: nowrap;
}

.separator-preview-text {
  flex: 1;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--accent);
  white-space: pre-wrap;
  word-break: break-all;
}

.separator-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.separator-popup-enter-active,
.separator-popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.separator-popup-enter-from,
.separator-popup-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// ── 节日查询 ──
.holiday-query {
  .config-item--country {
    flex: 1.2;
    min-width: 0;
  }
  .config-item--year {
    flex: 0.7;
    min-width: 0;
  }
}

.holiday-display {
  min-height: 200px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }
}

.holiday-loading,
.holiday-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 16px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: holiday-spin 0.8s linear infinite;
}

@keyframes holiday-spin {
  to {
    transform: rotate(360deg);
  }
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.holiday-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;

  & + .holiday-row {
    border-top: 1px solid var(--border);
    border-radius: 0;
  }

  &:hover {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    border-color: color-mix(in srgb, var(--accent) 20%, transparent);
    border-radius: 8px;

    & + .holiday-row {
      border-top-color: transparent;
    }
  }

  &.is-passed {
    opacity: 0.6;
  }
}

.holiday-name {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;

  &:hover {
    color: var(--accent);
  }
}

.holiday-date {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.holiday-status {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 500;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  transition: background 0.2s ease, color 0.2s ease;
  min-width: 88px;
  text-align: center;

  &.is-passed {
    background: color-mix(in srgb, var(--text-secondary) 14%, transparent);
    color: var(--text-secondary);
  }
}

@media (max-width: 640px) {
  .holiday-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .holiday-name {
    flex-basis: 100%;
  }
  .holiday-date {
    font-size: 0.8rem;
  }
  .holiday-status {
    min-width: auto;
  }
}

</style>