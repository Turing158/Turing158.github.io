<template>
  <div class="sfmc-page">
    <!-- 像素化洞穴背景 -->
    <div class="starfield" aria-hidden="true">
      <div class="cave-layer cave-stone"></div>
      <div class="cave-layer cave-darkness"></div>
      <div class="cave-layer cave-sparkles"></div>
    </div>
    <!-- 像素化Minecraft元素 -->
    <div class="mc-pixel-elements" aria-hidden="true">
      <!-- 矿石方块 - 钻石 -->
      <div class="ore-block ore-diamond ore-1">
        <svg viewBox="0 0 32 32" class="ore-svg">
          <rect x="0" y="0" width="32" height="32" fill="#2a4a5a"/>
          <rect x="4" y="4" width="24" height="24" fill="#3a6a8a"/>
          <rect x="8" y="8" width="16" height="16" fill="#4ac9e3"/>
          <rect x="12" y="12" width="8" height="8" fill="#7dd3f0"/>
          <rect x="14" y="14" width="4" height="4" fill="#ffffff" opacity="0.6"/>
        </svg>
      </div>
      <!-- 矿石方块 - 绿宝石 -->
      <div class="ore-block ore-emerald ore-2">
        <svg viewBox="0 0 32 32" class="ore-svg">
          <rect x="0" y="0" width="32" height="32" fill="#1a3a2a"/>
          <rect x="4" y="4" width="24" height="24" fill="#2a5a3a"/>
          <rect x="8" y="8" width="16" height="16" fill="#50c878"/>
          <rect x="12" y="12" width="8" height="8" fill="#7dd890"/>
          <rect x="14" y="14" width="4" height="4" fill="#ffffff" opacity="0.5"/>
        </svg>
      </div>
      <!-- 矿石方块 - 金 -->
      <div class="ore-block ore-gold ore-3">
        <svg viewBox="0 0 32 32" class="ore-svg">
          <rect x="0" y="0" width="32" height="32" fill="#3a2a1a"/>
          <rect x="4" y="4" width="24" height="24" fill="#5a4a2a"/>
          <rect x="8" y="8" width="16" height="16" fill="#daa520"/>
          <rect x="12" y="12" width="8" height="8" fill="#f0c040"/>
          <rect x="14" y="14" width="4" height="4" fill="#ffffff" opacity="0.5"/>
        </svg>
      </div>
      <!-- 矿石方块 - 红石 -->
      <div class="ore-block ore-redstone ore-4">
        <svg viewBox="0 0 32 32" class="ore-svg">
          <rect x="0" y="0" width="32" height="32" fill="#3a1a1a"/>
          <rect x="4" y="4" width="24" height="24" fill="#5a2a2a"/>
          <rect x="8" y="8" width="16" height="16" fill="#cd5c5c"/>
          <rect x="12" y="12" width="8" height="8" fill="#ff6b6b"/>
          <rect x="14" y="14" width="4" height="4" fill="#ffffff" opacity="0.4"/>
        </svg>
      </div>
      <!-- 火把装饰 -->
      <div class="torch torch-1">
        <svg viewBox="0 0 24 40" class="torch-svg">
          <rect x="10" y="16" width="4" height="24" fill="#8b6914"/>
          <rect x="8" y="8" width="8" height="12" fill="#daa520"/>
          <rect x="10" y="4" width="4" height="6" fill="#ff8c00"/>
          <rect x="11" y="1" width="2" height="4" fill="#ff4500" opacity="0.8"/>
        </svg>
      </div>
      <div class="torch torch-2">
        <svg viewBox="0 0 24 40" class="torch-svg">
          <rect x="10" y="16" width="4" height="24" fill="#8b6914"/>
          <rect x="8" y="8" width="8" height="12" fill="#daa520"/>
          <rect x="10" y="4" width="4" height="6" fill="#ff8c00"/>
          <rect x="11" y="1" width="2" height="4" fill="#ff4500" opacity="0.8"/>
        </svg>
      </div>
      <!-- 镐子装饰 -->
      <div class="pickaxe pickaxe-1">
        <svg viewBox="0 0 48 48" class="pickaxe-svg">
          <rect x="22" y="20" width="4" height="24" fill="#8b6914"/>
          <rect x="12" y="4" width="24" height="8" fill="#808080"/>
          <rect x="8" y="6" width="6" height="4" fill="#a0a0a0"/>
          <rect x="34" y="6" width="6" height="4" fill="#a0a0a0"/>
          <rect x="10" y="10" width="4" height="4" fill="#606060"/>
          <rect x="34" y="10" width="4" height="4" fill="#606060"/>
        </svg>
      </div>
      <!-- 合成台图案 -->
      <div class="crafting-table ct-1">
        <svg viewBox="0 0 48 48" class="crafting-svg">
          <rect x="4" y="4" width="40" height="40" fill="#5a4a3a"/>
          <rect x="8" y="8" width="32" height="32" fill="#8b7355"/>
          <line x1="24" y1="8" x2="24" y2="40" stroke="#6b5344" stroke-width="2"/>
          <line x1="8" y1="24" x2="40" y2="24" stroke="#6b5344" stroke-width="2"/>
          <rect x="10" y="10" width="12" height="12" fill="#7a6345"/>
          <rect x="26" y="10" width="12" height="12" fill="#7a6345"/>
          <rect x="10" y="26" width="12" height="12" fill="#7a6345"/>
          <rect x="26" y="26" width="12" height="12" fill="#7a6345"/>
        </svg>
      </div>
    </div>
    <!-- 底部地形轮廓 -->
    <div class="terrain-silhouette" aria-hidden="true">
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0,200 L0,160 L80,150 L120,140 L200,155 L280,130 L350,145 L420,120 L500,135 L580,110 L650,125 L720,100 L800,115 L880,90 L960,105 L1040,80 L1120,95 L1200,70 L1200,200 Z" fill="url(#terrainGradient)" />
        <defs>
          <linearGradient id="terrainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#161b22;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#0a0e14;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- 顶部导航条 -->
    <header class="sf-nav">
      <div class="sf-nav-inner">
        <div class="sf-logo">
          <img src="/icons/ico.ico" alt="StarFall" class="logo-icon" />
          <span class="logo-text">SFMC</span>
        </div>
        <nav class="sf-nav-links">
          <a :href="repoUrl" target="_blank" rel="noopener" class="sf-nav-link">
            <svg class="nav-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
          <button class="sf-nav-link sf-lang-btn" @click="toggleLang">
            {{ locale === 'zh-CN' ? 'EN' : '中文' }}
          </button>
          <router-link to="/" class="sf-nav-link sf-back-btn">
            <svg class="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {{ t('sfmc.backToBlog') }}
          </router-link>
        </nav>
      </div>
    </header>

    <!-- ==== Hero 区域 ==== -->
    <section class="sf-hero">
      <div class="hero-layout">
        <div class="hero-text">
          <h1 class="sf-title">
            <img src="/icons/ico.ico" alt="StarFall" class="title-icon" />
            <span class="title-word title-star">Star</span>
            <span class="title-word title-fall">Fall</span>
            <span class="title-word title-minecraft">Minecraft</span>
            <span class="title-word title-launcher">Launcher</span>
          </h1>
          <p class="sf-tagline">{{ t('sfmc.tagline') }}</p>
          <p class="sf-subtagline">{{ t('sfmc.subTagline') }}</p>
          <div class="hero-actions">
            <button class="sf-btn sf-btn-primary" @click="scrollToDownload">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              {{ t('sfmc.download') }}
              <span v-if="release" class="btn-tag">{{ release.tag_name }}</span>
            </button>
            <a :href="repoUrl" target="_blank" rel="noopener" class="sf-btn sf-btn-ghost">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              {{ t('sfmc.viewOnGithub') }}
            </a>
          </div>
        </div>
        <div class="hero-exe">
          <img src="/icons/ico.ico" alt="StarFall" class="exe-icon" />
        </div>
      </div>
    </section>

    <!-- ==== 核心特性 - 全新Bento网格布局 ==== -->
    <section class="sf-section sf-features-section">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/></svg>
          <h2 class="sf-section-title">{{ t('sfmc.featuresTitle') }}</h2>
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/></svg>
        </div>
        <div class="sf-bento-grid">
          <div v-for="(f, idx) in featureKeys" :key="f" class="sf-bento-card" :class="`bento-${idx + 1}`">
            <div class="bento-card-header">
              <span class="sf-feature-icon" v-html="featureIcons[f]"></span>
              <div class="bento-card-deco"></div>
            </div>
            <h3>{{ t(`sfmc.features.${f}.title`) }}</h3>
            <p>{{ t(`sfmc.features.${f}.desc`) }}</p>
            <div class="bento-card-footer">
              <span class="bento-pixel"></span>
              <span class="bento-pixel"></span>
              <span class="bento-pixel"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==== 技术规格 - Minecraft物品栏风格 ==== -->
    <section class="sf-section sf-tech-specs">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <h2 class="sf-section-title">{{ t('sfmc.techSpecsTitle') }}</h2>
        </div>
        <div class="specs-container">
          <!-- 物品栏展示 -->
          <div class="specs-hotbar">
            <div class="hotbar-slot active">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.speed') }}</span>
            </div>
            <div class="hotbar-slot">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.versions') }}</span>
            </div>
            <div class="hotbar-slot">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.accounts') }}</span>
            </div>
            <div class="hotbar-slot">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12h12v4a4 4 0 01-4 4H9a4 4 0 01-4-4v-4z"/><path d="M17 12h2a2 2 0 010 4h-2M8 5l2 3-2 3M12 5l2 3-2 3"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.java') }}</span>
            </div>
            <div class="hotbar-slot">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.ui') }}</span>
            </div>
            <div class="hotbar-slot">
              <svg class="slot-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <span class="slot-label">{{ t('sfmc.specs.resources') }}</span>
            </div>
          </div>
          <!-- 信息面板 -->
          <div class="specs-info-panel">
            <div class="info-row">
              <span class="info-label">{{ t('sfmc.specs.os') }}</span>
              <span class="info-value">{{ t('sfmc.specs.osValue') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('sfmc.specs.javaVersion') }}</span>
              <span class="info-value">{{ t('sfmc.specs.javaValue') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('sfmc.specs.mcVersions') }}</span>
              <span class="info-value">{{ t('sfmc.specs.mcValue') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('sfmc.specs.loaders') }}</span>
              <span class="info-value">{{ t('sfmc.specs.loadersValue') }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('sfmc.specs.autoUpdate') }}</span>
              <span class="info-value highlight">✓ {{ t('sfmc.specs.supported') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==== 留言板 - Gitalk ==== -->
    <section class="sf-section sf-comments">
      <div class="section-inner">
        <div class="section-header">
          <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h2 class="sf-section-title">{{ t('sfmc.commentsTitle') }}</h2>
        </div>
        <div id="sfmc-gitalk-container" class="gitalk-container" style="max-height: 600px; overflow-y: auto;"></div>
      </div>
    </section>

    <!-- ==== 下载区 - 全新设计 ==== -->
    <section ref="downloadSection" class="sf-section sf-download">
      <div class="section-inner">
        <div class="download-container">
          <div class="download-left">
            <div class="section-header">
              <svg class="header-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <h2 class="sf-section-title">{{ t('sfmc.download') }}</h2>
            </div>
            <p class="download-desc">{{ t('sfmc.requirements') }}</p>
            <p class="download-desc">{{ t('sfmc.specs.requirements') }}</p>
            <a :href="releasesUrl" target="_blank" rel="noopener" class="all-releases-link">
              <svg class="link-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              {{ t('sfmc.allReleases') }}
            </a>
          </div>
          <div class="download-right">
            <div class="download-box">
              <p v-if="loading" class="download-status">
                <span class="loading-dots">{{ t('sfmc.loadingRelease') }}</span>
              </p>
              <template v-if="release">
                <div class="version-info">
                  <span class="version-badge">{{ release.tag_name }}</span>
                  <span class="version-date">{{ formatDate(release.published_at) }}</span>
                </div>
                <div class="download-buttons">
                  <a
                    v-for="asset in downloadAssets"
                    :key="asset.name"
                    :href="asset.browser_download_url"
                    class="sf-btn sf-btn-primary"
                  >
                    <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {{ asset.label }}
                    <span class="btn-tag">{{ formatSize(asset.size) }}</span>
                  </a>
                </div>
              </template>
              <template v-else>
                <p class="download-status error">{{ t('sfmc.releaseError') }}</p>
                <a :href="releasesUrl" target="_blank" rel="noopener" class="sf-btn sf-btn-primary">
                  <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  {{ t('sfmc.allReleases') }}
                </a>
              </template>
            </div>
          </div>
        </div>

        <!-- 鸣谢区域 -->
        <div class="acknowledgements">
          <div class="ack-title">
            <svg class="ack-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>{{ t('sfmc.acknowledgements.title') }}</span>
          </div>
          <ul class="ack-list">
            <li>
              <svg class="ack-bullet" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {{ t('sfmc.acknowledgements.pcl') }}
            </li>
            <li>
              <svg class="ack-bullet" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              {{ t('sfmc.acknowledgements.laoji') }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ==== 项目说明弹窗 - 自定义像素风 ==== -->
    <Teleport to="body">
      <Transition name="notice-dialog">
        <div v-if="showNoticeDialog" class="notice-overlay" @click.self="closeNotice">
          <div class="notice-dialog">
            <!-- 标题栏 -->
            <div class="notice-header">
              <div class="notice-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <span class="notice-title">{{ t('sfmc.notice.title') }}</span>
              <button class="notice-close" @click="closeNotice" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- 内容区 -->
            <div class="notice-body">
              <div class="notice-content">
                <p>{{ t('sfmc.notice.content') }}</p>
              </div>
            </div>

            <!-- 底部按钮 -->
            <div class="notice-footer">
              <button class="sf-btn sf-btn-primary notice-btn" @click="dismissNotice">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                {{ t('sfmc.notice.dismiss') }}
              </button>
              <button class="sf-btn sf-btn-ghost notice-btn" @click="closeNotice">
                <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                {{ t('sfmc.notice.close') }}
              </button>
            </div>

            <!-- 像素装饰 -->
            <div class="notice-pixel-deco notice-pixel-tl"></div>
            <div class="notice-pixel-deco notice-pixel-tr"></div>
            <div class="notice-pixel-deco notice-pixel-bl"></div>
            <div class="notice-pixel-deco notice-pixel-br"></div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ==== 页脚 - 全新设计 ==== -->
    <footer class="sf-footer">
      <div class="footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="/icons/ico.ico" alt="StarFall" class="footer-icon" />
            <span>{{ t('sfmc.appName') }}</span>
          </div>
          <div class="footer-links">
            <a :href="repoUrl" target="_blank" rel="noopener" class="footer-link">
              <svg class="footer-link-icon-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
            <a :href="releasesUrl" target="_blank" rel="noopener" class="footer-link">
              <svg class="footer-link-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ t('sfmc.releases') }}
            </a>
            <router-link to="/" class="footer-link">
              <svg class="footer-link-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {{ t('sfmc.backToBlog') }}
            </router-link>
          </div>
        </div>
        <div class="footer-divider"></div>
        <p class="footer-note">{{ t('sfmc.footerNote') }}</p>
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

const REPO = 'StarFall-Minecraft-Launcher'
const STORAGE_KEY = 'sfmc-notice-dismissed'
const GITALK_SLUG = `sfmc-${REPO}-Message-Board`

const { t, locale } = useI18n()
const { loading, release, fetchLatest } = useLatestRelease(REPO)
const { init: initGitalk } = useGitalk('sfmc-gitalk-container', GITALK_SLUG, t('sfmc.appName'))

const repoUrl = `https://github.com/${config.github.owner}/${REPO}`
const releasesUrl = `${repoUrl}/releases`

const downloadSection = ref<HTMLElement | null>(null)
const showNoticeDialog = ref(false)

function checkNotice() {
  const dismissed = localStorage.getItem(STORAGE_KEY)
  if (!dismissed) {
    showNoticeDialog.value = true
  }
}

function closeNotice() {
  showNoticeDialog.value = false
}

function dismissNotice() {
  localStorage.setItem(STORAGE_KEY, '1')
  showNoticeDialog.value = false
}

useHead({
  title: computed(() => t('pageTitle.sfmc')),
  meta: [
    { name: 'description', content: computed(() => t('sfmc.subTagline')) },
    { property: 'og:title', content: 'StarFall Minecraft Launcher' },
    { property: 'og:description', content: computed(() => t('sfmc.subTagline')) },
    { property: 'og:type', content: 'website' },
    { name: 'theme-color', content: '#0f1419' },
  ],
  link: [
    { rel: 'icon', href: '/icons/ico.ico' },
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
      label: /x64/i.test(a.name) ? t('sfmc.downloads.x64') : t('sfmc.downloads.x86'),
    }))
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
  checkNotice()
  initGitalk()
})
</script>

<style lang="less" scoped>
// ===== 像素风主题变量（洞穴绿配色 - 低饱和度）=====
@bg-void: #1a1a1a;
@bg-obsidian: #2d2d2d;
@bg-deepslate: #3d3d3d;
@bg-stone: #252525;
@bg-surface: #2a2a2a;
@bg-card: #303030;

@text-primary: #E8E8E8;
@text-secondary: #A0A0A0;
@text-dim: #707070;
@text-accent: #50C878;
@text-accent-alt: #2E8B57;

@border-color: #3d3d3d;
@border-light: #505050;

@accent-blue: #50C878;
@accent-cyan: #2E8B57;
@accent-orange: #DAA520;

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

// ===== 像素化洞穴背景 =====
.starfield {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.cave-layer {
  position: absolute;
  inset: 0;
}

.cave-stone {
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 31px,
      rgba(61, 61, 61, 0.3) 31px,
      rgba(61, 61, 61, 0.3) 32px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 31px,
      rgba(61, 61, 61, 0.3) 31px,
      rgba(61, 61, 61, 0.3) 32px
    );
  background-size: 32px 32px;
}

.cave-darkness {
  background:
    radial-gradient(ellipse at 20% 20%, rgba(0, 0, 0, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(0, 0, 0, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.2) 0%, transparent 70%);
}

.cave-sparkles {
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 30% 60%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 50% 40%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 70% 80%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 90% 30%, rgba(255, 255, 255, 0.3), transparent),
    radial-gradient(1px 1px at 15% 75%, rgba(255, 255, 255, 0.2), transparent),
    radial-gradient(1px 1px at 85% 55%, rgba(255, 255, 255, 0.3), transparent);
  animation: twinkle 4s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

// ===== 像素化Minecraft元素 =====
.mc-pixel-elements {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

// 矿石方块
.ore-block {
  position: absolute;
  image-rendering: pixelated;
  animation: oreFloat 8s ease-in-out infinite;

  .ore-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 8px currentColor);
  }
}

.ore-1 {
  width: 48px;
  height: 48px;
  top: 12%;
  left: 8%;
  color: #4ac9e3;
  animation-delay: 0s;
}

.ore-2 {
  width: 40px;
  height: 40px;
  top: 25%;
  right: 10%;
  color: #50c878;
  animation-delay: 2s;
}

.ore-3 {
  width: 36px;
  height: 36px;
  top: 45%;
  left: 5%;
  color: #daa520;
  animation-delay: 4s;
}

.ore-4 {
  width: 44px;
  height: 44px;
  bottom: 30%;
  right: 8%;
  color: #cd5c5c;
  animation-delay: 6s;
}

@keyframes oreFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-12px) rotate(3deg); }
  50% { transform: translateY(-6px) rotate(-2deg); }
  75% { transform: translateY(-15px) rotate(1deg); }
}

