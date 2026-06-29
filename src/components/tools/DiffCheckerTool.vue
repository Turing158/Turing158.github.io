/**
 * Diff Checker Tool
 *
 * 代码差异对比工具 —— 对比两段文本的差异，以行级 diff 高亮展示。
 *
 * 使用自定义的 LCS（最长公共子序列）算法实现，无外部依赖。
 * 输出采用类似 git diff 的视觉风格：绿色表示新增行、红色表示删除行。
 */
<template>
  <div class="tool-form">
    <!-- 输入区：左右两栏 -->
    <div class="diff-inputs">
      <div class="diff-input-col">
        <label class="tool-label">{{ $t('tools.diff.originalLabel') }}</label>
        <BlogInput
          v-model="originalText"
          type="textarea"
          :placeholder="$t('tools.diff.originalPlaceholder')"
          :rows="8"
        />
      </div>
      <div class="diff-input-col">
        <label class="tool-label">{{ $t('tools.diff.changedLabel') }}</label>
        <BlogInput
          v-model="changedText"
          type="textarea"
          :placeholder="$t('tools.diff.changedPlaceholder')"
          :rows="8"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button type="primary" size="small" @click="compare">
        {{ $t('tools.diff.compare') }}
      </Button>
      <Button size="small" @click="copyResult">
        {{ $t('tools.diff.copy') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.diff.clear') }}
      </Button>
    </div>

    <!-- 差异输出 -->
    <label class="tool-label">{{ $t('tools.diff.outputLabel') }}</label>
    <div class="diff-output-wrapper" ref="outputRef">
      <table v-if="diffResult.length > 0" class="diff-table">
        <tbody>
          <tr
            v-for="(line, idx) in diffResult"
            :key="idx"
            class="diff-line"
            :class="{
              'diff-line-added': line.type === 'added',
              'diff-line-removed': line.type === 'removed',
            }"
          >
            <td class="diff-lineno diff-lineno-left">{{ line.leftNum }}</td>
            <td class="diff-lineno diff-lineno-right">{{ line.rightNum }}</td>
            <td class="diff-marker">{{ line.marker }}</td>
            <td class="diff-text"><pre>{{ line.text }}</pre></td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="compared" class="diff-empty">
        {{ $t('tools.diff.noDiff') }}
      </div>
      <div v-else class="diff-empty">
        {{ $t('tools.diff.empty') }}
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="diffResult.length > 0" class="diff-stats">
      <span class="diff-stat-added">+{{ stats.added }}</span>
      <span class="diff-stat-removed">-{{ stats.removed }}</span>
      <span class="diff-stat-unchanged">±{{ stats.unchanged }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

const originalText = ref('')
const changedText = ref('')
const compared = ref(false)

interface DiffLine {
  type: 'equal' | 'added' | 'removed'
  marker: string
  text: string
  leftNum: string
  rightNum: string
}

const diffResult = ref<DiffLine[]>([])
const stats = computed(() => {
  let added = 0
  let removed = 0
  let unchanged = 0
  for (const line of diffResult.value) {
    if (line.type === 'added') added++
    else if (line.type === 'removed') removed++
    else unchanged++
  }
  return { added, removed, unchanged }
})

/**
 * 基于 LCS 的逐行 diff 算法
 *
 * 将两段文本按行拆分，用 LCS 找出最长公共子序列的索引对，
 * 然后同步遍历两个序列，将非公共的部分标记为新增或删除。
 */
interface EditScript {
  type: 'equal' | 'added' | 'removed'
  leftIdx: number   // -1 表示不存在于原文本
  rightIdx: number  // -1 表示不存在于新文本
  text: string
}

function computeDiff(original: string, changed: string): DiffLine[] {
  const origLines = original.split('\n')
  const newLines = changed.split('\n')
  const lcs = lcsIndices(origLines, newLines)
  const edits: EditScript[] = []

  let oi = 0
  let ni = 0
  for (const [lo, ln] of lcs) {
    // 原文本中不在公共子序列的部分 —— 删除行
    while (oi < lo) {
      edits.push({ type: 'removed', leftIdx: oi, rightIdx: -1, text: origLines[oi] })
      oi++
    }
    // 新文本中不在公共子序列的部分 —— 新增行
    while (ni < ln) {
      edits.push({ type: 'added', leftIdx: -1, rightIdx: ni, text: newLines[ni] })
      ni++
    }
    // 公共部分
    edits.push({ type: 'equal', leftIdx: oi, rightIdx: ni, text: origLines[oi] })
    oi++
    ni++
  }
  // 剩余行
  while (oi < origLines.length) {
    edits.push({ type: 'removed', leftIdx: oi, rightIdx: -1, text: origLines[oi] })
    oi++
  }
  while (ni < newLines.length) {
    edits.push({ type: 'added', leftIdx: -1, rightIdx: ni, text: newLines[ni] })
    ni++
  }

  // 转为 DiffLine（含行号展示）
  let leftCounter = 0
  let rightCounter = 0
  return edits.map((edit) => {
    let leftNum = ''
    let rightNum = ''
    if (edit.type === 'removed' || edit.type === 'equal') {
      leftCounter++
      leftNum = String(leftCounter)
    }
    if (edit.type === 'added' || edit.type === 'equal') {
      rightCounter++
      rightNum = String(rightCounter)
    }

    const marker = edit.type === 'added' ? '+' : edit.type === 'removed' ? '-' : ' '

    return {
      type: edit.type,
      marker,
      text: edit.text,
      leftNum,
      rightNum,
    }
  })
}

/**
 * 计算 LCS 的索引对
 *
 * dp 优化：使用滚动数组降低空间复杂度
 */
function lcsIndices(a: string[], b: string[]): [number, number][] {
  const m = a.length
  const n = b.length
  // dp[j] = 当前位置的 LCS 长度（滚动数组）
  const dp: number[] = new Array(n + 1).fill(0)
  // 回溯数组
  const prev: Uint8Array[] = new Array(m + 1)
  for (let i = 0; i <= m; i++) prev[i] = new Uint8Array(n + 1)

  for (let i = 1; i <= m; i++) {
    const prevRow = dp.slice()
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prevRow[j - 1] + 1
        prev[i][j] = 1 // 对角线
      } else if (prevRow[j] >= dp[j - 1]) {
        dp[j] = prevRow[j]
        prev[i][j] = 2 // 向上
      } else {
        dp[j] = dp[j - 1]
        prev[i][j] = 3 // 向左
      }
    }
  }

  // 回溯
  const result: [number, number][] = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (prev[i][j] === 1) {
      result.unshift([i - 1, j - 1])
      i--
      j--
    } else if (prev[i][j] === 2) {
      i--
    } else {
      j--
    }
  }

  return result
}

