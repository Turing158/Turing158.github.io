<template>
  <div class="sfmc-page">
    <!-- 像素网格背景 -->
    <div class="pixel-grid" aria-hidden="true"></div>

    <!-- 顶部导航条 -->
    <header class="sf-nav">
      <div class="sf-nav-inner">
        <div class="sf-logo">
          <span class="logo-cube"></span>
          <span class="logo-text">StarFall Launcher</span>
        </div>
        <nav class="sf-nav-links">
          <a :href="repoUrl" target="_blank" rel="noopener" class="sf-nav-link">
            <span class="nav-dot">◆</span> GitHub
          </a>
          <button class="sf-nav-link sf-lang-btn" @click="toggleLang">
            {{ locale === 'zh-CN' ? 'EN' : '中文' }}
          </button>
          <router-link to="/" class="sf-nav-link sf-back-btn">
            ← {{ t('sfmc.backToBlog') }}
          </router-link>
        </nav>
      </div>
    </header>

    <!-- ==== Hero 区域（左文右 exe）==== -->
    <section class="sf-hero">
      <div class="hero-layout">
        <div class="hero-text">
          <h1 class="sf-title">
            <span class="title-star">&#x2605;</span>
            StarFall
            <span class="title-star">&#x2605;</span>
          </h1>
          <p class="sf-tagline">{{ t('sfmc.tagline') }}</p>
          <p class="sf-subtagline">{{ t('sfmc.subTagline') }}</p>
          <div class="hero-actions">
            <button class="sf-btn sf-btn-primary" @click="scrollToDownload">
              &#x25B6; {{ t('sfmc.download') }}
              <span v-if="release" class="btn-tag">{{ release.tag_name }}</span>
            </button>
            <a :href="repoUrl" target="_blank" rel="noopener" class="sf-btn sf-btn-ghost">
              &#x2691; {{ t('sfmc.viewOnGithub') }}
            </a>
          </div>
        </div>
        <div class="hero-exe"></div>
      </div>
    </section>

    <!-- ==== 核心特性 ==== -->
    <section class="sf-section">
      <div class="section-inner">
        <h2 class="sf-section-title">
          <span class="title-deco">&#x25A0;</span>
          {{ t('sfmc.featuresTitle') }}
          <span class="title-deco">&#x25A0;</span>
        </h2>
        <div class="sf-features">
          <div v-for="f in featureKeys" :key="f" class="sf-feature-card">
            <div class="feature-card-top">
              <span class="sf-feature-icon" v-html="featureIcons[f]"></span>
              <span class="feature-card-pixel"></span>
            </div>
            <h3>{{ t(`sfmc.features.${f}.title`) }}</h3>
            <p>{{ t(`sfmc.features.${f}.desc`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==== 截图区 ==== -->
    <section class="sf-section">
      <div class="section-inner">
        <h2 class="sf-section-title">
          <span class="title-deco">&#x25A0;</span>
          {{ t('sfmc.screenshotTitle') }}
          <span class="title-deco">&#x25A0;</span>
        </h2>
        <div class="sf-screenshot-placeholder">
          <span class="placeholder-icon-s">&#x25A3;</span>
          <span>{{ t('sfmc.screenshotPlaceholder') }}</span>
        </div>
      </div>
    </section>

    <!-- ==== 下载区 ==== -->
    <section ref="downloadSection" class="sf-section sf-download">
      <div class="section-inner">
        <h2 class="sf-section-title">
          <span class="title-deco">&#x25A0;</span>
          {{ t('sfmc.download') }}
          <span class="title-deco">&#x25A0;</span>
        </h2>
        <div class="download-box">
          <p v-if="loading" class="download-status">{{ t('sfmc.loadingRelease') }}</p>
          <template v-else-if="release">
            <p class="version-badge">&#x2691; {{ t('sfmc.latestVersion') }}: {{ release.tag_name }}</p>
            <div class="download-buttons">
              <a
                v-for="asset in downloadAssets"
                :key="asset.name"
                :href="asset.browser_download_url"
                class="sf-btn sf-btn-primary"
              >
                &#x2B07; {{ asset.label }}
                <span class="btn-tag">{{ formatSize(asset.size) }}</span>
              </a>
            </div>
          </template>
          <template v-else>
            <p class="download-status">{{ t('sfmc.releaseError') }}</p>
            <div class="download-buttons">
              <a :href="releasesUrl" target="_blank" rel="noopener" class="sf-btn sf-btn-primary">
                &#x2691; {{ t('sfmc.allReleases') }}
              </a>
            </div>
          </template>
          <a :href="releasesUrl" target="_blank" rel="noopener" class="all-releases-link">{{ t('sfmc.allReleases') }}</a>
          <p class="requirements">{{ t('sfmc.requirements') }}</p>
        </div>
      </div>
    </section>

    <!-- ==== 页脚 ==== -->
    <footer class="sf-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-cube"></span>
          <span>StarFall Minecraft Launcher</span>
        </div>
        <p class="footer-note">{{ t('sfmc.footerNote') }}</p>
        <div class="footer-links">
          <a :href="repoUrl" target="_blank" rel="noopener">&#x2691; GitHub</a>
          <span class="footer-divider">|</span>
          <router-link to="/">&#x2190; {{ t('sfmc.backToBlog') }}</router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import { setLocale } from '@/i18n'
import { config } from '@/config'
import { useLatestRelease } from '@/composables/useLatestRelease'

const REPO = 'StarFall-Minecraft-Launcher'

const { t, locale } = useI18n()
const { loading, release, fetchLatest } = useLatestRelease(REPO)

const repoUrl = `https://github.com/${config.github.owner}/${REPO}`
const releasesUrl = `${repoUrl}/releases`

const downloadSection = ref<HTMLElement | null>(null)

useHead({
  title: computed(() => t('pageTitle.sfmc')),
  meta: [
    { name: 'description', content: computed(() => t('sfmc.subTagline')) },
    { property: 'og:title', content: 'StarFall Minecraft Launcher' },
    { property: 'og:description', content: computed(() => t('sfmc.subTagline')) },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#14142a' },
  ],
})

const featureKeys = ['versions', 'accounts', 'java', 'speed', 'light', 'ui'] as const

const featureIcons: Record<string, string> = {
  versions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>',
  accounts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21c0-4 3-7 6-7s6 3 6 7"/><circle cx="17" cy="8" r="3"/><path d="M16 17c2 0 5 2 5 4"/></svg>',
  java: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h12v4a4 4 0 01-4 4H9a4 4 0 01-4-4v-4z"/><path d="M17 12h2a2 2 0 010 4h-2M8 5l2 3-2 3M12 5l2 3-2 3"/></svg>',
  speed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4L5 14h6l-2 6 10-10h-6l2-6z"/></svg>',
  light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
  ui: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>',
}

const downloadAssets = computed(() => {
  if (!release.value) return []
  return release.value.assets
    .filter(a => /x64|x86/i.test(a.name))
    .map(a => ({
      ...a,
      label: /x64/i.test(a.name) ? 'Windows x64' : 'Windows x86',
    }))
})

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function scrollToDownload() {
  downloadSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function toggleLang() {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

onMounted(() => {
  fetchLatest()
})
</script>

<style lang="less" scoped>
// ===== 像素风主题变量（深色末地石色系，低饱和度）=====
@bg-void: #0a0a1a;
@bg-obsidian: #14142a;
@bg-deepslate: #1e1e32;
@bg-stone: #2a2a40;
@bg-surface: #222238;

@text-primary: #c8c8d8;
@text-secondary: #8888a0;
@text-dim: #5a5a72;
@text-accent: #9a7ac8;
@text-accent-alt: #6a9ab8;

@border-color: #2a2a42;
@border-light: #3a3a56;

@accent-purple: #7a5aaa;
@accent-cyan: #5a8aaa;

// ===== 全局基础 =====
.sfmc-page {
  position: relative;
  min-height: 100vh;
  background-color: @bg-void;
  color: @text-primary;
  font-family: 'VT323', 'Courier New', 'Consolas', monospace;
  image-rendering: pixelated;
  overflow-x: hidden;
}

// ===== 像素网格背景 =====
.pixel-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 24px,
      rgba(122, 90, 170, 0.04) 24px,
      rgba(122, 90, 170, 0.04) 25px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 24px,
      rgba(122, 90, 170, 0.04) 24px,
      rgba(122, 90, 170, 0.04) 25px
    );
  background-size: 48px 48px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(122, 90, 170, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(90, 138, 170, 0.06) 0%, transparent 50%);
  }
}

// ===== 导航条 =====
.sf-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: @bg-obsidian;
  border-bottom: 3px solid @border-color;
}

.sf-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 24px;
}

