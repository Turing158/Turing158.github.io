<template>
  <div class="sfmc-jar-page">
    <!-- 像素化洞穴背景 -->
    <div class="cave-bg" aria-hidden="true">
      <div class="cave-layer cave-stone"></div>
      <div class="cave-layer cave-darkness"></div>
      <div class="cave-layer cave-sparkles"></div>
      <!-- 像素矿石装饰 -->
      <div class="ore-decoration ore-diamond-1"></div>
      <div class="ore-decoration ore-diamond-2"></div>
      <div class="ore-decoration ore-accent-1"></div>
      <div class="ore-decoration ore-gold-1"></div>
      <div class="ore-decoration ore-redstone-1"></div>
      <!-- 粒子效果 -->
      <div class="particle particle-1"></div>
      <div class="particle particle-2"></div>
      <div class="particle particle-3"></div>
    </div>

    <!-- 顶部导航条 - 像素风格 -->
    <header class="pixel-nav">
      <div class="pixel-nav-inner">
        <div class="pixel-logo">
          <div class="logo-pixel-block">
            <svg viewBox="0 0 24 24" class="logo-svg-icon">
              <rect x="2" y="2" width="20" height="20" fill="url(#logoGrad)"/>
              <rect x="6" y="6" width="4" height="4" fill="#fff" opacity="0.8"/>
              <rect x="14" y="6" width="4" height="4" fill="#fff" opacity="0.8"/>
              <rect x="6" y="14" width="4" height="4" fill="#fff" opacity="0.8"/>
              <rect x="14" y="14" width="4" height="4" fill="#fff" opacity="0.8"/>
              <rect x="10" y="10" width="4" height="4" fill="#fff"/>
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#4a9eff"/>
                  <stop offset="100%" style="stop-color:#3a7fd9"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="pixel-logo-text">SFMC</span>
          <span class="pixel-logo-badge">JAVA</span>
        </div>
        <nav class="pixel-nav-links">
          <a :href="repoUrl" target="_blank" rel="noopener" class="pixel-nav-link">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            <span>{{ t('sfmcJar.github') }}</span>
          </a>
          <button class="pixel-nav-link pixel-lang-btn" @click="toggleLang">
            {{ locale === 'zh-CN' ? 'EN' : '中文' }}
          </button>
          <router-link to="/" class="pixel-nav-link pixel-back-btn">
            <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>
            <span>{{ t('sfmcJar.goToBlog') }}</span>
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="pixel-hero">
      <div class="hero-layout">
        <div class="hero-text">
          <div class="hero-tag">
            <svg class="tag-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/></svg>
            <span>{{ t('sfmcJar.tag') }}</span>
          </div>
          <h1 class="pixel-title">
            <span class="title-text">SFMC</span>
            <span class="title-version">{{ t('sfmcJar.tag') }}</span>
          </h1>
          <p class="pixel-tagline">{{ t('sfmcJar.tagline') }}</p>
          <p class="pixel-desc">{{ t('sfmcJar.description') }}</p>
          <div class="hero-buttons">
            <button class="pixel-btn pixel-btn-primary" @click="scrollToDownload">
              <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v10M4 7l4 4 4-4M2 14h12"/></svg>
              <span>{{ t('sfmcJar.download') }}</span>
            </button>
            <a :href="repoUrl" target="_blank" rel="noopener" class="pixel-btn pixel-btn-outline">
              <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              <span>{{ t('sfmcJar.github') }}</span>
            </a>
          </div>
        </div>
        <!-- 右侧演示区 -->
        <div class="hero-demo">
          <div class="demo-frame">
            <div class="demo-screen">
              <div class="demo-content">
                <div class="demo-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <rect x="4" y="8" width="40" height="32" rx="2" fill="#3d3d3d"/>
                    <rect x="8" y="12" width="32" height="24" fill="#1a1a1a"/>
                    <path d="M12 20h8M12 24h12M12 28h6" stroke="#50C878" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="36" cy="24" r="4" fill="#50C878"/>
                  </svg>
                </div>
                <span class="demo-text">{{ t('sfmcJar.demoText') }}</span>
              </div>
            </div>
            <div class="demo-controls">
              <span class="control-dot dot-green"></span>
              <span class="control-dot dot-yellow"></span>
              <span class="control-dot dot-red"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心特性 -->
    <section class="pixel-section features-section">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
          <h2 class="section-title">{{ t('sfmcJar.featuresTitle') }}</h2>
          <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
        </div>
        <div class="features-grid">
          <div v-for="(f, idx) in features" :key="f.key" class="feature-card">
            <div class="feature-icon-box" :style="{ background: f.color }">
              <div v-html="f.icon" class="feature-svg"></div>
            </div>
            <h3>{{ t(`sfmcJar.features.${f.key}.title`) }}</h3>
            <p>{{ t(`sfmcJar.features.${f.key}.desc`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 技术规格 -->
    <section class="pixel-section specs-section">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          <h2 class="section-title">{{ t('sfmcJar.specsTitle') }}</h2>
          <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </div>
        <div class="specs-container">
          <div v-for="spec in specs" :key="spec.key" class="spec-item">
            <div class="spec-icon-box">
              <div v-html="spec.icon" class="spec-svg"></div>
            </div>
            <div class="spec-details">
              <span class="spec-label">{{ t(`sfmcJar.specs.${spec.key}.label`) }}</span>
              <span class="spec-value">{{ t(`sfmcJar.specs.${spec.key}.value`) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 下载区 -->
    <section ref="downloadSection" class="pixel-section download-section">
      <div class="section-inner">
        <div class="download-layout">
          <div class="download-info">
            <div class="section-header">
              <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <h2 class="section-title">{{ t('sfmcJar.download') }}</h2>
            </div>
            <p class="download-requirements">{{ t('sfmcJar.requirements') }}</p>
            <a :href="releasesUrl" target="_blank" rel="noopener" class="releases-link">
              <svg class="link-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>
              <span>{{ t('sfmcJar.allReleases') }}</span>
            </a>
          </div>
          <div class="download-box">
            <div class="box-inner">
              <p v-if="loading" class="loading-text">
                <span class="loading-dots">{{ t('sfmcJar.loading') }}</span>
              </p>
              <template v-else-if="release">
                <div class="release-info">
                  <span class="version-tag">{{ release.tag_name }}</span>
                  <span class="version-date">{{ formatDate(release.published_at) }}</span>
                </div>
                <div class="download-actions">
                  <a
                    v-for="asset in downloadAssets"
                    :key="asset.name"
                    :href="asset.browser_download_url"
                    class="pixel-btn pixel-btn-primary download-btn"
                  >
                    <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v10M4 7l4 4 4-4M2 14h12"/></svg>
                    <span>{{ asset.name }}</span>
                    <span class="size-tag">{{ formatSize(asset.size) }}</span>
                  </a>
                </div>
              </template>
              <template v-else>
                <p class="error-text">{{ t('sfmcJar.error') }}</p>
                <a :href="releasesUrl" target="_blank" rel="noopener" class="pixel-btn pixel-btn-primary">
                  <svg class="btn-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                  <span>{{ t('sfmcJar.allReleases') }}</span>
                </a>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 留言板 -->
    <section class="pixel-section comments-section">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-deco" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <h2 class="section-title">{{ t('sfmcJar.comments') }}</h2>
        </div>
        <div id="sfmc-jar-gitalk" class="gitalk-wrapper"></div>

        <!-- 鳴謝 -->
        <div class="acknowledgments">
          <div class="ack-divider"></div>
          <div class="ack-list">
            <div class="ack-item">
              <svg class="ack-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"/></svg>
              <span v-html="t('sfmcJar.ack.hmcl')"></span>
            </div>
            <div class="ack-item">
              <svg class="ack-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12v8c0 1-.5 2-2 2H4c-1.5 0-2-1-2-2V4zm0-1V2c0-1 .5-2 2-2h8c1.5 0 2 1 2 2v1"/></svg>
              <span v-html="t('sfmcJar.ack.laoji')"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 免责声明弹窗 -->
    <transition name="dialog-fade">
      <div v-if="showDisclaimer" class="disclaimer-dialog" role="dialog" aria-labelledby="disclaimer-title">
        <div class="dialog-header">
          <h3 id="disclaimer-title">{{ t('sfmcJar.notice.title') }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ t('sfmcJar.notice.content') }}</p>
        </div>
        <div class="dialog-footer">
          <button class="pixel-btn pixel-btn-outline dialog-btn" @click="closeDialog">{{ t('sfmcJar.notice.close') }}</button>
          <button class="pixel-btn pixel-btn-primary dialog-btn" @click="dismissDialog">{{ t('sfmcJar.notice.dismiss') }}</button>
        </div>
      </div>
    </transition>

    <!-- 页脚 -->
    <footer class="pixel-footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <div class="footer-logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" fill="url(#footerLogoGrad)"/>
                <rect x="6" y="6" width="4" height="4" fill="#fff" opacity="0.8"/>
                <rect x="14" y="6" width="4" height="4" fill="#fff" opacity="0.8"/>
                <rect x="6" y="14" width="4" height="4" fill="#fff" opacity="0.8"/>
                <rect x="14" y="14" width="4" height="4" fill="#fff" opacity="0.8"/>
                <rect x="10" y="10" width="4" height="4" fill="#fff"/>
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#4a9eff"/>
                    <stop offset="100%" style="stop-color:#3a7fd9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span>SFMC</span>
          </div>
          <div class="footer-links">
            <a :href="repoUrl" target="_blank" rel="noopener" class="footer-link">
              <svg class="footer-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              <span>{{ t('sfmcJar.github') }}</span>
            </a>
            <a :href="releasesUrl" target="_blank" rel="noopener" class="footer-link">
              <svg class="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v8M8 12h8M2 8v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-2l-2-2H6L4 6H2a2 2 0 00-2 2z"/></svg>
              <span>{{ t('sfmcJar.releases') }}</span>
            </a>
            <router-link to="/" class="footer-link">
              <svg class="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 3L5 8l5 5"/></svg>
              <span>{{ t('sfmcJar.back') }}</span>
            </router-link>
          </div>
        </div>
        <div class="footer-divider"></div>
        <p class="footer-note">{{ t('sfmcJar.footerNote') }}</p>
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
import { useGitalk } from '@/composables/useGitalk'

const REPO = 'SFMC'
const GITALK_SLUG = 'sfmc-java-edition-Message-Board'
const DISCLAIMER_KEY = 'sfmc-jar-disclaimer-dismissed'

const { t, locale } = useI18n()
const { loading, release, fetchLatest } = useLatestRelease(REPO)
const { init: initGitalk } = useGitalk('sfmc-jar-gitalk', GITALK_SLUG, 'SFMC Java Edition')

const repoUrl = `https://github.com/${config.github.owner}/${REPO}`
const releasesUrl = `${repoUrl}/releases`
const downloadSection = ref<HTMLElement | null>(null)
const showDisclaimer = ref(false)

function closeDialog() {
  showDisclaimer.value = false
}

function dismissDialog() {
  localStorage.setItem(DISCLAIMER_KEY, 'true')
  showDisclaimer.value = false
}

useHead({
  title: 'SFMC - Java Edition',
  meta: [
    { name: 'description', content: computed(() => t('sfmcJar.description')) },
    { property: 'og:title', content: 'SFMC - Java Edition' },
    { property: 'og:description', content: computed(() => t('sfmcJar.description')) },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#2E8B57' },
  ],
  link: [
    { rel: 'icon', href: '/icons/ico.ico' },
  ],
})

const features = [
  { key: 'performance', color: 'linear-gradient(135deg, #50C878 0%, #2E8B57 100%)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' },
  { key: 'crossPlatform', color: 'linear-gradient(135deg, #4A90D9 0%, #2E6BB5 100%)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { key: 'api', color: 'linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
]

const specs = [
  { key: 'language', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
  { key: 'jdk', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>' },
  { key: 'platform', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
  { key: 'license', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
]

const downloadAssets = computed(() => {
  if (!release.value) return []
  return release.value.assets.map(a => ({ ...a }))
})

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function scrollToDownload() {
  downloadSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function toggleLang() {
  setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

onMounted(() => {
  fetchLatest()
  initGitalk()

  // 检查是否已关闭免责声明
  if (!localStorage.getItem(DISCLAIMER_KEY)) {
    // 延迟显示，等页面加载完成
    setTimeout(() => {
      showDisclaimer.value = true
    }, 1000)
  }
})
</script>

<style lang="less" scoped>
// ===== 像素风主题变量（深蓝灰白配色 - 低饱和度）=====
@bg-void: #0a0e14;
@bg-obsidian: #0f1419;
@bg-deepslate: #161b22;
@bg-stone: #1c2333;
@bg-stone-light: #252535;
@bg-stone-dark: #161b22;
@bg-surface: #1a2028;
@bg-card: #1e2630;

@text-primary: #e6edf3;
@text-secondary: #7d8590;
@text-dim: #484f58;
@text-accent: #4a9eff;
@text-accent-alt: #6b73ff;

@border-color: #2d333b;
@border-light: #3d444d;

@accent-blue: #4a9eff;
@accent-blue-light: #6bb3ff;
@accent-blue-dark: #3a7fd9;
@accent-cyan: #39d2c0;
@accent-orange: #f0883e;
@gold: #DAA520;
@redstone: #CD5C5C;

// ===== 基础样式 =====
.sfmc-jar-page {
  position: relative;
  min-height: 100vh;
  background-color: @bg-void;
  color: @text-primary;
  font-family: 'VT323', 'Courier New', monospace;
  image-rendering: pixelated;
  overflow-x: hidden;
}

// ===== 星空粒子背景 =====
.cave-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(74, 158, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(57, 210, 192, 0.05) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 60%, rgba(107, 115, 255, 0.04) 0%, transparent 45%);
}

.cave-layer {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
}

.cave-stone {
  background-image: radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 90px 40px, rgba(74, 158, 255, 0.5), transparent),
    radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 160px 20px, rgba(57, 210, 192, 0.4), transparent),
    radial-gradient(1px 1px at 200px 60px, rgba(255, 255, 255, 0.3), transparent);
  background-size: 220px 100px;
  animation: sparkle 4s ease-in-out infinite;
}

.cave-darkness {
  background-image: radial-gradient(1px 1px at 50px 50px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 100px 20px, rgba(74, 158, 255, 0.4), transparent),
    radial-gradient(1px 1px at 150px 70px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 80px 90px, rgba(57, 210, 192, 0.3), transparent);
  background-size: 180px 120px;
  animation: sparkle 5s ease-in-out infinite 1s;
}

.cave-sparkles {
  background-image: radial-gradient(2px 2px at 30px 40px, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(2px 2px at 120px 60px, rgba(74, 158, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 180px 30px, rgba(57, 210, 192, 0.5), transparent);
  background-size: 200px 80px;
  animation: sparkle 6s ease-in-out infinite 2s;
}

@keyframes sparkle {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

// ===== 像素化Minecraft元素 =====
.ore-decoration {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid @border-color;
  animation: oreFloat 6s ease-in-out infinite;
}

.ore-diamond-1 {
  top: 15%;
  left: 5%;
  background: @accent-blue;
  box-shadow: inset -2px -2px 0 darken(@accent-blue, 15%), inset 2px 2px 0 rgba(255, 255, 255, 0.3);
  animation-delay: 0s;
}

.ore-diamond-2 {
  top: 60%;
  right: 8%;
  background: @accent-cyan;
  box-shadow: inset -2px -2px 0 darken(@accent-cyan, 15%), inset 2px 2px 0 rgba(255, 255, 255, 0.3);
  animation-delay: 2s;
}

.ore-accent-1 {
  top: 35%;
  right: 5%;
  background: @accent-blue;
  box-shadow: inset -2px -2px 0 darken(@accent-blue, 15%), inset 2px 2px 0 rgba(255, 255, 255, 0.3);
  animation-delay: 1s;
}

.ore-gold-1 {
  bottom: 25%;
  left: 8%;
  background: @accent-orange;
  box-shadow: inset -2px -2px 0 darken(@accent-orange, 15%), inset 2px 2px 0 rgba(255, 255, 255, 0.3);
  animation-delay: 3s;
}

.ore-redstone-1 {
  bottom: 40%;
  right: 12%;
  background: @text-accent-alt;
  box-shadow: inset -2px -2px 0 darken(@text-accent-alt, 15%), inset 2px 2px 0 rgba(255, 255, 255, 0.3);
  animation-delay: 4s;
}

@keyframes oreFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(5deg); }
}

// ===== 粒子效果 =====
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: @accent-blue;
  opacity: 0.4;
  animation: particleFloat 10s linear infinite;
}

.particle-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.particle-2 {
  top: 50%;
  right: 15%;
  animation-delay: 3s;
}

.particle-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 6s;
}

@keyframes particleFloat {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 0.4; }
  90% { opacity: 0.4; }
  100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
}

// ===== 导航条 =====
.pixel-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 3px solid @border-color;
}

.pixel-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1000px;
  margin: 0 auto;
  padding: 12px 20px;
}

.pixel-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-pixel-block {
  position: relative;
}

.logo-svg-icon {
  width: 28px;
  height: 28px;
  filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.5));
}

.pixel-logo-text {
  font-size: 22px;
  font-weight: bold;
  color: @accent-blue;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
}

.pixel-logo-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: @accent-blue-dark;
  color: @text-primary;
  border: 2px solid @accent-blue;
  letter-spacing: 1px;
}

.pixel-nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pixel-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 15px;
  color: @text-primary;
  text-decoration: none;
  background: @bg-stone-light;
  border: 2px solid @border-light;
  border-bottom-width: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: @accent-blue;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover::after {
    width: 80%;
  }

  &:hover {
    color: @accent-blue;
    background: @bg-stone;
    border-color: @accent-blue;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(74, 158, 255, 0.2);
  }

  &:active {
    transform: translateY(1px);
    border-bottom-width: 2px;
  }
}

.nav-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.pixel-lang-btn {
  background: @bg-stone-dark;
}

.pixel-back-btn {
  background: @accent-blue;
  border-color: @accent-blue-dark;
  color: #ffffff;

  &:hover {
    background: @accent-blue-light;
    border-color: @accent-blue;
    color: #ffffff;
  }
}

// ===== Hero 区域 =====
.pixel-hero {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 60px 20px 50px;
}

.hero-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  align-items: center;
}

