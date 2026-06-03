<template>
  <div class="release-detail-view">
    <!-- 顶部按钮行 -->
    <div class="header-actions">
      <!-- 返回按钮 -->
      <Button type="primary" class="back-button" @click="goBack">
        <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </Button>

      <div class="actions-right">
        <!-- 前往按钮 -->
        <Button size="small" @click="openProject">
          {{ $t('pageReleases.visitProject') }}
        </Button>
        <!-- 更多按钮 -->
        <Button size="small" @click="openReleases">
          {{ $t('pageReleases.more') }}
        </Button>
      </div>
    </div>

    <!-- 项目名称 -->
    <h1 class="page-title">{{ repoName }}</h1>

    <!-- 分割线 -->
    <div class="divider">
      <div class="divider-line"></div>
      <div class="divider-dot"></div>
      <div class="divider-line"></div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="status-wrap loading-text">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
      <span>{{ $t('pageReleases.loading') }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="status-wrap status-error">
      <span>{{ $t('pageReleases.loadFailed') }}</span>
      <Button size="small" @click="fetchReleases">{{ $t('pageReleases.retry') }}</Button>
    </div>

    <!-- 发行版本列表 -->
    <div v-else class="releases-list">
      <div
        v-for="(release, index) in releases"
        :key="release.id"
        class="release-card"
        :style="{ '--delay': index * 80 + 'ms' }"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <h2 class="release-title">{{ release.tag_name }}</h2>
            <span v-if="release.prerelease" class="tag tag-prerelease">
              {{ $t('pageReleases.prerelease') }}
            </span>
          </div>
          <time
            class="release-date"
            :datetime="release.published_at"
            :title="formatFullTime(release.published_at)"
          >
            {{ formatRelativeTime(release.published_at) }}
          </time>
        </div>

        <!-- 分割线 -->
        <div class="card-divider"></div>

        <!-- 发行内容 -->
        <div
          v-if="release.body"
          class="release-body"
          v-html="renderMarkdown(release.body)"
          @click="onBodyClick"
        ></div>

        <!-- 资源列表 -->
        <div v-if="release.assets && release.assets.length > 0" class="release-assets">
          <h3 class="assets-title">{{ $t('pageReleases.assets') }}</h3>
          <div class="assets-list">
            <a
              v-for="asset in release.assets"
              :key="asset.id"
              :href="asset.browser_download_url"
              target="_blank"
              rel="noopener noreferrer"
              class="asset-item"
              :download="asset.name"
            >
              <div class="asset-left">
                <svg class="asset-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span class="asset-name">{{ asset.name }}</span>
                <time
                  v-if="asset.updated_at"
                  class="asset-time"
                  :datetime="asset.updated_at"
                  :title="formatFullTime(asset.updated_at)"
                >
                  {{ formatRelativeTime(asset.updated_at) }}
                </time>
              </div>
              <div class="asset-right">
                <span v-if="asset.download_count !== undefined" class="asset-badge">
                  <svg class="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {{ formatNumber(asset.download_count) }}
                </span>
                <span class="asset-badge">
                  <svg class="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {{ formatFileSize(asset.size) }}
                </span>
                <svg class="asset-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </a>
          </div>
        </div>

        <!-- Reactions 反应 -->
        <template v-if="formatReactions(release.reactions).length > 0">
          <div class="card-divider"></div>
          <div class="release-reactions">
            <span
              v-for="reaction in formatReactions(release.reactions)"
              :key="reaction.key"
              class="reaction-item"
            >
              <span class="reaction-emoji">{{ reaction.emoji }}</span>
              <span class="reaction-count">{{ formatNumber(reaction.count) }}</span>
            </span>
          </div>
        </template>
      </div>

      <!-- 更多发行版本按钮 -->
      <div class="more-releases">
        <Button size="large" @click="openReleases">
          {{ $t('pageReleases.moreReleases') }}
          <svg class="external-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import MarkdownIt from 'markdown-it'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'

const router = useRouter()
const GITHUB_OWNER = 'Turing158'

const props = defineProps<{ repo: string }>()

interface ReleaseAsset {
  id: number
  name: string
  size: number
  download_count: number
  updated_at: string
  browser_download_url: string
}

interface Reactions {
  url: string
  total_count: number
  '+1': number
  '-1': number
  laugh: number
  hooray: number
  confused: number
  heart: number
  rocket: number
  eyes: number
}

interface Release {
  id: number
  tag_name: string
  prerelease: boolean
  published_at: string
  body: string | null
  html_url: string
  assets: ReleaseAsset[]
  reactions?: Reactions
}

const loading = ref(false)
const error = ref(false)
const releases = ref<Release[]>([])

const repoName = computed(() => props.repo || 'Unknown')

// Markdown 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// 标题文本转锚点 slug：保留字母/数字/下划线/中文，去除空格与符号（与 GitHub release 锚点格式一致）
function slugify(text: string): string {
  return text.trim().replace(/[^\w一-龥]+/g, '')
}

// 给标题加上 id，使锚点链接可定位
md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const inline = tokens[idx + 1]
  if (inline && inline.type === 'inline') {
    tokens[idx].attrSet('id', slugify(inline.content))
  }
  return self.renderToken(tokens, idx, options)
}

