<template>
  <div class="markdown-renderer markdown-body" v-html="html" ref="containerRef" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  html: string
}>()

const containerRef = ref<HTMLElement | null>(null)

// ==================== 图片加载失败处理 ====================

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.failed) return
  img.dataset.failed = '1'

  const alt = img.alt || '图片'
  const wrapper = document.createElement('div')
  wrapper.className = 'markdown-image-error'
  wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span class="markdown-image-error-alt">${alt.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</span>`
  img.replaceWith(wrapper)
}

const bindImageErrors = () => {
  if (!containerRef.value) return
  containerRef.value.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', handleImageError)
  })
}

const unbindImageErrors = () => {
  if (!containerRef.value) return
  containerRef.value.querySelectorAll('img').forEach((img) => {
    img.removeEventListener('error', handleImageError)
  })
}

// ==================== 复制代码 ====================

const handleCopyClick = async (e: Event) => {
  const btn = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLElement | null
  if (!btn) return
  const b64 = btn.dataset.codeB64
  if (!b64) return
  try {
    const code = decodeURIComponent(escape(atob(b64)))
    await navigator.clipboard.writeText(code)
    btn.textContent = '已复制!'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.textContent = '复制'
      btn.classList.remove('copied')
    }, 1500)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = decodeURIComponent(escape(atob(b64)))
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    btn.textContent = '已复制!'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.textContent = '复制'
      btn.classList.remove('copied')
    }, 1500)
  }
}

// ==================== TOC ====================

const getHeadings = () => {
  if (!containerRef.value) return []
  const headings = containerRef.value.querySelectorAll('h2, h3')
  return Array.from(headings).map((el, i) => {
    if (!el.id) {
      el.id = `heading-${el.tagName}-${i}`
    }
    return {
      id: el.id,
      level: el.tagName.toLowerCase(),
      text: el.textContent || '',
    }
  })
}

defineExpose({ getHeadings })

// ==================== 锚点滚动 ====================

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '')

const handleAnchorClick = (e: Event) => {
  const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  if (!link) return
  const href = link.getAttribute('href')
  if (!href || href === '#') return
  const targetId = decodeURIComponent(href.slice(1))
  let target: HTMLElement | null = document.getElementById(targetId)
  if (!target && containerRef.value) {
    const want = slugify(targetId)
    const headings = containerRef.value.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    target =
      Array.from(headings).find(
        (h) => slugify(h.id) === want || slugify(h.textContent || '') === want
      ) || null
  }
  if (target) {
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ==================== 生命周期 ====================

watch(
  () => props.html,
  () => {
    setTimeout(bindImageErrors, 0)
  },
  { immediate: true }
)

onMounted(() => {
  containerRef.value?.addEventListener('click', handleCopyClick)
  containerRef.value?.addEventListener('click', handleAnchorClick)
  bindImageErrors()
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleCopyClick)
  containerRef.value?.removeEventListener('click', handleAnchorClick)
  unbindImageErrors()
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  padding: 0;
  line-height: 1.8;
}
</style>
