<template>
  <div class="markdown-renderer markdown-body" v-html="html" ref="containerRef" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  html: string
}>()

const containerRef = ref<HTMLElement | null>(null)

// 复制代码按钮点击处理
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
    // fallback
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

// Expose headings for TOC
const getHeadings = () => {
  if (!containerRef.value) return []
  const headings = containerRef.value.querySelectorAll('h2, h3')
  return Array.from(headings).map((el, i) => {
    // markdown-it-anchor 已生成 id，仅在缺失时回退
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

// 使用事件委托监听复制按钮
watch(() => props.html, () => {
  // html 变化后不需要重新绑定，因为用的是容器上的事件委托
}, { immediate: true })

// 归一化为 GitHub 风格 slug：转小写、空白转连字符、去除其余标点（保留连字符/下划线/CJK）
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '')

// 拦截页内锚点链接点击，手动滚动（Hash 路由下浏览器会当成路由跳转）
const handleAnchorClick = (e: Event) => {
  const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  if (!link) return
  const href = link.getAttribute('href')
  if (!href || href === '#') return
  const targetId = decodeURIComponent(href.slice(1))
  let target: HTMLElement | null = document.getElementById(targetId)
  // 锚点与标题 id 不完全匹配时（如手写锚点去掉了 "+"、改了大小写），用归一化 slug 回退匹配标题
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

onMounted(() => {
  containerRef.value?.addEventListener('click', handleCopyClick)
  containerRef.value?.addEventListener('click', handleAnchorClick)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleCopyClick)
  containerRef.value?.removeEventListener('click', handleAnchorClick)
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  padding: 0;
  line-height: 1.8;
}
</style>
