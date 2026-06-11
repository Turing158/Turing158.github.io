<template>
  <div class="forum-page">
    <!-- 像素化背景纹理 -->
    <div class="pixel-bg" aria-hidden="true"></div>

    <!-- 顶部导航条 -->
    <header class="forum-nav">
      <div class="forum-nav-inner">
        <div class="forum-logo">
          <span class="logo-block"></span>
          <span class="logo-text">StarFall Forum</span>
        </div>
        <nav class="forum-nav-links">
          <a :href="frontendUrl" target="_blank" rel="noopener" class="forum-nav-link">
            <span class="link-icon">◈</span> Vue
          </a>
          <a :href="backendUrl" target="_blank" rel="noopener" class="forum-nav-link">
            <span class="link-icon">◈</span> Spring
          </a>
          <button class="forum-nav-link forum-lang-btn" @click="toggleLang">
            {{ locale === 'zh-CN' ? 'EN' : '中文' }}
          </button>
          <router-link to="/" class="forum-nav-link forum-back-link">
            ← {{ t('forum.backToBlog') }}
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="forum-hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">⬡</span>
          {{ t('forum.fullName') }}
        </div>
        <h1 class="forum-title">
          <span class="title-main">StarFall</span>
          <span class="title-sub">MINECRAFT FORUM</span>
        </h1>
        <p class="forum-tagline">{{ t('forum.tagline') }}</p>
        <p class="forum-subtagline">{{ t('forum.subTagline') }}</p>
        <div class="hero-actions">
          <a :href="frontendUrl" target="_blank" rel="noopener" class="forum-btn forum-btn-primary">
            <span class="btn-icon">▶</span> {{ t('forum.viewFrontend') }}
          </a>
          <a :href="backendUrl" target="_blank" rel="noopener" class="forum-btn forum-btn-secondary">
            <span class="btn-icon">▶</span> {{ t('forum.viewBackend') }}
          </a>
        </div>
      </div>
      <!-- 装饰性像素方块 -->
      <div class="hero-decorations" aria-hidden="true">
        <div class="deco-block deco-1"></div>
        <div class="deco-block deco-2"></div>
        <div class="deco-block deco-3"></div>
        <div class="deco-block deco-4"></div>
        <div class="deco-block deco-5"></div>
      </div>
    </section>

    <!-- 项目简介 -->
    <section class="forum-section forum-intro">
      <div class="section-header">
        <span class="header-icon">📜</span>
        <h2 class="forum-section-title">{{ t('forum.introTitle') }}</h2>
      </div>
      <div class="intro-box">
        <p>{{ t('forum.introDesc') }}</p>
      </div>
    </section>

    <!-- 双仓库卡片 -->
    <section class="forum-section">
      <div class="section-header">
        <span class="header-icon">📦</span>
        <h2 class="forum-section-title">{{ t('forum.reposTitle') }}</h2>
      </div>
      <div class="forum-repos">
        <!-- Vue 前端卡片 -->
        <div class="forum-repo-card repo-vue">
          <div class="repo-header">
            <div class="repo-icon">
              <span class="icon-v">V</span>
            </div>
            <div class="repo-info">
              <h3 class="repo-name">StarFall-vue</h3>
              <p class="repo-tech">Vue 3 · TypeScript · Element Plus</p>
            </div>
          </div>
          <p class="repo-desc">{{ t('forum.frontendDesc') }}</p>
          <div class="repo-actions">
            <a :href="frontendUrl" target="_blank" rel="noopener" class="forum-btn forum-btn-primary forum-btn--small">
              {{ t('forum.viewRepo') }}
            </a>
            <a :href="frontendUrl + '/commits'" target="_blank" rel="noopener" class="forum-btn forum-btn-ghost forum-btn--small">
              {{ t('forum.viewCommits') }}
            </a>
          </div>
        </div>

        <!-- Spring Boot 后端卡片 -->
        <div class="forum-repo-card repo-spring">
          <div class="repo-header">
            <div class="repo-icon">
              <span class="icon-s">S</span>
            </div>
            <div class="repo-info">
              <h3 class="repo-name">StarFall-SpringBoot</h3>
              <p class="repo-tech">Spring Boot · Java · MySQL</p>
            </div>
          </div>
          <p class="repo-desc">{{ t('forum.backendDesc') }}</p>
          <div class="repo-actions">
            <a :href="backendUrl" target="_blank" rel="noopener" class="forum-btn forum-btn-primary forum-btn--small">
              {{ t('forum.viewRepo') }}
            </a>
            <a :href="backendUrl + '/commits'" target="_blank" rel="noopener" class="forum-btn forum-btn-ghost forum-btn--small">
              {{ t('forum.viewCommits') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心特性 -->
    <section class="forum-section">
      <div class="section-header">
        <span class="header-icon">⚔</span>
        <h2 class="forum-section-title">{{ t('forum.featuresTitle') }}</h2>
      </div>
      <div class="forum-features">
        <div v-for="f in featureKeys" :key="f" class="forum-feature-card">
          <div class="feature-icon" v-html="featureIcons[f]"></div>
          <h3>{{ t(`forum.features.${f}.title`) }}</h3>
          <p>{{ t(`forum.features.${f}.desc`) }}</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="forum-section">
      <div class="section-header">
        <span class="header-icon">🔧</span>
        <h2 class="forum-section-title">{{ t('forum.techStackTitle') }}</h2>
      </div>
      <div class="forum-tech-stack">
        <div class="tech-group">
          <h4 class="tech-group-title">{{ t('forum.frontendStack') }}</h4>
          <div class="tech-tags">
            <span class="tech-tag tag-vue">Vue 3</span>
            <span class="tech-tag tag-ts">TypeScript</span>
            <span class="tech-tag tag-element">Element Plus</span>
            <span class="tech-tag tag-pinia">Pinia</span>
            <span class="tech-tag tag-router">Vue Router</span>
            <span class="tech-tag tag-vite">Vite</span>
          </div>
        </div>
        <div class="tech-group">
          <h4 class="tech-group-title">{{ t('forum.backendStack') }}</h4>
          <div class="tech-tags">
            <span class="tech-tag tag-spring">Spring Boot</span>
            <span class="tech-tag tag-java">Java</span>
            <span class="tech-tag tag-mysql">MySQL</span>
            <span class="tech-tag tag-mybatis">MyBatis</span>
            <span class="tech-tag tag-redis">Redis</span>
            <span class="tech-tag tag-jwt">JWT</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 鸣谢 -->
    <section class="forum-section forum-acknowledgements">
      <div class="section-header">
        <span class="header-icon">💝</span>
        <h2 class="forum-section-title">{{ t('forum.ackTitle') }}</h2>
      </div>
      <div class="ack-list">
        <div class="ack-item">
          <span class="ack-icon">📌</span>
          <p>{{ t('forum.ackMcbbs') }}</p>
        </div>
        <div class="ack-item">
          <span class="ack-icon">🎮</span>
          <p>{{ t('forum.ackRoommates') }}</p>
        </div>
        <div class="ack-item">
          <span class="ack-icon">🎓</span>
          <p>{{ t('forum.ackAdvisor') }}</p>
        </div>
        <div class="ack-item">
          <span class="ack-icon">🧋</span>
          <p>{{ t('forum.ackMilktea') }}</p>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="forum-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <span class="logo-block small"></span>
          <span>StarFall Minecraft Forum</span>
        </div>
        <div class="footer-links">
          <a :href="frontendUrl" target="_blank" rel="noopener">StarFall-vue</a>
          <span class="divider">|</span>
          <a :href="backendUrl" target="_blank" rel="noopener">StarFall-SpringBoot</a>
          <span class="divider">|</span>
          <router-link to="/">{{ t('forum.backToBlog') }}</router-link>
        </div>
        <p class="footer-note">{{ t('forum.footerNote') }}</p>
      </div>
    </footer>
  </div>

  <!-- 首次访问提示弹窗 -->
  <Teleport to="body">
    <Transition name="notice-dialog-fade">
      <div v-if="showNotice" class="notice-overlay" @click.self="closeNotice">
        <div class="notice-dialog" role="dialog" aria-modal="true">
          <div class="notice-dialog-header">
            <span class="notice-dialog-icon">⚠</span>
            <span class="notice-dialog-title">{{ t('pageTitle.starfallForum') }}</span>
          </div>
          <div class="notice-dialog-body">
            <p>{{ t('forum.notice') }}</p>
          </div>
          <div class="notice-dialog-footer">
            <button class="notice-btn notice-btn-ghost" @click="dismissNotice">
              {{ t('forum.noticeDismiss') }}
            </button>
            <button class="notice-btn notice-btn-primary" @click="closeNotice">
              {{ t('forum.noticeClose') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { setLocale } from '@/i18n'
import { config } from '@/config'

const FRONTEND_REPO = 'StarFall-vue'
const BACKEND_REPO = 'StarFall-SpringBoot'

const { t, locale } = useI18n()

const frontendUrl = computed(() => `https://github.com/${config.github.owner}/${FRONTEND_REPO}`)
const backendUrl = computed(() => `https://github.com/${config.github.owner}/${BACKEND_REPO}`)

// 独立页面自行管理 SEO
useHead({
  title: 'StarFall Minecraft Forum',
  meta: [
    { name: 'description', content: computed(() => t('forum.subTagline')) },
    { property: 'og:title', content: 'StarFall Minecraft Forum' },
    { property: 'og:description', content: computed(() => t('forum.subTagline')) },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#3d2914' },
  ],
})

const featureKeys = ['forum', 'user', 'post', 'comment', 'notification', 'search'] as const

const featureIcons: Record<string, string> = {
  forum: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="10" rx="1"/><path d="M4 5h8M4 7h6M4 9h4" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  user: '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>',
  post: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1" width="12" height="14" rx="1"/><path d="M5 4h6M5 7h6M5 10h4" stroke="currentColor" stroke-width="1" fill="none"/></svg>',
  comment: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v9H9l-3 3v-3H2z"/></svg>',
  notification: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 00-5 5v3l-2 2h14l-2-2V6a5 5 0 00-5-5z"/><path d="M6 12a2 2 0 004 0"/></svg>',
  search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l4.5 4.5"/></svg>',
}

const NOTICE_STORAGE_KEY = 'starfall-forum-notice-dismissed'

const showNotice = ref(false)

onMounted(() => {
  if (!localStorage.getItem(NOTICE_STORAGE_KEY)) {
    showNotice.value = true
  }
})

function closeNotice() {
  showNotice.value = false
}

function dismissNotice() {
  localStorage.setItem(NOTICE_STORAGE_KEY, '1')
  showNotice.value = false
}

function toggleLang() {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}
</script>

<style lang="less" scoped>
// ===== 像素风 Minecraft 主题变量 =====
@bg-dirt: #3d2914;        // 泥土色背景
@bg-dirt-dark: #2a1c0e;   // 深泥土色
@bg-stone: #5a5a5a;       // 石头色
@bg-stone-dark: #3d3d3d;  // 深石头色
@bg-grass: #4a7c3f;       // 草地绿（低饱和度）
@bg-grass-dark: #3a5c2f;  // 深草地绿
@bg-wood: #6b4423;        // 木头色
@bg-wood-light: #8b5a2b;  // 浅木头色

@text-primary: #e8dcc8;   // 羊皮纸色文字
@text-secondary: #a89880; // 次要文字
@text-accent: #c9a227;    // 金色（低饱和度）

@border-color: #2a1c0e;   // 边框色
@border-light: #5a4a3a;   // 浅边框

// ===== 基础样式 =====
.forum-page {
  position: relative;
  min-height: 100vh;
  background-color: @bg-dirt;
  color: @text-primary;
  font-family: 'VT323', 'Courier New', monospace;
  image-rendering: pixelated;
}

// ===== 像素化背景纹理 =====
.pixel-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    // 模拟 Minecraft 泥土纹理
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 16px,
      rgba(0, 0, 0, 0.1) 16px,
      rgba(0, 0, 0, 0.1) 17px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 16px,
      rgba(0, 0, 0, 0.1) 16px,
      rgba(0, 0, 0, 0.1) 17px
    );
  background-size: 32px 32px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(74, 124, 63, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(107, 68, 35, 0.15) 0%, transparent 50%);
  }
}

// ===== 顶部导航条 =====
.forum-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: @bg-dirt-dark;
  border-bottom: 4px solid @border-color;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
}