// 火把
.torch {
  position: absolute;
  image-rendering: pixelated;
  animation: torchFlicker 0.5s ease-in-out infinite alternate;

  .torch-svg {
    width: 100%;
    height: 100%;
  }
}

.torch-1 {
  width: 24px;
  height: 40px;
  top: 35%;
  left: 15%;
  animation-delay: 0s;
}

.torch-2 {
  width: 24px;
  height: 40px;
  bottom: 45%;
  right: 15%;
  animation-delay: 0.25s;
}

@keyframes torchFlicker {
  0% { opacity: 0.85; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

// 镐子
.pickaxe {
  position: absolute;
  image-rendering: pixelated;
  animation: pickaxeSwing 6s ease-in-out infinite;

  .pickaxe-svg {
    width: 100%;
    height: 100%;
  }
}

.pickaxe-1 {
  width: 48px;
  height: 48px;
  top: 60%;
  left: 12%;
  animation-delay: 0s;
}

@keyframes pickaxeSwing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

// 合成台
.crafting-table {
  position: absolute;
  image-rendering: pixelated;
  animation: craftingPulse 4s ease-in-out infinite;

  .crafting-svg {
    width: 100%;
    height: 100%;
  }
}

.ct-1 {
  width: 48px;
  height: 48px;
  bottom: 20%;
  left: 20%;
  animation-delay: 0s;
}

@keyframes craftingPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

// ===== 底部地形轮廓 =====
.terrain-silhouette {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;

  svg {
    width: 100%;
    height: 100%;
  }
}

// ===== 导航条 =====
.sf-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: fade(@bg-obsidian, 95%);
  backdrop-filter: blur(8px);
  border-bottom: 3px solid @border-color;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
}

.sf-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 24px;
}

