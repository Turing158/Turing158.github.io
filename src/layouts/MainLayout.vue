<template>
  <div class="main-layout">
    <!-- 顶部天空背景：压在页面背景之上、所有内容之下（独立页不渲染 MainLayout，自然排除） -->
    <SkyBackground />

    <!-- 移动端遮罩层：侧边栏展开时显示 -->
    <transition name="overlay-fade">
      <div
        v-if="isMobile && !isCollapsed"
        class="sidebar-overlay"
        @click="isCollapsed = true"
      />
    </transition>

    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="avatar-wrap">
          <img :src="avatarUrl" alt="avatar" class="avatar" />
        </div>
        <h1 class="blog-name">
          <span class="typewriter-text">{{ blogName }}</span>
          <span v-if="showBlogCursor" class="typewriter-cursor"></span>
        </h1>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: item.activeNames?.includes(route.name as string) }"
          @click="isMobile && (isCollapsed = true)"
        >
          <span class="nav-indicator" aria-hidden="true"></span>
          <span class="nav-icon">
            <SidebarIcon :name="item.icon" :size="20" />
          </span>
          <span class="nav-text">{{ $t(item.labelKey) }}</span>
        </router-link>
        <button class="nav-link search-trigger" @click="openSearch">
          <span class="nav-indicator" aria-hidden="true"></span>
          <span class="nav-icon">
            <SidebarIcon name="search" :size="20" />
          </span>
          <span class="nav-text">{{ $t('search.trigger') }}</span>
        </button>
        <a
          href="https://hub.turing158.cc.cd"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link hub-link"
          @click="isMobile && (isCollapsed = true)"
        >
          <span class="nav-indicator" aria-hidden="true"></span>
          <span class="nav-icon">
            <SidebarIcon name="hub" :size="20" />
          </span>
          <span class="nav-text">hub</span>
          <span class="nav-external">
            <SidebarIcon name="externalLink" :size="14" />
          </span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="theme-switcher">
          <!-- 系统按钮 -->
          <button
            class="theme-btn theme-btn--system px-fade"
            :class="{ active: systemMode }"
            :title="$t('theme.system')"
            :aria-label="$t('theme.system')"
            :aria-pressed="systemMode"
            @click="toggleSystemMode"
          >
            <SidebarIcon name="system" :size="18" />
          </button>
          <!-- 亮色主题按钮 -->
          <button
            v-for="t in lightThemes"
            :key="t.value"
            class="theme-btn px-fade"
            :class="{ active: systemMode ? systemLightTheme === t.value : currentTheme === t.value }"
            :data-theme="t.value"
            :title="$t(t.labelKey)"
            :aria-label="$t(t.labelKey)"
            :aria-pressed="systemMode ? systemLightTheme === t.value : currentTheme === t.value"
            @click="handleThemeClick(t.value)"
          >
            <SidebarIcon :name="t.icon" :size="18" />
          </button>
          <!-- 暗色主题按钮 -->
          <button
            class="theme-btn px-fade"
            :class="{ active: systemMode ? systemDarkTheme === 'dark' : currentTheme === 'dark' }"
            :data-theme="'dark'"
            :title="$t('theme.dark')"
            :aria-label="$t('theme.dark')"
            :aria-pressed="systemMode ? systemDarkTheme === 'dark' : currentTheme === 'dark'"
            @click="handleThemeClick('dark')"
          >
            <SidebarIcon name="dark" :size="18" />
          </button>
        </div>
        <button class="lang-btn px-fade" @click="toggleLang">
          <SidebarIcon name="lang" :size="16" />
          <span>{{ $t('common.switchLang') }}</span>
        </button>
        <button class="collapse-btn px-fade" :aria-label="$t('common.collapse')" @click="isCollapsed = true">
          <SidebarIcon name="chevronLeft" :size="16" class="collapse-icon" />
          <span class="collapse-text">{{ $t('common.collapse') }}</span>
        </button>
      </div>
    </aside>

    <!-- 展开按钮：长按拖动调整位置，短按展开侧边栏 -->
    <button
      ref="expandBtnRef"
      class="expand-btn"
      :class="{ 'is-dragging': isDragging, 'is-longpress': isLongPressing, 'is-visible': isCollapsed }"
      :style="btnStyle"
      :aria-label="$t('common.expand')"
      @mousedown="onPointerDown"
      @touchstart.passive="onPointerDown"
      @click="onExpandClick"
    >
      <SidebarIcon name="menu" :size="20" />
    </button>

    <main class="content" :class="{ 'content-expanded': isCollapsed, 'content-with-toc': isArticleDetail && isTocOpen }">
      <div class="content-scroll">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        <ArticleTOCDrawer v-if="isArticleDetail" :headings="tocHeadings" @update:openState="isTocOpen = $event" />
      </div>
      <VillageFooter />
    </main>

    <SearchDialog ref="searchDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { useAchievements } from '@/composables/useAchievements'