.hero-text {
  text-align: left;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: @bg-stone;
  border: 2px solid @border-color;
  color: @accent-blue;
  font-size: 13px;
  margin-bottom: 16px;
}

.tag-icon {
  width: 14px;
  height: 14px;
}

.pixel-title {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.title-text {
  font-size: 64px;
  font-weight: bold;
  color: @text-primary;
  text-shadow:
    3px 3px 0 @bg-stone-dark,
    -1px -1px 0 @bg-stone-dark;
  letter-spacing: 4px;
  line-height: 1;
}

.title-version {
  font-size: 14px;
  color: @accent-blue;
  letter-spacing: 3px;
  margin-top: 8px;
  text-shadow: 1px 1px 0 @bg-stone-dark;
}

.pixel-tagline {
  margin: 16px 0 8px;
  font-size: 18px;
  color: @text-primary;
}

.pixel-desc {
  margin: 0;
  font-size: 14px;
  color: @text-secondary;
  max-width: 400px;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

// ===== 按钮样式 =====
.pixel-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  font-family: inherit;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(74, 158, 255, 0.2);
  }

  &:active {
    transform: translateY(1px);
    border-bottom-width: 2px;
  }
}

.pixel-btn-primary {
  background: @accent-blue-dark;
  color: @text-primary;
  border-color: darken(@accent-blue-dark, 15%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: @accent-blue;
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.1),
      0 8px 25px rgba(74, 158, 255, 0.3);
  }
}

