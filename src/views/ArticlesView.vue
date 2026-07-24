<template>
  <div class="articles-view">
    <h1 class="page-title">{{ $t('articles.title') }}</h1>

    <div v-if="loading" class="status loading-text">
      <span>{{ $t('common.loading') }}</span>
      <span class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </span>

    </div>
    <div v-else-if="articles.length === 0" class="status">{{ $t('articles.noArticles') }}</div>

    <div v-else>
      <!-- 标签筛选区 -->
      <div class="tag-filter">
        <div class="tag-filter-list">
          <button
            v-for="tag in allTags"
            :key="tag"
            class="tag-filter-item"
            :class="{ 'tag-filter-item--active': selectedTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
          <Transition name="reset-btn">
            <button
              v-if="selectedTags.length > 0"
              class="tag-filter-reset"
              @click="selectedTags = []"
            >
              {{ $t('articles.tagReset') }}
            </button>
          </Transition>
        </div>
      </div>

      <!-- 文章列表 -->
      <TransitionGroup
        v-if="showCards"
        name="article-list"
        tag="div"
        class="articles-list"
        appear
      >
        <router-link
          v-for="(article, index) in pagedArticles"
          :key="article.slug"
          :to="`/article/${article.slug}`"
          class="article-card"
          :style="{ '--delay': index * 60 + 'ms' }"
        >
          <div class="article-card-content">
            <h2 class="article-card-title">{{ article.title }}</h2>
            <p class="article-card-desc">{{ article.description }}</p>
            <div class="article-card-meta">
              <span class="article-card-date" :title="formatFullTime(article.date)">{{ formatRelativeTime(article.date) }}</span>
              <span v-if="article.readingTime" class="article-card-reading-time" :title="`预计阅读 ${article.readingTime} 分钟`">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ $t('articles.readingTime', { time: article.readingTime }) }}
              </span>
              <!-- 浏览量 -->
              <span class="article-card-views">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <template v-if="viewCountsLoading">
                  <span class="views-spinner" />
                </template>
                <template v-else-if="viewCounts[article.slug] !== undefined">
                  {{ formatViewCount(viewCounts[article.slug]) }}
                </template>
                <template v-else>
                  ---
                </template>
              </span>
              <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
              <!-- 评论计数 -->
              <span
                v-if="commentCounts[article.slug] !== undefined"
                class="article-card-comments"
                :title="`${commentCounts[article.slug]} 条评论`"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {{ commentCounts[article.slug] }}
              </span>
            </div>
          </div>
        </router-link>
      </TransitionGroup>

      <!-- 无匹配提示 -->
      <div v-if="filteredArticles.length === 0" class="status">
        {{ $t('articles.noMatch') }}
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          {{ $t('articles.prev') }}
        </button>

        <div class="pagination-pages">
          <button
            v-for="page in pageNumbers"
            :key="page"
            class="pagination-page"
            :class="{ 'pagination-page--active': page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          {{ $t('articles.next') }}
        </button>

        <div class="pagination-size">
          <span>{{ $t('articles.perPage') }}</span>
          <BlogSelect
            v-model="pageSizeOption"
            :options="pageSizeOptions"
            :clearable="false"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticles } from '@/composables/useArticles'
import { usePageSeo } from '@/composables/useSeo'
import { useAppStore } from '@/stores/app'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'
import { useGitalkCounts } from '@/composables/useGitalkCount'
import { useViewCounts } from '@/composables/useViewCount'
import { formatReadingTime } from '@/composables/useReadingTime'
import { formatViewCount } from '@/utils/formatViewCount'
import { registerContextProvider } from '@/composables/contextMenuRegistry'
import { useI18n } from 'vue-i18n'
import BlogTip from '@/plugins/blog-tip'
import BlogSelect from '@/components/common/BlogSelect.vue'

// SEO
usePageSeo('文章', '查看所有技术文章和教程', '#/articles')

const { fetchArticles, loading } = useArticles()
const store = useAppStore()

// 用 storeToRefs 保持响应式连接
const { articles } = storeToRefs(store)

// 评论计数
const slugs = computed(() => articles.value.map(a => a.slug))
const { counts: commentCounts } = useGitalkCounts(slugs.value)

// 浏览量（传入 getter 函数以支持响应式追踪）
const { counts: viewCounts, loading: viewCountsLoading } = useViewCounts(() => slugs.value)

