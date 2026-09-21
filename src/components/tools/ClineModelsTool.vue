<template>
  <div class="tool-form cline-models">
    <!-- 工具介绍 -->
    <p class="cline-intro">{{ $t('tools.clineModels.intro') }}</p>

    <!-- Tab 切换：推荐 / 搜索 -->
    <div class="cline-tabs" role="tablist" :aria-label="$t('tools.clineModels.tabsLabel')">
      <button
        v-for="tab in tabs"
        :id="`cline-tab-${tab.value}`"
        :key="tab.value"
        type="button"
        role="tab"
        class="cline-tab px-fade"
        :class="{ active: activeTab === tab.value }"
        :aria-selected="activeTab === tab.value"
        :aria-controls="`cline-panel-${tab.value}`"
        :tabindex="activeTab === tab.value ? 0 : -1"
        @click="switchTab(tab.value, $event)"
        @keydown="onTabKeydown($event, tab.value)"
      >
        <!-- 推荐：星标 -->
        <svg v-if="tab.value === 'recommended'" class="cline-tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.4 6.7 19.2l1.1-5.9L3.5 9.2l5.9-.8L12 3Z"
            stroke="currentColor" stroke-width="2" stroke-linejoin="round"
          />
        </svg>
        <!-- 搜索：放大镜 -->
        <svg v-else class="cline-tab-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <line x1="21" y1="21" x2="16.4" y2="16.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>{{ $t(tab.labelKey) }}</span>
      </button>
    </div>

    <!-- 面板动画：out-in 避免两个面板同时在场；after-enter 里再聚焦搜索框（out-in 下
         新面板要等旧面板离场动画结束才挂载，nextTick 时输入框还不存在） -->
    <Transition name="cline-panel" mode="out-in" @after-enter="onPanelAfterEnter">
      <!-- ── 推荐面板 ── -->
      <div
        v-if="activeTab === 'recommended'"
        id="cline-panel-recommended"
        key="recommended"
        role="tabpanel"
        aria-labelledby="cline-tab-recommended"
        class="cline-panel"
      >
        <Transition name="loader-pop" mode="out-in" appear>
          <div v-if="loading" class="cline-loading cube-anim">
            <CubeLoader :text="$t('tools.clineModels.loading')" />
          </div>

          <div v-else-if="error" class="cline-error">
            <span class="empty-icon">⚠️</span>
            <span class="empty-text">{{ $t('tools.clineModels.loadFailed') }}</span>
            <Button size="small" @click="fetchClineModels">{{ $t('tools.clineModels.retry') }}</Button>
          </div>

          <div v-else class="cline-body">
            <!-- 免费模型 -->
            <div class="cline-section">
              <label class="tool-label">{{ $t('tools.clineModels.freeSectionTitle') }}</label>
              <div v-if="freeModels.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
              </div>
              <div v-else class="model-tags">
                <span
                  v-for="model in freeModels"
                  :key="model.id"
                  class="model-tag px-fade"
                  :title="tooltip(model)"
                  @click="copyId(model)"
                >{{ model.name }}</span>
              </div>
            </div>

            <!-- 推荐模型 -->
            <div class="cline-section">
              <label class="tool-label">{{ $t('tools.clineModels.recommendedSectionTitle') }}</label>
              <div v-if="recommendedModels.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
              </div>
              <div v-else class="model-tags">
                <span
                  v-for="model in recommendedModels"
                  :key="model.id"
                  class="model-tag px-fade"
                  :title="tooltip(model)"
                  @click="copyId(model)"
                >{{ model.name }}</span>
              </div>
            </div>

            <!-- Cline Pass 模型 -->
            <div class="cline-section">
              <label class="tool-label">{{ $t('tools.clineModels.clinePassSectionTitle') }}</label>
              <div v-if="clinePassModels.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
              </div>
              <div v-else class="model-tags">
                <span
                  v-for="model in clinePassModels"
                  :key="model.id"
                  class="model-tag px-fade"
                  :title="tooltip(model)"
                  @click="copyId(model)"
                >{{ model.name }}</span>
              </div>
            </div>

            <!-- Cline Cloud 模型 -->
            <div class="cline-section">
              <label class="tool-label">{{ $t('tools.clineModels.clineCloudSectionTitle') }}</label>
              <div v-if="clineCloudModels.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <span class="empty-text">{{ $t('tools.clineModels.empty') }}</span>
              </div>
              <div v-else class="model-tags">
                <span
                  v-for="model in clineCloudModels"
                  :key="model.id"
                  class="model-tag px-fade"
                  :title="tooltip(model)"
                  @click="copyId(model)"
                >{{ model.name }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── 搜索面板 ── -->
      <div
        v-else
        id="cline-panel-search"
        key="search"
        role="tabpanel"
        aria-labelledby="cline-tab-search"
        class="cline-panel cline-panel--search"
      >
        <div class="cline-search-bar">
          <BlogInput
            id="cline-model-search"
            ref="searchInputRef"
            v-model="keyword"
            type="text"
            :placeholder="$t('tools.clineModels.searchPlaceholder')"
            :disabled="searching"
            @keyup.enter="runSearch"
            @keyup.esc="resetSearch"
          >
            <template #prefix>
              <svg class="cline-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
                <line x1="21" y1="21" x2="16.4" y2="16.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </template>
          </BlogInput>

          <Button
            type="primary"
            size="small"
            :disabled="searching || !keyword.trim()"
            @click="runSearch"
          >
            {{ searching ? $t('tools.clineModels.loading') : $t('tools.clineModels.searchAction') }}
          </Button>

          <Button
            v-if="keyword"
            size="small"
            :disabled="searching"
            @click="resetSearch"
          >
            {{ $t('tools.clineModels.searchClear') }}
          </Button>
        </div>

        <!-- 搜索结果 -->
        <div class="cline-results">
          <div class="cline-results-head">
            <label class="tool-label">
              {{ searchKeyword ? $t('tools.clineModels.searchResultsTitle') : $t('tools.clineModels.searchDefaultTitle') }}
            </label>
            <span v-if="!searching && !searchError" class="cline-results-count">
              {{ $t('tools.clineModels.searchResultCount', { count: searchResults.length }) }}
            </span>
          </div>

          <!-- 加载中：进入搜索页 / 搜索 / 重试共用 -->
          <div v-if="searching" class="cline-loading cube-anim">
            <CubeLoader :text="searchKeyword ? $t('tools.clineModels.searching') : $t('tools.clineModels.searchLoading')" />
          </div>

          <div v-else-if="searchError" class="empty-state">
            <span class="empty-icon">⚠️</span>
            <span class="empty-text">{{ $t('tools.clineModels.searchFailed') }}</span>
            <Button size="small" @click="retrySearch">{{ $t('tools.clineModels.retry') }}</Button>
          </div>

          <div v-else-if="searchResults.length === 0" class="empty-state">
            <span class="empty-icon">🔍</span>
            <span class="empty-text">
              {{ searchKeyword ? $t('tools.clineModels.searchEmpty') : $t('tools.clineModels.searchDefaultEmpty') }}
            </span>
          </div>

          <!-- 结果列表：分页展示，点击「加载更多」每次多显示 10 个 -->
          <ul v-else class="model-list">
            <li
              v-for="model in visibleSearchResults"
              :key="model.id"
              class="model-item px-fade"
              role="button"
              tabindex="0"
              :title="$t('tools.clineModels.clickToCopy')"
              @click="copyId(model)"
              @keydown.enter.prevent="copyId(model)"
              @keydown.space.prevent="copyId(model)"
            >
              <div class="model-item-main">
                <span class="model-item-name">{{ model.name }}</span>
                <span class="model-item-desc">{{ model.description || $t('tools.clineModels.noDescription') }}</span>
              </div>
              <div class="model-item-side">
                <code class="model-item-id">{{ model.id }}</code>
                <svg class="model-item-copy" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2" />
                  <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
            </li>
          </ul>

          <!-- 还有更多结果：一次多显示 10 个 -->
          <div v-if="!searching && !searchError && hasMoreSearchResults" class="cline-results-more">
            <Button size="small" @click="showMoreSearchResults">
              {{ $t('tools.clineModels.searchShowMore', { count: remainingSearchResults }) }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from 'animal-island-vue'
import BlogInput from '@/components/common/BlogInput.vue'
import CubeLoader from '@/components/common/CubeLoader.vue'
import { useClineModels, markSearchPanelShown } from '@/composables/useClineModels'
import { copyText } from '@/utils/copyText'
import type { ClineModel } from '@/composables/useClineModels'

const { t } = useI18n()
const {
  loading,
  error,
  freeModels,
  recommendedModels,
  clinePassModels,
  clineCloudModels,
  fetchClineModels,
  searching,
  searchError,
  searchResults,
  visibleSearchResults,
  hasMoreSearchResults,
  visibleCount,
  searchKeyword,
  loadDefaultSearch,
  searchModels,
  showMoreSearchResults,
  resetSearchPanelShown,
} = useClineModels()

/** 还有多少条还没展示（用于「加载更多」按钮文案） */
const remainingSearchResults = computed(() =>
  Math.max(searchResults.value.length - visibleCount.value, 0)
)

onMounted(() => {
  fetchClineModels()
})

// ── Tab 切换 ──
type ClineTab = 'recommended' | 'search'

const tabs = [
  { value: 'recommended' as ClineTab, labelKey: 'tools.clineModels.tabRecommended' },
  { value: 'search' as ClineTab, labelKey: 'tools.clineModels.tabSearch' },
]

const activeTab = ref<ClineTab>('recommended')

/** 本次切换是否要自动聚焦搜索框：仅鼠标点击为真（键盘激活的 click detail 为 0） */
let focusInputOnEnter = false

function switchTab(tab: ClineTab, event?: MouseEvent) {
  if (activeTab.value === tab) return
  // 键盘（←/→ 或 Enter/Space）切换时把焦点留在 Tab 上，符合 ARIA tabs 惯例
  focusInputOnEnter = (event?.detail ?? 0) > 0
  // 离开搜索页：作废「面板已可见」标记，下次进入重新计时
  if (tab !== 'search') resetSearchPanelShown()
  activeTab.value = tab
  // 切到搜索页立刻开始加载默认列表
  if (tab === 'search') loadDefaultSearch()
}

/** 面板进场结束后自动聚焦搜索框，并标记 loading 已可见（最短展示时长从这里起算） */
function onPanelAfterEnter() {
  if (activeTab.value !== 'search') return
  markSearchPanelShown()
  const shouldFocus = focusInputOnEnter
  focusInputOnEnter = false
  if (shouldFocus) searchInputRef.value?.focus()
}

/** 左右方向键在 Tab 间移动（WAI-ARIA tabs 惯例） */
function onTabKeydown(event: KeyboardEvent, current: ClineTab) {
  const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!dir) return
  event.preventDefault()
  const index = tabs.findIndex((item) => item.value === current)
  const next = tabs[(index + dir + tabs.length) % tabs.length]
  if (!next || next.value === current) return
  switchTab(next.value)
  nextTick(() => document.getElementById(`cline-tab-${next.value}`)?.focus())
}

// ── 搜索 ──
const keyword = ref('')
const searchInputRef = ref<{ focus: () => void } | null>(null)

/** 清除关键词，回到进入搜索页时加载的默认列表 */
function resetSearch() {
  keyword.value = ''
  loadDefaultSearch()
  nextTick(() => searchInputRef.value?.focus())
}

function runSearch() {
  const query = keyword.value.trim()
  if (searching.value) return
  searchModels(query)
}

/** 失败重试：有关键词重搜该关键词，否则重载默认列表 */
function retrySearch() {
  searchModels(keyword.value.trim())
}

// 空描述回退到「点击复制」提示，保证每个标签都有有意义的 tooltip
function tooltip(model: ClineModel): string {
  return model.description || t('tools.clineModels.clickToCopy')
}

function copyId(model: ClineModel) {
  copyText(model.id, t('tools.clineModels.copied'))
}
</script>

<style scoped>
.cline-models {
  gap: 16px;
}

.cline-intro {
  margin: 0;
  padding: 10px 14px;
  border-left: 3px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  --pxs: 2px; clip-path: var(--pxc);
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* ── Tab 栏 ── */
.cline-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cline-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: var(--bg-card);
  color: var(--text-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease, transform 0.2s ease;
}

.cline-tab:hover {
  color: var(--text-primary);
  transform: translateY(-2px);
}

.cline-tab:active {
  transform: translateY(0);
}

.cline-tab.active {
  background: var(--accent);
  color: var(--bg-card);
  font-weight: 600;
}

/* 常显 accent 描边（px-fade 叠加层） */
.cline-tab.active::after {
  opacity: 1;
}

.cline-tab-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── 面板 ── */
.cline-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 120px;
}

/* 面板切换：淡入 + 轻微上移（out-in 无并排跳动） */
.cline-panel-enter-active,
.cline-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.cline-panel-enter-from,
.cline-panel-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ── 搜索面板 ── */
.cline-panel--search {
  gap: 12px;
}

.cline-search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
}

