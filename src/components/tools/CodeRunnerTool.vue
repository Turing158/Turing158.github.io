/**
 * Code Runner Tool
 *
 * 在线代码运行沙箱 —— 支持 JavaScript 代码执行（iframe 沙箱）和 HTML 实时预览。
 *
 * - JS 模式：构建 srcdoc iframe，重写 console 收集输出，postMessage 传回结果
 * - HTML 模式：直接将用户 HTML 写入 srcdoc iframe 中渲染预览
 */
<template>
  <div class="tool-form">
    <!-- 模式选择 -->
    <label class="tool-label">{{ $t('tools.codeRunner.modeLabel') }}</label>
    <div class="code-runner-radio-group">
      <label
        v-for="opt in modeOptions"
        :key="opt.value"
        class="code-runner-radio-item"
        :class="{ 'is-checked': selectedMode === opt.value }"
      >
        <input
          type="radio"
          :value="opt.value"
          v-model="selectedMode"
          class="code-runner-radio-input"
        />
        <span class="code-runner-radio-label">{{ opt.label }}</span>
      </label>
    </div>

    <!-- 代码输入区 -->
    <label class="tool-label">{{ $t('tools.codeRunner.codeLabel') }}</label>
    <BlogInput
      v-model="codeInput"
      type="textarea"
      :placeholder="inputPlaceholder"
      :rows="10"
    />

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button
        v-if="running"
        type="primary"
        danger
        size="small"
        @click="cancelExecution"
      >
        ■ {{ $t('tools.codeRunner.stop') }}
      </Button>
      <Button
        v-else
        type="primary"
        size="small"
        @click="run"
      >
        {{ $t('tools.codeRunner.run') }}
      </Button>
      <Button size="small" @click="copyResult">
        {{ $t('tools.codeRunner.copy') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.codeRunner.clear') }}
      </Button>
    </div>

    <!-- JS 模式：输出结果 -->
    <template v-if="selectedMode === 'js'">
      <label class="tool-label">{{ $t('tools.codeRunner.outputLabel') }}</label>
      <div class="code-runner-output">
        <div
          v-for="(item, idx) in outputLines"
          :key="idx"
          class="code-runner-line"
          :class="'code-runner-line--' + item.type"
        >
          <span class="code-runner-line-prefix">{{ item.type === 'error' ? '✗' : item.type === 'warn' ? '⚠' : '›' }}</span>
          <pre class="code-runner-line-text">{{ item.text }}</pre>
        </div>
        <div v-if="outputLines.length === 0 && hasRun" class="code-runner-empty">
          {{ $t('tools.codeRunner.noOutput') }}
        </div>
        <div v-if="outputLines.length === 0 && !hasRun" class="code-runner-empty">
          {{ $t('tools.codeRunner.runHint') }}
        </div>
      </div>
    </template>

    <!-- HTML 模式：实时预览 iframe -->
    <template v-if="selectedMode === 'html'">
      <label class="tool-label">{{ $t('tools.codeRunner.previewLabel') }}</label>
      <div class="code-runner-preview-wrapper">
        <iframe
          ref="previewIframeRef"
          class="code-runner-preview-iframe"
          sandbox="allow-scripts"
          :srcdoc="previewSrcdoc"
          title="HTML Preview"
        ></iframe>
      </div>
    </template>

    <!-- 隐藏的 JS 执行沙箱 iframe -->
    <iframe
      ref="sandboxIframeRef"
      class="code-runner-sandbox-iframe"
      sandbox="allow-scripts"
      title="JS Sandbox"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

type Mode = 'js' | 'html'

const selectedMode = ref<Mode>('js')
const codeInput = ref('')
const outputLines = ref<{ type: string; text: string }[]>([])
const hasRun = ref(false)
const running = ref(false)

const previewSrcdoc = ref('')
const sandboxIframeRef = ref<HTMLIFrameElement | null>(null)
const previewIframeRef = ref<HTMLIFrameElement | null>(null)

// 清理标记
let sandboxMessageHandler: ((e: MessageEvent) => void) | null = null
let runTimeoutId: ReturnType<typeof setTimeout> | null = null

const modeOptions = computed(() => [
  { label: t('tools.codeRunner.jsMode'), value: 'js' as const },
  { label: t('tools.codeRunner.htmlMode'), value: 'html' as const },
])

const inputPlaceholder = computed(() =>
  selectedMode.value === 'js'
    ? t('tools.codeRunner.jsPlaceholder')
    : t('tools.codeRunner.htmlPlaceholder')
)

/**
 * 构建 JS 沙箱 iframe 的 srcdoc HTML
 *
 * 重写 console.log/error/warn/info，收集输出到数组，
 * 用 try/catch 执行用户代码，完成后 postMessage 回父窗口。
 */
function buildSandboxHtml(userCode: string): string {
  const escapedCode = userCode
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')

  return `<!DOCTYPE html><html><body><script>
var __outputs = [];
var __console = {
  log: function() {
    __outputs.push({ type: 'log', text: Array.prototype.map.call(arguments, String).join(' ') });
  },
  error: function() {
    __outputs.push({ type: 'error', text: Array.prototype.map.call(arguments, String).join(' ') });
  },
  warn: function() {
    __outputs.push({ type: 'warn', text: Array.prototype.map.call(arguments, String).join(' ') });
  },
  info: function() {
    __outputs.push({ type: 'info', text: Array.prototype.map.call(arguments, String).join(' ') });
  }
};
console.log = __console.log;
console.error = __console.error;
console.warn = __console.warn;
console.info = __console.info;
try {
  (function() {
    ${escapedCode}
  })();
} catch (e) {
  __outputs.push({ type: 'error', text: e.toString() });
}
parent.postMessage(JSON.stringify(__outputs), '*');
<\/script></body></html>`
}

/**
 * 运行 JS 代码
 *
 * 1. 创建/获取沙箱 iframe
 * 2. 注册 message 监听器接收结果
 * 3. 写入 srcdoc 触发执行
 * 4. 5 秒超时兜底
 */
function runJsCode() {
  if (!codeInput.value.trim()) {
    BlogTip.show(t('tools.codeRunner.emptyHint'), { type: 'warning' })
    return
  }

  running.value = true
  hasRun.value = false
  outputLines.value = []
  previewSrcdoc.value = ''

  nextTick(() => {
    const iframe = sandboxIframeRef.value
    if (!iframe) {
      running.value = false
      return
    }

    // 先移除旧监听器
    if (sandboxMessageHandler) {
      window.removeEventListener('message', sandboxMessageHandler)
      sandboxMessageHandler = null
    }

    // 注册消息监听
    sandboxMessageHandler = (event: MessageEvent) => {
      // 验证来源为当前 iframe
      if (event.source !== iframe.contentWindow) return
      try {
        const data = JSON.parse(event.data)
        if (Array.isArray(data)) {
          outputLines.value = data as { type: string; text: string }[]
          hasRun.value = true
        }
      } catch {
        // 非 JSON 消息忽略
      }
    }
    window.addEventListener('message', sandboxMessageHandler)

    // 5 秒超时兜底
    if (runTimeoutId) clearTimeout(runTimeoutId)
    runTimeoutId = setTimeout(() => {
      if (!hasRun.value) {
        hasRun.value = true
        running.value = false
        if (outputLines.value.length === 0) {
          BlogTip.show(t('tools.codeRunner.noOutput'), { type: 'info' })
        }
      }
      // 移除监听器
      if (sandboxMessageHandler) {
        window.removeEventListener('message', sandboxMessageHandler)
        sandboxMessageHandler = null
      }
    }, 5000)

    // 写入 srcdoc 触发执行
    const html = buildSandboxHtml(codeInput.value)
    iframe.srcdoc = html

    // 等待 iframe 加载完成
    iframe.onload = () => {
      // 标记运行完成（但具体结果由 message 事件处理）
      if (!hasRun.value) {
        // 如果 iframe 加载后很快就有结果，message 事件会先触发
        // 这里作为兜底——如果 message 没收到，等超时
      }
    }
  })
}

/**
 * 运行 HTML 预览
 *
 * 直接将用户 HTML 写入预览 iframe 的 srcdoc
 */
function runHtml() {
  if (!codeInput.value.trim()) {
    BlogTip.show(t('tools.codeRunner.emptyHint'), { type: 'warning' })
    return
  }

  running.value = true
  outputLines.value = []
  hasRun.value = false

  previewSrcdoc.value = codeInput.value

  // 模拟短暂 loading 让 UI 有反馈
  setTimeout(() => {
    running.value = false
  }, 300)
}

/** 终止当前运行 */
function cancelExecution() {
  // 清空 iframe srcdoc 停止执行
  if (sandboxIframeRef.value) {
    sandboxIframeRef.value.srcdoc = ''
  }
  // 移除消息监听
  if (sandboxMessageHandler) {
    window.removeEventListener('message', sandboxMessageHandler)
    sandboxMessageHandler = null
  }
  // 清除超时
  if (runTimeoutId) {
    clearTimeout(runTimeoutId)
    runTimeoutId = null
  }
  running.value = false
  hasRun.value = true
  outputLines.value = outputLines.value.length > 0
    ? outputLines.value
    : [{ type: 'warn', text: t('tools.codeRunner.cancelled') }]
}

function run() {
  if (selectedMode.value === 'js') {
    runJsCode()
  } else {
    runHtml()
  }
}

function copyResult() {
  if (selectedMode.value === 'js') {
    if (outputLines.value.length === 0) {
      BlogTip.show(t('tools.codeRunner.nothingToCopy'), { type: 'warning' })
      return
    }
    const text = outputLines.value
      .map((line) => `[${line.type}] ${line.text}`)
      .join('\n')
    copyText(text, t('tools.copied'))
  } else {
    // HTML 模式：复制代码本身
    if (!codeInput.value.trim()) {
      BlogTip.show(t('tools.codeRunner.nothingToCopy'), { type: 'warning' })
      return
    }
    copyText(codeInput.value, t('tools.copied'))
  }
}

function clear() {
  codeInput.value = ''
  outputLines.value = []
  hasRun.value = false
  previewSrcdoc.value = ''
  running.value = false
}

// 组件卸载时清理
onUnmounted(() => {
  if (sandboxMessageHandler) {
    window.removeEventListener('message', sandboxMessageHandler)
    sandboxMessageHandler = null
  }
  if (runTimeoutId) {
    clearTimeout(runTimeoutId)
    runTimeoutId = null
  }
})
</script>

<style scoped>
.code-runner-radio-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.code-runner-radio-item {
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

.code-runner-radio-item.is-checked {
  background: var(--accent);
  color: var(--bg-card);
  border-color: var(--accent);
}

.code-runner-radio-input {
  display: none;
}

/* 沙箱 iframe 隐藏 */
.code-runner-sandbox-iframe {
  position: absolute;
  width: 0;
  height: 0;
  border: none;
  opacity: 0;
  pointer-events: none;
}

/* 输出区域 */
.code-runner-output {
  max-height: 320px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
}

.code-runner-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 1px 12px;
  transition: background 0.15s;
}

.code-runner-line:hover {
  background: rgba(128, 128, 128, 0.06);
}

.code-runner-line--error {
  background: rgba(220, 53, 69, 0.08);
}

.code-runner-line--warn {
  background: rgba(255, 193, 7, 0.08);
}

.code-runner-line-prefix {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  font-weight: 700;
  user-select: none;
}

.code-runner-line--log .code-runner-line-prefix {
  color: var(--text-secondary);
}

.code-runner-line--error .code-runner-line-prefix {
  color: #dc3545;
}

.code-runner-line--warn .code-runner-line-prefix {
  color: #e6a700;
}

.code-runner-line--info .code-runner-line-prefix {
  color: #17a2b8;
}

.code-runner-line-text {
  flex: 1;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
  font-size: inherit;
  color: var(--text-primary);
}

.code-runner-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* HTML 预览 */
.code-runner-preview-wrapper {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-runner-preview-iframe {
  width: 100%;
  height: 400px;
  border: none;
  display: block;
}
</style>