import { setLocale } from '@/i18n'
import ArticleTOCDrawer from '@/components/article/ArticleTOCDrawer.vue'
import VillageFooter from '@/components/common/VillageFooter.vue'
import SkyBackground from '@/components/common/SkyBackground.vue'
import SidebarIcon from '@/components/sidebar/SidebarIcon.vue'
import SearchDialog from '@/components/search/SearchDialog.vue'
import { useTypewriter } from '@/composables/useTypewriter'
import type { TocHeading } from '@/components/article/ArticleTOCDrawer.vue'
export type { TocHeading }

const route = useRoute()
const { locale } = useI18n()
const {
  theme: currentTheme,
  setTheme,
  systemMode,
  systemLightTheme,
  systemDarkTheme,
  toggleSystemMode,
  setSystemLightTheme,
  setSystemDarkTheme,
} = useTheme()

const searchDialogRef = ref<InstanceType<typeof SearchDialog> | null>(null)
const openSearch = () => searchDialogRef.value?.open()

const { isNavUnlocked } = useAchievements()

const isMobile = ref(window.innerWidth < 768)
const isCollapsed = ref(window.innerWidth < 768)
const fullBlogName = 'Turing_ICE'
const { displayedText: blogName, showCursor: showBlogCursor } = useTypewriter(fullBlogName, 120, 60)
const avatarUrl = 'https://foruda.gitee.com/avatar/1682216074543204020/12834578_turing-ice_1682216074.png'

// 监听窗口变化，同步 isMobile 状态
const onResize = () => {
  isMobile.value = window.innerWidth < 768
}

// Ctrl/Cmd + K 打开搜索
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    openSearch()
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', handleKeydown)
})

// TOC 状态管理
const tocHeadings = ref<TocHeading[]>([])
const isTocOpen = ref(true) // 桌面端默认展开

// 只在文章详情页显示 TOC
const isArticleDetail = computed(() => route.name === 'article-detail')

// 提供给子组件更新 headings 的方法
const updateTocHeadings = (headings: TocHeading[]) => {
  tocHeadings.value = headings
}

// 提供给子组件更新目录开关状态的方法
const updateTocOpenState = (isOpen: boolean) => {
  isTocOpen.value = isOpen
}

// 监听窗口变化，同步桌面端目录默认状态
const onResizeForToc = () => {
  const mobile = window.innerWidth < 1024
  // 桌面端默认展开，移动端默认关闭
  if (!mobile) {
    isTocOpen.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', onResizeForToc)
  onResizeForToc() // 初始化
})

onUnmounted(() => {
  window.removeEventListener('resize', onResizeForToc)
})

// 暴露给 window，让 ArticleDetailView 可以调用
if (typeof window !== 'undefined') {
  (window as any).__updateTocHeadings = updateTocHeadings
  ;(window as any).__updateTocOpenState = updateTocOpenState
}

// =============================================
// 展开按钮长按拖动逻辑
// =============================================
const STORAGE_KEY = 'expand-btn-top'
const LONG_PRESS_MS = 500

const expandBtnRef = ref<HTMLElement | null>(null)
const btnTop = ref(parseFloat(localStorage.getItem(STORAGE_KEY) || '33'))
const isDragging = ref(false)
const isLongPressing = ref(false)

// 拖动内部状态
let startY = 0
let startTop = 0
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let hasMoved = false
let didDrag = false

const btnStyle = computed(() => ({
  top: `${btnTop.value}vh`,
}))

function clampTop(vh: number): number {
  return Math.max(2, Math.min(95, vh))
}

