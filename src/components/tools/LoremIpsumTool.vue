<!--
  Lorem Ipsum 生成器
  支持生成段落/句子/单词，中英文混合
-->
<template>
  <div class="tool-form">
    <!-- 生成模式 -->
    <label class="tool-label">{{ $t('tools.loremIpsum.modeLabel') }}</label>
    <div class="li-mode-group">
      <button
        v-for="mode in modes"
        :key="mode.key"
        class="li-mode-btn"
        :class="{ active: activeMode === mode.key }"
        @click="activeMode = mode.key"
      >
        {{ mode.label }}
      </button>
    </div>

    <!-- 数量 -->
    <label class="tool-label">{{ $t('tools.loremIpsum.amountLabel') }}</label>
    <div class="li-amount">
      <BlogInput
        v-model.number="amount"
        type="number"
        min="1"
        max="100"
        class="li-amount-input"
      />
      <span class="li-amount-unit">{{ activeMode === 'paragraphs' ? $t('tools.loremIpsum.paragraphs') : activeMode === 'sentences' ? $t('tools.loremIpsum.sentences') : $t('tools.loremIpsum.words') }}</span>
    </div>

    <!-- 语言选择 -->
    <label class="tool-label">{{ $t('tools.loremIpsum.languageLabel') }}</label>
    <div class="li-mode-group">
      <button
        v-for="lang in languages"
        :key="lang.key"
        class="li-mode-btn"
        :class="{ active: activeLanguage === lang.key }"
        @click="activeLanguage = lang.key"
      >
        {{ lang.label }}
      </button>
    </div>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <Button type="primary" size="small" @click="generate">{{ $t('tools.loremIpsum.generate') }}</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.loremIpsum.copy') }}</Button>
      <Button danger size="small" @click="clear">{{ $t('tools.loremIpsum.clear') }}</Button>
    </div>

    <!-- 输出 -->
    <label v-if="output" class="tool-label">{{ $t('tools.loremIpsum.outputLabel') }}</label>
    <pre v-if="output" class="tool-output li-output">{{ output }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()

type Mode = 'paragraphs' | 'sentences' | 'words'
type Language = 'latin' | 'zh' | 'mixed'

const modes = reactive([
  { key: 'paragraphs' as Mode, label: t('tools.loremIpsum.modeParagraphs') },
  { key: 'sentences' as Mode, label: t('tools.loremIpsum.modeSentences') },
  { key: 'words' as Mode, label: t('tools.loremIpsum.modeWords') },
])
const languages = reactive([
  { key: 'latin' as Language, label: t('tools.loremIpsum.langLatin') },
  { key: 'zh' as Language, label: t('tools.loremIpsum.langZh') },
  { key: 'mixed' as Language, label: t('tools.loremIpsum.langMixed') },
])

const activeMode = ref<Mode>('paragraphs')
const activeLanguage = ref<Language>('latin')
const amount = ref(3)
const output = ref('')

// ─── 语料库 ────────────────────────────────────────

const LATIN_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  'arcu', 'bibendum', 'cursus', 'vitae', 'congue', 'mauris', 'rhoncus',
  'aenean', 'vel', 'elit', 'scelerisque', 'mauris', 'pellentesque', 'pulvinar',
  'pellentesque', 'habitant', 'morbi', 'tristique', 'senectus', 'netus',
  'malesuada', 'fames', 'ac', 'turpis', 'egestas', 'integer', 'eget',
  'aliquet', 'nibh', 'praesent', 'tristique', 'magna', 'sit', 'amet',
  'purus', 'gravida', 'quis', 'blandit', 'turpis', 'cursus', 'in',
  'hac', 'habitasse', 'platea', 'dictumst', 'quisque', 'sagittis', 'purus',
]