.pixel-btn-outline {
  background: @bg-stone;
  color: @text-primary;
  border-color: @border-color;

  &:hover {
    background: @bg-stone-light;
    border-color: @accent-blue;
  }
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}


// ===== 演示区 =====
.hero-demo {
  display: flex;
  justify-content: center;
}

.demo-frame {
  width: 100%;
  max-width: 380px;
  background: @bg-stone;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 12px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.2),
    inset 2px 2px 0 rgba(255, 255, 255, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.4);
}

.demo-screen {
  background: #0a0a0a;
  border: 2px solid @border-color;
  padding: 30px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.demo-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.demo-icon {
  width: 64px;
  height: 64px;
  opacity: 0.6;

  svg {
    width: 100%;
    height: 100%;
  }
}

.demo-text {
  font-size: 12px;
  color: @text-dim;
  letter-spacing: 1px;
}

.demo-controls {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  justify-content: center;
}

.control-dot {
  width: 8px;
  height: 8px;
  border: 1px solid @border-color;
}

.dot-green { background: @accent-blue; }
.dot-yellow { background: @gold; }
.dot-red { background: @redstone; }

// ===== 通用 Section =====
.pixel-section {
  position: relative;
  z-index: 1;
  padding: 50px 20px;
}

.section-inner {
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
}

.header-deco {
  width: 20px;
  height: 20px;
  color: @accent-blue;
  opacity: 0.6;
}

.section-title {
  font-size: 24px;
  color: @text-primary;
  text-shadow: 2px 2px 0 @bg-stone-dark;
  letter-spacing: 2px;
  margin: 0;
}

// ===== 特性卡片 =====
.features-section {
  background: linear-gradient(180deg, transparent 0%, rgba(46, 139, 87, 0.05) 50%, transparent 100%);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.feature-card {
  background: @bg-stone;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  padding: 20px;
  text-align: center;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardFadeIn 0.6s ease-out backwards;

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.05),
      0 12px 40px rgba(74, 158, 255, 0.15),
      0 0 20px rgba(74, 158, 255, 0.1);
    border-color: rgba(74, 158, 255, 0.4);
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }

  h3 {
    margin: 12px 0 6px;
    font-size: 16px;
    color: @text-primary;
    text-shadow: 1px 1px 0 @bg-stone-dark;
    transition: color 0.3s ease;
  }

  &:hover h3 {
    color: @accent-blue;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: @text-secondary;
  }
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.25s; }
.feature-card:nth-child(3) { animation-delay: 0.4s; }

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.feature-icon-box {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-bottom-width: 3px;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon-box {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 4px 15px rgba(74, 158, 255, 0.3);
}

.feature-svg {
  width: 24px;
  height: 24px;
  color: @text-primary;
  transition: transform 0.3s ease;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.feature-card:hover .feature-svg {
  transform: scale(1.1);
}

// ===== 技术规格 =====
.specs-section {
  background: linear-gradient(180deg, transparent 0%, rgba(80, 200, 120, 0.03) 50%, transparent 100%);
}

.specs-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.spec-item {
  background: @bg-stone;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: specSlideIn 0.5s ease-out backwards;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.05),
      0 8px 25px rgba(74, 158, 255, 0.12);
    border-color: rgba(74, 158, 255, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }
}

.spec-item:nth-child(1) { animation-delay: 0.1s; }
.spec-item:nth-child(2) { animation-delay: 0.2s; }
.spec-item:nth-child(3) { animation-delay: 0.3s; }
.spec-item:nth-child(4) { animation-delay: 0.4s; }

@keyframes specSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.spec-icon-box {
  width: 40px;
  height: 40px;
  background: @bg-stone-dark;
  border: 2px solid @border-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.spec-item:hover .spec-icon-box {
  background: rgba(74, 158, 255, 0.15);
  border-color: @accent-blue;
  transform: scale(1.1);
}

.spec-svg {
  width: 20px;
  height: 20px;
  color: @accent-blue;
  transition: transform 0.3s ease;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.spec-item:hover .spec-svg {
  transform: rotate(10deg);
}

.spec-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec-label {
  font-size: 11px;
  color: @text-dim;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: color 0.3s ease;
}

.spec-item:hover .spec-label {
  color: @text-secondary;
}

.spec-value {
  font-size: 14px;
  font-weight: bold;
  color: @text-primary;
  transition: color 0.3s ease;
}

.spec-item:hover .spec-value {
  color: @accent-blue;
}

// ===== 下载区 =====
.download-section {
  background: linear-gradient(180deg, transparent 0%, rgba(46, 139, 87, 0.05) 100%);
}

.download-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
  align-items: start;
}

.download-info {
  .section-header {
    justify-content: flex-start;
    margin-bottom: 16px;
  }
}

.download-requirements {
  margin: 0 0 16px;
  font-size: 14px;
  color: @text-secondary;
  line-height: 1.6;
}

.releases-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: @accent-blue;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  padding: 4px 8px;
  margin-left: -8px;
  border: 2px solid transparent;

  &:hover {
    color: @accent-blue-light;
    transform: translateX(4px);
    border-color: @accent-blue;
    background: rgba(74, 158, 255, 0.1);
  }
}

.link-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.releases-link:hover .link-icon {
  transform: translateX(3px);
}

.download-box {
  .box-inner {
    background: @bg-stone;
    border: 2px solid @border-color;
    border-bottom-width: 4px;
    padding: 24px;
    box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }

  &:hover .box-inner {
    border-color: rgba(74, 158, 255, 0.3);
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.05),
      0 8px 30px rgba(74, 158, 255, 0.1);
  }
}