function getEventY(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? e.touches[0].clientY : e.clientY
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  if ('button' in e && e.button !== 0) return

  startY = getEventY(e)
  startTop = btnTop.value
  hasMoved = false
  didDrag = false

  longPressTimer = setTimeout(() => {
    if (!hasMoved) {
      isLongPressing.value = true
      isDragging.value = true
      didDrag = true
    }
  }, LONG_PRESS_MS)

  document.addEventListener('mousemove', onPointerMove)
  document.addEventListener('mouseup', onPointerUp)
  document.addEventListener('touchmove', onPointerMove, { passive: false })
  document.addEventListener('touchend', onPointerUp)
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  const currentY = getEventY(e)
  const deltaPx = currentY - startY
  const vhDelta = (deltaPx / window.innerHeight) * 100

  if (Math.abs(deltaPx) > 4) {
    hasMoved = true
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (!isDragging.value) {
      isDragging.value = true
      isLongPressing.value = true
      didDrag = true
    }
  }

  if (isDragging.value) {
    e.preventDefault()
    btnTop.value = clampTop(startTop + vhDelta)
  }
}

function onPointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }

  if (isDragging.value) {
    localStorage.setItem(STORAGE_KEY, String(btnTop.value))
  }

  isDragging.value = false
  isLongPressing.value = false

  document.removeEventListener('mousemove', onPointerMove)
  document.removeEventListener('mouseup', onPointerUp)
  document.removeEventListener('touchmove', onPointerMove)
  document.removeEventListener('touchend', onPointerUp)
}

function onExpandClick() {
  if (!didDrag) {
    isCollapsed.value = false
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onPointerMove)
  document.removeEventListener('mouseup', onPointerUp)
  document.removeEventListener('touchmove', onPointerMove)
  document.removeEventListener('touchend', onPointerUp)
})
// =============================================

const navItems = computed(() => {
  const items = [
    { path: '/', icon: 'home', labelKey: 'nav.home', activeNames: ['home'] },
    { path: '/articles', icon: 'articles', labelKey: 'nav.articles', activeNames: ['articles', 'article-detail'] },
    { path: '/projects', icon: 'projects', labelKey: 'nav.projects', activeNames: ['projects', 'commits'] },
    { path: '/releases', icon: 'releases', labelKey: 'nav.releases', activeNames: ['releases', 'release-detail'] },
    { path: '/tools', icon: 'tools', labelKey: 'nav.tools', activeNames: ['tools', 'tool-detail'] },
    { path: '/friends', icon: 'link', labelKey: 'nav.friends', activeNames: ['friends'] },
    { path: '/about', icon: 'about', labelKey: 'nav.about', activeNames: ['about'] },
  ]

  // 彩蛋导航：通过 Konami Code 解锁后显示
  if (isNavUnlocked.value) {
    items.push({
      path: '/achievements',
      icon: 'trophy',
      labelKey: 'nav.achievements',
      activeNames: ['achievements'],
    })
  }

  return items
})

const lightThemes: { value: ThemeName; icon: string; labelKey: string }[] = [
  { value: 'forest' as ThemeName, icon: 'forest', labelKey: 'theme.forest' },
  { value: 'ocean' as ThemeName, icon: 'ocean', labelKey: 'theme.ocean' },
  { value: 'sunset' as ThemeName, icon: 'sunset', labelKey: 'theme.sunset' },
]

function handleThemeClick(t: ThemeName) {
  if (systemMode.value) {
    // 系统模式下：分别设置亮色/暗色主题
    if (t === 'dark') {
      setSystemDarkTheme(t)
    } else {
      setSystemLightTheme(t as Exclude<ThemeName, 'dark'>)
    }
  } else {
    // 普通模式：直接切换
    setTheme(t)
  }

  // 成就系统：记录主题使用
  const achievements = useAchievements()
  achievements.addUsedTheme(t)
  // 暗夜骑士：第一次使用暗色主题时解锁
  if (t === 'dark') {
    achievements.unlock('dark-knight')
  }
  // 主题跳跳虎：在 addUsedTheme 中自动检查
  achievements.checkConditionalAchievements()
}

const toggleLang = () => {
  const newLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
  setLocale(newLang)
}
</script>

