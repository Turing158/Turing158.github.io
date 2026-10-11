<template>
  <div class="home-view">
    <div class="widgets-grid">
      <!-- A · 森林手札：时间组件整体复用，装饰与节日围绕组件排布。 -->
      <section class="widget journal-card clock-widget" aria-labelledby="journal-clock-title">
        <header class="journal-header">
          <h2 id="journal-clock-title"><img :src="minecraftClock" class="minecraft-item" width="24" height="24" alt="" />{{ $t('home.journal.clockTitle') }}</h2>
          <span class="journal-header-meta">{{ clockTimezone }}</span>
        </header>
        <div class="journal-clock-face">
          <div class="journal-time-wrap"><ResponsiveTime class="clock-time" /></div>
          <div class="journal-camp">
            <div class="camp-caption">
              <img :src="minecraftCompass" class="minecraft-item" width="24" height="24" alt="" />
              <div class="camp-caption-copy">
                <h3>{{ $t('home.journal.campTitle') }}</h3>
                <p class="journal-clock-note">{{ $t('home.journal.clockNote') }}</p>
              </div>
              <span class="camp-world" aria-hidden="true">OVERWORLD</span>
            </div>
            <JournalCampScene />
          </div>
        </div>
        <div class="journal-holiday" aria-live="polite">
          <Transition name="loader-pop" mode="out-in">
            <div v-if="holidaysError" class="holiday-loading">{{ $t('home.loadFailed') }}</div>
            <div v-else-if="!holidaysLoaded" class="holiday-loading cube-anim">
              <CubeLoader :text="$t('home.loading')" />
            </div>
            <div v-else-if="!countdown" class="holiday-empty">
              <span class="holiday-book"><img :src="minecraftBook" class="minecraft-item" width="32" height="32" alt="" /></span>
              <div class="holiday-empty-copy">
                <p class="holiday-empty-title">{{ $t('home.journal.ordinaryDay') }}</p>
                <p class="holiday-empty-caption">{{ $t('home.holidayNoMore') }}</p>
              </div>
              <router-link to="/articles" class="journal-notes-link">
                <span>{{ $t('home.journal.readNotes') }}</span>
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M9 3h2v2h2v2h2v2h-2v2h-2v2H9V9H1V7h8z" /></svg>
              </router-link>
            </div>
            <div v-else class="holiday-content">
              <div class="holiday-heading">
                <p class="holiday-label">{{ $t(countdown.isToday ? 'home.journal.holidayDate' : 'home.journal.nextHoliday', { date: countdown.holiday.date.split('-').join('.') }) }}</p>
                <h3 class="holiday-name"><img :src="minecraftFirework" class="minecraft-item" width="24" height="24" alt="" />{{ countdown.holiday.name }}</h3>
              </div>
              <div v-if="countdown.isToday" class="holiday-countdown">
                <div class="holiday-today">{{ $t('home.holidayToday') }}</div>
                <div class="holiday-greeting">{{ countdown.greeting }}</div>
              </div>
              <div v-else-if="countdown.hoursLeft !== undefined && countdown.hoursLeft > 0" class="holiday-countdown">
                <div class="holiday-urgent">{{ $t('home.hoursLeft', { n: countdown.hoursLeft }) }}</div>
                <div class="holiday-greeting">{{ countdown.greeting }}</div>
              </div>
              <div v-else class="holiday-countdown">
                <i18n-t keypath="home.journal.daysUntil" tag="p" class="holiday-days">
                  <template #n><strong>{{ countdown.daysLeft }}</strong></template>
                </i18n-t>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <section class="widget journal-card profile-widget" aria-labelledby="journal-profile-title">
        <svg class="journal-leaf" viewBox="0 0 16 16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M8 1h6v6h-2v3h-3v2H6v3H4v-4H2V7h3V4h3zm2 3v2H8v2H6v2h2V8h2V6h2V4z" /></svg>
        <header class="journal-header">
          <h2 id="journal-profile-title"><img :src="minecraftTotem" class="minecraft-item" width="24" height="24" alt="" />{{ $t('home.journal.welcome') }}</h2>
          <span class="journal-header-meta">FIELD NOTES</span>
        </header>
        <div class="profile-summary">
          <div class="profile-copy">
            <div class="profile-identity">
              <button type="button" class="profile-avatar-wrap" :aria-label="$t('home.journal.avatar', { name: fullBlogName })" @click="onAvatarClick">
                <img :src="avatarUrl" alt="" width="70" height="70" class="profile-avatar" />
              </button>
              <div class="profile-identity-text">
                <h3 class="profile-name typewriter" :aria-label="fullBlogName">
                  <span class="typewriter-text" aria-hidden="true">{{ blogName }}</span>
                  <span v-if="showBlogCursor" class="typewriter-cursor" aria-hidden="true"></span>
                </h3>
                <p class="profile-handle">@{{ githubUser }}</p>
              </div>
            </div>
            <p class="profile-bio">{{ profileBio }}</p>
            <div v-if="profile?.location" class="profile-location">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M5 1h6v2h2v8h-2v2H9v2H7v-2H5v-2H3V3h2zm1 3v5h4V4z" /></svg>
              <span>{{ profile.location }}</span>
            </div>
          </div>
          <aside class="profile-corner" :aria-label="$t('home.journal.workingOn')">
            <p class="corner-kicker"><svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M5 3H3v3H1v4h2v3h2v-2H4V5h1zm6 0h2v3h2v4h-2v3h-2v-2h1V5h-1z" /></svg>{{ $t('home.journal.workingOn') }}</p>
            <svg class="corner-art" viewBox="0 0 112 64" fill="none" shape-rendering="crispEdges" aria-hidden="true">
              <path fill="var(--journal-edge)" opacity=".45" d="M4 60h104v4H4z" />
              <path class="corner-sparks" fill="var(--journal-bright)" opacity=".45" d="M84 8h4v4h-4zM94 2h4v4h-4z" />
              <path fill="var(--journal-accent)" d="M4 6h64v38H4z" />
              <path fill="var(--bg-card)" d="M8 10h56v29H8z" />
              <path fill="var(--journal-edge)" d="M8 10h56v5H8zM28 44h16v9H28zM21 53h30v4H21z" />
              <path fill="var(--journal-accent)" d="M17 20h4v4h-4zM21 24h4v4h-4zM17 28h4v4h-4z" />
              <path class="corner-terminal-cursor" fill="var(--journal-accent)" d="M30 29h16v3H30z" />
              <path class="corner-screen-scan" fill="var(--journal-accent)" d="M8 16h56v2H8z" />
              <path fill="var(--journal-bright)" d="M54 21h6v3h-6zM54 27h6v3h-6zM81 20h8v4h-8zM88 14h8v10h-8zM97 22h10v8H97zM81 28h15v6H81z" />
              <path fill="var(--journal-accent)" d="M92 22h4v23h-4zM86 26h6v5h-6zM96 27h7v4h-7z" />
              <path fill="var(--journal-edge)" d="M82 42h23v6h-23zM85 48h17v10H85z" />
              <path fill="var(--journal-dim)" d="M0 58h112v3H0z" />
            </svg>
            <strong class="corner-title">{{ $t('home.journal.project') }}</strong>
            <p class="corner-caption">{{ $t('home.journal.projectNote') }}</p>
            <span class="corner-foot"><i aria-hidden="true"></i>{{ $t('home.journal.projectStatus') }}</span>
          </aside>
        </div>
        <div v-if="profile" class="profile-collection">
          <div class="collection-heading" aria-hidden="true">
            <i class="collection-rune"></i>
            <span>{{ $t('home.journal.collection') }}</span>
            <i class="collection-rune"></i>
          </div>
          <nav class="profile-stats" :aria-label="$t('home.journal.stats')">
            <a v-for="stat in profileStats" :key="stat.tab" class="profile-stat" :href="`${githubProfileUrl}?tab=${stat.tab}`" :aria-label="`${$t(stat.label)} ${stat.value}`" target="_blank" rel="noopener noreferrer">
              <span class="collection-plinth" aria-hidden="true">
                <img :src="stat.icon" class="minecraft-item" width="32" height="32" alt="" />
              </span>
              <span class="stat-num" :title="String(stat.value)">{{ stat.displayValue }}</span>
              <span class="stat-label">{{ $t(stat.label) }}</span>
            </a>
          </nav>
          <div class="collection-desk" aria-hidden="true">
            <span class="collection-prop"><img :src="minecraftAmethyst" class="minecraft-item" width="24" height="24" alt="" /></span>
            <span class="collection-prop collection-book"><img :src="minecraftEnchantedBook" class="minecraft-item" width="32" height="32" alt="" /></span>
            <span class="collection-prop"><img :src="minecraftExperienceBottle" class="minecraft-item" width="24" height="24" alt="" /></span>
          </div>
        </div>
        <a class="profile-github" :href="githubProfileUrl" target="_blank" rel="noopener noreferrer">
          {{ $t('home.journal.githubLink') }}
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path d="M9 3h2v2h2v2h2v2h-2v2h-2v2H9V9H1V7h8z" /></svg>
        </a>
      </section>

      <!-- 近日动态 Widget（提交 + GitHub + Gitee 合并流，方案 A） -->
      <div class="widget log-widget">
        <div class="widget-header">
          <div class="widget-title">
            <img :src="minecraftSign" class="minecraft-item title-icon" width="24" height="24" alt="" />
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
              <span class="log-icon">
                <img :src="row.iconSrc" class="minecraft-item" width="24" height="24" alt="" />
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
              <img :src="minecraftBook" class="minecraft-item title-icon" width="24" height="24" alt="" />
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
            <img :src="minecraftMusicDisc" class="minecraft-item title-icon" width="24" height="24" alt="" />
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
import ResponsiveTime from '@/components/common/ResponsiveTime.vue'
import CubeLoader from '@/components/common/CubeLoader.vue'
import VibeCodingWidget from '@/components/home/VibeCodingWidget.vue'
import JournalCampScene from '@/components/home/JournalCampScene.vue'
import minecraftClock from '@/assets/minecraft-items/clock_00.png'
import minecraftTotem from '@/assets/minecraft-items/totem_of_undying.png'
import minecraftFirework from '@/assets/minecraft-items/firework_rocket.png'
import minecraftMinecart from '@/assets/minecraft-items/chest_minecart.png'
import minecraftEmerald from '@/assets/minecraft-items/emerald.png'
import minecraftEnderEye from '@/assets/minecraft-items/ender_eye.png'
import minecraftCompass from '@/assets/minecraft-items/compass_00.png'
import minecraftBook from '@/assets/minecraft-items/writable_book.png'
import minecraftAmethyst from '@/assets/minecraft-items/amethyst_shard.png'
import minecraftEnchantedBook from '@/assets/minecraft-items/enchanted_book.png'
import minecraftExperienceBottle from '@/assets/minecraft-items/experience_bottle.png'
import minecraftSign from '@/assets/minecraft-items/oak_sign.png'
import minecraftMusicDisc from '@/assets/minecraft-items/music_disc_cat.png'
import minecraftPickaxe from '@/assets/minecraft-items/diamond_pickaxe.png'
import minecraftArrow from '@/assets/minecraft-items/arrow.png'
import minecraftSeeds from '@/assets/minecraft-items/wheat_seeds.png'
import minecraftDoor from '@/assets/minecraft-items/oak_door.png'
import minecraftNetherStar from '@/assets/minecraft-items/nether_star.png'
import minecraftRepeater from '@/assets/minecraft-items/repeater.png'
import minecraftDiamond from '@/assets/minecraft-items/diamond.png'
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
const profileStats = computed(() => [
  { tab: 'repositories', label: 'home.repos', value: profile.value?.public_repos, icon: minecraftMinecart },
  { tab: 'followers', label: 'home.followers', value: profile.value?.followers, icon: minecraftEmerald },
  { tab: 'following', label: 'home.following', value: profile.value?.following, icon: minecraftEnderEye },
].map(stat => ({
  ...stat,
  displayValue: stat.value !== undefined && stat.value >= 1000
    ? `${(stat.value / 1000).toFixed(1).replace(/\.0$/, '')}k`
    : stat.value,
})))
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
const clockTimezone = computed(() => {
  const offset = -now.value.getTimezoneOffset()
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
  const minutes = Math.abs(offset) % 60
  return `UTC ${offset >= 0 ? '+' : '-'}${hours}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`
})

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
// 原版物品纹理按动态类型映射，所有主题保留物品原色。
function logIconFor(type: string): string {
  const k = (type || '').toLowerCase()
  if (k === 'commit') return minecraftPickaxe
  if (k.includes('push')) return minecraftArrow
  if (k.includes('create')) return minecraftSeeds
  if (k.includes('delete') || k.includes('destroy') || k === 'left') return minecraftDoor
  if (k.includes('follow') || k.includes('star') || k.includes('watch')) return minecraftNetherStar
  if (k.includes('fork') || k.includes('merge') || k.includes('pullrequest')) return minecraftRepeater
  if (k.includes('comment')) return minecraftBook
  if (k.includes('release')) return minecraftFirework
  return minecraftDiamond
}

interface LogRow {
  id: string
  text: string
  repo: string
  url: string
  date: string
  iconSrc: string
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
    .map(r => ({ id: r.id, text: r.text, repo: r.repo, url: r.url, date: r.date, iconSrc: logIconFor(r.kind) }))
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

@import '../styles/home-journal.less';

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
  width: 24px;
  height: 24px;
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

  .minecraft-item {
    width: 24px;
    height: 24px;
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
