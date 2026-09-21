<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { formatViewCount } from '@/utils/formatViewCount'

/**
 * 数字滚动动画组件
 *
 * - 挂载时从 0 滚动到目标值（用于浏览量加载完成后的入场动画）
 * - 外部数值变化时从旧值平滑滚动到新值
 * - 显示格式复用 formatViewCount（万/亿 缩写）
 * - 尊重 prefers-reduced-motion，直接显示最终值
 */
interface Props {
  /** 目标数字 */
  value: number
  /** 滚动时长（毫秒），默认 900 */
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  duration: 900,
})

const displayText = ref('0')
let rafId = 0

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animate(from: number, to: number, duration: number) {
  cancelAnimationFrame(rafId)
  if (prefersReducedMotion || duration <= 0 || from === to) {
    displayText.value = formatViewCount(to)
    return
  }
  const startTime = performance.now()
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration)
    // easeOutCubic：先快后慢
    const eased = 1 - Math.pow(1 - progress, 3)
    displayText.value = formatViewCount(Math.round(from + (to - from) * eased))
    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    }
  }
  rafId = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (to, from) => {
    animate(from ?? 0, to, props.duration)
  }
)

onMounted(() => {
  animate(0, props.value, props.duration)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
})
</script>