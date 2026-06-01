<template>
  <div class="article-detail">
    <article class="article-content" v-if="article">
      <Button class="back-button" type="primary" @click="goBack">
        <span class="back-arrow">⬅</span>
      </Button>

      <header class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="article-date" :title="formatFullTime(article.date)">{{ $t('articles.publishedAt') }} {{ formatRelativeTime(article.date) }}</span>
          <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </header>

      <MarkdownRenderer ref="mdRef" :html="article.html" />

      <section class="gitalk-section">
        <h3 class="gitalk-title">{{ $t('comments.title') }}</h3>
        <div id="gitalk-container"></div>
      </section>
    </article>

    <div v-else-if="loading" class="status">{{ $t('common.loading') }}</div>
    <div v-else class="status">{{ $t('common.error') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { useArticles } from '@/composables/useArticles'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import { Button } from 'animal-island-vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import Gitalk from 'gitalk'
import '../styles/gitalk-theme.css'
import type { TocHeading } from '@/components/article/ArticleTOCDrawer.vue'
import { config } from '@/config'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const { fetchArticles, loading } = useArticles()
const store = useAppStore()

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

const slug = computed(() => route.params.slug as string)

const article = computed(() =>
  store.articles.find((a) => a.slug === slug.value)
)

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
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
  position: relative;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  .back-arrow {
    font-size: 1.1rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    .back-arrow {
      transform: translateX(-4px);
    }
  }

  &:active {
    transform: scale(0.97);
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
    transform: translateY(-2px);
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
