<template>
  <div class="home-view">
    <div class="widgets-grid">
      <!-- Clock Widget -->
      <div class="widget clock-widget">
        <ResponsiveTime class="clock-time" />
        <Divider />
        <Transition name="loader-pop" mode="out-in" appear>
          <div v-if="!holidaysLoaded" class="holiday-loading cube-anim">
            <CubeLoader :text="$t('home.loading')" />
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
        </Transition>
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
            class="profile-stat px-fade"
            :href="`${githubProfileUrl}?tab=repositories`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.public_repos }}</span>
            <span class="stat-label">{{ $t('home.repos') }}</span>
          </a>
          <a
            class="profile-stat px-fade"
            :href="`${githubProfileUrl}?tab=followers`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.followers }}</span>
            <span class="stat-label">{{ $t('home.followers') }}</span>
          </a>
          <a
            class="profile-stat px-fade"
            :href="`${githubProfileUrl}?tab=following`"
            target="_blank"
            rel="noopener"
          >
            <span class="stat-num">{{ profile.following }}</span>
            <span class="stat-label">{{ $t('home.following') }}</span>
          </a>
        </div>
      </div>

      <!-- 近日动态 Widget（提交 + GitHub + Gitee 合并流，方案 A） -->
      <div class="widget log-widget">
        <div class="widget-header">
          <div class="widget-title">
            <svg class="px title-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M2 1 h12 v8 H2 Z M4 3 h8 v1 H4 Z M4 5 h5 v1 H4 Z M7 9 h2 v6 H7 Z" />
            </svg>
            <span class="title-text">{{ $t('home.recentLog') }}</span>
            <span class="title-en">RECENT LOG</span>
          </div>
          <div class="widget-sub">{{ $t('home.recentLogSub') }}</div>
        </div>
        <Transition name="loader-pop" mode="out-in" appear>
          <div v-if="logLoading" class="widget-content cube-anim">
            <CubeLoader :text="$t('common.loading')" />
          </div>
          <div v-else-if="!hasGitHubConfig" class="widget-content">{{ $t('home.githubNotConfigured') }}</div>
          <div v-else-if="logFailed && recentLog.length === 0" class="widget-content">{{ $t('home.loadFailed') }}</div>
          <div v-else-if="recentLog.length === 0" class="widget-content">{{ $t('home.noActivity') }}</div>
          <div v-else class="log-stream">
            <a
              v-for="(row, i) in recentLog"
              :key="row.id"
              :href="row.url"
              target="_blank"
              rel="noopener"
              class="log-row"
              :title="row.text"
              :style="{ '--log-index': i }"
            >
              <span class="log-icon" :style="{ color: row.iconColor }">
                <svg class="px" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" v-html="row.iconBody"></svg>
              </span>
              <span class="log-body">
                <span class="log-action">{{ row.text }}</span>
                <span class="log-repo">{{ row.repo }}</span>
              </span>
              <span class="log-time" :title="formatFullTime(row.date)">
                {{ formatRelativeTime(row.date) }}
              </span>
            </a>
          </div>
        </Transition>
        <router-link to="/commits" class="view-all">
          <span>{{ $t('home.logViewAll') }}</span>
          <span class="view-all-arrow">→</span>
        </router-link>
      </div>

      <div class="home-duo">
        <!-- 新写成的心得 Widget（方案 A） -->
        <div class="widget writings-widget">
          <div class="widget-header">
            <div class="widget-title">
              <svg class="px title-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M2 2 h5 v12 H2 Z M9 2 h5 v12 H9 Z M7 2 h2 v12 H7 Z M3 4 h3 v1 H3 Z M10 4 h3 v1 h-3 Z M3 7 h3 v1 H3 Z M10 7 h3 v1 h-3 Z" />
              </svg>
              <span class="title-text">{{ $t('home.writings') }}</span>
              <span class="title-en">LATEST WRITINGS</span>
            </div>
          </div>
          <Transition name="loader-pop" mode="out-in" appear>
            <div v-if="loading" class="widget-content cube-anim">
              <CubeLoader :text="$t('common.loading')" />
            </div>
            <div v-else-if="recentArticles.length === 0" class="widget-content">{{ $t('home.noArticles') }}</div>
            <div v-else class="writings-list">
              <router-link
                v-for="(article, index) in recentArticles"
                :key="article.slug"
                :to="`/article/${article.slug}`"
                class="writing-row"
                :style="{ '--item-index': index }"
              >
                <span class="writing-num">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="writing-body">
                  <span class="writing-title">{{ article.title }}</span>
                  <span class="writing-meta">
                    <span class="writing-date" :title="formatFullTime(article.date)">
                      {{ formatRelativeTime(article.date) }}
                    </span>
                    <span v-if="article.tags && article.tags.length > 0" class="writing-tag">
                      {{ article.tags[0] }}
                    </span>
                  </span>
                </span>
                <span class="writing-arrow">→</span>
              </router-link>
            </div>
          </Transition>
          <router-link to="/articles" class="view-all">
            <span>{{ $t('home.viewAllArticles', { n: articleTotal }) }}</span>
            <span class="view-all-arrow">→</span>
          </router-link>
        </div>

        <!-- Vibe Coding 活动卡（方案 B · 浓度热力） -->
        <VibeCodingWidget />

      </div>

      <!-- 留言板 Widget（方案 A，Gitalk 留声机），独占一整行 -->
      <div class="widget board-widget">
        <div class="widget-header">
          <div class="widget-title">
            <svg class="px title-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8 1 a7 7 0 1 0 0 14 a7 7 0 1 0 0 -14 Z M8 6 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z" />
            </svg>
            <span class="title-text">{{ $t('home.messageBoard') }}</span>
            <span class="title-en">GRAMOPHONE</span>
          </div>
          <div class="widget-sub">{{ $t('home.messageBoardNote') }}</div>
        </div>
        <div class="board-content">
          <div id="gitalk-container-home" class="gitalk-container"></div>
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
import CubeLoader from '@/components/common/CubeLoader.vue'
import VibeCodingWidget from '@/components/home/VibeCodingWidget.vue'
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
import { apiFetch } from '@/utils/apiEndpoint'
import { githubFetch } from '@/utils/githubApi'
import '@/styles/gitalk-theme.css'

