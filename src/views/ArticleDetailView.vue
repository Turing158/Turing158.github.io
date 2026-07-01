<template>
  <div class="article-detail">
    <article class="article-content" v-if="article">
      <!-- 顶部按钮行 -->
      <div class="header-bar">
        <Button type="primary" class="back-button" @click="goBack">
          <svg class="back-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Button>
      </div>

      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="article-date" :title="formatFullTime(article.date)">{{ $t('articles.publishedAt') }} {{ formatRelativeTime(article.date) }}</span>
          <span v-if="article.readingTime" class="article-reading-time" :title="`预计阅读 ${article.readingTime} 分钟`">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {{ $t('articles.readingTime', { time: article.readingTime }) }}
          </span>
          <!-- 浏览量 -->
          <span v-if="viewCount > 0" class="article-views-badge" :title="`${viewCount} 次浏览`">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {{ formatViewCount(viewCount) }}
          </span>
          <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </header>

      <MarkdownRenderer ref="mdRef" :html="article.html" />

      <!-- 分享按钮 -->
      <ShareButtons
        v-if="article"
        :title="article.title"
        :description="article.description"
      />

      <section class="gitalk-section">
        <h3 class="gitalk-title">{{ $t('comments.title') }}</h3>
        <div id="gitalk-container"></div>
      </section>
    </article>

    <div v-else-if="loading" class="status loading-text">
      <span class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </span>
      <span>{{ $t('common.loading') }}</span>
    </div>
    <div v-else class="status">{{ $t('common.error') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import ShareButtons from '@/components/article/ShareButtons.vue'
import { useArticles } from '@/composables/useArticles'
import { useArticleSeo } from '@/composables/useSeo'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import { Button } from 'animal-island-vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import { useViewCount } from '@/composables/useViewCount'
import { formatViewCount } from '@/utils/formatViewCount'
import Gitalk from 'gitalk'
import '../styles/gitalk-theme.css'
import type { TocHeading } from '@/components/article/ArticleTOCDrawer.vue'
import { config } from '@/config'
import { updateDocumentTitle } from '@/router'
import { useAchievements } from '@/composables/useAchievements'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const { fetchArticles, loading } = useArticles()
const store = useAppStore()

const slug = computed(() => route.params.slug as string)

const article = computed(() =>
  store.articles.find((a) => a.slug === slug.value)
)

// SEO 优化（必须在 article 之后声明）
const articleForSeo = computed(() => {
  if (!article.value) return null
  return {
    title: article.value.title,
    description: article.value.description,
    date: article.value.date,
    tags: article.value.tags,
    cover: article.value.cover,
    slug: article.value.slug,
  }
})
useArticleSeo(articleForSeo)

// 返回：有历史记录则返回上一页，否则回到文章列表
const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/articles')
  }
}

const mdRef = ref<InstanceType<typeof MarkdownRenderer> | null>(null)
const headings = ref<TocHeading[]>([])

// 浏览量
const { viewCount, incrementViewCount } = useViewCount(slug.value)

// 将 headings 传递给 layout 中的 TOC
const updateHeadings = () => {
  if (mdRef.value) {
    headings.value = mdRef.value.getHeadings()
    // 通过 layout 暴露的方法传递 headings
    if (typeof window !== 'undefined' && (window as any).__updateTocHeadings) {
      (window as any).__updateTocHeadings(headings.value)
    }
  }
}

const initGitalk = () => {
  const container = document.getElementById('gitalk-container')
  if (!container) return
  container.innerHTML = ''

  const gitalk = new Gitalk({
    clientID: config.gitalk.clientID,
    clientSecret: config.gitalk.clientSecret,
    repo: config.github.repo,
    owner: config.github.owner,
    admin: [config.github.owner],
    id: slug.value,
    title: article.value?.title || slug.value,
    body: article.value?.title || slug.value,
    distractionFreeMode: false,
    language: locale.value === 'zh-CN' ? 'zh-CN' : 'en',
    proxy: config.gitalk.proxy,
  })
  gitalk.render('gitalk-container')
}

onMounted(async () => {
  await fetchArticles()

  // 文章标题加载完成后更新浏览器标题
  if (article.value?.title) {
    updateDocumentTitle(article.value.title)
  }

  // 增加浏览量
  incrementViewCount()

  // 成就系统：记录文章访问（用于 bookworm 成就：访问 5 篇不同文章）
  if (slug.value) {
    useAchievements().addVisitedArticle(slug.value)
  }

  nextTick(() => {
    updateHeadings()
    initGitalk()
  })
})

watch(locale, () => {
  nextTick(initGitalk)
})
</script>

<style lang="less" scoped>
.article-detail {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;

  .back-icon {
    transition: transform 0.2s ease;
  }

  &:hover .back-icon {
    transform: translateX(-3px);
  }
}

.article-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.4;
  color: var(--text-primary);
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.article-date {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.article-reading-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 0.85rem;

  svg {
    opacity: 0.7;
  }
}

.article-views-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: default;

  svg {
    opacity: 0.75;
    flex-shrink: 0;
  }

  &:hover {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 12%, transparent);
  }
}

.tag {
  display: inline-block;
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border);
  cursor: default;
  transition: all 0.25s ease;

  &:hover {
    color: #fff;
    background: var(--accent);
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent);
  }
}

.gitalk-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.gitalk-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.25em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gitalk-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.1em;
  background: var(--accent);
  border-radius: 2px;
}

.status {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 1.1rem;
}
</style>
