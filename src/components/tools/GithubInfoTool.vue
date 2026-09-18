<template>
  <div class="tool-form github-info">
    <div class="github-config">
      <label class="config-label" for="github-username">
        {{ $t('tools.githubInfo.username') }}
      </label>
      <div class="config-row">
        <BlogInput
          id="github-username"
          v-model="username"
          type="text"
          :placeholder="$t('tools.githubInfo.usernamePlaceholder')"
          :disabled="loading"
          @keyup.enter="fetchUser"
        >
          <template #prefix>
            <svg class="github-mark" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path :d="gitHubMarkPath" fill="currentColor" />
            </svg>
          </template>
        </BlogInput>
        <Button
          type="primary"
          size="small"
          :disabled="loading || !username.trim()"
          @click="fetchUser"
        >
          {{ loading ? $t('tools.githubInfo.loading') : $t('tools.githubInfo.query') }}
        </Button>
      </div>
    </div>

    <div v-if="queried" class="random-results github-results">
      <div class="results-header">
        <span class="results-title">{{ $t('tools.githubInfo.stats') }}</span>
        <span v-if="user" class="results-count github-count">
          {{ 'github.com/' + user.login }}
        </span>
      </div>

      <div class="results-display github-display">
        <Transition name="loader-pop" mode="out-in" appear>
          <div v-if="loading" class="github-loading cube-anim">
            <CubeLoader :text="$t('tools.githubInfo.loading')" />
          </div>

          <div v-else-if="notFound" class="empty-state">
            <svg class="github-empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="gitHubMarkPath" fill="currentColor" />
            </svg>
            <span class="empty-text">{{ $t('tools.githubInfo.notFound') }}</span>
            <Button size="small" @click="fetchUser">{{ $t('tools.githubInfo.retry') }}</Button>
          </div>
  
          <div v-else-if="error" class="empty-state">
            <svg class="github-empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="gitHubMarkPath" fill="currentColor" />
            </svg>
            <span class="empty-text">{{ $t('tools.githubInfo.loadFailed') }}</span>
            <Button size="small" @click="fetchUser">{{ $t('tools.githubInfo.retry') }}</Button>
          </div>
  
          <div v-else-if="user" class="github-profile">
            <div class="github-profile-head">
              <div class="github-avatar-wrap">
                <img
                  class="github-avatar"
                  :src="user.avatar_url"
                  :alt="user.login"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="github-profile-info">
                <span class="github-login">{{ user.login }}</span>
                <span class="github-bio">{{ user.bio || $t('tools.githubInfo.noBio') }}</span>
              </div>
            </div>
  
            <div class="github-stats">
              <div class="github-stat">
                <span class="github-stat-value">{{ formatNumber(user.public_repos) }}</span>
                <span class="github-stat-label">{{ $t('tools.githubInfo.publicRepos') }}</span>
              </div>
              <div class="github-stat">
                <span class="github-stat-value">{{ formatNumber(user.followers) }}</span>
                <span class="github-stat-label">{{ $t('tools.githubInfo.followers') }}</span>
              </div>
              <div class="github-stat">
                <span class="github-stat-value">{{ formatNumber(user.following) }}</span>
                <span class="github-stat-label">{{ $t('tools.githubInfo.following') }}</span>
              </div>
            </div>
  
            <div class="github-joined">
              <div class="github-joined-row">
                <span class="github-joined-label">{{ $t('tools.githubInfo.joinedFor') }}</span>
                <span class="github-joined-value" aria-live="off">{{ durationText }}</span>
              </div>
              <div class="github-created">
                {{ $t('tools.githubInfo.createdAt') }}: {{ formatCreated(user.created_at) }}
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import CubeLoader from '@/components/common/CubeLoader.vue'
import { Button } from 'animal-island-vue'
import BlogTip from '@/plugins/blog-tip'

const { t, locale } = useI18n()

interface GithubUser {
  login: string
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
}

