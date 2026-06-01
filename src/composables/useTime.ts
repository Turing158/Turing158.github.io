/**
 * 时间格式化工具
 * - 小于1分钟：*秒前
 * - 小于1小时：*分钟前
 * - 小于1天：*小时前
 * - 小于1周：昨天、前天、*天前
 * - 大于1周：年/月/日
 * - 鼠标悬停显示：年/月/日 时:分:秒
 */

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (isNaN(diffMs) || diffMs < 0) {
    return dateStr
  }

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return `${diffSec}秒前`
  }

  if (diffMin < 60) {
    return `${diffMin}分钟前`
  }

  if (diffHour < 24) {
    return `${diffHour}小时前`
  }

  if (diffDay === 1) {
    return '昨天'
  }

  if (diffDay === 2) {
    return '前天'
  }

  if (diffDay < 7) {
    return `${diffDay}天前`
  }

  // 大于1周：年/月/日
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export function formatFullTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return dateStr
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}