.sf-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-cube {
  width: 20px;
  height: 20px;
  background: @accent-purple;
  border: 2px solid @border-color;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3), inset 2px 2px 0 rgba(255, 255, 255, 0.08);
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: @text-primary;
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 @bg-void;
}

.sf-nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sf-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 15px;
  color: @text-secondary;
  text-decoration: none;
  font-family: inherit;
  background: @bg-deepslate;
  border: 2px solid @border-color;
  border-bottom-width: 3px;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    color: @text-primary;
    background: @bg-stone;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    border-bottom-width: 2px;
  }
}

.nav-dot {
  color: @accent-purple;
  font-size: 8px;
}

.sf-lang-btn {
  background: @bg-surface;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
  }
}

.sf-back-btn {
  background: fade(@accent-purple, 15%);
  border-color: fade(@accent-purple, 30%);

  &:hover {
    background: fade(@accent-purple, 25%);
  }
}

// ===== Hero 区域（左文右 exe）=====
.sf-hero {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 24px 40px;
}

.hero-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}

.hero-text {
  text-align: left;
}

.sf-title {
  margin: 0;
  font-size: 52px;
  font-weight: bold;
  color: @text-primary;
  text-shadow:
    3px 3px 0 @bg-void,
    -1px -1px 0 @bg-void,
    1px -1px 0 @bg-void,
    -1px 1px 0 @bg-void;
  letter-spacing: 6px;
}

