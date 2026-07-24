<template>
  <div class="home-view">
    <div class="widgets-grid">
      <!-- Clock Widget -->
      <div class="widget clock-widget">
        <ResponsiveTime class="clock-time" />
        <Divider />
        <div v-if="!holidaysLoaded" class="holiday-loading loading-text">
          <span class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </span>
          {{ $t('home.loading') }}
        </div>
        <div v-else-if="holidaysError" class="holiday-loading">{{ $t('home.loadFailed') }}</div>
        <div v-else-if="!countdown" class="holiday-loading">{{ $t('home.holidayNoMore') }}</div>
        <div v-else class="holiday-content">
          <div class="holiday-name">{{ countdown.holiday.name }}</div>
          <div v-if="countdown.isToday" class="holiday-countdown">
            <div class="holiday-today">{{ $t('home.holidayToday') }}</div>
            <div class="holiday-greeting">{{ countdown.greeting }}</div>
          </div>
          <div v-else-if="countdown.hoursLeft !== undefined && countdown.hoursLeft > 0" class="holiday-countdown">
            <div class="holiday-urgent">{{ $t('home.hoursLeft', { n: countdown.hoursLeft }) }}</div>
            <div class="holiday-greeting">{{ countdown.greeting }}</div>
          </div>
          <div v-else class="holiday-countdown">
            <div class="holiday-days">{{ $t('home.daysLeft', { n: countdown.daysLeft }) }}</div>
          </div>
        </div>
      </div>

      <!-- Profile Widget -->
      <div class="widget profile-widget">
        <div class="profile-avatar-wrap">
          <img :src="avatarUrl" alt="avatar" class="profile-avatar" @click="onAvatarClick" />
        </div>
        <div class="profile-name typewriter">
          <span class="typewriter-text">{{ blogName }}</span>
          <span v-if="showBlogCursor" class="typewriter-cursor"></span>
        </div>
        <div class="profile-bio">{{ profileBio }}</div>
        <div v-if="profile?.location" class="profile-location">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
            />
          </svg>
          <span>{{ profile.location }}</span>
        </div>
        <div v-if="profile" class="profile-stats">
          <a
            class="profile-stat"
            :href="`${githubProfileUrl}?tab=repositories`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.public_repos }}</span>
            <span class="stat-label">{{ $t('home.repos') }}</span>
          </a>
          <a
            class="profile-stat"
            :href="`${githubProfileUrl}?tab=followers`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.followers }}</span>
            <span class="stat-label">{{ $t('home.followers') }}</span>
          </a>
          <a
            class="profile-stat"
            :href="`${githubProfileUrl}?tab=following`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.following }}</span>
            <span class="stat-label">{{ $t('home.following') }}</span>
          </a>
        </div>
      </div>

      <!-- Commits Widget -->
      <div class="widget commits-widget">
        <div class="widget-header">
          <div class="widget-title">📦 {{ $t('home.recentCommits') }}</div>
        </div>
        <div v-if="commitsLoading" class="widget-content loading-text">
          <span class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </span>
          {{ $t('common.loading') }}
        </div>
        <div v-else-if="!hasGitHubConfig" class="widget-content">{{ $t('home.githubNotConfigured') }}</div>
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
        <div v-if="loading" class="widget-content loading-text">
          <span class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </span>
          {{ $t('common.loading') }}
        </div>
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

      <!-- Gramophone Widget (Comments) -->
      <div class="widget gramophone-widget">
        <div class="widget-header">
          <div class="widget-title">🎵 {{ $t('home.gramophone') }}</div>
        </div>
        <div class="gramophone-content">
          <div id="gitalk-container-home" class="gitalk-container"></div>
        </div>
      </div>

      <!-- Gitee Activity Widget -->
      <div class="widget activity-widget">
        <div class="widget-header">
          <div class="widget-title">🦊 {{ $t('home.recentGiteeActivity') }}</div>
        </div>
        <div v-if="giteeLoading" class="widget-content loading-text">
          <span class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </span>
          {{ $t('common.loading') }}
        </div>
        <div v-else-if="giteeError" class="widget-content">{{ $t('home.loadFailed') }}</div>
        <div v-else-if="giteeActivities.length === 0" class="widget-content">{{ $t('home.noGiteeActivity') }}</div>
        <div v-else class="activity-list">
          <a
            v-for="(act, i) in giteeActivities"
            :key="act.id"
            :href="act.url"
            target="_blank"
            rel="noopener"
            class="activity-item gitee-item"
            :style="{ '--activity-index': i }"
          >
            <div class="activity-icon">{{ act.icon }}</div>
            <div class="activity-body">
              <div class="activity-text">
                <span class="activity-action">{{ act.action }}</span>
                <span class="activity-repo">{{ act.repo }}</span>
              </div>
              <div class="activity-time" :title="formatFullTime(act.date)">
                {{ formatRelativeTime(act.date) }}
              </div>
            </div>
            <div class="activity-arrow">↗</div>
          </a>
          <a
            :href="giteeProfileUrl"
            target="_blank"
            rel="noopener"
            class="view-all"
          >
            <span>{{ $t('home.viewMoreGiteeActivity') }}</span>
            <span class="view-all-arrow">→</span>
          </a>
        </div>
      </div>

      <!-- GitHub Activity Widget -->
      <div class="widget activity-widget">
        <div class="widget-header">
          <div class="widget-title">📊 {{ $t('home.recentActivity') }}</div>
        </div>
        <div v-if="activityLoading" class="widget-content loading-text">
          <span class="loading-dots">
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
            <div class="loading-dot"></div>
          </span>
          {{ $t('common.loading') }}
        </div>
        <div v-else-if="activityError" class="widget-content">{{ $t('home.loadFailed') }}</div>
        <div v-else-if="activities.length === 0" class="widget-content">{{ $t('home.noActivity') }}</div>
        <div v-else class="activity-list">
          <a
            v-for="(act, i) in activities"
            :key="act.id"
            :href="act.url"
            target="_blank"
            rel="noopener"
            class="activity-item"
            :style="{ '--activity-index': i }"
          >
            <div class="activity-icon" :class="`type-${act.type}`">{{ act.icon }}</div>
            <div class="activity-body">
              <div class="activity-text">
                <span class="activity-action">{{ act.action }}</span>
                <span class="activity-repo">{{ act.repo }}</span>
              </div>
              <div class="activity-time" :title="formatFullTime(act.date)">
                {{ formatRelativeTime(act.date) }}
              </div>
            </div>
            <div class="activity-arrow">↗</div>
          </a>
          <a
            :href="githubProfileUrl"
            target="_blank"
            rel="noopener"
            class="view-all"
          >
            <span>{{ $t('home.viewMoreActivity') }}</span>
            <span class="view-all-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Divider } from 'animal-island-vue'