.forum-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 20px;
}

.forum-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-block {
  width: 24px;
  height: 24px;
  background: @bg-grass;
  border: 2px solid @border-color;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &.small {
    width: 14px;
    height: 14px;
  }
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: @text-primary;
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 @border-color;
}

.forum-nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forum-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 16px;
  color: @text-secondary;
  text-decoration: none;
  background: @bg-stone-dark;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.1s ease;

  &:hover {
    color: @text-primary;
    background: @bg-stone;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
}

.link-icon {
  color: @text-accent;
  font-size: 10px;
}

.forum-lang-btn {
  background: @bg-wood;
  border-color: @border-color;

  &:hover {
    background: @bg-wood-light;
  }
}

.forum-back-link {
  background: @bg-grass-dark;
  border-color: darken(@bg-grass-dark, 10%);

  &:hover {
    background: @bg-grass;
  }
}

// ===== Hero 区域 =====
.forum-hero {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px 60px;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: @bg-stone-dark;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  color: @text-accent;
  font-size: 14px;
  letter-spacing: 1px;
  margin-bottom: 24px;
}

.badge-icon {
  color: @bg-grass;
}

.forum-title {
  margin: 0;
  line-height: 1.2;
}

.title-main {
  display: block;
  font-size: 56px;
  font-weight: bold;
  color: @text-primary;
  text-shadow:
    3px 3px 0 @border-color,
    -1px -1px 0 @border-color,
    1px -1px 0 @border-color,
    -1px 1px 0 @border-color;
  letter-spacing: 4px;
}

