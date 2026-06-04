<template>
  <!-- 文章卡片：整张卡为链接 -->
  <router-link
    v-if="result.type === 'article'"
    :to="`/article/${result.slug}`"
    class="search-card search-card--article"
    @click="props.shouldClose()"
  >
    <h3 class="card-title">{{ result.title }}</h3>
    <p class="card-desc">{{ result.description }}</p>
    <div class="card-meta">
      <span class="card-date" :title="formatFullTime(result.date)">
        {{ formatRelativeTime(result.date) }}
      </span>
      <span v-for="tag in result.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
  </router-link>

  <!-- 项目卡片 -->
  <div v-else-if="result.type === 'project'" class="search-card search-card--project">
    <h3 class="card-title">{{ result.name }}</h3>
    <p class="card-desc">{{ result.description }}</p>
    <div v-if="result.tech.length > 0" class="card-tech">
      <span v-for="tech in result.tech" :key="tech" class="tech-tag">{{ tech }}</span>
    </div>
    <div class="card-actions">
      <Button size="small" @click="open(`${result.url}/issues`)">
        {{ $t('search.issues') }}
      </Button>
      <Button size="small" @click="goToCommits(result.url)">
        {{ $t('search.commits') }}
      </Button>
      <Button type="primary" size="small" @click="open(result.url)">
        {{ $t('search.visit') }}
      </Button>
    </div>
  </div>

  <!-- 发行版卡片 -->
  <div v-else-if="result.type === 'release'" class="search-card search-card--release">
    <div class="card-header">
      <span class="repo-name">{{ result.repo }}</span>
      <div class="header-tags">
        <span class="tag tag-version">{{ result.tag_name }}</span>
        <span v-if="result.prerelease" class="tag tag-prerelease">
          {{ $t('search.prerelease') }}
        </span>
      </div>
    </div>
    <div class="card-footer">
      <a
        :href="result.author.html_url"
        target="_blank"
        rel="noopener noreferrer"
        class="author-link"
      >
        <img
          :src="result.author.avatar_url"
          :alt="result.author.login"
          class="author-avatar"
        />
        <span class="author-name">{{ result.author.login }}</span>
      </a>
      <span class="release-time-wrap">
        <span class="release-prefix">{{ $t('releases.publishedAt') }}</span>
        <time
          class="release-time"
          :title="formatFullTime(result.published_at)"
        >
          {{ formatRelativeTime(result.published_at) }}
        </time>
      </span>
      <div class="card-actions">
        <Button
          v-if="result.assets.length > 0"
          size="small"
          @click="open(result.assets[0].browser_download_url)"
        >
          {{ $t('search.download') }}
        </Button>
        <Button size="small" @click="goToDetail(result.repo)">
          {{ $t('search.more') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import type { SearchResult } from '@/types/search'

const props = defineProps<{
  result: SearchResult
  shouldClose: () => void
}>()

const router = useRouter()

function open(url: string) {
  window.open(url, '_blank')
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/[^/]+\/([^/?#]+)/)
  return match ? match[1] : ''
}

function goToCommits(url: string) {
  const repo = extractRepoName(url)
  if (repo) {
    props.shouldClose()
    router.push({ name: 'commits', params: { repo } })
  }
}

function goToDetail(repo: string) {
  props.shouldClose()
  router.push(`/release/${repo}`)
}
</script>

<style lang="less" scoped>
// ========================
// 通用卡片基础样式
// ========================
.search-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

// 文章卡片的 link 样式重置
.search-card--article {
  text-decoration: none;
  color: inherit;
}

// ========================
// 标题 & 描述
// ========================
.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.card-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// ========================
// 元信息行（文章卡片）
// ========================
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.card-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: default;
}

// ========================
// 标签徽章（文章 / 发行版通用）
// ========================
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

// ========================
// 技术标签（项目卡片）
// ========================
.card-tech {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tech-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

// ========================
// 按钮组（项目 / 发行版卡片）
// ========================
.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  flex-wrap: wrap;
}

// ========================
// 发行版卡片：头部
// ========================
.search-card--release {
  justify-content: space-between;
  gap: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.repo-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.header-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-version {
  background: var(--accent);
  color: #fff;
}

.tag-prerelease {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

// ========================
// 发行版卡片：底部（作者 + 时间 + 按钮）
// ========================
.card-footer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.author-link {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: var(--accent);

    .author-avatar {
      box-shadow: 0 0 0 2px var(--accent);
    }

    .author-name {
      text-decoration: underline;
    }
  }
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: box-shadow 0.2s ease;
}

.author-name {
  font-size: 0.85rem;
  white-space: nowrap;
  line-height: 24px;
}

.release-time-wrap {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.release-prefix {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  line-height: 24px;
}

.release-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  line-height: 24px;
  cursor: default;
}
</style>
