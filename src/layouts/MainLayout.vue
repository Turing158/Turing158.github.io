<template>
  <div class="main-layout">
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
        <h1 class="blog-name">{{ blogName }}</h1>
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
      </nav>

      <div class="sidebar-footer">
        <div class="theme-switcher">
          <!-- 系统按钮 -->
          <button
            class="theme-btn theme-btn--system"
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
            class="theme-btn"
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
            class="theme-btn"
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
        <button class="lang-btn" @click="toggleLang">
          <SidebarIcon name="lang" :size="16" />
          <span>{{ $t('common.switchLang') }}</span>
        </button>
        <button class="collapse-btn" :aria-label="$t('common.collapse')" @click="isCollapsed = true">
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
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <ArticleTOCDrawer v-if="isArticleDetail" :headings="tocHeadings" @update:openState="isTocOpen = $event" />
    </main>

    <SearchDialog ref="searchDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { setLocale } from '@/i18n'
import ArticleTOCDrawer from '@/components/article/ArticleTOCDrawer.vue'
import SidebarIcon from '@/components/sidebar/SidebarIcon.vue'
import SearchDialog from '@/components/search/SearchDialog.vue'
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

const isMobile = ref(window.innerWidth < 768)
const isCollapsed = ref(window.innerWidth < 768)
const blogName = 'Turing_ICE'
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

const navItems = [
  { path: '/', icon: 'home', labelKey: 'nav.home', activeNames: ['home'] },
  { path: '/articles', icon: 'articles', labelKey: 'nav.articles', activeNames: ['articles', 'article-detail'] },
  { path: '/projects', icon: 'projects', labelKey: 'nav.projects', activeNames: ['projects', 'commits'] },
  { path: '/releases', icon: 'releases', labelKey: 'nav.releases', activeNames: ['releases', 'release-detail'] },
  { path: '/tools', icon: 'tools', labelKey: 'nav.tools', activeNames: ['tools'] },
  { path: '/about', icon: 'about', labelKey: 'nav.about', activeNames: ['about'] },
]

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
  transition: transform 0.3s ease;
  box-shadow: 2px 0 8px var(--shadow);

  &.collapsed {
    transform: translateX(-100%);
  }
}

.sidebar-header {
  padding: 32px 24px 24px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-wrap {
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(
    135deg,
    var(--text-sidebar-active),
    transparent 60%
  );
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px) scale(1.04);
  }
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  border: 2px solid var(--bg-sidebar);
}

.blog-name {
  color: var(--text-sidebar);
  font-size: 1.1rem;
  margin-top: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.sidebar-nav {
  flex: 1;
  min-height: 0;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: var(--accent);
    border-radius: 0 10px 10px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }

}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  color: var(--text-sidebar);
  font-size: 0.95rem;
  flex-shrink: 0;
  overflow: hidden;
  transition: background-color 0.25s ease, color 0.25s ease;

  // 悬浮时的填充背景 — 用伪元素做缩放淡入，避免重排
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(255, 255, 255, 0.08);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  &:hover {
    color: var(--text-sidebar-active);

    &::before {
      opacity: 1;
    }

    .nav-icon {
      color: var(--text-sidebar-active);
      transform: scale(1.18) rotate(-4deg);
    }

    .nav-text {
      transform: translateX(3px);
    }
  }

  // 点击：图标按下回弹
  &:active .nav-icon {
    transform: scale(0.85) rotate(0deg);
  }

  &.active {
    color: var(--text-sidebar-active);
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.12);

    .nav-indicator {
      transform:translateY(-50%) scaleY(1);
      opacity: 1;
    }

    .nav-icon {
      color: var(--text-sidebar-active);
    }
  }
}

// 左侧高亮指示条
.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 60%;
  border-radius: 0 3px 3px 0;
  background: var(--text-sidebar-active);
  transform: translateY(-50%) scaleY(0);
  transform-origin: center;
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
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

// 搜索触发按钮 — 复用 .nav-link 样式，重置 button 默认值
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

