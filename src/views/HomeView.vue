<template>
  <div class="home-view">
    <div class="widgets-grid">
      <!-- Clock Widget -->
      <div class="widget clock-widget">
        <Time class="clock-time" />
        <Divider />
        <div v-if="!holidaysLoaded" class="holiday-loading">加载中...</div>
        <div v-else-if="holidaysError" class="holiday-loading">加载失败</div>
        <div v-else-if="!countdown" class="holiday-loading">今年没有更多节日了</div>
        <div v-else class="holiday-content">
          <div class="holiday-name">{{ countdown.holiday.name }}</div>
          <div v-if="countdown.isToday" class="holiday-countdown">
            <div class="holiday-today">就是今天！</div>
            <div class="holiday-greeting">{{ countdown.greeting }}</div>
          </div>
          <div v-else-if="countdown.hoursLeft !== undefined && countdown.hoursLeft > 0" class="holiday-countdown">
            <div class="holiday-urgent">还剩 {{ countdown.hoursLeft }} 小时</div>
            <div class="holiday-greeting">{{ countdown.greeting }}</div>
          </div>
          <div v-else class="holiday-countdown">
            <div class="holiday-days">还剩 {{ countdown.daysLeft }} 天</div>
          </div>
        </div>
      </div>

      <!-- Profile Widget -->
      <div class="widget profile-widget">
        <div class="profile-avatar-wrap">
          <img :src="avatarUrl" alt="avatar" class="profile-avatar" />
        </div>
        <div class="profile-name">{{ blogName }}</div>
        <div class="profile-bio">Java / C# 开发爱好者</div>
      </div>

      <!-- Commits Widget -->
      <div class="widget commits-widget">
        <div class="widget-header">
          <div class="widget-title">📦 {{ $t('home.recentCommits') }}</div>
        </div>
        <div v-if="commitsLoading" class="widget-content">{{ $t('common.loading') }}</div>
        <div v-else-if="!hasGitHubConfig" class="widget-content">请配置 GitHub 信息以显示提交记录</div>
        <div v-else-if="recentCommits.length === 0" class="widget-content">{{ $t('home.noCommits') }}</div>
        <div v-else class="commits-list">
          <a
            v-for="(commit, i) in recentCommits"
            :key="i"
            :href="commit.url"
            target="_blank"
            class="commit-card"
            :title="commit.fullMessage"
            :style="{ '--commit-index': i }"
          >
            <div class="commit-header">
              <div class="commit-repo">
                <span class="repo-icon">📁</span>
                <span class="repo-name">{{ commit.repo }}</span>
              </div>
              <div class="commit-date" :title="formatFullTime(commit.date)">
                {{ formatRelativeTime(commit.date) }}
              </div>
            </div>
            <div class="commit-msg" :title="commit.fullMessage">
              {{ commit.message }}
            </div>
            <div class="commit-footer">
              <span class="commit-hash">{{ commit.sha?.substring(0, 7) || 'unknown' }}</span>
              <span class="commit-link-icon">↗</span>
            </div>
          </a>
        </div>
      </div>

      <!-- Articles Widget -->
      <div class="widget articles-widget">
        <div class="widget-header">
          <div class="widget-title">📝 {{ $t('home.recentArticles') }}</div>
        </div>
        <div v-if="loading" class="widget-content">{{ $t('common.loading') }}</div>
        <div v-else-if="recentArticles.length === 0" class="widget-content">{{ $t('home.noArticles') }}</div>
        <div v-else class="article-list">
          <router-link
            v-for="(article, index) in recentArticles"
            :key="article.slug"
            :to="`/article/${article.slug}`"
            class="article-item"
            :style="{ '--item-index': index }"
          >
            <div class="article-content">
              <div class="article-title-row">
                <span class="article-number">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="article-title">{{ article.title }}</span>
              </div>
              <div class="article-meta">
                <span class="article-date" :title="formatFullTime(article.date)">
                  {{ formatRelativeTime(article.date) }}
                </span>
                <span v-if="article.tags && article.tags.length > 0" class="article-tag">
                  {{ article.tags[0] }}
                </span>
              </div>
            </div>
            <div class="article-arrow">→</div>
          </router-link>
          <router-link to="/articles" class="view-all">
            <span>{{ $t('home.viewAll') }}</span>
            <span class="view-all-arrow">→</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Time, Divider } from 'animal-island-vue'
