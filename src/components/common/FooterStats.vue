<template>
  <footer class="footer-stats">
    <div class="stats-container">
      <div class="stats-grid">
        <!-- 运行天数 -->
        <div class="stat-item">
          <span class="stat-icon">📅</span>
          <span class="stat-value">{{ animatedDays }}</span>
          <span class="stat-label">{{ $t('footerStats.runningDays') }}</span>
        </div>

        <!-- 文章数量 -->
        <div class="stat-item">
          <span class="stat-icon">📝</span>
          <span class="stat-value">{{ animatedArticles }}</span>
          <span class="stat-label">{{ $t('footerStats.articles') }}</span>
        </div>

        <!-- 总字数 -->
        <div class="stat-item">
          <span class="stat-icon">✍️</span>
          <span class="stat-value">{{ formatWords(animatedWords) }}</span>
          <span class="stat-label">{{ $t('footerStats.words') }}</span>
        </div>

        <!-- 浏览量 -->
        <div class="stat-item">
          <span class="stat-icon">👀</span>
          <span class="stat-value">{{ formatViews(animatedViews) }}</span>
          <span class="stat-label">{{ $t('footerStats.views') }}</span>
        </div>

        <!-- 分隔装饰 -->
        <div class="stat-divider" aria-hidden="true"></div>

        <!-- 趣味统计 -->
        <div class="stat-item stat-fun">
          <span class="stat-icon">☕</span>
          <span class="stat-value">{{ coffeeCups }}</span>
          <span class="stat-label">{{ $t('footerStats.coffee') }}</span>
        </div>

        <div class="stat-item stat-fun">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ bookHeight }}</span>
          <span class="stat-label">{{ $t('footerStats.bookHeight') }}</span>
        </div>

        <div class="stat-item stat-fun">
          <span class="stat-icon">🏃</span>
          <span class="stat-value">{{ playgroundLaps }}</span>
          <span class="stat-label">{{ $t('footerStats.laps') }}</span>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="footer-copy">
        <span>{{ $t('footerStats.copyright', { year: currentYear }) }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFooterStats } from '@/composables/useFooterStats'

const {
  runningDays,
  articleCount,
  totalWords,
  totalViews,
  coffeeCups,
  playgroundLaps,
  bookHeight,
} = useFooterStats()

const currentYear = new Date().getFullYear()

// 动画数字
const animatedDays = ref(0)
const animatedArticles = ref(0)
const animatedWords = ref(0)
const animatedViews = ref(0)

// 数字动画工具函数
function animateNumber(
  target: number,
  setter: (v: number) => void,
  duration = 1500
) {
  const start = performance.now()
  const from = 0

  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // easeOutCubic
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = Math.round(from + (target - from) * eased)
    setter(current)
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }

  requestAnimationFrame(tick)
}

// 格式化数字显示
function formatWords(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + 'w'
  }
  return n.toLocaleString()
}

function formatViews(n: number): string {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + 'w'
  }
  return n.toLocaleString()
}

onMounted(() => {
  // 等待数据加载后执行动画
  let unwatch: (() => void) | undefined
  unwatch = watch(
    [runningDays, articleCount, totalWords, totalViews],
    ([days, articles, words, views]) => {
      if (days > 0 || articles > 0) {
        animateNumber(days, (v) => (animatedDays.value = v))
        animateNumber(articles, (v) => (animatedArticles.value = v))
        animateNumber(words, (v) => (animatedWords.value = v))
        animateNumber(views, (v) => (animatedViews.value = v))
        unwatch?.()
      }
    },
    { immediate: true }
  )
})
</script>

<style lang="less" scoped>
.footer-stats {
  margin-top: 48px;
  padding: 24px 16px 16px;
  border-top: 1px solid var(--border);
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--bg-secondary) 100%
  );
}

.stats-container {
  max-width: 900px;
  margin: 0 auto;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 12px 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  min-width: 72px;
  border-radius: 10px;
  transition: background 0.25s ease, transform 0.25s ease;

  &:hover {
    background: var(--bg-card-hover);
    transform: translateY(-2px);

    .stat-icon {
      transform: scale(1.2) rotate(-5deg);
    }

    .stat-value {
      color: var(--accent);
    }
  }
}

.stat-icon {
  font-size: 1.2rem;
  line-height: 1;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  transition: color 0.25s ease;
  line-height: 1.3;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: linear-gradient(
    180deg,
    transparent,
    var(--border-strong),
    transparent
  );
}

// 趣味统计项稍微不同样式
.stat-fun {
  .stat-value {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  &:hover .stat-value {
    color: var(--accent);
  }
}

.footer-copy {
  margin-top: 16px;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

// 响应式
@media (max-width: 640px) {
  .stats-grid {
    gap: 8px 16px;
  }

  .stat-item {
    min-width: 60px;
    padding: 6px 8px;
  }

  .stat-icon {
    font-size: 1rem;
  }

  .stat-value {
    font-size: 0.95rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .stat-divider {
    display: none;
  }

  .stat-fun {
    display: none;
  }
}
</style>