.title-star {
  display: inline-block;
  color: @accent-purple;
  font-size: 24px;
  vertical-align: middle;
  margin: 0 8px 0 0;
  animation: starPulse 2s ease-in-out infinite;
  text-shadow: 2px 2px 0 @bg-void;

  &:last-child {
    margin: 0 0 0 8px;
  }
}

@keyframes starPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.sf-tagline {
  margin: 16px 0 6px;
  font-size: 18px;
  color: @text-primary;
}

.sf-subtagline {
  margin: 0;
  font-size: 15px;
  color: @text-secondary;
  max-width: 420px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-top: 28px;
}

// ===== 右侧 exe 占位区 =====
.hero-exe {
  aspect-ratio: 4 / 3;
  width: 100%;
  background: #0a0a1a;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.03),
    0 6px 24px rgba(0, 0, 0, 0.4);
}

// ===== 按钮系统 =====
.sf-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  font-size: 15px;
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

.sf-btn-primary {
  background: @accent-purple;
  color: @text-primary;
  border-color: darken(@accent-purple, 15%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.08);

  &:hover {
    background: lighten(@accent-purple, 5%);
  }
}

.sf-btn-ghost {
  background: @bg-deepslate;
  color: @text-primary;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
  }
}

.btn-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// ===== 通用 section =====
.sf-section {
  position: relative;
  z-index: 1;
  padding: 40px 24px;
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.sf-section-title {
  text-align: center;
  font-size: 22px;
  margin: 0 0 32px;
  color: @text-primary;
  letter-spacing: 3px;
  text-shadow: 2px 2px 0 @bg-void;
}

.title-deco {
  display: inline-block;
  color: @accent-purple;
  font-size: 10px;
  vertical-align: middle;
  margin: 0 10px;
}

// ===== 特性卡片 =====
.sf-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.sf-feature-card {
  background: @bg-surface;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 20px;
  text-align: center;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  transition: transform 0.15s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: @border-light;
  }

  h3 {
    margin: 12px 0 8px;
    font-size: 16px;
    color: @text-primary;
    text-shadow: 1px 1px 0 @bg-void;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: @text-secondary;
  }
}