interface DurationParts {
  years: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

// GitHub 官方图标路径（Simple Icons）
const gitHubMarkPath =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const username = ref('')
const user = ref<GithubUser | null>(null)
const loading = ref(false)
const error = ref(false)
const notFound = ref(false)
const queried = ref(false)
const nowTick = ref(Date.now())

let tickTimer: ReturnType<typeof setInterval> | undefined

function startTick() {
  if (tickTimer) return
  nowTick.value = Date.now()
  tickTimer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
}

function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = undefined
  }
}

onUnmounted(stopTick)

// 按日历周年拆分：整年从注册日的相应周年日起算，其余按剩余天/时/分/秒
function getJoinedParts(createdAt: string, now: number): DurationParts {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) {
    return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const nowDate = new Date(now)
  let years = nowDate.getFullYear() - created.getFullYear()
  const anniversary = new Date(created)
  anniversary.setFullYear(created.getFullYear() + years)
  if (anniversary.getTime() > nowDate.getTime()) {
    years = Math.max(0, years - 1)
    anniversary.setTime(created.getTime())
    anniversary.setFullYear(created.getFullYear() + years)
  }
  const diffMs = Math.max(0, nowDate.getTime() - anniversary.getTime())
  return {
    years,
    days: Math.floor(diffMs / 86400000),
    hours: Math.floor((diffMs % 86400000) / 3600000),
    minutes: Math.floor((diffMs % 3600000) / 60000),
    seconds: Math.floor((diffMs % 60000) / 1000),
  }
}

const durationText = computed(() => {
  if (!user.value) return ''
  const parts = getJoinedParts(user.value.created_at, nowTick.value)
  return [
    `${parts.years} ${t('tools.githubInfo.year')}`,
    `${parts.days} ${t('tools.githubInfo.day')}`,
    `${String(parts.hours).padStart(2, '0')} ${t('tools.githubInfo.hour')}`,
    `${String(parts.minutes).padStart(2, '0')} ${t('tools.githubInfo.minute')}`,
    `${String(parts.seconds).padStart(2, '0')} ${t('tools.githubInfo.second')}`,
  ].join(' ')
})

function formatNumber(n: number): string {
  return n.toLocaleString(locale.value)
}

function formatCreated(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchUser() {
  queried.value = true
  const name = username.value.trim()
  if (!name) return
  loading.value = true
  error.value = false
  notFound.value = false
  stopTick()
  user.value = null
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`)
    if (res.status === 404) {
      notFound.value = true
      return
    }
    if (!res.ok) throw new Error()
    const data = (await res.json()) as GithubUser
    user.value = data
    nowTick.value = Date.now()
    startTick()
  } catch {
    error.value = true
    BlogTip.show(t('tools.githubInfo.loadFailed'), { type: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.github-info {
  gap: 16px;
}

.github-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-secondary);
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
}

.config-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.config-row .blog-input {
  flex: 1;
  min-width: 180px;
}

.config-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.github-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.github-count {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.github-display {
  min-height: 100px;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  padding: 14px;
  background: var(--bg-card);
}

.github-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 22px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.github-empty-icon {
  width: 40px;
  height: 40px;
  color: var(--border);
}

.github-profile {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.github-profile-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.github-avatar-wrap {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  /* 1 个像素网格单位 = 64px / 16 = 4px，环宽即 1 单位 */
  padding: 4px;
  background-color: var(--border);
  clip-path: var(--pxc-circle);
}

.github-avatar {
  width: 100%;
  height: 100%;
  display: block;
  clip-path: var(--pxc-circle-in);
}

.github-profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.github-login {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  word-break: break-all;
}

.github-bio {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.github-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.github-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  text-align: center;
}

.github-stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.github-stat-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.github-joined {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
}

.github-joined-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.github-joined-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.github-joined-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.github-created {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

@media (max-width: 420px) {
  .github-stats {
    grid-template-columns: 1fr;
  }
}
</style>