.sf-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
  filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.3));
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
  gap: 8px;
}

.sf-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 15px;
  color: @text-secondary;
  text-decoration: none;
  font-family: inherit;
  background: @bg-deepslate;
  border: 2px solid @border-color;
  border-bottom-width: 4px;
  cursor: pointer;
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

.nav-icon-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.sf-lang-btn {
  background: @bg-surface;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
  }
}

.sf-back-btn {
  background: fade(@accent-blue, 12%);
  border-color: fade(@accent-blue, 25%);

  &:hover {
    background: fade(@accent-blue, 20%);
  }
}

// ===== Hero 区域（保持不变）=====
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
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 16px;
  line-height: 1.1;
}

.title-icon {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  image-rendering: pixelated;
  animation: iconPulse 2s ease-in-out infinite;
  filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.5));
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.title-word {
  display: inline-block;
  font-weight: bold;
  text-shadow:
    3px 3px 0 @bg-void,
    -1px -1px 0 @bg-void,
    1px -1px 0 @bg-void,
    -1px 1px 0 @bg-void;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-6px) scale(1.05);
  }
}

.title-star {
  font-size: 64px;
  color: @accent-blue;
  letter-spacing: 4px;
  animation: wordFloat1 4s ease-in-out infinite;
}

.title-fall {
  font-size: 56px;
  color: @accent-cyan;
  letter-spacing: 3px;
  animation: wordFloat2 4.5s ease-in-out infinite;
}