function renderMarkdown(content: string): string {
  return md.render(content)
}

// 拦截发行内容内的锚点链接点击，滚动到对应标题（限定在同一张卡片内）
function onBodyClick(e: MouseEvent) {
  const anchor = (e.target as HTMLElement).closest('a')
  if (!anchor) return
  const href = anchor.getAttribute('href')
  if (!href || !href.startsWith('#')) return

  e.preventDefault()
  const id = decodeURIComponent(href.slice(1))
  const card = anchor.closest('.release-card')
  const target = card?.querySelector(`[id="${CSS.escape(id)}"]`) as HTMLElement | null
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// reactions 键名到 Emoji 的映射
const REACTION_EMOJI: Record<string, string> = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
}

// 格式化 reactions 数据：返回有数量的项（emoji + count）
function formatReactions(reactions?: Reactions): { key: string; emoji: string; count: number }[] {
  if (!reactions) return []
  return Object.keys(REACTION_EMOJI)
    .map((key) => ({
      key,
      emoji: REACTION_EMOJI[key],
      count: (reactions[key as keyof Reactions] as number) || 0,
    }))
    .filter((item) => item.count > 0)
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 导航函数
const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/releases')
  }
}

function openProject() {
  window.open(`https://github.com/${GITHUB_OWNER}/${repoName.value}`, '_blank')
}

function openReleases() {
  window.open(`https://github.com/${GITHUB_OWNER}/${repoName.value}/releases`, '_blank')
}

// 获取发行版本数据
async function fetchReleases() {
  loading.value = true
  error.value = false

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${repoName.value}/releases?per_page=10`
    )
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    releases.value = (await res.json()) as Release[]
  } catch {
    error.value = true
    releases.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchReleases)
</script>

<style lang="less" scoped>
.release-detail-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

// 顶部按钮行
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;

  .back-icon {
    transition: transform 0.2s ease;
  }

  &:hover .back-icon {
    transform: translateX(-3px);
  }
}

.actions-right {
  display: flex;
  gap: 10px;
}

// 项目名称
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 24px;
}

// 自定义分割线
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--border) 20%,
    var(--border) 80%,
    transparent
  );
}

.divider-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  flex-shrink: 0;
}

// 状态显示
.status-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 0;
  color: var(--text-secondary);
}

.loading-text {
  .loading-dots {
    display: flex;
    gap: 8px;
  }

  .loading-dot {
    width: 10px;
    height: 10px;
    background: var(--accent);
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.status-error {
  flex-direction: row;
}

// 发行版本列表
.releases-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 发行卡片
.release-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: card-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  animation-delay: var(--delay, 0ms);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.release-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tag-prerelease {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.release-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

// 卡片内部分割线
.card-divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0;
}

// 发行内容（Markdown 渲染）
.release-body {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-primary);

  :deep(p) {
    margin: 0 0 12px;
    &:last-child { margin-bottom: 0; }
  }

  :deep(a) {
    color: var(--accent);
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  :deep(code) {
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 0.875em;
  }

  :deep(pre) {
    background: var(--bg-secondary);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(ul), :deep(ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 16px 0 8px;
    font-weight: 600;
  }

  :deep(blockquote) {
    border-left: 4px solid var(--accent);
    margin: 12px 0;
    padding: 8px 16px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }
}

// 资源列表
.release-assets {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.assets-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// 资源条目（整行可点击）
.asset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid transparent;
  border-radius: 10px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-card);
    border-color: var(--accent);
    transform: translateX(4px);

    .asset-arrow {
      opacity: 1;
      transform: translateX(4px);
    }
  }
}

.asset-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.asset-icon {
  flex-shrink: 0;
  color: var(--accent);
}

.asset-name {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.asset-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.asset-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.asset-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border-radius: 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;

  .badge-icon {
    opacity: 0.7;
  }
}

.asset-arrow {
  flex-shrink: 0;
  color: var(--text-secondary);
  opacity: 0.5;
  transition: all 0.2s ease;
}

// Reactions 反应
.release-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reaction-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 0.85rem;
  line-height: 1;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
}

.reaction-emoji {
  font-size: 1rem;
}

.reaction-count {
  color: var(--text-secondary);
  font-weight: 600;
}

// 更多发行版本按钮
.more-releases {
  display: flex;
  justify-content: center;
  padding: 24px 0;

  .external-icon {
    margin-left: 6px;
    opacity: 0.8;
  }
}

// 响应式
@media (max-width: 768px) {
  .release-detail-view {
    padding: 20px 12px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .release-card {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .asset-item {
    padding: 12px;
  }

  .asset-right {
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .asset-arrow {
    display: none;
  }
}
</style>