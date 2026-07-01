/**
 * AchievementProgress — 成就进度条
 *
 * 显示已解锁数量/总数 和 环形进度指示器
 */
<template>
  <div class="achievement-progress">
    <div class="progress-ring-wrap">
      <svg class="progress-ring" viewBox="0 0 120 120" aria-hidden="true">
        <!-- 背景圆环 -->
        <circle
          class="ring-bg"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          :stroke-width="8"
        />
        <!-- 进度圆环 -->
        <circle
          class="ring-fill"
          cx="60"
          cy="60"
          r="52"
          fill="none"
          :stroke-width="8"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
        />
      </svg>
      <div class="ring-center">
        <span class="ring-percent">{{ progress }}%</span>
      </div>
    </div>
    <div class="progress-text">
      <span class="progress-label">{{ $t('achievements.title') }}</span>
      <span class="progress-count">{{ $t('achievements.progress', { unlocked, total }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    unlocked: number
    total: number
    progress: number
  }>(),
  {
    unlocked: 0,
    total: 1,
    progress: 0,
  }
)

const circumference = 2 * Math.PI * 52
const dashOffset = computed(() => {
  return circumference - (props.progress / 100) * circumference
})
</script>

<style lang="less" scoped>
.achievement-progress {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border);
}

.progress-ring-wrap {
  position: relative;
  flex-shrink: 0;
  width: 90px;
  height: 90px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--bg-secondary);
}

.ring-fill {
  stroke: var(--accent);
  transition: stroke-dashoffset 0.6s ease;
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.progress-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

// 响应式
@media (max-width: 480px) {
  .achievement-progress {
    padding: 16px;
  }

  .progress-ring-wrap {
    width: 72px;
    height: 72px;
  }

  .ring-percent {
    font-size: 0.95rem;
  }
}
</style>