.cline-search-bar .blog-input {
  flex: 1;
  min-width: 180px;
}

.cline-search-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.cline-search-hint {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.5;
  color: var(--text-secondary);
  opacity: 0.85;
}

/* 结果区固定成卡片底色，与推荐面板的裸标签区分 */
.cline-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
}

.cline-results-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cline-results-count {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.cline-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* 搜索加载态：给方块动画留固定高度，出现/消失时结果区不跳动 */
.cline-results .cline-loading {
  min-height: 96px;
}

/* ── 结果列表 ── */
.model-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 行卡片：底色比结果区浅一档，hover 时描边淡入 accent（px-fade） */
.model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.model-item:hover {
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-card));
  transform: translateX(2px);
}

.model-item:active {
  transform: translateX(2px) scale(0.99);
}

.model-item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.model-item-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-item-desc {
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-item-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  max-width: 55%;
}

.model-item-id {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.72rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 2px 8px;
  --pxs: 2px; clip-path: var(--pxc);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-item-copy {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
}

.model-item:hover .model-item-copy,
.model-item:focus-visible .model-item-copy {
  opacity: 1;
  color: var(--accent);
}

.cline-results-more {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

/* 窄屏：描述与 ID 让位给模型名，隐藏复制图标避免挤压 */
@media (max-width: 480px) {
  .model-item-desc {
    display: none;
  }

  .model-item-side {
    max-width: 48%;
  }

  .model-item-copy {
    display: none;
  }
}

.cline-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
}

.empty-icon {
  font-size: 1.5rem;
}

.empty-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Transition 只接受单个子节点，两个 section 需包一层；间距与 .cline-models 保持一致 */
.cline-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cline-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 镜像 ToolsView 的 .tool-tag 外观，但 cursor: pointer + 点击复制 */
.model-tag {
  background: var(--bg-secondary);
  color: var(--accent);
  padding: 4px 12px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.8rem;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}

/* 搜索结果区底色是 --bg-secondary，标签改为 --bg-card 以免糊成一片 */
.cline-results .model-tag {
  background: var(--bg-card);
}

.model-tag:hover {
  background: var(--accent);
  color: var(--bg-card);
  transform: scale(1.08);
}

.model-tag:active {
  transform: scale(0.96);
}
</style>