function compare() {
  diffResult.value = computeDiff(originalText.value, changedText.value)
  compared.value = true
}

function copyResult() {
  if (diffResult.value.length === 0) {
    BlogTip.show(t('tools.diff.nothingToCopy'), { type: 'warning' })
    return
  }
  const text = diffResult.value
    .map((line) => `${line.marker} ${line.text}`)
    .join('\n')
  copyText(text, t('tools.copied'))
}

function clear() {
  originalText.value = ''
  changedText.value = ''
  diffResult.value = []
  compared.value = false
}
</script>

<style scoped>
.diff-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.diff-input-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diff-output-wrapper {
  max-height: 400px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
}

.diff-line {
  transition: background 0.15s;
}

.diff-line:hover {
  filter: brightness(1.05);
}

.diff-line-added {
  background: rgba(40, 167, 69, 0.12);
}

.diff-line-removed {
  background: rgba(220, 53, 69, 0.12);
}

.diff-lineno {
  width: 40px;
  min-width: 40px;
  padding: 0 8px;
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-secondary);
  user-select: none;
  border-right: 1px solid var(--border);
}

.diff-lineno-left {
  border-right: none;
}

.diff-lineno-right {
  border-left: 1px solid var(--border);
}

.diff-marker {
  width: 20px;
  min-width: 20px;
  padding: 0 4px;
  text-align: center;
  font-weight: 700;
  user-select: none;
  color: var(--text-secondary);
}

.diff-line-added .diff-marker {
  color: #28a745;
}

.diff-line-removed .diff-marker {
  color: #dc3545;
}

.diff-text {
  padding: 0 8px;
  white-space: pre;
  overflow-x: auto;
}

.diff-text pre {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  white-space: pre;
}

.diff-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-family: inherit;
}

.diff-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.diff-stat-added {
  color: #28a745;
}

.diff-stat-removed {
  color: #dc3545;
}

.diff-stat-unchanged {
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .diff-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
