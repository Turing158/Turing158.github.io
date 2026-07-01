<template>
  <div :class="['loading-spinner-wrapper', sizeClass, variantClass]" :style="customStyle">
    <div v-if="variant === 'dots'" class="loading-dots">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
    <div v-else-if="variant === 'spinner'" class="loading-spinner"></div>
    <div v-else-if="variant === 'bounce'" class="loading-bounce">
      <div class="bounce-item bounce-1"></div>
      <div class="bounce-item bounce-2"></div>
      <div class="bounce-item bounce-3"></div>
    </div>
    <div v-else-if="variant === 'ring'" class="loading-ring"></div>
    <div v-else-if="variant === 'text'" class="loading-text">
      {{ text || $t('common.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  /** 加载动画类型：dots, spinner, bounce, ring, text */
  variant?: 'dots' | 'spinner' | 'bounce' | 'ring' | 'text'
  /** 大小：small, medium, large */
  size?: 'small' | 'medium' | 'large'
  /** 文字内容（仅 text 类型有效） */
  text?: string
  /** 自定义颜色 */
  color?: string
  /** 是否居中 */
  centered?: boolean
  /** 自定义类名 */
  class?: string
  /** 内联样式 */
  style?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dots',
  size: 'medium',
  centered: true,
})

const customStyle = computed(() => ({
  ...props.style,
  ...(props.color && { '--loading-color': props.color }),
}))

const sizeClass = computed(() => `loading-size--${props.size}`)
const variantClass = computed(() => `loading-variant--${props.variant}`)
</script>

<style lang="less" scoped>
.loading-spinner-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  color: var(--loading-color, var(--accent));

  &.loading-size--small {
    padding: 0.5rem 0;
    .loading-dots { gap: 3px; }
    .loading-dot { width: 5px; height: 5px; }
    .loading-spinner { width: 16px; height: 16px; border-width: 2px; }
    .bounce-item { width: 6px; height: 6px; }
    .loading-ring { width: 16px; height: 16px; border-width: 2px; }
    .loading-text { font-size: 0.85rem; }
  }

  &.loading-size--medium {
    padding: 1rem 0;
    .loading-dots { gap: 4px; }
    .loading-dot { width: 6px; height: 6px; }
    .loading-spinner { width: 20px; height: 20px; border-width: 2px; }
    .bounce-item { width: 8px; height: 8px; }
    .loading-ring { width: 20px; height: 20px; border-width: 2px; }
    .loading-text { font-size: 0.9rem; }
  }

  &.loading-size--large {
    padding: 1.5rem 0;
    .loading-dots { gap: 5px; }
    .loading-dot { width: 8px; height: 8px; }
    .loading-spinner { width: 24px; height: 24px; border-width: 3px; }
    .bounce-item { width: 10px; height: 10px; }
    .loading-ring { width: 24px; height: 24px; border-width: 3px; }
    .loading-text { font-size: 1rem; }
  }
}

/* Dots 变体 */
.loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: loading-bounce 1.4s infinite ease-in-out;
  animation-fill-mode: both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Spinner 变体 */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: spinner-spin 0.8s linear infinite;
}

@keyframes spinner-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Bounce 变体 */
.loading-bounce {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.bounce-item {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: bounce-pulse 1.4s infinite ease-in-out;
}

.bounce-1 { animation-delay: -0.32s; }
.bounce-2 { animation-delay: -0.16s; }
.bounce-3 { animation-delay: 0s; }

@keyframes bounce-pulse {
  0%, 60%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Ring 变体 */
.loading-ring {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: transparent;
  animation: ring-spin 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

@keyframes ring-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Text 变体 */
.loading-text {
  color: currentColor;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 无障碍减少动画（与Windows系统中的"窗口内的动画控件和元素"有冲突，全部都使用动画）
@media (prefers-reduced-motion: reduce) {
  .loading-dot,
  .loading-spinner,
  .bounce-item,
  .loading-ring {
    animation: none;
  }

  .loading-dot,
  .bounce-item {
    opacity: 1;
    transform: scale(1);
  }
}
*/
</style>