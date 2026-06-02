/**
 * 时间格式化工具
 * - 小于1分钟：*秒前 / * seconds ago
 * - 小于1小时：*分钟前 / * minutes ago
 * - 小于1天：*小时前 / * hours ago
 * - 小于1周：昨天、前天、*天前 / Yesterday, Day before yesterday, * days ago
 * - 大于1周：年/月/日
 * - 鼠标悬停显示：年/月/日 时:分:秒
 */

import { useI18n } from 'vue-i18n'

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

  const { t } = useI18n()

  if (diffSec < 60) {
    return t('time.secondsAgo', { n: diffSec })
  }

  if (diffMin < 60) {
    return t('time.minutesAgo', { n: diffMin })
  }

  if (diffHour < 24) {
    return t('time.hoursAgo', { n: diffHour })
  }

  if (diffDay === 1) {
    return t('time.yesterday')
  }

  if (diffDay === 2) {
    return t('time.dayBeforeYesterday')
  }

  if (diffDay < 7) {
    return t('time.daysAgo', { n: diffDay })
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
