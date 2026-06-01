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
  return Array.from(headings).map((el) => {
    if (!el.id) {
      el.id = `heading-${el.tagName}-${Array.from(headings).indexOf(el)}`
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

onMounted(() => {
  containerRef.value?.addEventListener('click', handleCopyClick)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleCopyClick)
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  padding: 0;
  line-height: 1.8;
}
</style>
