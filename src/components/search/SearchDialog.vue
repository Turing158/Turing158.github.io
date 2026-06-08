<template>
  <BlogDialog
    v-model="visible"
    :title="$t('search.title')"
    width="800px"
    max-height="80vh"
    :on-open="onDialogOpen"
  >
    <div class="search-dialog-body">
      <!-- 搜索输入框 -->
      <BlogInput
        ref="inputRef"
        v-model="query"
        :placeholder="$t('search.placeholder')"
      >
        <template #prefix>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </template>
      </BlogInput>

      <!-- 搜索类型 Tabs -->
      <div class="search-tabs">
        <button
          class="search-tab"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          {{ $t('search.tabAll') }}
          <span v-if="query" class="tab-count">{{ counts.all }}</span>
        </button>
        <button
          class="search-tab"
          :class="{ active: activeTab === 'article' }"
          @click="activeTab = 'article'"
        >
          {{ $t('search.tabArticles') }}
          <span v-if="query" class="tab-count">{{ counts.article }}</span>
        </button>
        <button
          class="search-tab"
          :class="{ active: activeTab === 'project' }"
          @click="activeTab = 'project'"
        >
          {{ $t('search.tabProjects') }}
          <span v-if="query" class="tab-count">{{ counts.project }}</span>
        </button>
        <button
          class="search-tab"
          :class="{ active: activeTab === 'release' }"
          @click="activeTab = 'release'"
        >
          {{ $t('search.tabReleases') }}
          <span v-if="query" class="tab-count">{{ counts.release }}</span>
        </button>
      </div>

      <!-- 状态提示 -->
      <div v-if="loading" class="search-status">
        <div class="search-spinner" />
        <span>{{ $t('search.loading') }}</span>
      </div>
      <div v-else-if="!query" class="search-status">
        <span class="search-hint-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <span>{{ $t('search.startTyping') }}</span>
        <span class="search-shortcut-hint">{{ $t('search.shortcut') }}</span>
      </div>
      <div v-else-if="results.length === 0" class="search-status">
        <span class="search-hint-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <span>{{ $t('search.noResults') }}</span>
      </div>

      <!-- 搜索结果 -->
      <div v-else class="search-results">
        <div class="search-results-count">
          {{ $t('search.resultsCount', { n: results.length }) }}
        </div>
        <div class="search-results-grid">
          <SearchCard
            v-for="result in results"
            :key="`${result.type}-${result.id}`"
            :result="result"
            :query="query"
            :should-close="() => (visible = false)"
          />
        </div>
      </div>
    </div>
  </BlogDialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import BlogDialog from '@/components/common/BlogDialog.vue'
import BlogInput from '@/components/common/BlogInput.vue'
import SearchCard from '@/components/search/SearchCard.vue'
import { useSearch } from '@/composables/useSearch'

const visible = ref(false)
const inputRef = ref<InstanceType<typeof BlogInput> | null>(null)

const { query, loading, results, counts, activeTab, initialize } = useSearch()

// BlogDialog onOpen 回调：加载数据 + 自动聚焦
async function onDialogOpen() {
  await initialize()
  await nextTick()
  // 聚焦搜索输入框
  inputRef.value?.focus()
}

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({ open, close })
</script>

<style lang="less" scoped>
.search-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

/* ======================== */
/* 搜索类型 Tabs            */
/* ======================== */
.search-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.search-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    color: var(--text-primary);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }

  &.active {
    background: var(--bg-card);
    color: var(--accent);
    box-shadow: 0 1px 4px var(--shadow);
    font-weight: 600;
  }
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 0.7rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  line-height: 1;
}

/* ======================== */
/* 状态提示                 */
/* ======================== */
.search-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.search-hint-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.search-shortcut-hint {
  font-size: 0.75rem;
  opacity: 0.5;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}

.search-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ======================== */
/* 搜索结果                 */
/* ======================== */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-results-count {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding: 0 4px;
}

.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}
</style>