.loading-text {
  margin: 0 0 16px;
  color: @text-secondary;
  font-size: 14px;
  text-align: center;
}

.loading-dots {
  &::after {
    content: '...';
    animation: dots 1.5s steps(4, end) infinite;
  }
}

@keyframes dots {
  0%, 25% { content: ''; }
  50% { content: '.'; }
  75% { content: '..'; }
  100% { content: '...'; }
}

.error-text {
  margin: 0 0 16px;
  color: @redstone;
  font-size: 14px;
  text-align: center;
}

.release-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.version-tag {
  display: inline-block;
  padding: 6px 14px;
  background: @accent-blue-dark;
  border: 2px solid @accent-blue;
  color: @text-primary;
  font-size: 14px;
  font-weight: bold;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 158, 255, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(74, 158, 255, 0); }
}

.version-date {
  font-size: 13px;
  color: @text-dim;
}

.download-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.download-btn {
  flex: 1;
  min-width: 140px;
  justify-content: center;
  animation: btnPop 0.4s ease-out backwards;
}

.download-btn:nth-child(1) { animation-delay: 0.1s; }
.download-btn:nth-child(2) { animation-delay: 0.2s; }

@keyframes btnPop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.size-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// ===== 留言板 =====
.comments-section {
  background: linear-gradient(180deg, transparent 0%, rgba(80, 200, 120, 0.03) 50%, transparent 100%);
}

