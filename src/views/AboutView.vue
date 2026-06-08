<template>
  <div class="about-view">
    <h1 class="page-title">{{ $t('about.title') }}</h1>

    <div class="about-card">
      <!-- Profile Header -->
      <div class="about-header">
        <div class="avatar-wrapper">
          <img :src="avatarUrl" alt="avatar" class="about-avatar" />
        </div>
        <div class="about-info">
          <h2 class="about-name">{{ name }}</h2>
          <p class="about-bio">{{ $t('about.bio') }}</p>
          <div class="about-tags">
            <span v-for="tag in profileTags" :key="tag" class="profile-tag">{{ tag }}</span>
          </div>
        </div>
      </div>

      <!-- Skills Section -->
      <div class="about-section">
        <h3 class="section-title">
          <span class="section-icon">⚡</span>
          {{ $t('about.skills') }}
        </h3>
        <div class="skill-categories">
          <div
            v-for="(category, ci) in skillCategories"
            :key="category.title"
            class="skill-category"
            :style="{ '--cat-index': ci }"
          >
            <div class="skill-category-title">{{ category.title }}</div>
            <div class="skill-tags">
              <span
                v-for="skill in category.skills"
                :key="skill"
                class="skill-tag"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Section -->
      <div class="about-section">
        <h3 class="section-title">
          <span class="section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          {{ $t('about.timeline') }}
        </h3>
        <div class="timeline">
          <div
            v-for="(item, i) in timelineItems"
            :key="i"
            class="timeline-item"
            :class="{ 'is-first': i === 0, 'is-last': i === timelineItems.length - 1 }"
            :style="{ '--item-index': i }"
          >
            <div class="timeline-marker">
              <div class="timeline-dot">
                <svg v-if="i === 0" class="dot-icon" width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div class="timeline-pulse"></div>
            </div>
            <div class="timeline-card">
              <div class="timeline-card-top">
                <span class="timeline-date">
                  <svg class="date-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ item.date }}
                </span>
                <span class="timeline-line"></span>
                <span v-if="i === 0" class="timeline-badge">{{ $t('about.timelineLatestBadge') }}</span>
              </div>
              <div class="timeline-title">{{ item.title }}</div>
              <div class="timeline-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Section -->
      <div class="about-section">
        <h3 class="section-title">
          <span class="section-icon">✉️</span>
          {{ $t('about.contact') }}
        </h3>
        <div class="contact-grid">
          <a
            v-for="link in contactLinks"
            :key="link.label"
            :href="link.href"
            :target="link.external ? '_blank' : undefined"
            class="contact-card"
          >
            <span class="contact-icon">{{ link.icon }}</span>
            <span class="contact-label">{{ link.label }}</span>
            <span class="contact-value">{{ link.value }}</span>
            <span class="contact-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageSeo } from '@/composables/useSeo'

// SEO
usePageSeo('关于', '了解 Turing_ICE 的背景、技能和联系方式', '#/about')

const { t } = useI18n()

const name = 'Turing_ICE'
const avatarUrl = 'https://foruda.gitee.com/avatar/1682216074543204020/12834578_turing-ice_1682216074.png'

const profileTags = ['Java', 'C#', 'Vue']

interface SkillCategory {
  title: string
  skills: string[]
}

const skillCategories = computed<SkillCategory[]>(() => [
  {
    title: t('about.skillsBackend'),
    skills: ['Java', 'C#', 'Spring Boot', 'MySQL'],
  },
  {
    title: t('about.skillsFrontend'),
    skills: ['Vue', 'JavaScript', 'WPF'],
  },
  {
    title: t('about.skillsTools'),
    skills: ['Git', 'Docker', 'Linux', 'Claude Code'],
  },
])

interface TimelineItem {
  date: string
  title: string
  desc: string
}

const timelineItems = computed<TimelineItem[]>(() => [
  { date: '2024-2026', title: t('about.timelineItem1Title'), desc: t('about.timelineItem1Desc') },
  { date: '2022-2023', title: t('about.timelineItem2Title'), desc: t('about.timelineItem2Desc') },
  { date: '2019-2022', title: t('about.timelineItem3Title'), desc: t('about.timelineItem3Desc') },
  { date: '2016-2018', title: t('about.timelineItem4Title'), desc: t('about.timelineItem4Desc') },
  { date: '2009-2015', title: t('about.timelineItem5Title'), desc: t('about.timelineItem5Desc') },
])

interface ContactLink {
  icon: string
  label: string
  value: string
  href: string
  external: boolean
}