.title-minecraft {
  font-size: 44px;
  color: @text-primary;
  letter-spacing: 2px;
  animation: wordFloat3 5s ease-in-out infinite;
}

.title-launcher {
  font-size: 32px;
  color: @accent-orange;
  letter-spacing: 2px;
  animation: wordFloat4 5.5s ease-in-out infinite;
}

@keyframes wordFloat1 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes wordFloat2 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes wordFloat3 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes wordFloat4 {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
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

// 响应式：小屏幕时居中
@media (max-width: 900px) {
  .sf-tagline {
    text-align: center;
  }

  .sf-subtagline {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
  }
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
  background: @bg-void;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.exe-icon {
  width: 48px;
  height: 48px;
  opacity: 0.3;
  image-rendering: pixelated;
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
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
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
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-3px) scale(1.02);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(2px) scale(0.98);
    border-bottom-width: 3px;
  }
}

.sf-btn-primary {
  background: linear-gradient(180deg, @accent-blue 0%, darken(@accent-blue, 10%) 100%);
  color: @text-primary;
  border-color: darken(@accent-blue, 20%);
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: linear-gradient(180deg, lighten(@accent-blue, 5%) 0%, @accent-blue 100%);
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.1),
      0 8px 20px fade(@accent-blue, 30%);
  }
}

