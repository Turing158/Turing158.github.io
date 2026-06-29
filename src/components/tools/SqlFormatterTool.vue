/**
 * SQL 格式化 / 美化器
 *
 * 自定义 SQL 格式化引擎，纯前端实现，无外部依赖。
 * 支持关键字大写、逗号位置选择、压缩（minify）等特性。
 */
<template>
  <div class="tool-form">
    <!-- 配置选项 -->
    <div class="sql-options-row">
      <div class="sql-options-left">
        <Checkbox
          v-model="keywordUpperModel"
          :options="keywordUpperOptions"
        />
      </div>
      <div class="sql-options-right">
        <Checkbox
          v-model="commaBeforeNewlineModel"
          :options="commaBeforeNewlineOptions"
        />
      </div>
    </div>

    <!-- SQL 输入 -->
    <label class="tool-label">{{ $t('tools.sqlFormatter.inputLabel') }}</label>
    <BlogInput
      v-model="input"
      type="textarea"
      :placeholder="$t('tools.sqlFormatter.placeholder')"
      :rows="8"
    />

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button type="primary" size="small" @click="formatSql">
        {{ $t('tools.sqlFormatter.format') }}
      </Button>
      <Button size="small" @click="minifySql">
        {{ $t('tools.sqlFormatter.minify') }}
      </Button>
      <Button size="small" @click="copyResult">
        {{ $t('tools.sqlFormatter.copy') }}
      </Button>
      <Button danger size="small" @click="clear">
        {{ $t('tools.sqlFormatter.clear') }}
      </Button>
    </div>

    <!-- 输出 -->
    <label class="tool-label">{{ $t('tools.sqlFormatter.outputLabel') }}</label>
    <pre class="tool-output" ref="outputRef">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button, Checkbox } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

const input = ref('')
const output = ref('')
const keywordUpper = ref(true)
const commaBeforeNewline = ref(true)

const outputRef = ref<HTMLPreElement | null>(null)

// 关键字大写选项
const keywordUpperOptions = computed(() => [
  { label: t('tools.sqlFormatter.keywordUpper'), value: 'upper' },
])
const keywordUpperModel = computed<(string)[]>({
  get: () => (keywordUpper.value ? ['upper'] : []),
  set: (val) => { keywordUpper.value = val.includes('upper') },
})

// 逗号前换行选项
const commaBeforeNewlineOptions = computed(() => [
  { label: t('tools.sqlFormatter.commaBeforeNewline'), value: 'before' },
])
const commaBeforeNewlineModel = computed<(string)[]>({
  get: () => (commaBeforeNewline.value ? ['before'] : []),
  set: (val) => { commaBeforeNewline.value = val.includes('before') },
})

// ---------- SQL 关键字列表 ----------
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE',
  'BETWEEN', 'EXISTS', 'IS', 'NULL',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL',
  'ON', 'AS', 'USING',
  'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET',
  'DELETE',
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
  'HAVING', 'LIMIT', 'OFFSET',
  'UNION', 'ALL', 'DISTINCT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'WITH', 'RECURSIVE',
  'TOP', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'CAST', 'COALESCE', 'NULLIF',
  'IF', 'ELSE',
  'BEGIN', 'COMMIT', 'ROLLBACK',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN', 'FULL JOIN',
  'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
  'GROUP BY', 'ORDER BY',
])

// 需要在前面换行的主要子句关键字（按匹配长度降序排列）
const CLAUSE_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
  'JOIN', 'ON',
  'GROUP BY', 'ORDER BY',
  'HAVING', 'LIMIT', 'OFFSET',
  'VALUES',
  'UNION', 'UNION ALL',
  'SET',
  'INSERT INTO',
]

// ---------- 词法分析 ----------
interface Token {
  type: 'keyword' | 'clause' | 'identifier' | 'string' | 'number'
      | 'operator' | 'comma' | 'lparen' | 'rparen' | 'comment' | 'semicolon' | 'other'
  value: string
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const s = sql