const contactLinks = computed<ContactLink[]>(() => [
  {
    icon: '🐙',
    label: 'GitHub',
    value: 'Turing158',
    href: 'https://github.com/Turing158',
    external: true,
  },
  {
    icon: '📧',
    label: t('about.email'),
    value: '15818961209@163.com',
    href: 'mailto:15818961209@163.com',
    external: false,
  },
])
</script>

<style lang="less" scoped>
.about-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.about-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 12px var(--shadow);
}

// ── Profile Header ──
.about-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, var(--accent), var(--accent-hover), var(--accent));
    animation: avatar-ring-spin 4s linear infinite;
  }
}

@keyframes avatar-ring-spin {
  to { transform: rotate(360deg); }
}

.about-avatar {
  position: relative;
  z-index: 1;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: block;
}

.about-info {
  flex: 1;
}

.about-name {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.about-bio {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.6;
}

.about-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-tag {
  display: inline-block;
  padding: 3px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
  cursor: default;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    box-shadow: 0 4px 12px var(--shadow);
  }
}

// ── Section Titles ──
.about-section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.section-icon {
  font-size: 1.1rem;
}

// ── Skills — Tag Cloud Style ──
.skill-categories {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skill-category {
  opacity: 0;
  animation: fade-slide-in 0.5s ease forwards;
  animation-delay: calc(var(--cat-index) * 0.1s);
}

@keyframes fade-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skill-category-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  display: inline-block;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: default;
  transition: all 0.25s ease;
  &:hover {
    color: var(--accent);
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
}

// ── Timeline — Card Style ──
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 16px;

  // 中轴线 — 渐变而非纯色
  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--border) 10%,
      var(--border) 90%,
      transparent 100%
    );
  }
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  opacity: 0;
  animation: timeline-item-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.15s);

  &:hover {
    .timeline-card {
      border-color: color-mix(in srgb, var(--accent) 25%, transparent);
      background: color-mix(in srgb, var(--accent) 4%, transparent);
      box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 8%, transparent);
      transform: translateX(4px);
    }

    .timeline-dot {
      background: var(--accent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent),
                  0 0 12px color-mix(in srgb, var(--accent) 30%, transparent);
    }

    .timeline-date {
      color: var(--accent);
    }

    .timeline-line {
      width: 32px;
      opacity: 1;
    }
  }

  &.is-first {
    .timeline-date {
      color: var(--accent);
    }

    .timeline-dot {
      background: var(--accent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent);
    }
  }
}

@keyframes timeline-item-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 左侧节点区域
.timeline-marker {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid color-mix(in srgb, var(--accent) 50%, transparent);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  z-index: 1;
}

.timeline-pulse {
  position: absolute;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  z-index: 0;
}

.is-first .timeline-pulse {
  animation: timeline-pulse 2.5s ease-out infinite;
}

@keyframes timeline-pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

// 右侧卡片区域
.timeline-card {
  flex: 1;
  padding: 16px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: default;
  position: relative;
  overflow: hidden;

  // 左侧强调条
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--accent);
    opacity: 0;
    transform: scaleY(0);
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover::before {
    opacity: 1;
    transform: scaleY(1);
  }
}

.timeline-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.timeline-date {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  flex-shrink: 0;
}

.timeline-line {
  display: inline-block;
  height: 1px;
  width: 16px;
  background: var(--border);
  opacity: 0.5;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  flex-shrink: 0;
}

.timeline-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.timeline-desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

// ── Contact Cards ──
.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    transform: translateX(4px);

    .contact-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    .contact-icon {
      transform: scale(1.15);
    }
  }
}

.contact-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.contact-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 60px;
}

.contact-value {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.contact-arrow {
  font-size: 1rem;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.25s ease;
}

// ── Reduced Motion ──
// 仅关闭大幅度的入场/循环动画，保留 hover 的小幅过渡反馈
@media (prefers-reduced-motion: reduce) {
  .avatar-wrapper::before {
    animation: none;
  }

  .skill-category,
  .timeline-item {
    animation: none;
    opacity: 1;
  }

  .timeline-pulse {
    animation: none;
  }
}

// ── Responsive ──
@media (max-width: 480px) {
  .about-header {
    flex-direction: column;
    text-align: center;
  }

  .about-tags {
    justify-content: center;
  }

  .contact-card {
    flex-wrap: wrap;
  }

  .timeline-card {
    padding: 14px 16px;
  }
}
</style>