// 所有唯一标签
const allTags = computed(() => {
  const tagSet = new Set<string>()
  articles.value.forEach(article => {
    article.tags?.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
})

// 选中的标签
const selectedTags = ref<string[]>([])

// 切换标签选中状态
const toggleTag = (tag: string) => {
  const idx = selectedTags.value.indexOf(tag)
  if (idx === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(idx, 1)
  }
}

// 筛选后的文章（选中标签为 OR 关系；未选中任何标签时显示全部）
const filteredArticles = computed(() => {
  if (selectedTags.value.length === 0) return articles.value
  return articles.value.filter(article =>
    article.tags?.some(tag => selectedTags.value.includes(tag))
  )
})

// 分页
const currentPage = ref(1)
const pageSizeOptions = [
  { label: '5', value: '5' },
  { label: '10', value: '10' },
  { label: '20', value: '20' },
  { label: '50', value: '50' },
]
const pageSizeOption = ref(pageSizeOptions[1])
const pageSize = computed(() => Number(pageSizeOption.value.value))

// 筛选变化时重置到第一页
watch(filteredArticles, () => {
  currentPage.value = 1
})

// 每页条数变化时，若当前页超出总页数则跳到最后一页
watch(pageSizeOption, () => {
  const lastPage = Math.max(1, Math.ceil(filteredArticles.value.length / pageSize.value))
  if (currentPage.value > lastPage) {
    currentPage.value = lastPage
  }
})

// 总页数
const totalPages = computed(() => {
  if (filteredArticles.value.length === 0) return 1
  return Math.ceil(filteredArticles.value.length / pageSize.value)
})

// 当前页的文章
const pagedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredArticles.value.slice(start, start + pageSize.value)
})

// 页码列表（简单显示所有页码）
const pageNumbers = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

const showCards = ref(false)

onMounted(async () => {
  await fetchArticles()
  await nextTick()
  showCards.value = true
})

// ── 右键菜单上下文提供者 ──
const { t } = useI18n()
const router = useRouter()

const unregisterContextMenu = registerContextProvider((target) => {
  // 仅在文章列表区域右键时提供
  if (!target.closest('.articles-view')) return []

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
      const slugs = articles.value.map(a => a.slug)
      if (slugs.length === 0) return
      const randomSlug = slugs[Math.floor(Math.random() * slugs.length)]
      router.push(`/article/${randomSlug}`)
    },
  })

  // 复制文章链接
  items.push({
    id: 'copy-articles-link',
    label: t('contextMenu.copyLink'),
    icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    action: () => {
      const url = `${window.location.origin}${window.location.pathname}#/articles`
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
/* ── TransitionGroup 动画 ─────────────────────────── */
/* 入场：从左滑入，依次延迟 */
.article-list-enter-active {
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
}

.article-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

/* 出场：淡出 + 离开文档流，让剩余卡片可立即开始 FLIP 过渡 */
.article-list-leave-active {
  position: absolute;
  width: 100%;
  transition: opacity 0.25s ease;
}

.article-list-leave-to {
  opacity: 0;
}

/* 关键：move 类让剩余卡片在位置上平滑过渡（FLIP 动画） */
.article-list-move {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.articles-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.status {
  text-align: center;
  color: var(--text-secondary);
  padding: 48px;
  font-size: 1.1rem;
}

/* ── 标签筛选 ─────────────────────────────────── */
.tag-filter {
  margin-bottom: 24px;
}

.tag-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-filter-item {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 2px 8px var(--shadow);
  }

  &:active {
    transform: translateY(0);
  }

  &--active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);

    &:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px var(--shadow);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.tag-filter-reset {
  background: transparent;
  color: var(--text-secondary);
  border: 1px dashed var(--text-secondary);
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, border-style 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    border-style: solid;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px var(--shadow);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 重置按钮出现/消失动画 */
.reset-btn-enter-active,
.reset-btn-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.reset-btn-enter-from {
  opacity: 0;
  transform: translateX(-8px) scale(0.9);
}

.reset-btn-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.9);
}

/* ── 文章列表 ─────────────────────────────────── */
.articles-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

.article-card-title {
  font-size: 1.3rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.article-card-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.6;
}

.article-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.article-card-date {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.article-card-reading-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 0.8rem;

  svg {
    opacity: 0.7;
  }

  &:hover {
    color: var(--accent);

    svg {
      opacity: 1;
    }
  }
}

.article-card-views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--accent);
  font-size: 0.75rem;
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

  .views-spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: views-spin 0.6s linear infinite;
  }
}

@keyframes views-spin {
  to {
    transform: rotate(360deg);
  }
}

.article-card-comments {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-left: auto;

  svg {
    opacity: 0.7;
  }

  &:hover {
    color: var(--accent);

    svg {
      opacity: 1;
    }
  }
}

.tag {
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;

  &:hover {
    transform: scale(1.08) translateY(-1px);
    border-color: var(--accent);
    box-shadow: 0 2px 8px var(--shadow);
  }
}

/* ── 分页 ─────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.pagination-btn {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-page {
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
  }

  &--active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);

    &:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
      color: #fff;
    }
  }
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.pagination-select {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  outline: none;

  &:hover {
    border-color: var(--accent);
  }
}
</style>
