/**
 * 将文章日期解析为时间戳，用于排序。
 * 兼容 ISO 字符串、"Fri Feb 09 2024 ..." 等格式；
 * 无法解析或为空时返回 0，排序时沉底。
 */
export function articleTime(date: string | undefined | null): number {
  if (!date) return 0
  const t = new Date(date).getTime()
  return Number.isNaN(t) ? 0 : t
}