<style lang="less" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
  /* 建立层叠上下文：让天空背景（z-index: -1）压在本布局的页面背景之上、全部内容之下 */
  position: relative;
  z-index: 0;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  border-right: 2px solid var(--px-ink);

  &.collapsed {
    transform: translateX(-100%);
  }
}

.sidebar-header {
  padding: 32px 24px 24px;
  text-align: center;
  border-bottom: 2px dashed rgba(255, 255, 255, 0.14);
}

.avatar-wrap {
  position: relative;
  display: inline-flex;
  padding: 4px;
  background: var(--text-sidebar-active);
  clip-path: var(--pxc-circle);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.avatar-wrap:hover {
  transform: translateY(-2px) scale(1.05);
}

.avatar {
  width: 80px;
  height: 80px;
  display: block;
  object-fit: cover;
  clip-path: var(--pxc-circle);
  box-shadow: inset 0 0 0 2px var(--bg-sidebar);
}

.blog-name {
  color: var(--text-sidebar-active);
  font-family: var(--font-pixel);
  font-size: 1rem;
  margin-top: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.typewriter-text {
  white-space: nowrap;
  min-height: 1.2em;
  line-height: 1.2em;
  contain: content;
}

.typewriter-cursor {
  display: inline-block;
  width: 6px;
  height: 1em;
  background: var(--text-sidebar-active);
  margin-left: 3px;
  animation: blink-cursor 0.8s step-end infinite;
  vertical-align: text-bottom;
  contain: content;
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border: none;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  --pxs: 3px;
  clip-path: var(--pxc);
  color: var(--text-sidebar);
  font-size: 0.95rem;
  flex-shrink: 0;
  overflow: hidden;
  /* isolation + ::before z-index:-1：hover 背景层压在内容之下 */
  isolation: isolate;
  transition: color 0.2s ease;

  /* hover 背景：透明度 0→1 + 缩放 0.9→1 弹入 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: rgba(255, 255, 255, 0.08);
    opacity: 0;
    transform: scale(0.9);
    transition:
      opacity 0.2s ease,
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.nav-link:hover {
  color: var(--text-sidebar-active);
}

.nav-link:hover:not(.active)::before {
  opacity: 1;
  transform: scale(1);
}

.nav-link:hover .nav-icon {
  color: var(--text-sidebar-active);
  transform: scale(1.12) rotate(-4deg);
}

.nav-link:hover .nav-text {
  transform: translateX(3px);
}

.nav-link:active .nav-icon {
  transform: scale(0.85);
}

.nav-link.active {
  color: var(--accent-ink);
  font-weight: 700;
  background-color: var(--text-sidebar-active);
}

.nav-link.active .nav-indicator {
  opacity: 0;
}

.nav-link.active .nav-icon {
  color: var(--accent-ink);
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 60%;
  background: var(--text-sidebar-active);
  transform: translateY(-50%) scaleY(0);
  transform-origin: center;
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}

.nav-link:hover .nav-indicator {
  transform: translateY(-50%) scaleY(1);
  opacity: 1;
}

.nav-icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--text-sidebar);
  transform-origin: center center;
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.nav-text {
  position: relative;
  z-index: 1;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-trigger {
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.hub-link {
  cursor: pointer;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.nav-external {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  color: var(--text-sidebar);
  opacity: 0.75;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease, color 0.25s ease;
}

.hub-link:hover .nav-external {
  opacity: 1;
  color: var(--text-sidebar-active);
  transform: translate(1px, -1px);
}

.sidebar-footer {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
  border-top: 2px dashed rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-switcher {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.theme-btn {
  width: 36px;
  height: 36px;
  --pxs: 3px;
  clip-path: var(--pxc);
  border: 2px solid transparent;
  --px-fade-inset: 2px;
  --px-frame-fade: var(--px-frame-sidebar-active);
  color: var(--text-sidebar);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
}

/* 主题按钮平时无边框（px-fade 只应随 .active 淡入，压过工具类 :hover 淡入） */
.theme-btn:not(.active)::after {
  opacity: 0;
}

.theme-btn :deep(svg) {
  display: block;
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.theme-btn--system:not(.active) {
  background: rgba(148, 163, 184, 0.2);
}

.theme-btn--system:not(.active):hover {
  background: rgba(148, 163, 184, 0.35);
}

.theme-btn:not(.active)[data-theme="forest"] { background: rgba(79, 138, 69, 0.4); }
.theme-btn:not(.active)[data-theme="forest"]:hover { background: rgba(79, 138, 69, 0.6); }

.theme-btn:not(.active)[data-theme="ocean"] { background: rgba(46, 131, 168, 0.4); }
.theme-btn:not(.active)[data-theme="ocean"]:hover { background: rgba(46, 131, 168, 0.6); }

.theme-btn:not(.active)[data-theme="sunset"] { background: rgba(198, 95, 56, 0.4); }
.theme-btn:not(.active)[data-theme="sunset"]:hover { background: rgba(198, 95, 56, 0.6); }

.theme-btn:not(.active)[data-theme="dark"] { background: rgba(13, 19, 27, 0.5); }
.theme-btn:not(.active)[data-theme="dark"]:hover { background: rgba(13, 19, 27, 0.75); }

.theme-btn:not(.active):hover {
  transform: translateY(-2px);
}

.theme-btn:not(.active):hover :deep(svg) {
  transform: scale(1.12) rotate(-6deg);
}

.theme-btn:not(.active):active {
  transform: translateY(1px) scale(0.94);
}

.theme-btn:not(.active):active :deep(svg) {
  transform: scale(0.85);
}

.theme-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-sidebar-active);
}

/* 原为 border-image 简写整块切换（底图从无到有，瞬间出现），改由 px-fade 叠加层淡入 */
.theme-btn.active::after {
  opacity: 1;
}

.theme-btn.active:hover :deep(svg) {
  transform: scale(1.1) rotate(6deg);
}

.theme-btn.active:active {
  transform: scale(0.92);
}

.lang-btn,
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  --pxs: 3px;
  clip-path: var(--pxc);
  border: 2px solid transparent; border-image: var(--px-frame-on-dark) 6 / calc(2 * var(--pxs)) stretch;
  --px-fade-inset: 2px;
  --px-frame-fade: var(--px-frame-sidebar-active);
  background: transparent;
  color: var(--text-sidebar);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lang-btn :deep(svg),
.collapse-btn :deep(svg) {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.lang-btn:hover,
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-sidebar-active);
  transform: translateY(-2px);
}

.lang-btn:active,
.collapse-btn:active {
  transform: translateY(1px) scale(0.97);
}

.lang-btn:hover :deep(svg) {
  transform: scale(1.12) rotate(-8deg);
}

.collapse-btn:hover :deep(svg) {
  transform: translateX(-4px) scale(1.1);
}

.collapse-icon {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.collapse-btn:hover .collapse-icon {
  transform: translateX(-4px) scale(1.1);
}

.collapse-btn:active .collapse-icon {
  transform: translateX(2px) scale(0.88);
}

.expand-btn {
  position: fixed;
  left: 0;
  z-index: 101;
  width: 38px;
  height: 54px;
  border: none;
  background: var(--px-ink);
  color: var(--bg-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  /* 右缘贴视口的像素阶梯圆角（与 ToolsView 工具详情悬浮条的切法一致），左缘贴屏幕保持直角 */
  clip-path: polygon(0 0, calc(100% - 4px) 0, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%, 0 100%);
  transform: translateX(-101%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease, background 0.2s ease, width 0.2s ease, height 0.2s ease;
}

.expand-btn.is-visible {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.expand-btn:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.expand-btn:active {
  transform: translateX(0) scaleX(0.94);
}

.expand-btn.is-longpress {
  width: 42px;
  height: 58px;
}

.expand-btn.is-dragging {
  width: 42px;
  height: 58px;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: grabbing;
}

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left 0.3s ease, padding-right 0.3s ease;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  min-width: 0;
}

.content.content-expanded {
  margin-left: 0;
}

.content .content-scroll {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.content .content-scroll > :first-child {
  min-height: 100%;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.5);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .content.content-with-toc {
    padding-right: 292px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    transform: translateX(-100%);
  }
  .content {
    margin-left: 0;
  }
  .content.content-expanded {
    margin-left: 0;
  }
}
</style>
