<template>
  <span>{{ displayText }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { formatViewCount } from '@/utils/formatViewCount'
import { useAnimations } from '@/composables/useAnimations'

/**
 * 数字滚动动画组件
 *
 * - 挂载时从 0 滚动到目标值（用于浏览量加载完成后的入场动画）
 * - 外部数值变化时从旧值平滑滚动到新值
 * - 显示格式复用 formatViewCount（万/亿 缩写）
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

const { animationsEnabled } = useAnimations()

function animate(from: number, to: number, duration: number) {
  cancelAnimationFrame(rafId)
  // 动画关闭：直接落到目标值，不做滚动
  if (!animationsEnabled.value || duration <= 0 || from === to) {
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

// 动画关闭时掐掉进行中的滚动，数字直接定格在目标值
watch(animationsEnabled, (on) => {
  if (on) return
  cancelAnimationFrame(rafId)
  displayText.value = formatViewCount(props.value)
})

onMounted(() => {
  animate(0, props.value, props.duration)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
})
</script>