.sidebar-footer {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 16px));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-switcher {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.theme-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  color: var(--text-sidebar);
  cursor: pointer;
  transition: background 0.25s ease, border-color 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  // 图标默认 transform 过渡
  :deep(svg) {
    display: block;
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  // 系统按钮
  &--system {
    &:not(.active) {
      background: rgba(148, 163, 184, 0.2); // slate-400
      &:hover {
        background: rgba(148, 163, 184, 0.35);
      }
    }
  }

  // 非 active 状态 - 使用对应主题色
  &:not(.active) {
    // Forest 主题按钮
    &[data-theme="forest"] {
      background: rgba(74, 124, 89, 0.25); // forest accent: #4a7c59
      &:hover {
        background: rgba(74, 124, 89, 0.45);
      }
    }

    // Ocean 主题按钮
    &[data-theme="ocean"] {
      background: rgba(42, 111, 151, 0.25); // ocean accent: #2a6f97
      &:hover {
        background: rgba(42, 111, 151, 0.45);
      }
    }

    // Sunset 主题按钮
    &[data-theme="sunset"] {
      background: rgba(192, 85, 51, 0.25); // sunset accent: #c05533
      &:hover {
        background: rgba(192, 85, 51, 0.45);
      }
    }

    // Dark 主题按钮
    &[data-theme="dark"] {
      background: rgba(15, 23, 42, 0.3); // dark accent: #0f172a
      &:hover {
        background: rgba(15, 23, 42, 0.5);
      }
    }

    &:hover {
      transform: translateY(-2px);

      :deep(svg) {
        transform: scale(1.18) rotate(-6deg);
      }
    }

    &:active {
      transform: translateY(0) scale(0.94);

      :deep(svg) {
        transform: scale(0.85) rotate(0deg);
      }
    }
  }

  // active 状态
  &.active {
    border-color: var(--text-sidebar-active);
    background: rgba(255, 255, 255, 0.2);
    color: var(--text-sidebar-active);

    &:hover {
      :deep(svg) {
        transform: scale(1.12) rotate(6deg);
      }
    }

    &:active {
      transform: scale(0.94);

      :deep(svg) {
        transform: scale(0.85);
      }
    }
  }
}

.lang-btn,
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--text-sidebar);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  :deep(svg) {
    transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--text-sidebar-active);
    color: var(--text-sidebar-active);
    transform: translateY(-2px);
  }

  &:active {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(0) scale(0.96);
  }
}

// 语言按钮：hover 图标旋转，点击图标按压
.lang-btn {
  &:hover :deep(svg) {
    transform: scale(1.18) rotate(-8deg);
  }

  &:active :deep(svg) {
    transform: scale(0.85) rotate(0deg);
  }
}

// 折叠按钮：hover 图标左移，点击图标按压回弹
.collapse-btn {
  &:hover :deep(svg) {
    transform: translateX(-4px) scale(1.1);
  }

  &:active :deep(svg) {
    transform: translateX(2px) scale(0.88);
  }
}

.collapse-icon {
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

// =============================================
// 展开按钮：贴边 + 长按拖动 + 显隐动画
// =============================================
.expand-btn {
  position: fixed;
  left: 0;
  z-index: 101;
  width: 36px;
  height: 52px;
  border-radius: 0 14px 14px 0;
  border: none;
  background: var(--bg-sidebar);
  color: var(--text-sidebar);
  cursor: pointer;
  box-shadow: 2px 4px 12px var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;

  // 默认隐藏状态
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;

  // 显隐过渡动画
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease,
    width 0.2s ease,
    height 0.2s ease;

  // 可见状态
  &.is-visible {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  // hover 效果
  &:hover {
    background: var(--accent);
    color: #fff;
    box-shadow: 2px 6px 16px var(--shadow);
  }

  &:active {
    transform: translateX(0) scale(0.96);
  }

  // 长按蓄力中：按钮微微放大 + 阴影增强
  &.is-longpress {
    width: 40px;
    height: 56px;
    box-shadow: 2px 8px 20px var(--shadow);
  }

  // 拖动中：放大 + 高亮 + 禁用过渡（跟手）
  &.is-dragging {
    width: 40px;
    height: 56px;
    background: var(--accent);
    color: #fff;
    box-shadow: 2px 8px 24px var(--shadow);
    cursor: grabbing;
  }
}
// =============================================

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left 0.3s ease, padding-right 0.3s ease;
  display: flex;
  position: relative;
  overflow-x: hidden;
  min-width: 0;

  &.content-expanded {
    margin-left: 0;
  }

  > :first-child {
    flex: 1;
    min-width: 0;
  }
}

/* 桌面端：为悬浮目录留出右侧空间，避免遮挡文章 */
@media (min-width: 1024px) {
  /* 只在目录打开时才留出空间 */
  .content.content-with-toc {
    padding-right: 292px; /* 260px TOC + 32px gap */
  }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* 移动端遮罩层 */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    &:not(.collapsed) {
      transform: translateX(0);
    }
    &.collapsed {
      transform: translateX(-100%);
    }
  }

  .content {
    margin-left: 0;
    &.content-expanded {
      margin-left: 0;
    }
  }
}

// // 尊重系统「减少动态效果」设置：保留菜单图标的移入/移出/点击反馈，去掉其余大幅位移与缩放
// @media (prefers-reduced-motion: reduce) {
//   .avatar-wrap,
//   .nav-text,
//   .nav-indicator,
//   .theme-btn,
//   .lang-btn,
//   .collapse-btn,
//   .expand-btn {
//     transition-duration: 0.01ms;
//   }

//   .avatar-wrap:hover,
//   .nav-link:hover .nav-text,
//   .theme-btn:hover,
//   .theme-btn:hover :deep(svg),
//   .theme-btn:active :deep(svg),
//   .lang-btn:hover,
//   .lang-btn:hover :deep(svg),
//   .lang-btn:active :deep(svg),
//   .collapse-btn:hover,
//   .collapse-btn:hover :deep(svg),
//   .collapse-btn:active :deep(svg),
//   .expand-btn:hover {
//     transform: none;
//   }
// }
</style>