.sf-btn-ghost {
  background: @bg-deepslate;
  color: @text-primary;
  border-color: @border-color;

  &:hover {
    background: @bg-stone;
    border-color: @border-light;
  }
}

.btn-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-icon-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-icon {
  font-size: 12px;
}

// ===== 通用 section =====
.sf-section {
  position: relative;
  z-index: 1;
  padding: 50px 24px;
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 36px;
}

.header-icon-svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sf-section-title {
  font-size: 24px;
  color: @text-primary;
  letter-spacing: 3px;
  text-shadow: 2px 2px 0 @bg-void;
  margin: 0;
}

// ===== Bento网格特性卡片 =====
.sf-features-section {
  background: linear-gradient(180deg, transparent 0%, fade(@bg-deepslate, 30%) 50%, transparent 100%);
}

.sf-bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
}

.sf-bento-card {
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 20px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: cardFadeIn 0.6s ease-out backwards;

  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: @accent-blue;
    box-shadow:
      inset -2px -2px 0 rgba(0, 0, 0, 0.2),
      inset 2px 2px 0 rgba(255, 255, 255, 0.03),
      0 12px 32px rgba(0, 0, 0, 0.4),
      0 0 20px fade(@accent-blue, 15%);
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

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bento-1 {
  grid-column: span 2;
  background: linear-gradient(135deg, @bg-card 0%, darken(@bg-card, 3%) 100%);
  animation-delay: 0s;
}

.bento-2 {
  animation-delay: 0.1s;
}

.bento-3 {
  animation-delay: 0.2s;
}

.bento-4 {
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation-delay: 0.3s;
}

.bento-5 {
  animation-delay: 0.4s;
}

.bento-6 {
  animation-delay: 0.5s;
}

.bento-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bento-card-deco {
  width: 12px;
  height: 12px;
  background: fade(@accent-blue, 30%);
  border: 2px solid @border-color;
}

.bento-card-footer {
  display: flex;
  gap: 4px;
  margin-top: 12px;
}

.bento-pixel {
  width: 8px;
  height: 8px;
  background: @border-color;

  &:first-child {
    background: fade(@accent-blue, 50%);
  }
}

.sf-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: @bg-deepslate;
  border: 2px solid @border-color;
  color: @accent-blue;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

// ===== 技术规格 - Minecraft物品栏风格 =====
.sf-tech-specs {
  background: linear-gradient(180deg, transparent 0%, fade(@bg-deepslate, 25%) 50%, transparent 100%);
}

.specs-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.specs-hotbar {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
}

.hotbar-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: @bg-surface;
  border: 2px solid @border-color;
  border-bottom-width: 3px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 80px;
  animation: slotFadeIn 0.5s ease-out backwards;

  &:hover {
    transform: translateY(-4px) scale(1.05);
    border-color: @accent-blue;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  &.active {
    background: fade(@accent-blue, 15%);
    border-color: @accent-blue;
    box-shadow: 0 0 16px fade(@accent-blue, 40%);
    animation: slotPulse 2s ease-in-out infinite;
  }
}

@keyframes slotFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slotPulse {
  0%, 100% { box-shadow: 0 0 12px fade(@accent-blue, 30%); }
  50% { box-shadow: 0 0 20px fade(@accent-blue, 50%); }
}

.slot-icon-svg {
  width: 28px;
  height: 28px;
}

.slot-label {
  font-size: 12px;
  color: @text-secondary;
  white-space: nowrap;
}

.hotbar-slot.active .slot-label {
  color: @accent-blue;
}

.specs-info-panel {
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 20px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  animation: panelSlideIn 0.6s ease-out;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: @bg-surface;
  border: 2px solid @border-color;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  animation: rowFadeIn 0.5s ease-out backwards;

  &:hover {
    border-color: @border-light;
    background: fade(@bg-deepslate, 50%);
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rowFadeIn {
  from {
    opacity: 0;
    transform: translateX(-15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-label {
  font-size: 14px;
  color: @text-secondary;
}

.info-value {
  font-size: 14px;
  color: @text-primary;

  &.highlight {
    color: @accent-cyan;
  }
}

// ===== 响应式补充 =====
@media (max-width: 600px) {
  .specs-hotbar {
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px;
  }

  .hotbar-slot {
    padding: 10px 12px;
    min-width: calc(33.33% - 6px);
  }

  .slot-icon {
    font-size: 20px;
  }

  .slot-label {
    font-size: 11px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 10px 12px;
  }
}

// ===== 留言板 =====
.sf-comments {
  background: linear-gradient(180deg, transparent 0%, fade(@bg-deepslate, 20%) 50%, transparent 100%);
}

.gitalk-container {
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  padding: 20px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);

  :deep(.gitalk-container) {
    padding: 0;
  }
}

// ===== 下载区 =====
.sf-download {
  background: linear-gradient(180deg, transparent 0%, fade(@bg-deepslate, 20%) 100%);
}

// ===== 鸣谢区域 =====
.acknowledgements {
  margin-top: 32px;
  padding: 20px 24px;
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  animation: ackFadeIn 0.8s ease-out;
}

.ack-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: bold;
  color: @text-primary;
  text-shadow: 1px 1px 0 @bg-void;
}

.ack-icon {
  width: 18px;
  height: 18px;
  color: @accent-orange;
  flex-shrink: 0;
  animation: heartBeat 2s ease-in-out infinite;
}

.ack-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 0;
    font-size: 13px;
    line-height: 1.6;
    color: @text-secondary;
    transition: all 0.2s ease;
    animation: ackItemFadeIn 0.5s ease-out backwards;

    &:hover {
      color: @text-primary;
      transform: translateX(4px);
    }

    & + li {
      border-top: 1px dashed @border-color;
    }
  }
}

.ack-bullet {
  width: 14px;
  height: 14px;
  margin-top: 3px;
  color: @accent-cyan;
  flex-shrink: 0;
}

@keyframes ackFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1); }
  75% { transform: scale(1.15); }
}