const ZH_WORDS = [
  '开发', '设计', '实现', '测试', '部署', '维护', '优化', '重构',
  '前端', '后端', '全栈', '架构', '算法', '数据', '存储', '缓存',
  '网络', '安全', '性能', '扩展', '兼容', '响应', '交互', '体验',
  '代码', '编程', '调试', '文档', '配置', '版本', '协作', '发布',
  '模块', '组件', '服务', '接口', '协议', '标准', '规范', '流程',
  '学习', '研究', '探索', '创新', '分享', '总结', '记录', '成长',
  '项目', '产品', '用户', '需求', '分析', '规划', '评估', '反馈',
  '工具', '框架', '平台', '系统', '应用', '网站', '页面', '功能',
  '技术', '方法', '经验', '技巧', '思路', '模式', '策略', '实践',
  '质量', '效率', '价值', '目标', '结果', '过程', '细节', '整体',
  '计算机', '互联网', '人工智能', '云计算', '大数据', '区块链',
  '源', '程序', '逻辑', '抽象', '封装', '继承', '多态',
  '服务器', '客户端', '浏览器', '数据库', '编辑器', '终端',
]

// 标准 Lorem Ipsum 开头
const LOREM_START = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const result: T[] = []
  for (let i = 0; i < n; i++) {
    result.push(pick(arr))
  }
  return result
}

function randomLatinSentence(): string {
  // 8-18 个词组成一个句子
  const wordCount = 8 + Math.floor(Math.random() * 11)
  const words = pickN(LATIN_WORDS, wordCount)
  const sentence = words.join(' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

function randomZhSentence(): string {
  // 5-10 个词组成句子
  const wordCount = 5 + Math.floor(Math.random() * 6)
  const words = pickN(ZH_WORDS, wordCount)
  return words.join('') + '。'
}

function randomMixedSentence(): string {
  // 50% 概率返回拉丁语或中文句子
  return Math.random() < 0.5 ? randomLatinSentence() : randomZhSentence()
}

type SentenceFn = () => string

function generateWords(fn: SentenceFn, count: number): string {
  // 从句子中提取单词/词
  const result: string[] = []
  while (result.length < count) {
    const sentence = fn()
    // 按空格或字符分割
    const tokens = fn === randomLatinSentence
      ? sentence.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean)
      : sentence.replace(/[。，！？、；：]/g, '').split('')
    for (const token of tokens) {
      if (result.length >= count) break
      result.push(token)
    }
  }
  return result.slice(0, count).join(' ')
    + (fn !== randomZhSentence && fn !== randomMixedSentence ? '...' : '……')
}

function generateSentences(fn: SentenceFn, count: number): string {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(fn())
  }
  return result.join(' ')
}

function generateParagraphs(fn: SentenceFn, count: number): string {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    // 每个段落 3-7 句
    const sentenceCount = 3 + Math.floor(Math.random() * 5)
    const sentences: string[] = []
    for (let j = 0; j < sentenceCount; j++) {
      sentences.push(fn())
    }
    // 第一段用标准 Lorem Ipsum 开头
    if (i === 0 && activeLanguage.value === 'latin') {
      result.push(LOREM_START + ' ' + sentences.slice(1).join(' '))
    } else {
      result.push(sentences.join(' '))
    }
  }
  return result.join('\n\n')
}

function getSentenceFn(): SentenceFn {
  switch (activeLanguage.value) {
    case 'latin': return randomLatinSentence
    case 'zh': return randomZhSentence
    case 'mixed': return randomMixedSentence
  }
}

function generate() {
  const n = Math.max(1, Math.min(100, amount.value || 1))
  amount.value = n
  const fn = getSentenceFn()

  switch (activeMode.value) {
    case 'paragraphs':
      output.value = generateParagraphs(fn, n)
      break
    case 'sentences':
      output.value = generateSentences(fn, n)
      break
    case 'words':
      output.value = generateWords(fn, n)
      break
  }
}

function copyResult() {
  if (!output.value) {
    BlogTip.show(t('tools.loremIpsum.nothingToCopy'), { type: 'warning' })
    return
  }
  copyText(output.value, t('tools.copied'))
}

function clear() {
  output.value = ''
}
</script>

<style scoped>
.li-mode-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.li-mode-btn {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.li-mode-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.li-mode-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.li-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.li-amount-input {
  width: 80px;
}

.li-amount-unit {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.li-output {
  max-height: 360px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  font-family: inherit;
  font-size: 0.88rem;
}
</style>