import ResponsiveTime from '@/components/common/ResponsiveTime.vue'
import { useArticles } from '@/composables/useArticles'
import { usePageSeo } from '@/composables/useSeo'
import { useAppStore } from '@/stores/app'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import { useHolidays } from '@/composables/useHolidays'
import { useGitalk } from '@/composables/useGitalk'
import { config } from '@/config'
import BlogTip from '@/plugins/blog-tip'
import { useAchievements } from '@/composables/useAchievements'
import { useTypewriter } from '@/composables/useTypewriter'
import '@/styles/gitalk-theme.css'

// SEO
usePageSeo(
  computed(() => config.blog.title),
  'Turing_ICE 的个人博客，分享技术文章、开发工具和学习笔记',
  '#/'
)

const { fetchArticles, fetchRecentCommits, loading } = useArticles()
const store = useAppStore()
const { t, locale } = useI18n()

// Gramophone (Gitalk Comments)
const { init: initGitalk } = useGitalk('gitalk-container-home', 'home-comments', '留声机评论')
const gramophoneInitialized = ref(false)

const fullBlogName = config.blog.title
const { displayedText: blogName, showCursor: showBlogCursor } = useTypewriter(fullBlogName, 120, 60, 2000, 800)
const avatarUrl = 'https://foruda.gitee.com/avatar/1682216074543204020/12834578_turing-ice_1682216074.png'
const hasGitHubConfig = !!(config.github.owner && config.github.repo)
const githubUser = config.github.owner
const githubProfileUrl = `https://github.com/${githubUser}`
const giteeUser = config.gitee.owner
const giteeProfileUrl = `https://gitee.com/${giteeUser}`