@keyframes ackItemFadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.download-container {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
  align-items: start;
}

.download-left {
  text-align: left;

  .section-header {
    justify-content: flex-start;
    margin-bottom: 16px;
  }
}

.download-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: @text-secondary;
  line-height: 1.7;
}

.link-arrow-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.all-releases-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: @accent-blue;
  text-decoration: none;
  padding: 8px 0;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    color: lighten(@accent-blue, 10%);
    transform: translateX(6px) scale(1.02);

    .link-arrow-svg {
      animation: arrowBounce 0.6s ease;
    }
  }
}

@keyframes arrowBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

.download-right {
  .download-box {
    background: @bg-card;
    border: 3px solid @border-color;
    border-bottom-width: 5px;
    padding: 24px;
    box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2), inset 2px 2px 0 rgba(255, 255, 255, 0.03);
  }
}

.download-status {
  margin: 0 0 16px;
  color: @text-secondary;
  font-size: 15px;
  text-align: center;

  &.error {
    color: @accent-orange;
  }
}

.loading-dots {
  &::after {
    content: '...';
    animation: loadingDots 1.5s steps(4, end) infinite;
  }
}

@keyframes loadingDots {
  0%, 25% { content: ''; }
  50% { content: '.'; }
  75% { content: '..'; }
  100% { content: '...'; }
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.version-badge {
  display: inline-block;
  padding: 6px 16px;
  background: fade(@accent-blue, 15%);
  border: 2px solid fade(@accent-blue, 40%);
  color: @accent-blue;
  font-size: 14px;
  animation: badgePulse 2s ease-in-out infinite;
}

.version-date {
  font-size: 13px;
  color: @text-dim;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 fade(@accent-blue, 0%);
  }
  50% {
    box-shadow: 0 0 12px fade(@accent-blue, 30%);
  }
}