import { useArticles } from '@/composables/useArticles'
import { useAppStore } from '@/stores/app'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import { useHolidays } from '@/composables/useHolidays'

const { fetchArticles, fetchRecentCommits, loading } = useArticles()
const store = useAppStore()

const blogName = 'Turing_ICE'
const avatarUrl = 'https://foruda.gitee.com/avatar/1682216074543204020/12834578_turing-ice_1682216074.png'
const hasGitHubConfig = !!(import.meta.env.VITE_GITHUB_OWNER && import.meta.env.VITE_GITHUB_REPO)

// Clock — Time 组件自带定时器，无需手动管理
const now = ref(new Date())

// Commits
const commitsLoading = ref(true)
const recentCommits = ref<any[]>([])
onMounted(async () => {
  recentCommits.value = await fetchRecentCommits()
  commitsLoading.value = false
})

// Holidays
const { loaded: holidaysLoaded, error: holidaysError, fetchHolidays, countdown } = useHolidays(() => now.value)
onMounted(() => { fetchHolidays() })

// Articles
const recentArticles = computed(() => store.articles.slice(0, 5))
onMounted(async () => {
  await fetchArticles()
})
</script>

<style lang="less" scoped>
.home-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.widget {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px var(--shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px var(--shadow);
  }
}

.widget-header {
  margin-bottom: 16px;
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

// Clock Widget
.clock-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.clock-time {
  margin: 8px auto;
}

.holiday-loading {
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: center;
}

.holiday-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.holiday-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent);
}

.holiday-countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.holiday-days {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.holiday-today {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e74c3c;
}

.holiday-urgent {
  font-size: 1rem;
  font-weight: 600;
  color: #e67e22;
}

.holiday-greeting {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

// Profile Widget
.profile-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.profile-avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 12px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.35),
      transparent
    );
    transform: skewX(-20deg);
    pointer-events: none;
  }

  &:hover::after {
    animation: avatar-shine 0.6s ease;
  }
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--accent);
  display: block;
}

@keyframes avatar-shine {
  0% { left: -100%; }
  100% { left: 150%; }
}

.profile-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.profile-bio {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

// Commits Widget
.widget-content {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.commits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.commit-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: commit-fade-in 0.5s ease forwards;
  animation-delay: calc(var(--commit-index) * 0.08s);
  opacity: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px var(--shadow);
    border-color: var(--accent);

    &::before {
      transform: scaleX(1);
    }

    .commit-link-icon {
      opacity: 1;
      transform: translate(2px, -2px);
    }

    .repo-icon {
      transform: scale(1.1) rotate(-5deg);
    }

    .commit-hash {
      background: var(--accent);
      color: #fff;
    }
  }
}

@keyframes commit-fade-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.commit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.commit-repo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.repo-icon {
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.repo-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-date {
  font-size: 0.7rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  padding: 2px 8px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.commit-msg {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 500;
}

.commit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.commit-hash {
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}

.commit-link-icon {
  font-size: 1.1rem;
  color: var(--accent);
  opacity: 0;
  transition: all 0.3s ease;
}

// Articles Widget
.article-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 12px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: article-fade-in 0.5s ease forwards;
  animation-delay: calc(var(--item-index) * 0.08s);
  opacity: 0;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    background: var(--bg-secondary);
    transform: translateX(8px);

    &::before {
      transform: scaleY(1);
    }

    .article-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    .article-number {
      color: var(--accent);
      transform: scale(1.1);
    }

    .article-title {
      color: var(--accent);
    }
  }
}

@keyframes article-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.article-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.article-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.article-number {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.article-title {
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 32px;
}

.article-date {
  color: var(--text-secondary);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.article-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.7rem;
  color: var(--accent);
  font-weight: 500;
}

.article-arrow {
  font-size: 1.2rem;
  color: var(--accent);
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
}

.view-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  border-radius: 8px;
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    background: var(--bg-secondary);
    transform: translateY(-2px);

    .view-all-arrow {
      transform: translateX(4px);
    }
  }
}

.view-all-arrow {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