.title-sub {
  display: block;
  font-size: 18px;
  color: @text-accent;
  letter-spacing: 8px;
  margin-top: 8px;
  text-shadow: 2px 2px 0 @border-color;
}

.forum-tagline {
  margin: 24px 0 8px;
  font-size: 20px;
  color: @text-primary;
}

.forum-subtagline {
  margin: 0;
  font-size: 16px;
  color: @text-secondary;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

// ===== 按钮样式 =====
.forum-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  font-family: inherit;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.1s ease;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(2px);
    border-bottom-width: 3px;
  }
}

.forum-btn-primary {
  background: @bg-grass;
  color: @text-primary;
  border-color: darken(@bg-grass, 15%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: lighten(@bg-grass, 5%);
  }
}

.forum-btn-secondary {
  background: @bg-wood;
  color: @text-primary;
  border-color: darken(@bg-wood, 15%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: lighten(@bg-wood, 5%);
  }
}

.forum-btn-ghost {
  background: @bg-stone-dark;
  color: @text-primary;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
  }
}

.forum-btn--small {
  padding: 8px 14px;
  font-size: 14px;
}

.btn-icon {
  font-size: 10px;
}

// ===== 装饰性像素方块 =====
.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.deco-block {
  position: absolute;
  border: 2px solid @border-color;
  box-shadow: inset -3px -3px 0 rgba(0, 0, 0, 0.2), inset 3px 3px 0 rgba(255, 255, 255, 0.05);
}