const { fetchArticles, fetchRecentCommits, loading } = useArticles()
const store = useAppStore()
const { t, locale } = useI18n()

// SEO
usePageSeo(
  computed(() => config.blog.title),
  computed(() => t('seo.home')),
  '/',
)

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
    // 经 tool-proxy 转发（Worker 侧带 PAT，规避浏览器匿名限流）
    const res = await apiFetch(`${config.github.userApi}/${encodeURIComponent(githubUser)}`)
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
    // github-proxy 会把写死的 owner 注入到 /users 之后，所以这里不写登录名
    const res = await githubFetch('users/events?per_page=10')
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
  // 走统一后端基址（域名池首项），不要硬编码域名 —— 否则切到备用域名后这里会失效
  const target = `${config.backendBase}/gitee/contribution`
  const sources = [
    target,
    `https://gitee.com/${giteeUser}/contribution_timeline?limit=10`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://gitee.com/${giteeUser}/contribution_timeline?limit=10`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://gitee.com/${giteeUser}/contribution_timeline?limit=10`)}`,
  ]
  for (const url of sources) {
    try {
      // apiFetch：本地自动改走 Vite 同源代理，线上直连；其余公开源原样请求
      const res = await apiFetch(url, { headers: { Accept: 'application/json' } })
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

// ── 近日动态（方案 A）：提交 + GitHub + Gitee 合并成一条村民日志 ──
// 行内像素小图标：自绘 16×16，fill=currentColor，颜色按事件类型固定
const LOG_ICONS: Record<string, { color: string; body: string }> = {
  pickaxe: {
    color: 'var(--accent)',
    body: '<path d="M7 6 h2 l4 8 -2 1 Z M3 2 c3 -1.5 7 -1.5 10 1.5 L12 6 C10 4 6 4 4 5.5 Z"/>',
  },
  arrow: {
    color: 'var(--border-strong)',
    body: '<path d="M8 2 L14 8 h-3 v6 H5 V8 H2 Z"/>',
  },
  sprout: {
    color: '#6ba53a',
    body: '<path d="M7 8 h2 v7 H7 Z M8 7 c0 -3 2 -5 5 -5 c0 3 -2 5 -5 5 Z M7 7 C7 4.5 5.5 3 3 3 c0 2.5 1.5 4 4 4 Z"/>',
  },
  door: {
    color: 'var(--text-secondary)',
    body: '<path fill-rule="evenodd" d="M4 1 h8 v14 H4 Z M6 3 h4 v10 H6 Z M9 8 h1 v2 H9 Z"/>',
  },
  star: {
    color: '#C9A227',
    body: '<path d="M7 1 h2 v4 h4 v2 h-4 v4 h-2 v-4 H3 V5 h4 Z"/>',
  },
  heart: {
    color: '#B0553A',
    body: '<path d="M2 3 h4 v2 h4 V3 h4 v4 l-6 6 -6 -6 Z"/>',
  },
  merge: {
    color: '#58707F',
    body: '<path d="M4 2 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z M11 10 a2 2 0 1 1 0 4 a2 2 0 1 1 0 -4 Z M6 3 h2 v7 h3 v-1 l2 2 -2 2 v-1 H6 Z"/>',
  },
  bubble: {
    color: 'var(--accent)',
    body: '<path d="M2 2 h12 v9 H8 l-4 4 v-4 H2 Z"/>',
  },
  flag: {
    color: '#C9A227',
    body: '<path d="M3 1 h2 v14 H3 Z M5 2 h8 v6 H5 Z"/>',
  },
  gem: {
    color: 'var(--accent)',
    body: '<path d="M8 2 L14 6 8 14 2 6 Z"/>',
  },
}

function logIconFor(type: string): string {
  const k = (type || '').toLowerCase()
  if (k === 'commit') return 'pickaxe'
  if (k.includes('push')) return 'arrow'
  if (k.includes('create')) return 'sprout'
  if (k.includes('delete') || k.includes('destroy') || k === 'left') return 'door'
  if (k.includes('follow') || k.includes('star') || k.includes('watch')) return 'star'
  if (k.includes('fork') || k.includes('merge') || k.includes('pullrequest')) return 'merge'
  if (k.includes('comment')) return 'bubble'
  if (k.includes('release')) return 'flag'
  return 'gem'
}

interface LogRow {
  id: string
  text: string
  repo: string
  url: string
  date: string
  iconBody: string
  iconColor: string
}

const recentLog = computed<LogRow[]>(() => {
  const rows: Array<{ id: string; kind: string; text: string; repo: string; url: string; date: string }> = []
  recentCommits.value.forEach((c: any, i: number) => {
    rows.push({ id: `commit-${c.sha || i}`, kind: 'commit', text: c.message, repo: c.repo, url: c.url, date: c.date })
  })
  for (const a of activities.value) {
    rows.push({ id: `gh-${a.id}`, kind: a.type, text: a.action, repo: a.repo, url: a.url, date: a.date })
  }
  for (const a of giteeActivities.value) {
    rows.push({ id: `gitee-${a.id}`, kind: a.type, text: a.action, repo: a.repo, url: a.url, date: a.date })
  }
  return rows
    .filter(r => r.date && r.text)
    .sort((x, y) => (new Date(y.date).getTime() || 0) - (new Date(x.date).getTime() || 0))
    .slice(0, 8)
    .map(r => {
      const meta = LOG_ICONS[logIconFor(r.kind)] ?? LOG_ICONS.gem
      return { id: r.id, text: r.text, repo: r.repo, url: r.url, date: r.date, iconBody: meta.body, iconColor: meta.color }
    })
})

const logLoading = computed(() => commitsLoading.value || activityLoading.value || giteeLoading.value)
const logFailed = computed(() => activityError.value && giteeError.value)

const articleTotal = computed(() => store.articles.length)
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
  --pxs: 4px; clip-path: var(--pxc);
  padding: 24px;
  box-shadow: 0 2px 12px var(--shadow);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
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
  /* 1 个像素网格单位 = 72px / 16 = 4.5px，环宽即 1 单位 */
  padding: 4.5px;
  background: var(--accent);
  clip-path: var(--pxc-circle);
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
  clip-path: var(--pxc-circle-in);
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
  --pxs: 3px; clip-path: var(--pxc);
  text-decoration: none;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
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

// ── 方案 A 三卡：近日动态 / 新写成的心得 / 留言板 ──────────
.widget-content {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  width: 22px;
  height: 22px;
  color: var(--accent);
  flex-shrink: 0;
}

.title-en {
  margin-left: auto;
  font-family: var(--font-pixel);
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--text-secondary);
}

.widget-sub {
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

// 心得 + Vibe Coding 活动卡双列（心得更宽），留言板独占下一行
.home-duo {
  grid-column: span 2;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 20px;
  min-width: 0;
}

// 近日动态：提交 + GitHub + Gitee 合并流
.log-widget {
  grid-column: span 2;
}

.log-stream {
  display: flex;
  flex-direction: column;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 6px;
  border-bottom: 2px dashed var(--border);
  text-decoration: none;
  transition: background 0.3s ease;
  animation: home-row-fade-in 0.5s ease forwards;
  animation-delay: calc(var(--log-index) * 0.06s);
  opacity: 0;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: var(--bg-secondary);

    .log-repo {
      color: var(--accent-hover);
    }
  }
}

.log-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  transition: transform 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
  }
}

