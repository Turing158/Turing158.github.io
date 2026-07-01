/**
 * AchievementsView — 成就/徽章系统导航页
 *
 * 彩蛋页面，通过 Konami Code 解锁后可从侧边栏访问。
 * 展示用户已解锁和未解锁的成就卡片网格。
 */
<template>
  <div class="achievements-view">
    <!-- 页面标题 -->
    <h1 class="page-title">{{ $t('achievements.title') }}</h1>
    <p class="page-desc">{{ $t('achievements.description') }}</p>

    <!-- 进度条 -->
    <AchievementProgress
      :unlocked="unlockedCount"
      :total="totalCount"
      :progress="progress"
    />

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="category-tab"
        :class="{ active: activeCategory === cat.key }"
        @click="activeCategory = cat.key"
      >
        <span class="tab-icon">{{ cat.icon }}</span>
        <span class="tab-label">{{ $t(cat.labelKey) }}</span>
        <span class="tab-count">{{ cat.count }}</span>
      </button>
    </div>

    <!-- 成就卡片网格 -->
    <div class="achievements-grid">
      <AchievementCard
        v-for="(ach, index) in filteredAchievements"
        :key="ach.id"
        :achievement="ach"
        :is-latest="ach.id === latestUnlocked?.id"
        :style="{ '--card-index': index }"
        :class="{ 'card-visible': cardVisible }"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="filteredAchievements.length === 0" class="empty-state">
      <span class="empty-icon">🏆</span>
      <p class="empty-text">{{ $t('achievements.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import { usePageSeo } from '@/composables/useSeo'
import AchievementCard from '@/components/achievements/AchievementCard.vue'
import AchievementProgress from '@/components/achievements/AchievementProgress.vue'
import type { AchievementCategory } from '@/data/achievements'

// SEO
usePageSeo('成就', '成就/徽章系统 — 探索所有隐藏成就', '#/achievements')

const {
  getByCategory,
  unlockedCount,
  totalCount,
  progress,
  latestUnlocked,
} = useAchievements()

// ===== 分类 =====
interface CategoryTab {
  key: AchievementCategory | 'all'
  icon: string
  labelKey: string
  count: number
}

const activeCategory = ref<AchievementCategory | 'all'>('all')

const allAchievements = computed(() => getByCategory('all'))

const categories = computed<CategoryTab[]>(() => {
  const all = allAchievements.value
  return [
    { key: 'all', icon: '🏆', labelKey: 'achievements.categories.all', count: all.length },
    { key: 'exploration', icon: '🗺️', labelKey: 'achievements.categories.exploration', count: all.filter((a) => a.category === 'exploration').length },
    { key: 'special', icon: '⭐', labelKey: 'achievements.categories.special', count: all.filter((a) => a.category === 'special').length },
    { key: 'secret', icon: '🔮', labelKey: 'achievements.categories.secret', count: all.filter((a) => a.category === 'secret').length },
  ]
})

const filteredAchievements = computed(() =>
  getByCategory(activeCategory.value)
)

// ===== 入场动画 =====
const cardVisible = ref(false)

onMounted(async () => {
  await nextTick()
  cardVisible.value = true
})
</script>

<style lang="less" scoped>
.achievements-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.page-desc {
  color: var(--text-secondary);
  margin-bottom: 32px;
  font-size: 0.95rem;
}

// ===== 分类标签 =====
.category-tabs {
  display: flex;
  gap: 8px;
  margin: 24px 0;
  flex-wrap: wrap;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.25s ease;

  &:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  &.active {
    background: var(--accent);
    color: var(--bg-card);
    border-color: var(--accent);
    font-weight: 600;
  }
}

.tab-icon {
  font-size: 1rem;
}

.tab-count {
  font-size: 0.78rem;
  opacity: 0.8;
  background: var(--bg-secondary);
  padding: 1px 7px;
  border-radius: 10px;

  .category-tab.active & {
    background: rgba(255, 255, 255, 0.2);
  }
}

// ===== 卡片网格 =====
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  // 入场动画
  > * {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition-delay: calc(var(--card-index, 0) * 60ms);
  }

  &.card-visible > .card-visible,
  > .card-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// ===== 空状态 =====
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 0.95rem;
}

// 响应式
@media (max-width: 480px) {
  .achievements-view {
    padding: 24px 16px;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
