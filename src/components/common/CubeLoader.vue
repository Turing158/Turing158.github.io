<template>
  <div
    class="cube-loader"
    :class="[sizeClass, { 'cube-loader--inline': inline }]"
    :style="customSize"
    role="status"
    :aria-label="text || t('common.loading')"
  >
    <div class="cube3d" aria-hidden="true">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <span v-if="text" class="cube-loader-text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 全站统一加载动画：旋转的像素草方块。
 * 样式在 styles/cube-loader.css（全局），供本组件与 MarkdownRenderer 注入的加载层共用。
 */
interface Props {
  /** 尺寸：预设 small / medium / large，或自定义像素值 */
  size?: 'small' | 'medium' | 'large' | number
  /** 加载文案，不传则只显示方块 */
  text?: string
  /** 行内显示：与文字同排的小方块 */
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
})

const { t } = useI18n()

/** 全站方块统一缩小为原先的 1/2，数字尺寸按同比例换算，最小不低于 8px 保证可辨识 */
const SIZE_SCALE = 1 / 2

const sizeClass = computed(() =>
  typeof props.size === 'number' ? '' : `cube-loader--${props.size}`
)

const customSize = computed(() =>
  typeof props.size === 'number'
    ? ({
        '--cube-size': `${Math.max(8, Math.round(props.size * SIZE_SCALE))}px`,
      } as CSSProperties)
    : undefined
)
</script>