// Avatar click easter egg — count 10 clicks to trigger warning
const avatarClickCount = ref(0)
let avatarClickTimer: ReturnType<typeof setTimeout> | null = null

function onAvatarClick() {
  avatarClickCount.value++
  if (avatarClickTimer) {
    clearTimeout(avatarClickTimer)
  }
  avatarClickTimer = setTimeout(() => {
    avatarClickCount.value = 0
  }, 3000)

  if (avatarClickCount.value >= 10) {
    avatarClickCount.value = 0
    if (avatarClickTimer) {
      clearTimeout(avatarClickTimer)
      avatarClickTimer = null
    }
    BlogTip.show('不要到處亂摸咯！', { type: 'warning', duration: 3000 })
    useAchievements().unlock('speed-demon')
  }
}

// GitHub Profile
interface GitHubProfile {
  public_repos: number
  followers: number
  following: number
  bio: string | null
  location: string | null
}
const profile = ref<GitHubProfile | null>(null)
const profileBio = computed(() => profile.value?.bio || t('home.profileBio'))
onMounted(async () => {
  try {
    const res = await fetch(`https://api.github.com/users/${githubUser}`)
    if (!res.ok) return
    const data = await res.json()
    profile.value = {
      public_repos: data.public_repos ?? 0,
      followers: data.followers ?? 0,
      following: data.following ?? 0,
      bio: data.bio ?? null,
      location: data.location ?? null,
    }
  } catch {
    // 静默失败，回退到默认简介
  }
})

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

// GitHub Activity Events
interface ActivityItem {
  id: string
  type: string
  icon: string
  action: string
  repo: string
  url: string
  date: string
}
const activities = ref<ActivityItem[]>([])
const activityLoading = ref(true)
const activityError = ref(false)

