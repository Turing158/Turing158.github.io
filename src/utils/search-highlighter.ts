/**
 * 搜索关键词高亮工具
 * 将文本中匹配的关键词包裹在 <mark> 标签中
 */

/**
 * 转义正则特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 高亮文本中匹配搜索词的部分
 * @param text 原始文本
 * @param query 搜索关键词
 * @returns 包含 <mark> 高亮标签的 HTML 字符串
 */
export function highlight(text: string, query: string): string {
  if (!query?.trim()) return text
  const escaped = escapeRegExp(query.trim())
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}