.feature-card-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.feature-card-pixel {
  display: none;
}

.sf-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: @bg-deepslate;
  border: 2px solid @border-color;
  color: @accent-purple;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

// ===== 截图占位 =====
.sf-screenshot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  background: @bg-surface;
  border: 3px dashed @border-color;
  color: @text-dim;
  font-size: 15px;
  letter-spacing: 1px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
}

.placeholder-icon-s {
  font-size: 32px;
  color: @border-light;
}

// ===== 下载区 =====
.sf-download {
  text-align: center;
}

.download-box {
  max-width: 600px;
  margin: 0 auto;
  background: @bg-surface;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 28px 24px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
}

.download-status {
  margin: 0 0 16px;
  color: @text-secondary;
  font-size: 15px;
}

.version-badge {
  display: inline-block;
  margin: 0 0 20px;
  padding: 6px 16px;
  border: 2px solid fade(@accent-purple, 40%);
  color: @accent-purple;
  font-size: 14px;
}

.download-buttons {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

.all-releases-link {
  display: inline-block;
  margin-top: 18px;
  font-size: 14px;
  color: @accent-cyan;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.requirements {
  margin: 18px 0 0;
  font-size: 13px;
  color: @text-dim;
}

// ===== 页脚 =====
.sf-footer {
  position: relative;
  z-index: 1;
  background: @bg-obsidian;
  border-top: 3px solid @border-color;
  margin-top: 20px;
  padding: 24px 24px 28px;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 15px;
  color: @text-primary;
  margin-bottom: 8px;
}

.footer-cube {
  width: 14px;
  height: 14px;
  background: @accent-purple;
  border: 2px solid @border-color;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3);
}

.footer-note {
  margin: 0 0 10px;
  font-size: 13px;
  color: @text-secondary;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;

  a {
    color: @text-secondary;
    text-decoration: none;

    &:hover {
      color: @accent-purple;
    }
  }
}

.footer-divider {
  color: @text-dim;
}

// ===== 响应式 =====
@media (max-width: 900px) {
  .hero-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .hero-text {
    text-align: center;
  }

  .hero-subtagline {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    justify-content: center;
  }

  .sf-title {
    font-size: 40px;
  }

  .hero-exe {
    aspect-ratio: 16 / 9;
  }

  .sf-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .sf-hero {
    padding: 40px 16px 28px;
  }

  .hero-layout {
    gap: 20px;
  }

  .sf-nav-inner {
    padding: 8px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sf-nav-links {
    gap: 4px;
  }

  .sf-nav-link {
    padding: 5px 8px;
    font-size: 13px;
  }

  .logo-text {
    font-size: 15px;
  }

  .sf-title {
    font-size: 32px;
    letter-spacing: 3px;
  }

  .title-star {
    font-size: 16px;

    &:last-child {
      margin: 0 0 0 4px;
    }
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-exe {
    aspect-ratio: 4 / 3;
    min-height: 160px;
  }

  .sf-features {
    grid-template-columns: 1fr;
  }

  .download-buttons {
    flex-direction: column;
    align-items: center;
  }

  .sf-section {
    padding: 28px 16px;
  }
}

@media (max-width: 400px) {
  .sf-nav-links {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

// ===== 无障碍：减少动画 =====
@media (prefers-reduced-motion: reduce) {
  .title-star {
    animation: none;
  }

  * {
    transition: none !important;
  }
}
</style>
