<!--
  工具弹窗快捷操作（移植自 CodeCraft-ps 导航栏右上角的 LanguageSelect 语言切换组件）
  收起时是与关闭按钮同款的方形图标按钮（地球图标），
  悬停 / 键盘聚焦（focus-within）时横向展开出「切换 / 跳转」两个操作按钮，
  展开动画由 grid 0fr → 1fr 过渡驱动；高亮指示块跟随悬停按钮平滑滑动。
  两个按钮目前只发出 switch / jump 事件，具体逻辑暂未接入。
-->
<template>
  <div class="tda-select px-fade" role="group" :aria-label="t('tools.dialogNavLabel')" @mouseleave="hovered = null">
    <span class="tda-face" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    </span>
    <div class="tda-expand">
      <div class="tda-expand-inner">
        <div ref="listRef" class="tda-options">
          <span
            v-if="pill"
            class="tda-indicator"
            :class="{ 'is-visible': hovered }"
            aria-hidden="true"
            :style="{ width: pill.w + 'px', transform: `translateX(${pill.x}px)` }"
          />
          <button
            v-for="action in actions"
            :key="action.key"
            type="button"
            class="tda-btn"
            :data-key="action.key"
            @mouseenter="onHover(action.key)"
            @click="onAction(action.key, $event)"
          >{{ t(action.labelKey) }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  switch: []
  jump: []
}>()

const { t } = useI18n()

const actions = [
  { key: 'switch', labelKey: 'tools.dialogNavSwitch' },
  { key: 'jump', labelKey: 'tools.dialogNavJump' },
] as const

type ActionKey = (typeof actions)[number]['key']

const listRef = ref<HTMLElement | null>(null)
// 指示块的几何信息：悬停不同按钮时 transform 过渡产生滑动动画
const pill = ref<{ x: number; w: number } | null>(null)
const hovered = ref<ActionKey | null>(null)

function measure() {
  const btn = listRef.value?.querySelector<HTMLButtonElement>(`[data-key="${hovered.value}"]`)
  if (btn) pill.value = { x: btn.offsetLeft, w: btn.offsetWidth }
}

function onHover(key: ActionKey) {
  hovered.value = key
  measure()
}

function onAction(key: ActionKey, e: MouseEvent) {
  if (key === 'switch') emit('switch')
  else emit('jump')
  // 点击后归还焦点，选择框才能随鼠标离开恢复收起态；键盘 Tab 聚焦触发的 focus-within 展开不受影响
  ;(e.currentTarget as HTMLElement).blur()
}

onMounted(() => {
  // 字体异步加载会改变按钮文字宽度，加载完成后校准一次指示块位置
  document.fonts?.ready.then(measure).catch(() => {})
})
</script>

<style scoped>
/* 定位在弹窗右上角、关闭按钮左侧（关闭按钮 top 14px / right 14px / 32px 见方） */
.tda-select {
  position: absolute;
  top: 14px;
  right: 56px;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 32px;
  --pxs: 2px;
  clip-path: var(--pxc);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  transition: background-color 0.2s;
}

.tda-select:hover {
  background: var(--border);
}

/* 收起态：16px 图标居中在 32px 见方面积里，与关闭按钮同高同观感 */
.tda-face {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.tda-select:hover .tda-face {
  color: var(--text-primary);
}

.tda-face svg {
  display: block;
}

/* 展开容器：grid 列 0fr → 1fr 过渡，横向展开到按钮行的实际内容宽度 */
.tda-expand {
  display: grid;
  grid-template-columns: 0fr;
  transition: grid-template-columns 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.tda-select:hover .tda-expand,
.tda-select:focus-within .tda-expand {
  grid-template-columns: 1fr;
}

.tda-expand-inner {
  overflow: hidden;
  min-width: 0;
}

/* 按钮行：固定 32px 与收起态等高，展开前后容器高度不变；内边距在裁剪层内，
   收起时随列宽 0 一起被裁掉，不占横向空间；relative 作为指示块的定位基准 */
.tda-options {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 6px 0 8px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.18s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.tda-select:hover .tda-options,
.tda-select:focus-within .tda-options {
  opacity: 1;
  transform: translateX(0);
  transition-delay: 0.06s;
}

/* 高亮指示块：绝对定位在按钮行下方，悬停不同按钮时 translateX 过渡平移 */
.tda-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  --pxs: 2px;
  clip-path: var(--pxc);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  opacity: 0;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.15s ease;
  pointer-events: none;
}

.tda-indicator.is-visible {
  opacity: 1;
}

.tda-btn {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: none;
  background: transparent;
  --pxs: 2px;
  clip-path: var(--pxc);
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1;
  /* 字重全档一致：避免悬停高亮切换时因字重变化产生宽度抖动 */
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.tda-btn:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
}

.tda-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
</style>