.gitalk-wrapper {
  background: @bg-stone;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  padding: 20px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.05);
}

// ===== 鳴謝 =====
.acknowledgments {
  margin-top: 24px;
}

.ack-divider {
  height: 2px;
  background: @border-color;
  margin-bottom: 20px;
  transform: scaleX(0);
  animation: dividerExpand 0.8s ease-out 0.5s forwards;
}

@keyframes dividerExpand {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.ack-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ack-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: @bg-stone-dark;
  border: 2px solid @border-color;
  border-bottom-width: 3px;
  font-size: 13px;
  color: @text-secondary;
  line-height: 1.6;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.15), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
  animation: ackSlideIn 0.5s ease-out backwards;

  &:hover {
    transform: translateX(8px);
    border-color: rgba(240, 136, 62, 0.4);
    background: rgba(240, 136, 62, 0.05);
  }
}

.ack-item:nth-child(1) { animation-delay: 0.6s; }
.ack-item:nth-child(2) { animation-delay: 0.75s; }

@keyframes ackSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ack-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  color: @accent-orange;
  transition: transform 0.3s ease;
}

.ack-item:hover .ack-icon {
  transform: scale(1.2) rotate(10deg);
}

.ack-item strong {
  color: @text-primary;
  text-shadow: 1px 1px 0 @bg-void;
}

