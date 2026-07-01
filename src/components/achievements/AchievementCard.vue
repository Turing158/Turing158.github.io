/**
 * AchievementCard — 单个成就卡片（毛玻璃风格）
 *
 * 锁定态：灰度 + 锁图标 + 问号 + 模糊遮罩
 * 解锁态：全彩 + 毛玻璃背景 + 光泽流动
 * 最近解锁：额外发光脉冲动画
 * 已获得时间：解锁态底部显示相对时间
 */
<template>
  <div
    class="achievement-card"
    :class="{
      unlocked: achievement.unlocked,
      'is-latest': isLatest,
    }"
  >
    <!-- 毛玻璃背景层 -->
    <div class="card-glass" aria-hidden="true"></div>

    <!-- 卡片顶部：图标 + 名称 -->
    <div class="card-header">
      <div class="card-icon-wrap">
        <span class="card-icon">{{ achievement.unlocked ? achievement.icon : '❓' }}</span>
      </div>
      <div class="card-title-group">
        <h3 class="card-name">
          {{ achievement.unlocked ? displayName : '???' }}
        </h3>
      </div>
    </div>

    <!-- 卡片描述 -->
    <p class="card-desc">
      {{ achievement.unlocked ? displayDescription : $t('achievements.locked') }}
    </p>

    <!-- 底部：锁定态显示解锁条件，解锁态显示完成标记 + 获得时间 -->
    <div class="card-footer">
      <template v-if="achievement.unlocked">
        <span class="card-badge unlocked-badge">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ $t('achievements.unlocked') }}
        </span>
        <span v-if="achievement.unlockedAt" class="card-unlock-time" :title="formatFullTime(achievement.unlockedAt)">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ formatRelativeTime(achievement.unlockedAt) }}
        </span>
      </template>
      <template v-else>
        <span class="card-badge locked-badge">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {{ $t(achievement.conditionKey) }}
        </span>
      </template>
    </div>

    <!-- 解锁态光泽流动覆盖层 -->
    <div v-if="achievement.unlocked" class="card-shine" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AchievementWithState } from '@/composables/useAchievements'

const props = defineProps<{
  achievement: AchievementWithState
  isLatest?: boolean
}>()

const { locale } = useI18n()

const displayName = computed(() => {
  return locale.value === 'en-US'
    ? props.achievement.nameEn
    : props.achievement.name
})

const displayDescription = computed(() => {
  return locale.value === 'en-US'
    ? props.achievement.descriptionEn
    : props.achievement.description
})

// 格式化时间戳为相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp

  if (diffMs < 0) return ''

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 格式化时间戳为完整时间（用于 title tooltip）
function formatFullTime(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}
</script>

<style lang="less" scoped>
.achievement-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  padding: 20px;
  overflow: hidden;
  cursor: default;
  isolation: isolate;

  // 毛玻璃背景层
  .card-glass {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: color-mix(in srgb, var(--bg-card) 60%, transparent);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    border-radius: inherit;
    transition: background 0.4s ease, border-color 0.4s ease;
  }

  // 基础过渡
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.4s ease;

  // 锁定态
  &:not(.unlocked) {
    filter: grayscale(0.7) opacity(0.5);

    &:hover {
      filter: grayscale(0.5) opacity(0.65);
      transform: translateY(-2px);
    }
  }

  // 解锁态
  &.unlocked {
    .card-glass {
      background: color-mix(in srgb, var(--bg-card) 75%, transparent);
      border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    }

    &:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow:
        0 8px 32px var(--shadow),
        0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent),
        0 0 20px color-mix(in srgb, var(--accent) 8%, transparent);

      .card-glass {
        background: color-mix(in srgb, var(--bg-card) 85%, transparent);
        border-color: color-mix(in srgb, var(--accent) 45%, transparent);
      }

      .card-icon-wrap {
        transform: scale(1.1) rotate(-3deg);
        box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent);
      }

      .card-shine {
        animation-duration: 2.5s;
      }
    }
  }

  // 最近解锁：发光脉冲
  &.is-latest {
    animation: latest-glow 2.5s ease-in-out;

    .card-glass {
      border-color: color-mix(in srgb, var(--accent) 50%, transparent);
      box-shadow: 0 0 24px color-mix(in srgb, var(--accent) 15%, transparent);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.card-icon-wrap {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: color-mix(in srgb, var(--bg-secondary) 70%, transparent);
  font-size: 1.5rem;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.4s ease;
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
}

.card-title-group {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 auto 0;
  flex: 1;
  position: relative;
  z-index: 1;
}

.card-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.card-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 8px;
  line-height: 1.4;
  font-weight: 600;
}

.unlocked-badge {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
}

.locked-badge {
  background: color-mix(in srgb, var(--bg-secondary) 60%, transparent);
  color: var(--text-secondary);
  border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
}

.card-unlock-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  opacity: 0.8;
}

// 光泽流动覆盖层
.card-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    135deg,
    transparent 30%,
    color-mix(in srgb, var(--accent) 4%, transparent) 50%,
    transparent 70%
  );
  pointer-events: none;
  animation: shine 4s ease-in-out infinite;
  z-index: 0;
}

@keyframes shine {
  0%, 100% {
    transform: rotate(0deg) translateX(-20%);
  }
  50% {
    transform: rotate(0deg) translateX(20%);
  }
}

@keyframes latest-glow {
  0% {
    box-shadow: 0 0 0 transparent;
  }
  30% {
    box-shadow:
      0 0 30px color-mix(in srgb, var(--accent) 25%, transparent),
      0 0 60px color-mix(in srgb, #ffd700 15%, transparent);
  }
  100% {
    box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 12%, transparent);
  }
}

// 尊重系统减少动态效果（与Windows系统中的"窗口内的动画控件和元素"有冲突，全部都使用动画）
/* @media (prefers-reduced-motion: reduce) {
  .achievement-card {
    transition-duration: 0.01ms !important;

    &:hover {
      transform: none !important;
    }
  }
  .card-shine {
    animation: none;
  }
  .achievement-card.is-latest {
    animation: none;
  }
  .card-icon-wrap {
    transition-duration: 0.01ms !important;
  }
} */
</style>