.log-row:hover .log-icon {
  transform: scale(1.08) rotate(-6deg);
}

.log-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.log-action {
  flex: 1;
  min-width: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-repo {
  flex-shrink: 0;
  max-width: 40%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.log-time {
  flex-shrink: 0;
  font-family: var(--font-pixel);
  font-size: 10px;
  color: var(--text-secondary);
}

// 新写成的心得
.writings-list {
  display: flex;
  flex-direction: column;
}

.writing-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 6px;
  border-bottom: 2px dashed var(--border);
  text-decoration: none;
  transition: background 0.3s ease;
  animation: home-row-fade-in 0.5s ease forwards;
  animation-delay: calc(var(--item-index) * 0.08s);
  opacity: 0;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: var(--bg-secondary);

    .writing-title {
      color: var(--accent);
    }

    .writing-num {
      color: var(--accent-bright);
    }

    .writing-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.writing-num {
  width: 30px;
  flex-shrink: 0;
  font-family: var(--font-pixel);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 1px 1px 0 var(--shadow);
}

.writing-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.writing-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.writing-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.writing-tag {
  display: inline-block;
  padding: 2px 10px;
  background: var(--bg-card);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--accent);
}

.writing-arrow {
  flex-shrink: 0;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
}

// 留言板（Gitalk 留声机），独占一整行
.board-widget {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.board-content {
  flex: 1;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 8px;

  // Gitalk 在窄栏里的适配
  :deep(.gt-container) {
    max-height: none;
  }

  :deep(.gt-copyright) {
    display: none;
  }
}

// 「查看全部」像素描边按钮
.view-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  align-self: flex-start;
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame-accent) 6 / calc(2 * var(--pxs)) stretch;
  text-decoration: none;
  transition: background 0.3s ease, transform 0.3s ease;

  &:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    transform: translateY(-2px);

    .view-all-arrow {
      transform: translateX(4px);
    }
  }
}

.view-all-arrow {
  transition: transform 0.3s ease;
}

@keyframes home-row-fade-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .widgets-grid {
    grid-template-columns: 1fr;
  }

  // span 2 在单列网格里会撑出隐式第二列，把时钟与资料卡挤进同一行，必须重置
  .log-widget,
  .home-duo,
  .board-widget {
    grid-column: auto;
  }

  .home-duo {
    grid-template-columns: 1fr;
  }

  .log-action {
    font-size: 0.82rem;
  }

  .board-content {
    max-height: 500px;
  }
}
</style>
