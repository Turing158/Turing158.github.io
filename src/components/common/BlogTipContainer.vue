<template>
  <div class="blog-tip-container">
    <div
      v-for="(tip, index) in tips"
      :key="tip.id"
      class="blog-tip-item"
      :class="[`blog-tip-${tip.type}`, { 'is-leaving': tip.leaving }]"
      :style="{ top: `${index * (itemHeight + gap)}px` }"
      @mouseenter="onMouseEnter(tip)"
      @mouseleave="onMouseLeave(tip)"
    >
      <span class="blog-tip-message">{{ tip.message }}</span>
      <span v-if="tip.count > 1" class="blog-tip-count">{{ tip.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tips, startLeaveTimer, clearLeaveTimer } from '@/plugins/blog-tip'

// 与 CSS 中的 gap 和实际高度保持一致
const itemHeight = 44 // .blog-tip-item 的 padding(10+10) + line-height(1.5*0.9rem≈22) ≈ 42，留余量
const gap = 10

function onMouseEnter(tip: (typeof tips.value)[number]) {
  clearLeaveTimer(tip.id)
  tip.leaving = false
}

function onMouseLeave(tip: (typeof tips.value)[number]) {
  startLeaveTimer(tip.id)
}
</script>

<style lang="less" scoped>
.blog-tip-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  pointer-events: none;
}

.blog-tip-item {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 8px;
  background: var(--accent);
  border: 2px solid var(--border);
  box-shadow: 0 6px 20px var(--shadow);
  font-size: 0.9rem;
  color: #f1f1f1;
  pointer-events: auto;
  white-space: nowrap;
  animation: blog-tip-in 0.3s ease;
  transition: top 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
}

.blog-tip-message {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.blog-tip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #f1f1f1;
  color: var(--accent);
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
}

// type variants — only border color differs
.blog-tip-info {
  border-color: var(--accent);
}
.blog-tip-success {
  border-color: #4caf50;
}
.blog-tip-warning {
  border-color: #ff9800;
}
.blog-tip-error {
  border-color: #e74c3c;
}

@keyframes blog-tip-in {
  from {
    opacity: 0;
    transform: translate(-50%, -12px) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) rotate(0deg);
  }
}

.is-leaving {
  opacity: 0 !important;
  transform: translate(-50%, -12px) rotate(3deg) !important;
  pointer-events: none;
  position: absolute;
}
</style>