function mapEvent(ev: any): ActivityItem | null {
  if (!ev || !ev.type || !ev.repo?.name) return null
  const repo = ev.repo.name
  const repoUrl = `https://github.com/${repo}`
  const payload = ev.payload || {}
  let icon = '📊'
  let action = ''
  let url = repoUrl

  switch (ev.type) {
    case 'PushEvent': {
      const n = payload.distinct_size ?? payload.size ?? payload.commits?.length ?? 0
      const ref = (payload.ref || '').replace(/^refs\/heads\//, '') || 'main'
      icon = '🚀'
      if (n > 1) action = t('home.activity.push', { n, ref })
      else if (n === 1) action = t('home.activity.pushOne', { ref })
      else action = t('home.activity.pushEmpty', { ref })
      const sha = payload.commits?.[payload.commits.length - 1]?.sha
      url = sha ? `${repoUrl}/commit/${sha}` : `${repoUrl}/commits/${ref}`
      break
    }
    case 'CreateEvent': {
      icon = '🌱'
      const refType = payload.ref_type
      if (refType === 'repository') {
        action = t('home.activity.createRepo')
      } else if (refType === 'branch') {
        action = t('home.activity.createBranch', { ref: payload.ref })
        url = `${repoUrl}/tree/${payload.ref}`
      } else if (refType === 'tag') {
        action = t('home.activity.createTag', { ref: payload.ref })
        url = `${repoUrl}/releases/tag/${payload.ref}`
      } else {
        action = t('home.activity.other')
      }
      break
    }
    case 'DeleteEvent': {
      icon = '🗑️'
      action = t('home.activity.delete', { refType: payload.ref_type, ref: payload.ref })
      break
    }
    case 'PullRequestEvent': {
      icon = '🔀'
      const n = payload.number || payload.pull_request?.number
      const merged = payload.pull_request?.merged
      const act = payload.action
      if (merged) action = t('home.activity.prMerged', { n })
      else if (act === 'closed') action = t('home.activity.prClosed', { n })
      else if (act === 'reopened') action = t('home.activity.prReopened', { n })
      else action = t('home.activity.prOpened', { n })
      url = payload.pull_request?.html_url || `${repoUrl}/pull/${n}`
      break
    }
    case 'IssuesEvent': {
      icon = '🐛'
      const n = payload.issue?.number
      const act = payload.action
      if (act === 'closed') action = t('home.activity.issueClosed', { n })
      else if (act === 'reopened') action = t('home.activity.issueReopened', { n })
      else action = t('home.activity.issueOpened', { n })
      url = payload.issue?.html_url || `${repoUrl}/issues/${n}`
      break
    }
    case 'IssueCommentEvent': {
      icon = '💬'
      const n = payload.issue?.number
      action = t('home.activity.issueComment', { n })
      url = payload.comment?.html_url || `${repoUrl}/issues/${n}`
      break
    }
    case 'WatchEvent':
      icon = '⭐'
      action = t('home.activity.watch')
      break
    case 'ForkEvent':
      icon = '🍴'
      action = t('home.activity.fork')
      url = payload.forkee?.html_url || repoUrl
      break
    case 'ReleaseEvent': {
      icon = '🎉'
      const tag = payload.release?.tag_name || payload.release?.name
      action = tag
        ? t('home.activity.release', { tag })
        : t('home.activity.releaseNoTag')
      url = payload.release?.html_url || `${repoUrl}/releases`
      break
    }
    case 'PublicEvent':
      icon = '🌐'
      action = t('home.activity.publicRepo')
      break
    case 'MemberEvent':
      icon = '👥'
      action = t('home.activity.member')
      break
    default:
      action = t('home.activity.other')
  }

  return {
    id: ev.id,
    type: ev.type.replace('Event', '').toLowerCase(),
    icon,
    action,
    repo,
    url,
    date: ev.created_at,
  }
}

// 重新翻译活动数据
function retranslateActivities() {
  activities.value = activities.value.map(act => {
    // 从原始数据重新翻译
    const rawEvent = rawGitHubEvents.value.find(ev => ev.id === act.id)
    if (rawEvent) {
      const newAct = mapEvent(rawEvent)
      if (newAct) {
        return newAct
      }
    }
    return act
  })
}

// 存储原始 GitHub 事件数据
const rawGitHubEvents = ref<any[]>([])

onMounted(async () => {
  try {
    const res = await fetch(`https://api.github.com/users/${githubUser}/events?per_page=10`)
    if (!res.ok) {
      activityError.value = true
      return
    }
    const data = await res.json()
    rawGitHubEvents.value = Array.isArray(data) ? data : []
    activities.value = rawGitHubEvents.value
      .map(mapEvent)
      .filter((x): x is ActivityItem => x !== null)
      .slice(0, 10)
  } catch {
    activityError.value = true
  } finally {
    activityLoading.value = false
  }
})

// 监听语言变化，重新翻译
watch(locale, () => {
  retranslateActivities()
  retranslateGiteeActivities()
})

// Gitee Activity Events
const giteeActivities = ref<ActivityItem[]>([])
const giteeLoading = ref(true)
const giteeError = ref(false)

function mapGiteeEvent(ev: any): ActivityItem | null {
  if (!ev || !ev.action) return null

  const projectName = ev.project?.name_with_namespace || ev.title || ''
  const projectPath = ev.project?.path || ''
  let icon = '📊'
  let action = ''
  let repo = projectName
  let url = projectPath ? `https://gitee.com${projectPath}` : giteeProfileUrl

  switch (ev.action) {
    case 'push': {
      const n = ev.commit_count || ev.commits?.length || 0
      const ref = ev.short_ref_name || ev.ref_name || 'main'
      icon = '🚀'
      action = n === 1
        ? t('home.giteeActivity.pushOne', { ref })
        : t('home.giteeActivity.push', { n, ref })
      if (ev.project_compare_path) url = `https://gitee.com${ev.project_compare_path}`
      else if (ev.project_tree_path) url = `https://gitee.com${ev.project_tree_path}`
      break
    }
    case 'created':
    case 'create_project':
    case 'transfer':
      icon = '🌱'
      action = t('home.giteeActivity.created')
      break
    case 'destroyed':
      icon = '🗑️'
      action = t('home.giteeActivity.destroyed')
      repo = ev.title || projectName
      url = giteeProfileUrl
      break
    case 'left':
      icon = '👋'
      action = t('home.giteeActivity.left')
      repo = ev.title || projectName
      url = giteeProfileUrl
      break
    case 'joined':
      icon = '🤝'
      action = t('home.giteeActivity.joined')
      repo = ev.title || projectName
      break
    case 'followed': {
      icon = '👤'
      const m = ev.content?.match(/href="(\/[^"]+)"[^>]*>([^<]+)</)
      const name = m?.[2] || ''
      const path = m?.[1] || ''
      action = `${t('home.giteeActivity.followed')} ·`
      repo = name ? `@${name}` : ''
      url = path ? `https://gitee.com${path}` : url
      break
    }
    case 'starred':
    case 'star':
      icon = '⭐'
      action = t('home.giteeActivity.starred')
      break
    case 'forked':
    case 'fork':
      icon = '🍴'
      action = t('home.giteeActivity.forked')
      break
    case 'merge_requested':
    case 'merge_request_opened':
    case 'opened_mr': {
      icon = '🔀'
      const n = ev.iid || ev.target?.iid || ''
      action = t('home.giteeActivity.mrOpened', { n })
      break
    }
    case 'merge_request_closed':
    case 'closed_mr': {
      icon = '🔀'
      const n = ev.iid || ev.target?.iid || ''
      action = t('home.giteeActivity.mrClosed', { n })
      break
    }
    case 'merge_request_merged':
    case 'merged_mr': {
      icon = '🔀'
      const n = ev.iid || ev.target?.iid || ''
      action = t('home.giteeActivity.mrMerged', { n })
      break
    }
    case 'issue_opened':
    case 'opened_issue': {
      icon = '🐛'
      const n = ev.iid || ev.target?.iid || ''
      action = t('home.giteeActivity.issueOpened', { n })
      break
    }
    case 'issue_closed':
    case 'closed_issue': {
      icon = '🐛'
      const n = ev.iid || ev.target?.iid || ''
      action = t('home.giteeActivity.issueClosed', { n })
      break
    }
    case 'commented':
    case 'comment':
      icon = '💬'
      action = t('home.giteeActivity.comment')
      break
    case 'released': {
      icon = '🎉'
      const tag = ev.target?.tag_name || ev.target?.name || ''
      action = tag ? t('home.giteeActivity.release', { tag }) : t('home.activity.releaseNoTag')
      break
    }
    default: {
      const label = [ev.action_human_name, ev.type_human_name].filter(Boolean).join('')
      action = t('home.giteeActivity.other', { label: label || ev.action })
    }
  }

  return {
    id: String(ev.id),
    type: ev.action,
    icon,
    action,
    repo,
    url,
    date: ev.created_at,
  }
}

