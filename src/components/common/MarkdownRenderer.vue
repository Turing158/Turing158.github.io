<template>
  <div class="markdown-renderer markdown-body" v-html="html" ref="containerRef" />
  <ImageViewer
    :visible="viewerVisible"
    :images="viewerImages"
    :initial-index="viewerIndex"
    @close="viewerVisible = false"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ImageViewer, { type ImageViewerImage } from '@/components/common/ImageViewer.vue'

const props = defineProps<{
  html: string
}>()

const { t } = useI18n()
const containerRef = ref<HTMLElement | null>(null)

// ==================== 图片加载状态（加载占位 / 失败占位） ====================

// 占位容器持久存在，状态间仅切换类名：内容层（转圈/裂图/图片）以透明度过渡，
// 容器边框与背景保持稳定不做动画

const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  const wrap = img.closest('.markdown-img-wrap')
  if (wrap) {
    wrap.classList.remove('is-loading', 'is-error')
    wrap.classList.add('is-loaded')
  }
  img.classList.add('markdown-img-enter')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  let wrap = img.closest('.markdown-img-wrap') as HTMLElement | null
  if (!wrap) {
    // 绑定后才失败的已加载图片没有占位容器，现场补一个
    wrap = mountImageWrap(img)
  }
  wrap.classList.remove('is-loading')
  wrap.classList.add('is-error')
}

// 失败层点击重试：容器切回加载态，原图元素重新请求（重试参数绕过失败缓存）
const handleRetryClick = (e: Event) => {
  const wrap = (e.target as HTMLElement).closest('.markdown-img-wrap') as HTMLElement | null
  const img = wrap?.querySelector('img')
  if (!wrap || !img) return
  wrap.classList.remove('is-error')
  wrap.classList.add('is-loading')
  const base = (wrap.dataset.src || img.src).replace(/([?&])retry=\d+/, '')
  img.src = `${base}${base.includes('?') ? '&' : '?'}retry=${Date.now()}`
}

// 构建持久占位容器：加载层 + 失败层（调用方负责替换后把 img 装入容器）
const buildImageWrap = (img: HTMLImageElement) => {
  const alt = img.alt || '图片'
  const escapedAlt = alt.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))
  const wrap = document.createElement('div')
  wrap.className = 'markdown-img-wrap is-loading'
  wrap.dataset.src = img.src
  wrap.innerHTML = `<div class="markdown-img-layer is-loading-layer"><span class="markdown-img-spinner" aria-hidden="true"></span></div><div class="markdown-img-layer is-error-layer"><button class="markdown-image-retry" type="button" title="${t('common.reloadImage')}" aria-label="${t('common.reloadImage')}"><svg class="icon-cracked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3l-1.5 5 2.5 2.5-2.5 3 2 3.5-1 4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6z"/><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8.5l1-4-2-3.5 2.5-3-2.5-2.5L13 3z"/><circle cx="16.8" cy="8.3" r="1.4"/><path d="m21 15.5-2.8-2.8-3.4 3.6"/></svg><svg class="icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></button><span class="markdown-image-error-alt">${escapedAlt}</span></div>`
  return wrap
}

// 用占位容器替换图片（先替换再装入，避免容器包含自身的替换报错）
const mountImageWrap = (img: HTMLImageElement) => {
  const wrap = buildImageWrap(img)
  img.replaceWith(wrap)
  wrap.appendChild(img)
  return wrap
}

const bindImageStates = () => {
  containerRef.value?.querySelectorAll('img').forEach((img) => {
    if (img.dataset.stateBound) return
    img.dataset.stateBound = '1'
    img.addEventListener('error', handleImageError)
    img.addEventListener('load', handleImageLoad)

    if (img.complete) {
      // 绑定前已完成：成功则无需处理，失败则包占位容器并直接置于失败态（覆盖 error 早于监听的情况）
      if (img.naturalWidth === 0) {
        const wrap = mountImageWrap(img)
        wrap.classList.remove('is-loading')
        wrap.classList.add('is-error')
      }
      return
    }
    // 未加载完成：包占位容器进入加载态
    mountImageWrap(img)
  })
}

const unbindImageStates = () => {
  if (!containerRef.value) return
  containerRef.value.querySelectorAll('img').forEach((img) => {
    img.removeEventListener('error', handleImageError)
    img.removeEventListener('load', handleImageLoad)
  })
}

// ==================== 图片查看器 ====================

const viewerVisible = ref(false)
const viewerImages = ref<ImageViewerImage[]>([])
const viewerIndex = ref(0)

const handleImageClick = (e: Event) => {
  const img = (e.target as HTMLElement).closest('img') as HTMLImageElement | null
  if (!img || !containerRef.value) return
  // 链接内的图片保留原有跳转行为；加载失败的图片已被占位元素替换
  if (img.closest('a[href]')) return
  const allImages = Array.from(containerRef.value.querySelectorAll('img'))
  const index = allImages.indexOf(img)
  if (index === -1) return
  viewerImages.value = allImages.map((el) => ({
    src: el.currentSrc || el.src,
    alt: el.alt || '',
  }))
  viewerIndex.value = index
  viewerVisible.value = true
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
    setTimeout(bindImageStates, 0)
  },
  { immediate: true }
)

onMounted(() => {
  containerRef.value?.addEventListener('click', handleCopyClick)
  containerRef.value?.addEventListener('click', handleAnchorClick)
  containerRef.value?.addEventListener('click', handleImageClick)
  containerRef.value?.addEventListener('click', handleRetryClick)
  bindImageStates()
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleCopyClick)
  containerRef.value?.removeEventListener('click', handleAnchorClick)
  containerRef.value?.removeEventListener('click', handleImageClick)
  containerRef.value?.removeEventListener('click', handleRetryClick)
  unbindImageStates()
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  padding: 0;
  line-height: 1.8;
}
</style>