// ===== 页脚 =====
.pixel-footer {
  position: relative;
  z-index: 1;
  background: @bg-stone-dark;
  border-top: 3px solid @border-color;
  margin-top: 30px;
  padding: 24px 20px;
}

.footer-inner {
  max-width: 1000px;
  margin: 0 auto;
}

.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
  color: @text-primary;
}

.footer-logo-icon {
  svg {
    width: 24px;
    height: 24px;
    filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.5));
  }
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: @text-secondary;
  text-decoration: none;
  font-size: 13px;
  transition: all 0.3s ease;
  padding: 4px 8px;
  margin: -4px -8px;
  border: 2px solid transparent;

  &:hover {
    color: @accent-blue;
    border-color: @accent-blue;
    background: rgba(74, 158, 255, 0.1);
    transform: translateY(-2px);
  }
}

.footer-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.footer-link:hover .footer-icon {
  transform: scale(1.1);
}

.footer-divider {
  height: 2px;
  background: @border-color;
  margin-bottom: 12px;
}

.footer-note {
  margin: 0;
  font-size: 12px;
  color: @text-dim;
  text-align: center;
}

// ===== 免责声明弹窗 =====
.disclaimer-dialog {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  width: 360px;
  max-width: calc(100vw - 48px);
  background: @bg-stone;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.2),
    inset 2px 2px 0 rgba(255, 255, 255, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.6);
}

