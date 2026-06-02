<template>
  <div class="articles-view">
    <h1 class="page-title">{{ $t('articles.title') }}</h1>

    <div v-if="loading" class="status loading-text">
      <span class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </span>
      <span>{{ $t('common.loading') }}</span>
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
              <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
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
          <select v-model="pageSize" class="pagination-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useArticles } from '@/composables/useArticles'
import { useAppStore } from '@/stores/app'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'

const { fetchArticles, loading } = useArticles()
const store = useAppStore()

// 用 storeToRefs 保持响应式连接
const { articles } = storeToRefs(store)

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
const pageSize = ref(10)

// 筛选变化时重置到第一页
watch(filteredArticles, () => {
  currentPage.value = 1
})

// 每页条数变化时，若当前页超出总页数则跳到最后一页
watch(pageSize, () => {
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
</script>

<style lang="less" scoped>
/* ── 文章卡片入场动画（必须在最前面，避免被其他样式覆盖） ── */
.article-list-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.article-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.article-list-leave-active {
  transition: all 0.2s ease;
}

.article-list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.articles-view {
  max-width: 800px;
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

/* 文章卡片入场动画：从左往右滑入（依次入场） */
.article-list-enter-active {
  transition-property: opacity, transform;
  transition-duration: 0.35s;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
}

.article-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.article-list-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.article-list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
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

.tag {
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;

  &:hover {
    transform: scale(1.1) translateY(-1px);
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