  while (i < s.length) {
    // 跳过空白
    if (/\s/.test(s[i])) {
      i++
      continue
    }

    // 单行注释 --
    if (s[i] === '-' && s[i + 1] === '-') {
      let end = i + 2
      while (end < s.length && s[end] !== '\n') end++
      tokens.push({ type: 'comment', value: s.slice(i, end) })
      i = end
      continue
    }

    // 块注释 /* */
    if (s[i] === '/' && s[i + 1] === '*') {
      let end = i + 2
      while (end < s.length && !(s[end] === '*' && s[end + 1] === '/')) end++
      tokens.push({ type: 'comment', value: s.slice(i, end + 2) })
      i = end + 2
      continue
    }

    // 字符串（单引号或双引号）
    if (s[i] === "'" || s[i] === '"') {
      const quote = s[i]
      let end = i + 1
      while (end < s.length && s[end] !== quote) {
        if (s[end] === '\\') end++ // 跳过转义
        end++
      }
      if (end < s.length) end++ // 闭合引号
      tokens.push({ type: 'string', value: s.slice(i, end) })
      i = end
      continue
    }

    // 数字
    if (/\d/.test(s[i]) || (s[i] === '.' && i + 1 < s.length && /\d/.test(s[i + 1]))) {
      let end = i
      if (s[end] === '0' && (s[end + 1] === 'x' || s[end + 1] === 'X')) {
        end += 2
        while (end < s.length && /[0-9a-fA-F]/.test(s[end])) end++
      } else {
        while (end < s.length && /[\d.]/.test(s[end])) end++
      }
      tokens.push({ type: 'number', value: s.slice(i, end) })
      i = end
      continue
    }

    // 逗号
    if (s[i] === ',') {
      tokens.push({ type: 'comma', value: ',' })
      i++
      continue
    }

    // 分号
    if (s[i] === ';') {
      tokens.push({ type: 'semicolon', value: ';' })
      i++
      continue
    }

    // 括号
    if (s[i] === '(') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
      continue
    }
    if (s[i] === ')') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
      continue
    }

    // 标识符或关键字（字母开头）
    if (/[a-zA-Z_]/.test(s[i])) {
      let end = i
      while (end < s.length && /[a-zA-Z_0-9]/.test(s[end])) end++
      const word = s.slice(i, end)
      const upper = word.toUpperCase()

      // 先检查多词关键字
      // 向后看 N 个词来匹配 clause keywords
      let matched = false
      for (const clause of CLAUSE_KEYWORDS) {
        const parts = clause.split(' ')
        if (parts.length > 1) {
          let lookEnd = end
          let matchAll = true
          const lookWords: string[] = [upper]
          while (lookEnd < s.length && /\s/.test(s[lookEnd])) lookEnd++
          for (let pi = 1; pi < parts.length; pi++) {
            let wordEnd = lookEnd
            while (wordEnd < s.length && /[a-zA-Z_]/.test(s[wordEnd])) wordEnd++
            const nextWord = s.slice(lookEnd, wordEnd).toUpperCase()
            lookWords.push(nextWord)
            if (nextWord !== parts[pi]) {
              matchAll = false
              break
            }
            lookEnd = wordEnd
            while (lookEnd < s.length && /\s/.test(s[lookEnd])) lookEnd++
          }
          if (matchAll && lookWords.join(' ') === clause) {
            tokens.push({ type: 'clause', value: clause })
            i = lookEnd
            matched = true
            break
          }
        }
      }
      if (matched) continue

      // 单字 clause 关键字
      if (['SELECT', 'FROM', 'WHERE', 'VALUES', 'SET'].includes(upper)) {
        tokens.push({ type: 'clause', value: upper })
        i = end
        continue
      }

      // 普通关键字
      if (SQL_KEYWORDS.has(upper)) {
        tokens.push({ type: 'keyword', value: upper })
        i = end
        continue
      }

      // 标识符
      tokens.push({ type: 'identifier', value: word })
      i = end
      continue
    }

    // 运算符/其他符号
    let opEnd = i
    while (opEnd < s.length && /[+\-*/%=<>!&|^~@#]/.test(s[opEnd])) opEnd++
    if (opEnd > i) {
      tokens.push({ type: 'operator', value: s.slice(i, opEnd) })
      i = opEnd
      continue
    }

    // 剩余字符作为 other
    tokens.push({ type: 'other', value: s[i] })
    i++
  }

  return tokens
}