.deco-1 {
  width: 40px;
  height: 40px;
  top: 15%;
  left: 8%;
  background: @bg-grass;
  animation: float 4s ease-in-out infinite;
}

.deco-2 {
  width: 30px;
  height: 30px;
  top: 25%;
  right: 12%;
  background: @bg-wood;
  animation: float 5s ease-in-out infinite 1s;
}

.deco-3 {
  width: 24px;
  height: 24px;
  bottom: 30%;
  left: 15%;
  background: @bg-stone;
  animation: float 3.5s ease-in-out infinite 0.5s;
}

.deco-4 {
  width: 36px;
  height: 36px;
  bottom: 20%;
  right: 10%;
  background: @bg-grass-dark;
  animation: float 4.5s ease-in-out infinite 1.5s;
}

.deco-5 {
  width: 20px;
  height: 20px;
  top: 40%;
  left: 5%;
  background: @bg-wood-light;
  animation: float 3s ease-in-out infinite 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// ===== 通用 section =====
.forum-section {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.header-icon {
  font-size: 20px;
}

.forum-section-title {
  font-size: 24px;
  color: @text-primary;
  text-shadow: 2px 2px 0 @border-color;
  letter-spacing: 2px;
  margin: 0;
}

// ===== 项目简介 =====
.intro-box {
  background: @bg-stone-dark;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 24px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);

  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.8;
    color: @text-secondary;
  }
}