async function fetchGiteeTimeline(): Promise<any[]> {
  const target = `/gitee/contribution`
  const sources = [
    target,
    `https://gitee.com/${giteeUser}/contribution_timeline?limit=10`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://gitee.com/${giteeUser}/contribution_timeline?limit=10`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://gitee.com/${giteeUser}/contribution_timeline?limit=10`)}`,
  ]
  for (const url of sources) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) continue
      const text = await res.text()
      const data = JSON.parse(text)
      if (Array.isArray(data)) return data
    } catch {
      // try next source
    }
  }
  throw new Error('All sources failed')
}

// 存储原始 Gitee 事件数据
const rawGiteeEvents = ref<any[]>([])

// 重新翻译 Gitee 活动数据
function retranslateGiteeActivities() {
  giteeActivities.value = giteeActivities.value.map(act => {
    // 从原始数据重新翻译
    const rawEvent = rawGiteeEvents.value.find(ev => String(ev.id) === act.id)
    if (rawEvent) {
      const newAct = mapGiteeEvent(rawEvent)
      if (newAct) {
        return newAct
      }
    }
    return act
  })
}

onMounted(async () => {
  try {
    const data = await fetchGiteeTimeline()
    rawGiteeEvents.value = data
    giteeActivities.value = data
      .map(mapGiteeEvent)
      .filter((x): x is ActivityItem => x !== null)
      .slice(0, 10)
  } catch {
    giteeError.value = true
  } finally {
    giteeLoading.value = false
  }

  // Initialize Gitalk for Gramophone widget
  if (!gramophoneInitialized.value) {
    nextTick(() => {
      initGitalk()
      gramophoneInitialized.value = true
    })
  }
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
  overflow: hidden;
  min-width: 0;
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

// Typewriter effect — JS-driven loop with blinking cursor
.typewriter {
  display: inline-flex;
  align-items: center;
}

.typewriter-text {
  white-space: nowrap;
  min-height: 1.2em;
  line-height: 1.2em;
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent);
  margin-left: 2px;
  animation: typewriter-blink 0.8s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes typewriter-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .typewriter-cursor {
    animation: none;
  }
}

.profile-bio {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 0.78rem;

  svg {
    color: var(--accent);
    flex-shrink: 0;
  }
}

.profile-stats {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-top: 16px;
  width: 100%;
  max-width: 240px;
}

.profile-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 10px;
  text-decoration: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--accent);
    box-shadow: 0 6px 14px var(--shadow);

    .stat-num {
      color: var(--accent);
    }
  }
}

