/**
 * API 测试工具（轻量级 Postman）
 *
 * 基于 Fetch API 的 HTTP 请求测试工具，支持多种方法、请求头和请求体。
 * 纯浏览器端发送，受 CORS 限制。
 */
<template>
  <div class="tool-form">
    <!-- URL 行：方法下拉 + URL 输入 -->
    <div class="api-url-row">
      <BlogSelect
        v-model="selectedMethod"
        class="api-method-select"
        :options="methodOptions"
        :clearable="false"
      />
      <BlogInput
        v-model="url"
        class="api-url-input"
        type="text"
        :placeholder="$t('tools.apiTest.urlPlaceholder')"
      />
    </div>

    <!-- 请求头 -->
    <label class="tool-label">{{ $t('tools.apiTest.headersLabel') }}</label>
    <div class="api-headers-list">
      <div
        v-for="(header, idx) in headers"
        :key="idx"
        class="api-header-row"
      >
        <BlogInput
          v-model="header.key"
          class="api-header-key"
          type="text"
          :placeholder="$t('tools.apiTest.headerKeyPlaceholder')"
        />
        <span class="api-header-colon">:</span>
        <BlogInput
          v-model="header.value"
          class="api-header-value"
          type="text"
          :placeholder="$t('tools.apiTest.headerValuePlaceholder')"
        />
        <button
          class="api-header-remove"
          title="Remove"
          @click="removeHeader(idx)"
        >
          ×
        </button>
      </div>
    </div>
    <Button size="small" @click="addHeader">
      + {{ $t('tools.apiTest.addHeader') }}
    </Button>

    <!-- 请求体（仅 POST/PUT/PATCH） -->
    <template v-if="bodyEnabled">
      <label class="tool-label">{{ $t('tools.apiTest.bodyLabel') }}</label>
      <div class="api-body-type-row">
        <label
          v-for="opt in bodyTypeOptions"
          :key="opt.value"
          class="api-body-radio-item"
          :class="{ 'is-checked': bodyType === opt.value }"
        >
          <input
            type="radio"
            :value="opt.value"
            v-model="bodyType"
            class="api-body-radio-input"
          />
          <span class="api-body-radio-label">{{ opt.label }}</span>
        </label>
      </div>
      <BlogInput
        v-if="bodyType === 'raw'"
        v-model="bodyRaw"
        type="textarea"
        :placeholder="$t('tools.apiTest.bodyPlaceholder')"
        :rows="6"
      />
    </template>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button
        type="primary"
        size="small"
        :loading="sending"
        :disabled="sending"
        @click="send"
      >
        {{ sending ? $t('tools.apiTest.sending') : $t('tools.apiTest.send') }}
      </Button>
      <Button size="small" @click="copyResponse">
        {{ $t('tools.apiTest.copyResponse') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.apiTest.clear') }}
      </Button>
    </div>

    <!-- 响应区 -->
    <label class="tool-label">{{ $t('tools.apiTest.responseLabel') }}</label>
    <div class="api-response">
      <!-- 元信息 -->
      <div v-if="responseStatus !== null" class="api-response-meta">
        <span
          class="api-status-badge"
          :class="'api-status--' + statusCategory"
        >{{ responseStatus }}</span>
        <span class="api-response-time">{{ $t('tools.apiTest.timeLabel') }}: {{ responseTime }}ms</span>
      </div>

      <!-- 响应头 -->
      <details v-if="responseHeadersText" class="api-response-details">
        <summary>{{ $t('tools.apiTest.responseHeadersLabel') }}</summary>
        <pre class="api-response-pre">{{ responseHeadersText }}</pre>
      </details>

      <!-- 响应体 -->
      <pre
        v-if="responseBodyText !== null"
        class="api-response-pre api-response-body"
      >{{ responseBodyText }}</pre>

      <!-- 提示 -->
      <div v-else-if="responseError" class="api-response-hint api-response-hint--error">
        {{ responseError }}
      </div>
      <div v-else class="api-response-hint">
        {{ $t('tools.apiTest.noResponse') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import BlogSelect from '@/components/common/BlogSelect.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

// HTTP 方法
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const

const methodOptions = HTTP_METHODS.map((m) => ({ label: m, value: m }))

const selectedMethod = ref<{ label: string; value: string }>(methodOptions[0])
const url = ref('')
const sending = ref(false)
const headers = ref<{ key: string; value: string }[]>([
  { key: 'Content-Type', value: 'application/json' },
])

// 请求体
type BodyType = 'none' | 'raw'
const bodyType = ref<BodyType>('raw')
const bodyRaw = ref('')

const bodyEnabled = computed(() => {
  const m = selectedMethod.value.value
  return m === 'POST' || m === 'PUT' || m === 'PATCH'
})

const bodyTypeOptions = computed(() => [
  { label: t('tools.apiTest.bodyNone'), value: 'none' as const },
  { label: t('tools.apiTest.bodyRaw'), value: 'raw' as const },
])

// 响应
const responseStatus = ref<number | null>(null)
const responseTime = ref<number>(0)
const responseHeadersText = ref('')
const responseBodyText = ref<string | null>(null)
const responseError = ref('')

const statusCategory = computed(() => {
  const s = responseStatus.value
  if (s === null) return ''
  if (s < 200) return '1xx'
  if (s < 300) return '2xx'
  if (s < 400) return '3xx'
  if (s < 500) return '4xx'
  return '5xx'
})

// 切换 Method 时，如果切出 POST/PUT/PATCH 则清理 body 显示
watch(selectedMethod, () => {
  if (!bodyEnabled.value) {
    bodyType.value = 'none'
  } else {
    bodyType.value = 'raw'
  }
})

function addHeader() {
  headers.value.push({ key: '', value: '' })
}

function removeHeader(idx: number) {
  headers.value.splice(idx, 1)
}

/** 格式化响应体：JSON 自动缩进，非 JSON 原文 */
function formatBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

/** 将 Headers 对象转为可读文本 */
function headersToText(headers: Headers): string {
  const lines: string[] = []
  headers.forEach((value, key) => {
    lines.push(`${key}: ${value}`)
  })
  return lines.sort().join('\n')
}

async function send() {
  if (!url.value.trim()) {
    BlogTip.show(t('tools.apiTest.invalidUrl'), { type: 'warning' })
    return
  }

  // 基本 URL 校验
  try {
    new URL(url.value)
  } catch {
    BlogTip.show(t('tools.apiTest.invalidUrl'), { type: 'warning' })
    return
  }

  sending.value = true
  responseStatus.value = null
  responseTime.value = 0
  responseHeadersText.value = ''
  responseBodyText.value = null
  responseError.value = ''

  const startTime = performance.now()

  try {
    // 构建请求
    const fetchInit: RequestInit = {
      method: selectedMethod.value.value,
    }

    // 添加请求头
    const headerRecord: Record<string, string> = {}
    for (const h of headers.value) {
      if (h.key.trim()) {
        headerRecord[h.key.trim()] = h.value
      }
    }
    if (Object.keys(headerRecord).length > 0) {
      fetchInit.headers = headerRecord
    }

    // 添加请求体
    if (bodyEnabled.value && bodyType.value === 'raw' && bodyRaw.value.trim()) {
      fetchInit.body = bodyRaw.value
    }

    // 30 秒超时
    const controller = new AbortController()
    fetchInit.signal = controller.signal
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(url.value, fetchInit)
    clearTimeout(timeoutId)

    const elapsed = Math.round(performance.now() - startTime)
    responseTime.value = elapsed
    responseStatus.value = res.status
    responseHeadersText.value = headersToText(res.headers)

    const bodyText = await res.text()
    responseBodyText.value = formatBody(bodyText)
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - startTime)
    responseTime.value = elapsed

    if (err.name === 'AbortError') {
      responseError.value = t('tools.apiTest.timeout')
    } else if (err instanceof TypeError && err.message.includes('fetch')) {
      // CORS / 网络错误
      if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        responseError.value = t('tools.apiTest.corsError')
      } else {
        responseError.value = t('tools.apiTest.networkError')
      }
    } else if (err instanceof TypeError) {
      responseError.value = `${t('tools.apiTest.networkError')}: ${err.message}`
    } else {
      responseError.value = `${t('tools.apiTest.requestError')}: ${err.message || err}`
    }
  }

  sending.value = false
}

function copyResponse() {
  if (responseBodyText.value !== null) {
    copyText(responseBodyText.value, t('tools.copied'))
  } else if (responseError.value) {
    BlogTip.show(t('tools.apiTest.nothingToCopy'), { type: 'warning' })
  } else {
    BlogTip.show(t('tools.apiTest.nothingToCopy'), { type: 'warning' })
  }
}

function clear() {
  url.value = ''
  headers.value = [{ key: 'Content-Type', value: 'application/json' }]
  bodyRaw.value = ''
  bodyType.value = 'raw'
  selectedMethod.value = methodOptions[0]
  responseStatus.value = null
  responseTime.value = 0
  responseHeadersText.value = ''
  responseBodyText.value = null
  responseError.value = ''
}
</script>

<style scoped>
/* URL 行 */
.api-url-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.api-method-select {
  width: 110px;
  flex-shrink: 0;
}

.api-url-input {
  flex: 1;
  min-width: 0;
}

/* 请求头 */
.api-headers-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.api-header-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.api-header-key {
  flex: 1;
  min-width: 0;
}

.api-header-colon {
  color: var(--text-secondary);
  font-weight: 700;
  flex-shrink: 0;
}

.api-header-value {
  flex: 2;
  min-width: 0;
}

.api-header-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.api-header-remove:hover {
  background: rgba(220, 53, 69, 0.12);
  color: #dc3545;
}

/* 请求体类型选择 */
.api-body-type-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.api-body-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.api-body-radio-item.is-checked {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}

.api-body-radio-input {
  display: none;
}

/* 响应区 */
.api-response {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.api-response-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 600;
}

.api-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fff;
}

.api-status--2xx { background: #28a745; }
.api-status--3xx { background: #17a2b8; }
.api-status--4xx { background: #e6a700; }
.api-status--5xx { background: #dc3545; }
.api-status--1xx { background: #6c757d; }

.api-response-time {
  color: var(--text-secondary);
  font-weight: 400;
}

.api-response-details {
  border-bottom: 1px solid var(--border);
}

.api-response-details summary {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  user-select: none;
}

.api-response-details summary:hover {
  background: rgba(128, 128, 128, 0.05);
}

.api-response-pre {
  margin: 0;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-primary);
  max-height: 240px;
  overflow-y: auto;
}

.api-response-body {
  padding: 12px;
}

.api-response-hint {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.api-response-hint--error {
  color: #dc3545;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .api-url-row {
    flex-direction: column;
  }

  .api-method-select {
    width: 100%;
  }

  .api-header-row {
    flex-wrap: wrap;
  }

  .api-header-key {
    flex: 1 1 100px;
  }

  .api-header-value {
    flex: 1 1 120px;
  }
}
</style>