.download-buttons {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}

// ===== 项目说明弹窗 - 像素风自定义 =====
.notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 14, 20, 0.85);
  backdrop-filter: blur(4px);
}

.notice-dialog {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: @bg-card;
  border: 3px solid @border-color;
  border-bottom-width: 5px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.2),
    inset 2px 2px 0 rgba(255, 255, 255, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.5);
  animation: noticeAppear 0.3s ease-out;
}

@keyframes noticeAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.notice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: @bg-deepslate;
  border-bottom: 3px solid @border-color;
}

.notice-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: fade(@accent-orange, 15%);
  border: 2px solid fade(@accent-orange, 40%);
  color: @accent-orange;

  svg {
    width: 18px;
    height: 18px;
  }
}

.notice-title {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  color: @text-primary;
  text-shadow: 2px 2px 0 @bg-void;
  letter-spacing: 1px;
}

.notice-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: @bg-surface;
  border: 2px solid @border-color;
  color: @text-secondary;
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    background: @accent-orange;
    border-color: @accent-orange;
    color: @text-primary;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.notice-body {
  padding: 24px;
}

.notice-content {
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: @text-secondary;
  }
}

.notice-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: @bg-deepslate;
  border-top: 3px solid @border-color;
}

.notice-btn {
  min-width: 100px;
  justify-content: center;
}

