<template>
  <!-- 文章卡片：整张卡为链接 -->
  <router-link
    v-if="result.type === 'article'"
    :to="`/article/${result.slug}`"
    class="search-card search-card--article"
    @click="props.shouldClose()"
  >
    <h3 class="card-title" v-html="highlight(result.title, query)" />
    <p class="card-desc" v-html="highlight(result.description, query)" />
    <div class="card-meta">
      <span class="card-date" :title="formatFullTime(result.date)">
        {{ formatRelativeTime(result.date) }}
      </span>
      <span v-for="tag in result.tags" :key="tag" class="tag" v-html="highlight(tag, query)" />
    </div>
    <span class="card-type-badge">{{ $t('search.typeArticle') }}</span>
  </router-link>

  <!-- 项目卡片 -->
  <div v-else-if="result.type === 'project'" class="search-card search-card--project">
    <h3 class="card-title" v-html="highlight(result.name, query)" />
    <p class="card-desc" v-html="highlight(result.description, query)" />
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
      <Button
        type="primary"
        size="small"
        @click="open(result.url)"
        @mousedown="startLongPress(result)"
        @mouseup="cancelLongPress"
        @mouseleave="cancelLongPress"
        @touchstart.prevent="startLongPress(result)"
        @touchend.prevent="cancelLongPress"
      >
        {{ $t('search.visit') }}
      </Button>
    </div>
    <span class="card-type-badge">{{ $t('search.typeProject') }}</span>
    <!-- 长按平台选择弹窗 -->
    <BlogDialog v-model="showPlatformDialog" :title="dialogTitle" :width="360" :show-close="true" :close-on-click-overlay="true">
      <div class="platform-dialog-content">
        <button class="platform-btn platform-btn--github" @click="openGithub">
          <svg class="platform-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </button>
        <button class="platform-btn platform-btn--gitee" @click="openGitee">
          <img class="platform-btn__icon" src="https://gitee.com/favicon.ico" alt="Gitee" />
          <span>Gitee</span>
        </button>
      </div>
    </BlogDialog>
  </div>

  <!-- 发行版卡片 -->
  <div v-else-if="result.type === 'release'" class="search-card search-card--release">
    <div class="card-header">
      <span class="repo-name" v-html="highlight(result.repo, query)" />
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
    <span class="card-type-badge">{{ $t('search.typeRelease') }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import BlogDialog from '@/components/common/BlogDialog.vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import { highlight } from '@/utils/search-highlighter'
import type { SearchResult } from '@/types/search'

const props = defineProps<{
  result: SearchResult
  query: string
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

// ── 长按平台选择 ──
const showPlatformDialog = ref(false)
const longPressProject = ref<{ name: string; url: string } | null>(null)
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const LONG_PRESS_DURATION = 600

onBeforeUnmount(() => {
  clearLongPressTimer()
})

function clearLongPressTimer() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function startLongPress(project: { name: string; url: string }) {
  clearLongPressTimer()
  longPressTimer.value = setTimeout(() => {
    longPressProject.value = project
    showPlatformDialog.value = true
    longPressTimer.value = null
  }, LONG_PRESS_DURATION)
}

function cancelLongPress() {
  clearLongPressTimer()
}

const dialogTitle = ref('')

watch(showPlatformDialog, (val) => {
  if (val && longPressProject.value) {
    dialogTitle.value = longPressProject.value.name
  }
})

function openGithub() {
  if (longPressProject.value) {
    open(longPressProject.value.url)
  }
  showPlatformDialog.value = false
}

function openGitee() {
  if (longPressProject.value) {
    const repoName = extractRepoName(longPressProject.value.url)
    open(`https://gitee.com/turing-ice/${repoName}`)
  }
  showPlatformDialog.value = false
}
</script>

<style lang="less" scoped>
/* ======================== */
/* 通用卡片基础样式         */
/* ======================== */
.search-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

/* 文章卡片的 link 样式重置 */
.search-card--article {
  text-decoration: none;
  color: inherit;
}

/* ======================== */
/* 标题 & 描述              */
/* ======================== */
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

/* ======================== */
/* 搜索高亮                 */
/* ======================== */
:deep(.search-highlight) {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  color: var(--accent);
  border-radius: 2px;
  padding: 0 2px;
}

/* ======================== */
/* 元信息行（文章卡片）      */
/* ======================== */
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

/* ======================== */
/* 标签徽章（文章/发行版）   */
/* ======================== */
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
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover{
    transform: scale(1.1) translateY(-1px);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    box-shadow: 0 2px 8px var(--shadow);
  }
}

/* ======================== */
/* 技术标签（项目卡片）      */
/* ======================== */
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
  cursor: default;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover{
    transform: scale(1.1) translateY(-1px);
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    box-shadow: 0 2px 8px var(--shadow);
  }
}

/* ======================== */
/* 按钮组（项目/发行版卡片） */
/* ======================== */
.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  flex-wrap: wrap;
}

/* ======================== */
/* 卡片类型标签（右下角）    */
/* ======================== */
.card-type-badge {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text-secondary);
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  line-height: 1.4;
  letter-spacing: 0.02em;
  user-select: none;
  z-index: 1;
  cursor: default;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover{
    transform: scale(1.1) translateY(-1px);
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 20%, transparent);
    box-shadow: 0 2px 8px var(--shadow);
  }
}

/* ======================== */
/* 长按平台选择弹窗         */
/* ======================== */
.platform-dialog-content {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.platform-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    object-fit: contain;
    border-radius: 3px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }

  &:active {
    transform: scale(0.96);
  }

  &--github {
    &:hover {
      background: #24292f;
      color: #fff;
      border-color: #24292f;
    }
  }

  &--gitee {
    &:hover {
      background: #c71d23;
      color: #fff;
      border-color: #c71d23;

      .platform-btn__icon {
        filter: brightness(2);
      }
    }
  }
}

/* ======================== */
/* 发行版卡片：头部         */
/* ======================== */
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

  &:hover{
    color: #fff;
    background: var(--accent);
  }
}

.tag-prerelease {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* ======================== */
/* 发行版卡片：底部         */
/* ======================== */
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
