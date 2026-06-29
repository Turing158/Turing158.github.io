/**
 * 复制文本到剪贴板
 * 优先使用 Clipboard API (navigator.clipboard.writeText)，
 * 降级使用 document.execCommand('copy')
 */
import BlogTip from '@/plugins/blog-tip'

export async function copyText(text: string, successMessage?: string) {
  const msg = successMessage ?? '已复制!'
  try {
    await navigator.clipboard.writeText(text)
    BlogTip.show(msg, { type: 'success' })
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    BlogTip.show(msg, { type: 'success' })
  }
}
