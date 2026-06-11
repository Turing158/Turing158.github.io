/**
 * 文章阅读时间估算工具
 *
 * 根据文章字数计算预计阅读时间
 * - 中文：约 300 字/分钟
 * - 英文：约 200 词/分钟
 */

// 阅读速度配置
const READING_SPEED = {
  chinese: 300, // 中文字/分钟
  english: 200, // 英文词/分钟
} as const

/**
 * 计算单篇文章的阅读时间
 * @param content Markdown 原文内容
 * @returns 预计阅读时间（分钟），最少 1 分钟
 */
export function calculateReadingTime(content: string): number {
  if (!content || content.trim().length === 0) {
    return 1
  }

  // 移除 Markdown 语法符号，只保留纯文本
  const cleanContent = content
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]+`/g, '')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // 移除标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体和斜体标记
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除列表标记
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 移除引用标记
    .replace(/^>\s+/gm, '')
    // 移除分隔线
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除多余空白
    .replace(/\s+/g, ' ')
    .trim()

  // 统计中文字符数
  const chineseChars = (cleanContent.match(/[一-龥]/g) || []).length

  // 统计英文单词数（按空格分隔的非空字符串）
  const englishWords = cleanContent
    .replace(/[一-龥]/g, '') // 移除中文字符
    .split(/\s+/)
    .filter((word) => word.length > 0 && /[a-zA-Z]/.test(word)).length

  // 计算阅读时间
  const chineseTime = chineseChars / READING_SPEED.chinese
  const englishTime = englishWords / READING_SPEED.english

  const totalMinutes = Math.ceil(chineseTime + englishTime)

  // 最少 1 分钟
  return Math.max(1, totalMinutes)
}

/**
 * 格式化阅读时间为可读字符串
 * @param minutes 分钟数
 * @returns 格式化后的字符串，如 "5 分钟"
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) {
    return '1 分钟'
  }
  return `${minutes} 分钟`
}
