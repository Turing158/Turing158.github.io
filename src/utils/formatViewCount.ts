/**
 * 浏览量数字格式化工具
 *
 * 格式化规则：
 * - 一万以下（不包括一万）：显示正常数据
 * - 一万以上（包括一万）：显示万以上数字，保留2位小数
 * - 十万以上（包括十万）：显示万以上数字，保留2位小数
 * - 百万以上（包括百万）：显示万以上数字，保留1位小数
 * - 千万以上（包括千万）：显示万以上数字，保留1位小数
 * - 一亿以上（包括一亿）：显示亿以上数字，保留1位小数
 */

/**
 * 格式化浏览量数字
 * @param count 原始浏览量
 * @returns 格式化后的字符串
 */
export function formatViewCount(count: number): string {
  if (count < 0) {
    return '0'
  }

  // 一万以下：显示正常数据
  if (count < 10000) {
    return count.toString()
  }

  // 一亿以上：显示亿以上数字，保留1位小数
  if (count >= 100000000) {
    const yi = count / 100000000
    return yi.toFixed(1) + ' 亿'
  }

  // 一万以上：显示万以上数字
  const wan = count / 10000

  // 千万以上：保留1位小数
  if (count >= 10000000 || count >= 1000000) {
    return wan.toFixed(1) + ' 万'
  }

  return wan.toFixed(2) + ' 万'
}
