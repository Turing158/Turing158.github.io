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
      </nav>

      <div class="sidebar-footer">
        <div class="theme-switcher">
          <button
            v-for="t in themes"
            :key="t.value"
            class="theme-btn"
            :class="{ active: currentTheme === t.value }"
            :data-theme="t.value"
            :title="$t(t.labelKey)"
            :aria-label="$t(t.labelKey)"
            :aria-pressed="currentTheme === t.value"
            @click="setTheme(t.value)"
          >
            <SidebarIcon :name="t.icon" :size="18" />
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

    <button
      v-if="isCollapsed"
      class="expand-btn"
      :aria-label="$t('common.expand')"
      @click="isCollapsed = false"
    >
      <SidebarIcon name="menu" :size="20" />
    </button>

    <main class="content" :class="{ 'content-expanded': isCollapsed }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <ArticleTOCDrawer v-if="isArticleDetail" :headings="tocHeadings" />
    </main>
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
import type { TocHeading } from '@/components/article/ArticleTOCDrawer.vue'
export type { TocHeading }

const route = useRoute()
const { locale } = useI18n()
const { theme: currentTheme, setTheme } = useTheme()

const isMobile = ref(window.innerWidth < 768)
const isCollapsed = ref(window.innerWidth < 768)
const blogName = 'Turing_ICE'
const avatarUrl = 'https://foruda.gitee.com/avatar/1682216074543204020/12834578_turing-ice_1682216074.png'

// 监听窗口变化，同步 isMobile 状态
const onResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

// TOC 状态管理
const tocHeadings = ref<TocHeading[]>([])

// 只在文章详情页显示 TOC
const isArticleDetail = computed(() => route.name === 'article-detail')

// 提供给子组件更新 headings 的方法
const updateTocHeadings = (headings: TocHeading[]) => {
  tocHeadings.value = headings
}

// 暴露给 window，让 ArticleDetailView 可以调用
if (typeof window !== 'undefined') {
  (window as any).__updateTocHeadings = updateTocHeadings
}

const navItems = [
  { path: '/', icon: 'home', labelKey: 'nav.home', activeNames: ['home'] },
  { path: '/articles', icon: 'articles', labelKey: 'nav.articles', activeNames: ['articles', 'article-detail'] },
  { path: '/projects', icon: 'projects', labelKey: 'nav.projects', activeNames: ['projects', 'commits'] },
  { path: '/releases', icon: 'releases', labelKey: 'nav.releases', activeNames: ['releases'] },
  { path: '/tools', icon: 'tools', labelKey: 'nav.tools', activeNames: ['tools'] },
  { path: '/about', icon: 'about', labelKey: 'nav.about', activeNames: ['about'] },
]

const themes = [
  { value: 'forest' as ThemeName, icon: 'forest', labelKey: 'theme.forest' },
  { value: 'ocean' as ThemeName, icon: 'ocean', labelKey: 'theme.ocean' },
  { value: 'sunset' as ThemeName, icon: 'sunset', labelKey: 'theme.sunset' },
]

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
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-switcher {
  display: flex;
  justify-content: center;
  gap: 8px;
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

.expand-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 101;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: none;
  background: var(--bg-sidebar);
  color: var(--text-sidebar);
  cursor: pointer;
  box-shadow: 0 2px 10px var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease, color 0.25s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    background: var(--accent);
    color: #fff;
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.94);
  }
}

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  display: flex;
  position: relative;

  &.content-expanded {
    margin-left: 0;
  }

  > :first-child {
    flex: 1;
    min-width: 0;
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