.stat-num {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  transition: color 0.3s ease;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
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

// Gramophone Widget
.gramophone-widget {
  grid-column: span 2;
  height: auto;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.gramophone-content {
  max-height: 600px;
  overflow-y: auto;
}

.gitalk-container {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;

  // Override gitalk theme styles for gramophone widget
  :deep(.gt-container) {
    max-height: none;
  }

  // Hide footer in gramophone widget
  :deep(.gt-copyright) {
    display: none;
  }
}

@media (max-width: 768px) {
  .gramophone-widget {
    grid-column: span 1;
    max-height: 500px;
  }

  .gramophone-content,
  .gitalk-container {
    max-height: 500px;
  }
}

// Activity Widget
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  animation: activity-fade-in 0.5s ease forwards;
  animation-delay: calc(var(--activity-index) * 0.06s);
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
    transform-origin: center;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 6px 16px var(--shadow);

    &::before {
      transform: scaleY(1);
    }

    .activity-icon {
      transform: scale(1.1) rotate(-6deg);
    }

    .activity-arrow {
      opacity: 1;
      transform: translate(2px, -2px);
    }

    .activity-repo {
      color: var(--accent);
    }
  }
}

@keyframes activity-fade-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: transform 0.3s ease;
}

.activity-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.activity-text {
  font-size: 0.88rem;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-action {
  color: var(--text-secondary);
  margin-right: 4px;
  word-break: break-all;
  overflow-wrap: break-word;
}

.activity-repo {
  color: var(--text-primary);
  font-weight: 600;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  transition: color 0.3s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-time {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.activity-arrow {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .activity-text {
    font-size: 0.82rem;
  }

  .activity-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>
