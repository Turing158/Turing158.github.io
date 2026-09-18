<template>
  <div class="article-detail">
    <Transition name="loader-pop" mode="out-in" appear>
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
            <span v-for="tag in article.tags" :key="tag" class="tag px-fade">{{ tag }}</span>
          </div>
        </header>

        <GrassTerrainDivider class="article-divider" />
  
        <!-- 内容区不做 out-in 过渡：本地加载常在 16ms 内完成，分支同帧挂载又切换会冻结过渡（卡"加载中/失败"），
             加载器自身有旋转动画，秒切即可 -->
        <MarkdownRenderer v-if="article.html" ref="mdRef" :html="article.html" />
        <div v-else-if="htmlLoading" class="status cube-anim">
          <CubeLoader :text="$t('common.loading')" />
        </div>
        <!-- 首次尝试前不渲染错误分支，避免未尝试就闪现错误 -->
        <div v-else-if="htmlAttempted" class="status">
          {{ htmlError || $t('common.error') }}
          <div style="margin-top: 12px;">
            <Button size="small" @click="ensureArticleHtml">{{ $t('common.retry') }}</Button>
          </div>
        </div>
  
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

      <div v-else-if="loading" class="status cube-anim">
        <CubeLoader :text="$t('common.loading')" />
      </div>
      <!-- 首次加载完成前不渲染错误分支：否则挂载帧先入错误分支、同帧数据就绪再切分支，
           out-in + appear 会在快速切换中被冻结，页面卡在"加载失败" -->
      <div v-else-if="loadAttempted" class="status">{{ $t('common.error') }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import CubeLoader from '@/components/common/CubeLoader.vue'
import ShareButtons from '@/components/article/ShareButtons.vue'
import { useArticles, loadArticleHtml } from '@/composables/useArticles'
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
import { useAchievements } from '@/composables/useAchievements'
import { registerContextProvider } from '@/composables/contextMenuRegistry'
import BlogTip from '@/plugins/blog-tip'
import GrassTerrainDivider from '@/components/common/GrassTerrainDivider.vue'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
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
const htmlLoading = ref(false)
const htmlError = ref<string | null>(null)
const loadAttempted = ref(false)
const htmlAttempted = ref(false)

// 浏览量（useViewCount 内部 onMounted 自动递增）
const { viewCount } = useViewCount(slug.value)

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

// 内层 out-in 过渡需等加载占位动画离场结束后才挂载 MarkdownRenderer，
// nextTick 时机 mdRef 仍为 null，因此改为侦听渲染器就绪后再提取标题
watch(
  [mdRef, () => article.value?.html],
  ([renderer, html]) => {
    if (renderer && html) updateHeadings()
  },
  { flush: 'post' }
)

let gitalkObserver: MutationObserver | undefined

const initGitalk = () => {
  const container = document.getElementById('gitalk-container')
  if (!container) return
  container.innerHTML = ''

  const gitalk = new Gitalk({
    clientID: config.gitalk.clientID,
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

  // textarea 是替换元素没有伪元素，像素帧叠加层须挂在同盒包裹层上；
  // gitalk（React）可能整体重绘评论区，observer 保证包裹层一直在场
  gitalkObserver?.disconnect()
  const wrapTextarea = () => {
    const ta = container.querySelector('.gt-header-textarea')
    if (!ta || ta.parentElement?.classList.contains('gt-textarea-wrap')) return
    const wrap = document.createElement('span')
    wrap.className = 'gt-textarea-wrap'
    ta.replaceWith(wrap)
    wrap.appendChild(ta)
  }
  wrapTextarea()
  gitalkObserver = new MutationObserver(wrapTextarea)
  gitalkObserver.observe(container, { childList: true, subtree: true })
}

// 外层 out-in 过渡会延迟评论容器挂载，内容加载过快时容器尚未出现，短暂重试等待
const initGitalkWhenReady = (retries = 20) => {
  if (document.getElementById('gitalk-container')) {
    initGitalk()
  } else if (retries > 0) {
    setTimeout(() => initGitalkWhenReady(retries - 1), 50)
  }
}

// 两阶段加载：fetchArticles 仅加载元数据（轻量），ensureArticleHtml 按需获取渲染 HTML
async function ensureArticleHtml() {
  if (!article.value) return
  if (article.value.html) return  // 已由 loadArticleHtml 填充或预存在 store

  htmlLoading.value = true
  htmlError.value = null
  try {
    await loadArticleHtml(slug.value)
  } catch (e: any) {
    htmlError.value = e?.message || 'Failed to load article content'
  } finally {
    htmlLoading.value = false
    htmlAttempted.value = true
  }
}

async function loadArticle() {
  // 切换文章时重置，避免上一篇文章的"已尝试"状态让错误分支抢跑渲染
  htmlAttempted.value = false
  await fetchArticles()
  loadAttempted.value = true

  // 标题由 useArticleSeo 响应 article 变化自动更新

  // useViewCount 内部 onMounted 已自动调用递增

  // 成就系统：记录文章访问（用于 bookworm 成就：访问 5 篇不同文章）
  if (slug.value) {
    useAchievements().addVisitedArticle(slug.value)
  }

  // 按需加载 HTML（local 走 fetch 预渲染文件，GitHub 走运行时渲染兜底）
  await ensureArticleHtml()

  nextTick(() => {
    updateHeadings()
    initGitalkWhenReady()
  })
}

onMounted(loadArticle)

watch(() => slug.value, loadArticle)

watch(locale, () => {
  nextTick(initGitalkWhenReady)
})

// ── 右键菜单上下文提供者 ──
const unregisterContextMenu = registerContextProvider((target) => {
  // 仅在文章详情区域右键时提供
  if (!target.closest('.article-detail')) return []

  const items = []

  // 返回顶部
  items.push({
    id: 'scroll-to-top',
    label: t('contextMenu.scrollToTop'),
    icon: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
  })

  // 随机文章
  items.push({
    id: 'random-article',
    label: t('contextMenu.randomArticle'),
    icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M8 12h8M8 8h8M8 16h5"/>',
    action: () => {
      const slugs = store.articles.map(a => a.slug)
      if (slugs.length === 0) return
      const randomSlug = slugs[Math.floor(Math.random() * slugs.length)]
      router.push(`/article/${randomSlug}`)
    },
  })

  // 复制文章链接
  items.push({
    id: 'copy-article-link',
    label: t('contextMenu.copyLink'),
    icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    action: () => {
      const url = `${window.location.origin}${window.location.pathname}#/article/${slug.value}`
      navigator.clipboard.writeText(url).then(() => {
        BlogTip.show(t('tools.copied'), { type: 'success', duration: 2000 })
      }).catch(() => {
        BlogTip.show(t('contextMenu.copyFailed'), { type: 'error', duration: 2000 })
      })
    },
  })

  return items
})

onUnmounted(() => {
  unregisterContextMenu()
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
  margin-bottom: 6px;
}

.article-divider {
  margin-bottom: 32px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  --pxs: 3px; clip-path: var(--pxc);

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
  --pxs: 3px; clip-path: var(--pxc);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border: 1px solid transparent; border-image: var(--px-frame-accent-faint) 6 / calc(2 * var(--pxs)) stretch;
  transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: default;

  svg {
    opacity: 0.75;
    flex-shrink: 0;
  }

  &:hover {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 12%, transparent);
  }
}

.tag {
  display: inline-block;
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 2px 10px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  cursor: default;
  transition: all 0.25s ease;

  &:hover {
    color: #fff;
    background: var(--accent);
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
  --pxs: 2px; clip-path: var(--pxc);
}

.status {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 1.1rem;
}
</style>