// 像素装饰角
.notice-pixel-deco {
  position: absolute;
  width: 8px;
  height: 8px;
  background: @border-color;
}

.notice-pixel-tl {
  top: -3px;
  left: -3px;
  background: @accent-blue;
}

.notice-pixel-tr {
  top: -3px;
  right: -3px;
  background: @accent-cyan;
}

.notice-pixel-bl {
  bottom: -3px;
  left: -3px;
  background: @accent-cyan;
}

.notice-pixel-br {
  bottom: -3px;
  right: -3px;
  background: @accent-blue;
}

// 过渡动画
.notice-dialog-enter-active {
  transition: all 0.3s ease-out;
}

.notice-dialog-leave-active {
  transition: all 0.2s ease-in;
}

.notice-dialog-enter-from,
.notice-dialog-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

// 响应式
@media (max-width: 600px) {
  .notice-dialog {
    max-width: 100%;
  }

  .notice-footer {
    flex-direction: column;
  }

  .notice-btn {
    width: 100%;
  }
}

// ===== 页脚 =====
.sf-footer {
  position: relative;
  z-index: 1;
  background: @bg-obsidian;
  border-top: 3px solid @border-color;
  margin-top: 20px;
  padding: 28px 24px 32px;
}

.footer-inner {
  max-width: 1100px;
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
  font-size: 15px;
  color: @text-primary;
}

.footer-icon {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
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
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    color: @accent-blue;
    transform: translateY(-2px);
  }
}

.footer-link-icon-svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.footer-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, @border-color, transparent);
  margin-bottom: 16px;
  animation: dividerExpand 1s ease-out;
}

@keyframes dividerExpand {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.footer-note {
  margin: 0;
  font-size: 13px;
  color: @text-dim;
  text-align: center;
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
    justify-content: center;
  }

  .hero-exe {
    aspect-ratio: 16 / 9;
  }

  .sf-bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-1 {
    grid-column: span 2;
  }

  .bento-4 {
    grid-row: span 1;
  }

  .download-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .download-left {
    text-align: center;

    .section-header {
      justify-content: center;
    }
  }

  .showcase-sidebar {
    width: 120px;
  }

  .footer-top {
    flex-direction: column;
    gap: 16px;
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
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sf-nav-links {
    gap: 6px;
  }

  .sf-nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }

  .logo-text {
    font-size: 15px;
  }

  .sf-title {
    gap: 4px 10px;
  }

  .title-icon {
    width: 40px;
    height: 40px;
  }

  .title-star {
    font-size: 44px;
  }

  .title-fall {
    font-size: 38px;
  }

  .title-minecraft {
    font-size: 30px;
  }

  .title-launcher {
    font-size: 24px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-exe {
    aspect-ratio: 4 / 3;
    min-height: 160px;
  }

  .sf-bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-1 {
    grid-column: span 1;
  }

  .showcase-content {
    flex-direction: column;
  }

  .showcase-sidebar {
    width: 100%;
    display: flex;
    overflow-x: auto;
    border-right: none;
    border-bottom: 3px solid @border-color;
  }

  .sidebar-item {
    flex: 1;
    text-align: center;
    padding: 10px 12px;
    white-space: nowrap;
  }

  .download-buttons {
    flex-direction: column;
    align-items: center;
  }

  .sf-section {
    padding: 36px 16px;
  }

  .footer-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 400px) {
  .sf-nav-links {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

// ===== 无障碍：减少动画（与Windows系统中的“窗口内的动画控件和元素”有冲突） =====
// @media (prefers-reduced-motion: reduce) {
//   .title-icon,
//   .title-word {
//     animation: none;
//   }

//   .mc-block {
//     animation: none;
//   }

//   .ore-block,
//   .torch,
//   .pickaxe,
//   .crafting-table {
//     animation: none;
//   }

//   .sf-bento-card,
//   .hotbar-slot,
//   .info-row,
//   .version-badge,
//   .acknowledgements,
//   .ack-icon,
//   .footer-divider {
//     animation: none;
//   }

//   .notice-dialog {
//     animation: none;
//   }

//   * {
//     transition: none !important;
//   }
// }
</style>
