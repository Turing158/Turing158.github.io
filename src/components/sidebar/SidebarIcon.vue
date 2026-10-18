<template>
  <svg
    class="sidebar-icon-svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(d, i) in paths" :key="i">
      <path v-if="d.type === 'path'" :d="d.d" />
      <circle v-else-if="d.type === 'circle'" :cx="d.cx" :cy="d.cy" :r="d.r" />
      <line
        v-else-if="d.type === 'line'"
        :x1="d.x1"
        :y1="d.y1"
        :x2="d.x2"
        :y2="d.y2"
      />
      <polyline v-else-if="d.type === 'polyline'" :points="d.points" />
      <rect
        v-else-if="d.type === 'rect'"
        :x="d.x"
        :y="d.y"
        :width="d.width"
        :height="d.height"
        :rx="d.rx"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Shape =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'polyline'; points: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number }

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    strokeWidth?: number | string
  }>(),
  {
    size: 20,
    strokeWidth: 2,
  }
)

// Lucide 风格线性图标 (24x24 viewBox)
const icons: Record<string, Shape[]> = {
  home: [
    { type: 'path', d: 'M3 9.5 12 3l9 6.5' },
    { type: 'path', d: 'M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10' },
    { type: 'path', d: 'M9 21v-6h6v6' },
  ],
  articles: [
    { type: 'path', d: 'M4 4a1 1 0 0 1 1-1h9l6 6v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z' },
    { type: 'polyline', points: '14 3 14 9 20 9' },
    { type: 'line', x1: 8, y1: 13, x2: 16, y2: 13 },
    { type: 'line', x1: 8, y1: 17, x2: 13, y2: 17 },
  ],
  projects: [
    { type: 'path', d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z' },
    { type: 'path', d: 'M12 15 9 12a16 16 0 0 1 9-9c2.5 0 3 .5 3 3a16 16 0 0 1-9 9Z' },
    { type: 'path', d: 'M9 12H5l2-3h3' },
    { type: 'path', d: 'M12 15v4l3-2v-3' },
  ],
  tools: [
    { type: 'path', d: 'M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18v3h3l6.4-6.3a4 4 0 0 0 5.3-5.4l-2.8 2.8-2.1-2.1Z' },
  ],
  about: [
    { type: 'circle', cx: 12, cy: 8, r: 4 },
    { type: 'path', d: 'M4 21a8 8 0 0 1 16 0' },
  ],
  link: [
    { type: 'path', d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' },
    { type: 'path', d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  ],
  forest: [
    { type: 'path', d: 'M12 2 7 11h3l-4 7h12l-4-7h3Z' },
    { type: 'line', x1: 12, y1: 18, x2: 12, y2: 22 },
  ],
  ocean: [
    { type: 'path', d: 'M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2' },
    { type: 'path', d: 'M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2' },
    { type: 'path', d: 'M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2' },
  ],
  sunset: [
    { type: 'path', d: 'M17 18a5 5 0 0 0-10 0' },
    { type: 'line', x1: 12, y1: 2, x2: 12, y2: 9 },
    { type: 'line', x1: 4.2, y1: 10.2, x2: 5.6, y2: 11.6 },
    { type: 'line', x1: 1, y1: 18, x2: 3, y2: 18 },
    { type: 'line', x1: 21, y1: 18, x2: 23, y2: 18 },
    { type: 'line', x1: 18.4, y1: 11.6, x2: 19.8, y2: 10.2 },
    { type: 'path', d: 'M8 9 12 5l4 4' },
    { type: 'line', x1: 1, y1: 22, x2: 23, y2: 22 },
  ],
  dark: [
    { type: 'path', d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
  ],
  lang: [
    { type: 'circle', cx: 12, cy: 12, r: 9 },
    { type: 'line', x1: 3, y1: 12, x2: 21, y2: 12 },
    { type: 'path', d: 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z' },
  ],
  settings: [
    { type: 'path', d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' },
    { type: 'circle', cx: 12, cy: 12, r: 3 },
  ],
  animation: [
    { type: 'path', d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z' },
    { type: 'path', d: 'M20 3v4' },
    { type: 'path', d: 'M22 5h-4' },
    { type: 'path', d: 'M4 17v2' },
    { type: 'path', d: 'M5 18H3' },
  ],
  // 动画开关「关」：同一组星芒加一道斜杠
  animationOff: [
    { type: 'path', d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0Z' },
    { type: 'path', d: 'M20 3v4' },
    { type: 'path', d: 'M22 5h-4' },
    { type: 'path', d: 'M4 17v2' },
    { type: 'path', d: 'M5 18H3' },
    { type: 'line', x1: 3.2, y1: 20.8, x2: 20.8, y2: 3.2 },
  ],
  chevronLeft: [{ type: 'polyline', points: '15 6 9 12 15 18' }],
  menu: [
    { type: 'line', x1: 3, y1: 6, x2: 21, y2: 6 },
    { type: 'line', x1: 3, y1: 12, x2: 21, y2: 12 },
    { type: 'line', x1: 3, y1: 18, x2: 21, y2: 18 },
  ],
  commits: [
    { type: 'circle', cx: 12, cy: 8, r: 3 },
    { type: 'line', x1: 12, y1: 11, x2: 12, y2: 21 },
    { type: 'circle', cx: 12, cy: 17, r: 3 },
    { type: 'circle', cx: 18, cy: 17, r: 3 },
    { type: 'line', x1: 12, y1: 14, x2: 18, y2: 14 },
  ],
  releases: [
    { type: 'path', d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z' },
    { type: 'polyline', points: '3.27 6.96 12 12.01 20.73 6.96' },
    { type: 'line', x1: 12, y1: 22.08, x2: 12, y2: 12 },
  ],
  gripVertical: [
    { type: 'circle', cx: 9, cy: 6, r: 1 },
    { type: 'circle', cx: 15, cy: 6, r: 1 },
    { type: 'circle', cx: 9, cy: 12, r: 1 },
    { type: 'circle', cx: 15, cy: 12, r: 1 },
    { type: 'circle', cx: 9, cy: 18, r: 1 },
    { type: 'circle', cx: 15, cy: 18, r: 1 },
  ],
  search: [
    { type: 'circle', cx: 11, cy: 11, r: 8 },
    { type: 'line', x1: 21, y1: 21, x2: 16.65, y2: 16.65 },
  ],
  externalLink: [
    { type: 'path', d: 'M15 3h6v6' },
    { type: 'path', d: 'M10 14 21 3' },
    { type: 'path', d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' },
  ],
  hub: [
    { type: 'rect', x: 9, y: 2, width: 6, height: 6, rx: 1 },
    { type: 'rect', x: 2, y: 16, width: 6, height: 6, rx: 1 },
    { type: 'rect', x: 16, y: 16, width: 6, height: 6, rx: 1 },
    { type: 'line', x1: 12, y1: 8, x2: 12, y2: 12 },
    { type: 'line', x1: 5, y1: 16, x2: 9.5, y2: 12 },
    { type: 'line', x1: 19, y1: 16, x2: 14.5, y2: 12 },
  ],
  system: [
    { type: 'rect', x: 2, y: 3, width: 20, height: 14, rx: 2 },
    { type: 'line', x1: 8, y1: 21, x2: 16, y2: 21 },
    { type: 'line', x1: 12, y1: 17, x2: 12, y2: 21 },
  ],
  trophy: [
    { type: 'path', d: 'M6 2h12v2c0 3-2 7-6 9-4-2-6-6-6-9V2Z' },
    { type: 'path', d: 'M12 13v5' },
    { type: 'path', d: 'M8 22h8' },
    { type: 'path', d: 'M6 8a4 4 0 0 1-4-4V4h2a4 4 0 0 1 4 4' },
    { type: 'path', d: 'M18 8a4 4 0 0 0 4-4V4h-2a4 4 0 0 0-4 4' },
  ],
  // 遮罩类型（设置面板）
  layers: [
    { type: 'path', d: 'M12 2 2 7l10 5 10-5-10-5Z' },
    { type: 'polyline', points: '2 17 12 22 22 17' },
    { type: 'polyline', points: '2 12 12 17 22 12' },
  ],
  // 点击遮罩关闭（设置面板）
  pointer: [
    { type: 'path', d: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3Z' },
    { type: 'path', d: 'M13 13l6 6' },
  ],
  // PWA 安装（设置面板）
  download: [
    { type: 'path', d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
    { type: 'polyline', points: '7 10 12 15 17 10' },
    { type: 'line', x1: 12, y1: 15, x2: 12, y2: 3 },
  ],
  // 已完成徽标（设置面板）
  check: [{ type: 'polyline', points: '20 6 9 17 4 12' }],
}

const paths = computed<Shape[]>(() => icons[props.name] ?? [])
</script>

<style lang="less" scoped>
.sidebar-icon-svg {
  display: block;
  flex-shrink: 0;
}
</style>