.dialog-header {
  padding: 12px 16px;
  border-bottom: 2px solid @border-color;
  background: @bg-stone-dark;

  h3 {
    margin: 0;
    font-size: 16px;
    color: @text-primary;
    text-shadow: 1px 1px 0 @bg-void;
    letter-spacing: 1px;
  }
}

.dialog-body {
  padding: 16px;

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: @text-secondary;
  }
}

.dialog-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 2px solid @border-color;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 8px 16px;
  font-size: 13px;
}

// 弹窗动画
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: all 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// ===== 响应式 =====
@media (max-width: 800px) {
  .hero-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .hero-text {
    text-align: center;
  }

  .pixel-desc {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-buttons {
    justify-content: center;
  }

  .title-text {
    font-size: 48px;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .specs-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .download-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .download-info .section-header {
    justify-content: center;
  }

  .footer-top {
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 500px) {
  .pixel-hero {
    padding: 40px 16px 32px;
  }

  .pixel-nav-inner {
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  .pixel-nav-links {
    gap: 6px;
  }

  .pixel-nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }

  .pixel-logo-text {
    font-size: 18px;
  }

  .title-text {
    font-size: 36px;
    letter-spacing: 2px;
  }

  .title-version {
    font-size: 12px;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .specs-container {
    grid-template-columns: 1fr;
  }

  .download-actions {
    flex-direction: column;
    align-items: center;
  }

  .pixel-section {
    padding: 36px 16px;
  }

  .section-title {
    font-size: 20px;
  }

  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .disclaimer-dialog {
    width: 100%;
    max-width: 320px;
    bottom: 16px;
    right: 16px;
  }
}

// ===== 无障碍（与Windows系统中的“窗口内的动画控件和元素”有冲突） =====
// @media (prefers-reduced-motion: reduce) {
//   .cave-sparkles,
//   .ore-decoration,
//   .particle {
//     animation: none;
//   }

//   * {
//     transition: none !important;
//   }
// }
</style>
