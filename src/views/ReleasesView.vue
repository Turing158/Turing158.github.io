<template>
  <div class="releases-view">
    <h1 class="page-title">{{ $t('releases.title') }}</h1>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">{{ $t('common.loading') }}</span>
    </div>

    <div v-else-if="error" class="error-container">
      <span class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <p class="error-text">{{ $t('releases.loadFailed') }}</p>
    </div>

    <div v-else class="releases-grid">
      <TransitionGroup name="release-card" tag="div" class="releases-grid-inner" appear>
        <div
          v-for="(release, index) in displayedReleases"
          :key="release.repo"
          class="release-card"
          :style="{ '--delay': index * 80 + 'ms' }"
        >
          <!-- 第一行：标题 + 版本标签 -->
          <div class="card-header">
            <span class="repo-name">{{ release.repo }}</span>
            <div class="header-tags">
              <span class="tag tag-version">{{ release.tag_name }}</span>
              <span v-if="release.prerelease" class="tag tag-prerelease">
                {{ $t('releases.prerelease') }}
              </span>
            </div>
          </div>

          <!-- 第二行：作者 + 发行于 + 时间 + 按钮 -->
          <div class="card-footer">
            <a
              :href="release.author.html_url"
              target="_blank"
              rel="noopener noreferrer"
              class="author-link"
            >
              <img
                :src="release.author.avatar_url"
                :alt="release.author.login"
                class="author-avatar"
              />
              <span class="author-name">{{ release.author.login }}</span>
            </a>
            <span class="release-time-wrap">
              <span class="release-prefix">{{ $t('releases.publishedAt') }}</span>
              <time
                class="release-time"
                :title="formatFullTime(release.published_at)"
              >
                {{ formatRelativeTime(release.published_at) }}
              </time>
            </span>
            <div class="card-actions">
              <Button
                v-if="release.assets.length > 0"
                size="small"
                @click="open(release.assets[0].browser_download_url)"
              >
                {{ $t('releases.download') }}
              </Button>
              <Button
                size="small"
                @click="goToDetail(release.repo)"
              >
                {{ $t('releases.more') }}
              </Button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Button } from 'animal-island-vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'

const router = useRouter()

interface ReleaseAsset {
  browser_download_url: string
}

interface ReleaseAuthor {
  login: string
  avatar_url: string
  html_url: string
}

interface Release {
  repo: string
  tag_name: string
  prerelease: boolean
  published_at: string
  html_url: string
  author: ReleaseAuthor
  assets: ReleaseAsset[]
}

const repos = ['StarFall-Minecraft-Launcher', 'SFMC']
const GITHUB_OWNER = 'Turing158'

const loading = ref(true)
const error = ref(false)
const releases = ref<Release[]>([])

const displayedReleases = computed(() =>
  releases.value.filter(r => r.tag_name)
)

function open(url: string) {
  window.open(url, '_blank')
}

function goToDetail(repo: string) {
  router.push(`/release/${repo}`)
}

async function fetchReleases() {
  loading.value = true
  error.value = false

  try {
    const results = await Promise.allSettled(
      repos.map(repo =>
        axios
          .get<Release[]>(
            `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/releases?per_page=1`
          )
          .then(res => {
            const data = res.data?.[0]
            if (data) {
              return {
                repo,
                tag_name: data.tag_name,
                prerelease: data.prerelease,
                published_at: data.published_at,
                html_url: data.html_url,
                author: {
                  login: data.author.login,
                  avatar_url: data.author.avatar_url,
                  html_url: data.author.html_url,
                },
                assets: (data.assets ?? []).map(a => ({
                  browser_download_url: a.browser_download_url,
                })),
              } as Release
            }
            return null
          })
      )
    )

    const successful = results
      .filter((r): r is PromiseFulfilledResult<Release | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((r): r is Release => r !== null)

    if (successful.length === 0) {
      error.value = true
    } else {
      releases.value = successful
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchReleases()
})
</script>

<style lang="less" scoped>
.releases-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: var(--text-primary);
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 0;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

// 错误状态
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
}

.error-icon {
  color: var(--text-secondary);
}

.error-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

// 卡片网格 — 一行两个，自适应
.releases-grid-inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

// 卡片
.release-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

// 第一行：标题 + 标签
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

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
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

// 第二行：作者 + 发行于 + 时间 + 按钮 — 置底对齐
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
  position: relative;
  z-index: 1;
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

// 右侧按钮组
.card-actions {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

// 入场动画
.release-card-enter-active {
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
}

.release-card-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

// 响应式：小屏一列
@media (max-width: 640px) {
  .releases-grid-inner {
    grid-template-columns: 1fr;
  }
}
</style>