// ---------- 格式化 ----------
function formatSqlString(sql: string, opts: {
  keywordUpper: boolean
  commaBeforeNewline: boolean
}): string {
  if (!sql.trim()) return ''

  const tokens = tokenize(sql)
  const lines: string[] = []
  let indent = 0

  // 前一个 token 类型（用于决定是否需要空格）
  let prevType: string | null = null

  function addLine(text: string) {
    if (text.length > 0) {
      lines.push('  '.repeat(Math.max(0, indent)) + text.trimStart())
    }
  }

  // 在 token 之间添加空格
  function shouldAddSpace(currType: string): boolean {
    if (!prevType) return false
    if (currType === 'rparen') return false
    if (currType === 'comma') return false
    if (currType === 'semicolon') return false
    if (currType === 'lparen' && prevType !== 'comma') return true
    if (prevType === 'lparen') return false
    if (prevType === 'comma') return true
    if (prevType === 'operator' || currType === 'operator') return true
    if (prevType === 'identifier' && currType === 'identifier') return true
    return false
  }

  let currentLine = ''

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    let text = token.value

    // 关键字大写
    if (opts.keywordUpper && (token.type === 'keyword' || token.type === 'clause')) {
      text = token.value.toUpperCase()
    }

    // 处理 clause 关键字 —— 换行
    if (token.type === 'clause') {
      // 先提交当前行
      if (currentLine.trim()) {
        addLine(currentLine)
      }
      currentLine = ''

      currentLine += text
      prevType = token.type
      continue
    }

    // 逗号
    if (token.type === 'comma') {
      if (currentLine.trim()) {
        addLine(currentLine)
      }

      if (opts.commaBeforeNewline) {
        // 逗号在当前行末尾，新行开始
        lines[lines.length - 1] += ',\n'
        currentLine = ''
      } else {
        // 逗号在新行开头
        currentLine = ','
      }

      // 如果前一个是逗号且在后一个 token 前加空格
      prevType = 'comma'
      continue
    }

    // 左括号 —— 增加缩进
    if (token.type === 'lparen') {
      if (currentLine.trim()) {
        currentLine += ' ('
      } else {
        currentLine = '('
      }
      indent++
      prevType = 'lparen'
      continue
    }

    // 右括号 —— 减少缩进
    if (token.type === 'rparen') {
      if (currentLine.trim()) {
        addLine(currentLine)
      }
      indent = Math.max(0, indent - 1)
      currentLine = ')'
      prevType = 'rparen'
      continue
    }

    // 分号
    if (token.type === 'semicolon') {
      if (currentLine.trim()) {
        addLine(currentLine)
      }
      currentLine = ';'
      prevType = 'semicolon'
      continue
    }

    // 注释 —— 单独一行
    if (token.type === 'comment') {
      if (currentLine.trim()) {
        addLine(currentLine)
      }
      currentLine = ''
      addLine(token.value)
      prevType = null
      continue
    }

    // 字符串、标识符、数字、运算符等
    const needSpace = shouldAddSpace(token.type)
    if (needSpace && currentLine.length > 0 && !currentLine.endsWith(' ')) {
      currentLine += ' '
    }
    currentLine += text
    prevType = token.type
  }

  // 最后一行
  if (currentLine.trim()) {
    addLine(currentLine)
  }

  return lines.join('\n')
}

// ---------- 压缩 ----------
function minifySqlString(sql: string): string {
  if (!sql.trim()) return ''

  // 去除多余空白和注释
  let result = sql
    // 移除单行注释
    .replace(/--.*$/gm, '')
    // 移除块注释
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 合并空白
    .replace(/\s+/g, ' ')
    // 逗号前空格
    .replace(/\s+,/g, ',')
    // 括号内空格
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    // 运算符前后空格
    .replace(/\s*([=<>!])\s*/g, ' $1 ')
    // 合并多余空格
    .replace(/\s{2,}/g, ' ')
    .trim()

  return result
}

// ---------- 组件方法 ----------
function formatSql() {
  if (!input.value.trim()) {
    BlogTip.show(t('tools.sqlFormatter.empty'), { type: 'warning' })
    return
  }
  output.value = formatSqlString(input.value, {
    keywordUpper: keywordUpper.value,
    commaBeforeNewline: commaBeforeNewline.value,
  })
}

function minifySql() {
  if (!input.value.trim()) {
    BlogTip.show(t('tools.sqlFormatter.empty'), { type: 'warning' })
    return
  }
  output.value = minifySqlString(input.value)
}

function copyResult() {
  if (!output.value) {
    BlogTip.show(t('tools.sqlFormatter.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(output.value, t('tools.copied'))
}

function clear() {
  input.value = ''
  output.value = ''
}
</script>

<style scoped>
.sql-options-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.sql-options-left,
.sql-options-right {
  display: flex;
  align-items: center;
}
</style>