// ===== 双仓库卡片 =====
.forum-repos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.forum-repo-card {
  background: @bg-stone-dark;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 20px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-3px);
  }
}

.repo-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.repo-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  flex-shrink: 0;

  .icon-v, .icon-s {
    font-size: 24px;
    font-weight: bold;
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
  }
}

.repo-vue .repo-icon {
  background: #3a6b30;
  .icon-v { color: #a8d898; }
}

.repo-spring .repo-icon {
  background: #5a7a4a;
  .icon-s { color: #c8e6b8; }
}

.repo-info {
  flex: 1;
}

.repo-name {
  margin: 0;
  font-size: 18px;
  color: @text-primary;
  text-shadow: 1px 1px 0 @border-color;
}

.repo-tech {
  margin: 4px 0 0;
  font-size: 13px;
  color: @text-secondary;
}

.repo-desc {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
  color: @text-secondary;
}

.repo-actions {
  display: flex;
  gap: 10px;
}

// ===== 特性卡片 =====
.forum-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.forum-feature-card {
  background: @bg-stone-dark;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 18px;
  text-align: center;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-3px);
  }

  h3 {
    margin: 10px 0 6px;
    font-size: 16px;
    color: @text-primary;
    text-shadow: 1px 1px 0 @border-color;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: @text-secondary;
  }
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: @bg-wood;
  border: 2px solid @border-color;
  color: @text-accent;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

// ===== 技术栈 =====
.forum-tech-stack {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.tech-group {
  background: @bg-stone-dark;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 18px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
}

.tech-group-title {
  margin: 0 0 14px;
  font-size: 16px;
  color: @text-accent;
  text-shadow: 1px 1px 0 @border-color;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  padding: 6px 12px;
  font-size: 13px;
  border: 2px solid @border-color;
  border-bottom-width: 3px;
  background: @bg-dirt-dark;
  color: @text-primary;
  transition: transform 0.1s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.tag-vue { background: #3a5a30; border-color: #2a4a20; }
.tag-ts { background: #3a5a70; border-color: #2a4a60; }
.tag-element { background: #4a6a40; border-color: #3a5a30; }
.tag-pinia { background: #6a5a30; border-color: #5a4a20; }
.tag-router { background: #3a6a40; border-color: #2a5a30; }
.tag-vite { background: #5a5a60; border-color: #4a4a50; }

.tag-spring { background: #5a7a4a; border-color: #4a6a3a; }
.tag-java { background: #7a5a30; border-color: #6a4a20; }
.tag-mysql { background: #4a5a60; border-color: #3a4a50; }
.tag-mybatis { background: #6a4a30; border-color: #5a3a20; }
.tag-redis { background: #6a4040; border-color: #5a3030; }
.tag-jwt { background: #5a5a40; border-color: #4a4a30; }

// ===== 鸣谢 =====
.forum-acknowledgements {
  .ack-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .ack-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: @bg-stone-dark;
    border: 3px solid @border-color;
    border-bottom-width: 5px;
    box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: @text-secondary;
    }
  }

  .ack-icon {
    font-size: 20px;
    flex-shrink: 0;
  }
}

// ===== 页脚 =====
.forum-footer {
  position: relative;
  z-index: 1;
  background: @bg-dirt-dark;
  border-top: 4px solid @border-color;
  margin-top: 40px;
  padding: 24px 20px;
}

.footer-content {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  color: @text-primary;
  margin-bottom: 12px;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  margin-bottom: 12px;

  a {
    color: @text-secondary;
    text-decoration: none;

    &:hover {
      color: @text-accent;
    }
  }
}

.divider {
  color: @border-light;
}

.footer-note {
  margin: 0;
  font-size: 13px;
  color: @text-secondary;
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .title-main {
    font-size: 40px;
  }

  .title-sub {
    font-size: 14px;
    letter-spacing: 4px;
  }

  .forum-hero {
    padding: 50px 16px 40px;
  }

  .forum-repos {
    grid-template-columns: 1fr;
  }

  .forum-features {
    grid-template-columns: repeat(2, 1fr);
  }

  .forum-tech-stack {
    grid-template-columns: 1fr;
  }

  .forum-acknowledgements .ack-list {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .forum-nav-links {
    gap: 6px;
  }

  .forum-nav-link {
    padding: 6px 10px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .title-main {
    font-size: 32px;
  }

  .forum-features {
    grid-template-columns: 1fr;
  }

  .repo-actions {
    flex-direction: column;
  }

  .forum-nav-link {
    padding: 5px 8px;
    font-size: 12px;
  }

  .logo-text {
    font-size: 16px;
  }
}

// ===== 无障碍：减少动画 =====
@media (prefers-reduced-motion: reduce) {
  .deco-block {
    animation: none;
  }

  * {
    transition: none !important;
  }
}

// ===== 首次访问提示弹窗（像素风） =====
.notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: fade(#000, 55%);
  backdrop-filter: blur(3px);
}

.notice-dialog {
  width: 100%;
  max-width: 480px;
  background: @bg-dirt-dark;
  border: 4px solid @border-color;
  border-bottom-width: 6px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.5);
  image-rendering: pixelated;
}

.notice-dialog-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: @bg-stone-dark;
  border-bottom: 4px solid @border-color;
}

.notice-dialog-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notice-dialog-title {
  font-size: 18px;
  font-weight: bold;
  color: @text-accent;
  text-shadow: 1px 1px 0 @border-color;
  letter-spacing: 1px;
}

.notice-dialog-body {
  padding: 20px;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: @text-secondary;
  }
}

.notice-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px 16px;
  border-top: 2px solid @border-color;
}

.notice-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  font-size: 15px;
  font-weight: bold;
  font-family: inherit;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  cursor: pointer;
  transition: all 0.1s ease;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(2px);
    border-bottom-width: 3px;
  }
}

.notice-btn-primary {
  background: @bg-grass;
  color: @text-primary;
  border-color: darken(@bg-grass, 15%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: lighten(@bg-grass, 5%);
  }
}

.notice-btn-ghost {
  background: @bg-stone-dark;
  color: @text-secondary;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
    color: @text-primary;
  }
}

// ===== 弹窗过渡动画 =====
.notice-dialog-fade-enter-active {
  transition: opacity 0.25s ease;

  .notice-dialog {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
  }
}

.notice-dialog-fade-leave-active {
  transition: opacity 0.2s ease;

  .notice-dialog {
    transition: transform 0.18s ease-in, opacity 0.18s ease-in;
  }
}

.notice-dialog-fade-enter-from {
  opacity: 0;

  .notice-dialog {
    transform: scale(0.88);
    opacity: 0;
  }
}

.notice-dialog-fade-leave-to {
  opacity: 0;

  .notice-dialog {
    transform: scale(0.94);
    opacity: 0;
  }
}
</style>
