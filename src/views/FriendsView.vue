<template>
  <div class="friends-view">
    <h1 class="page-title">{{ $t('pageTitle.friends') }}</h1>

    <!-- 大卡片 1：友链列表 -->
    <div class="friends-card">
      <div class="card-header">
        <span class="card-icon">🌱</span>
        <h2 class="card-title">{{ $t('friends.listTitle') }}</h2>
        <span v-if="!loading && !error && friends.length > 0" class="card-count">{{ friends.length }}</span>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="friends-status">
        <CubeLoader :text="$t('common.loading')" />
      </div>

      <!-- 加载失败 -->
      <div v-else-if="error" class="friends-status">
        <span>{{ $t('friends.loadFailed') }}</span>
        <Button size="small" @click="load">{{ $t('friends.retry') }}</Button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="friends.length === 0" class="friends-empty">{{ $t('friends.empty') }}</div>

      <template v-else>
        <TransitionGroup name="friend-card" tag="div" class="friends-grid" appear>
          <div
            v-for="(friend, index) in pagedFriends"
            :key="friendKey(friend)"
            class="friend-card px-fade"
            :style="{ '--delay': index * 60 + 'ms' }"
          >
            <div class="friend-avatar">
              <img
                v-if="friend.head && !failedAvatars.has(friendKey(friend))"
                :src="friend.head"
                :alt="displayName(friend)"
                loading="lazy"
                @error="failedAvatars.add(friendKey(friend))"
              />
              <span v-else class="friend-avatar-fallback">{{ avatarFallback(friend) }}</span>
            </div>
            <div class="friend-info">
              <span class="friend-name">{{ displayName(friend) }}</span>
              <a
                v-if="friend.link"
                class="friend-link"
                :href="friend.link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ displayDomain(friend.link) }}
                <ExternalLinkIcon :size="12" />
              </a>
              <span v-if="friendLabels(friend.label).length" class="friend-labels">
                <span v-for="label in friendLabels(friend.label)" :key="label" class="friend-label">
                  {{ label }}
                </span>
              </span>
            </div>
          </div>
        </TransitionGroup>

        <!-- 分页（每页 9 个） -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            class="pagination-btn px-fade"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            {{ $t('friends.prev') }}
          </button>

          <div class="pagination-pages">
            <button
              v-for="page in pageNumbers"
              :key="page"
              class="pagination-page px-fade px-fade-alt"
              :class="{ 'pagination-page--active': page === currentPage }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </div>

          <button
            class="pagination-btn px-fade"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            {{ $t('friends.next') }}
          </button>
        </div>
      </template>
    </div>

    <!-- 像素分割线 -->
    <GrassTerrainDivider size="sm" class="friends-divider" />

    <!-- 大卡片 2：申请友链 -->
    <div class="friends-apply-card">
      <div class="card-header">
        <span class="card-icon">📮</span>
        <h2 class="card-title">{{ $t('friends.applyTitle') }}</h2>
      </div>

      <!-- 布局：左侧实时预览（与上方友链卡片同款），右侧申请表单 -->
      <div class="apply-layout">
        <!-- 左：效果预览 -->
        <div class="apply-preview">
          <div class="friend-card apply-preview-card">
            <div class="friend-avatar">
              <img
                v-if="applyForm.head.trim() && !previewAvatarFailed"
                :src="applyForm.head.trim()"
                alt=""
                @error="previewAvatarFailed = true"
              />
              <span v-else class="friend-avatar-fallback">{{ previewAvatarFallback }}</span>
            </div>
            <div class="friend-info">
              <span class="friend-name">{{ previewName }}</span>
              <span v-if="applyForm.link.trim()" class="friend-link">
                {{ displayDomain(applyForm.link.trim()) || applyForm.link.trim() }}
                <ExternalLinkIcon :size="12" />
              </span>
              <span v-if="applyForm.labels.length" class="friend-labels">
                <span v-for="label in applyForm.labels" :key="label" class="friend-label">
                  {{ label }}
                </span>
              </span>
            </div>
          </div>
          <span class="apply-preview-caption">{{ $t('friends.applyPreview') }}</span>

          <!-- 接口返回消息（成功/业务错误/网络异常）显示在预览说明下方 -->
          <p
            v-if="applyStatus"
            class="apply-status"
            :class="applyStatusOk ? 'is-success' : 'is-error'"
            role="status"
          >
            {{ applyStatus }}
          </p>
        </div>

        <!-- 右：申请表单（名称/头像/链接必填，介绍与标签折叠为选填） -->
        <form class="apply-form" @submit.prevent="submitApply">
        <div class="apply-fields">
          <div class="apply-field">
            <label class="apply-label" for="apply-name">
              {{ $t('friends.applyName') }}<i class="apply-required">*</i>
            </label>
            <BlogInput
              id="apply-name"
              v-model="applyForm.name"
              :placeholder="$t('friends.applyNamePlaceholder')"
              :max-length="30"
              show-count
            />
          </div>
          <div class="apply-field">
            <label class="apply-label" for="apply-head">
              {{ $t('friends.applyHead') }}<i class="apply-required">*</i>
            </label>
            <BlogInput
              id="apply-head"
              v-model="applyForm.head"
              :placeholder="$t('friends.applyHeadPlaceholder')"
              :max-length="100"
              show-count
            />
          </div>
          <div class="apply-field">
            <label class="apply-label" for="apply-link">
              {{ $t('friends.applyLink') }}<i class="apply-required">*</i>
            </label>
            <BlogInput
              id="apply-link"
              v-model="applyForm.link"
              :placeholder="$t('friends.applyLinkPlaceholder')"
              :max-length="100"
              show-count
            />
          </div>
        </div>

        <!-- 折叠：选填的介绍与标签 -->
        <button
          type="button"
          class="apply-more-toggle"
          :aria-expanded="applyMoreOpen"
          @click="applyMoreOpen = !applyMoreOpen"
        >
          <svg
            width="12"
            height="7"
            viewBox="0 0 12 7"
            fill="none"
            class="apply-more-chevron"
            :class="{ 'is-open': applyMoreOpen }"
          >
            <path
              d="M1 1L6 6L11 1"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ $t('friends.applyMore') }}
          <span
            v-if="applyForm.desc.trim() || applyForm.labels.length"
            class="apply-more-dot"
            aria-hidden="true"
          />
        </button>

        <div class="apply-more" :class="{ 'is-open': applyMoreOpen }" :inert="!applyMoreOpen">
          <div class="apply-more-inner">
            <div class="apply-field">
              <label class="apply-label" for="apply-desc">{{ $t('friends.applyDescLabel') }}</label>
              <BlogInput
                id="apply-desc"
                v-model="applyForm.desc"
                type="textarea"
                :rows="3"
                :max-length="100"
                show-count
                :resizable="false"
                :placeholder="$t('friends.applyDescPlaceholder')"
              />
            </div>
            <div class="apply-field">
              <span class="apply-label">{{ $t('friends.applyTagsLabel') }}</span>
              <BlogTagSelect
                v-model="applyForm.labels"
                :options="TAG_OPTIONS"
                :max-tags="5"
                :tag-max-length="10"
                :placeholder="$t('friends.applyTagsPlaceholder')"
              />
              <span class="apply-field-hint">{{ $t('friends.applyTagsHint') }}</span>
            </div>
          </div>
        </div>

        <div class="apply-actions">
          <button type="submit" class="apply-submit" :disabled="applying">
            {{ applying ? $t('friends.applySubmitting') : $t('friends.applySubmit') }}
          </button>
        </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from 'animal-island-vue'
import { applyFriendLink, fetchFriendLinks, friendLabels } from '@/data/friends'
import type { FriendLink } from '@/data/friends'
import { usePageSeo } from '@/composables/useSeo'
import BlogInput from '@/components/common/BlogInput.vue'
import BlogTagSelect from '@/components/common/BlogTagSelect.vue'
import CubeLoader from '@/components/common/CubeLoader.vue'
import ExternalLinkIcon from '@/components/common/ExternalLinkIcon.vue'
import GrassTerrainDivider from '@/components/common/GrassTerrainDivider.vue'

const { t } = useI18n()

// SEO
usePageSeo(
  computed(() => t('pageTitle.friends')),
  computed(() => t('seo.friends')),
  '#/friends',
)

// ── 友链数据 ──

const friends = ref<FriendLink[]>([])
const loading = ref(true)
const error = ref(false)
const failedAvatars = reactive(new Set<string>())

// ── 分页（每页 9 个） ──

const PAGE_SIZE = 9
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(friends.value.length / PAGE_SIZE)))
const pagedFriends = computed(() =>
  friends.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE),
)
const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))

async function load() {
  loading.value = true
  error.value = false
  try {
    friends.value = await fetchFriendLinks()
    currentPage.value = 1
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── 展示辅助 ──

/** 接口无 id 字段，用 名称+链接 组合作为稳定 key */
function friendKey(friend: FriendLink): string {
  return `${friend.name ?? ''}|${friend.link ?? ''}`
}

function displayName(friend: FriendLink): string {
  return friend.name || displayDomain(friend.link) || t('friends.unnamed')
}

function avatarFallback(friend: FriendLink): string {
  return displayName(friend).charAt(0) || '🔗'
}

/** 从链接中提取用于展示的域名 */
function displayDomain(url: string | null): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ── 申请友链 ──

/** 标签候选列表（可搜索、可多选、可自定义输入） */
const TAG_OPTIONS = ['南梁', 'IT大佬', '帅哥', '童鞋', '梦想家', 'IMSB', '咕咕嘎嘎']

const applyForm = reactive({
  name: '',
  head: '',
  link: '',
  desc: '',
  labels: [] as string[],
})
const applyMoreOpen = ref(false)
const applying = ref(false)
const applyStatus = ref('')
const applyStatusOk = ref(false)

// ── 预览：与上方友链卡片同款，随输入实时更新 ──

const previewAvatarFailed = ref(false)
watch(
  () => applyForm.head,
  () => {
    previewAvatarFailed.value = false
  },
)

/** 预览名称：与列表卡片同规则（名称 → 域名 → 未命名站点） */
const previewName = computed(
  () => applyForm.name.trim() || displayDomain(applyForm.link.trim()) || t('friends.unnamed'),
)
const previewAvatarFallback = computed(() => previewName.value.charAt(0) || '🔗')

function showApplyStatus(message: string, ok: boolean) {
  applyStatus.value = message
  applyStatusOk.value = ok
}

function resetApplyForm() {
  applyForm.name = ''
  applyForm.head = ''
  applyForm.link = ''
  applyForm.desc = ''
  applyForm.labels = []
}

/** 提交前先做与 Worker 校验一致的拦截，其余业务错误（链接已存在 / 申请达上限等）以接口返回为准 */
async function submitApply() {
  if (applying.value) return
  const name = applyForm.name.trim()
  const head = applyForm.head.trim()
  const link = applyForm.link.trim()
  const desc = applyForm.desc.trim()

  if (!name || !head || !link) {
    showApplyStatus(t('friends.applyMissing'), false)
    return
  }
  // 接口限制 desc ≤ 50 字（输入框按需求放宽到 100，提交时再校验）
  if (desc.length > 50) {
    showApplyStatus(t('friends.applyDescTooLong'), false)
    return
  }

  applying.value = true
  applyStatus.value = ''
  try {
    const result = await applyFriendLink({ name, head, link, desc, label: applyForm.labels })
    if (result.success) {
      showApplyStatus(t('friends.applySuccess'), true)
      resetApplyForm()
    } else {
      // 接口返回的业务错误为中文文案，直接展示
      showApplyStatus(result.error || t('friends.applyFailed'), false)
    }
  } catch {
    showApplyStatus(t('friends.applyNetworkError'), false)
  } finally {
    applying.value = false
  }
}
</script>

<style lang="less" scoped>
.friends-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.friends-card,
.friends-apply-card {
  background: var(--bg-card);
  --pxs: 4px; clip-path: var(--pxc);
  padding: 32px;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  box-shadow: 0 2px 12px var(--shadow);
  min-height: 120px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.card-icon {
  font-size: 1.4rem;
}

.card-title {
  font-size: 1.3rem;
  color: var(--text-primary);
  flex: 1;
}

.card-count {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 2px 10px;
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
}

.friends-divider {
  margin: 12px 0;
}

.friends-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-secondary);
  --pxs: 3px; clip-path: var(--pxc);
  padding: 16px 18px;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  box-shadow: 0 2px 8px var(--shadow);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

/* 友链卡片入场动画：从上往下落下（必须在 .friend-card 之后，确保优先级）。
   离场不做过渡（元素立即移除）：分页快速连续切换时进出动画互相打断，
   会让 TransitionGroup 卡在中间状态、新旧卡片堆积，翻页只保留入场的错落动画。 */
.friend-card-enter-active {
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
}

.friend-card-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.friend-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  overflow: hidden;
  --pxs: 2px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.friend-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
}

.friend-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.friend-name {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-link {
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.78rem;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;

  .friend-card:hover & {
    color: var(--accent);
  }

  &:hover {
    color: var(--accent);
    text-decoration: underline;
  }
}

.friend-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.friend-label {
  background: var(--bg-card);
  color: var(--accent);
  padding: 1px 8px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.72rem;
  border: 1px solid transparent; border-image: var(--px-frame-muted) 6 / calc(2 * var(--pxs)) stretch;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;

  &:hover {
    transform: scale(1.1) translateY(-1px);
    box-shadow: 0 2px 8px var(--shadow);
  }
}

.friends-empty {
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 24px;
  text-align: center;
  background: var(--bg-secondary);
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) repeat;
}

/* 分页（与文章列表同款像素风分页） */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.pagination-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  padding: 6px 16px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* 禁用态不淡入（压过工具类 .px-fade:hover::after） */
  &:disabled::after {
    opacity: 0;
  }
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-page {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  width: 32px;
  height: 32px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--accent);
  }

  &--active {
    background: var(--accent);
    color: #fff;
    --px-frame-fade: var(--px-frame-accent);
    --px-frame-fade-alt: var(--px-frame-accent-hover);

    &::after {
      opacity: 1;
    }

    &:hover::after {
      opacity: 0;
    }
  }
}

/* ── 申请友链表单 ── */
/* 布局：左预览 + 右表单，窄屏改为单列 */
.apply-layout {
  display: grid;
  grid-template-columns: minmax(230px, 300px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.apply-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 4px 0;

  /* 接口返回消息占满预览列宽并居中 */
  .apply-status {
    align-self: stretch;
    text-align: center;
  }
}

/* 预览卡复用上方 .friend-card 样式，去掉交互态 */
.apply-preview-card {
  width: 100%;
  cursor: default;

  &:hover {
    transform: none;
    box-shadow: 0 2px 8px var(--shadow);
  }

  .friend-link {
    cursor: default;

    &:hover {
      color: var(--text-secondary);
      text-decoration: none;
    }
  }
}

.apply-preview-caption {
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.85;
}

@media (max-width: 760px) {
  .apply-layout {
    grid-template-columns: 1fr;
  }
}

.apply-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apply-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.apply-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.apply-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.apply-required {
  color: var(--fgColor-danger);
  font-style: normal;
  margin-left: 4px;
}

.apply-field-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.apply-more-toggle {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 2px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--accent);
  }
}

.apply-more-chevron {
  transition: transform 0.25s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

/* 折叠区内有已填内容时的提示点 */
.apply-more-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  --pxs: 2px; clip-path: var(--pxc);
}

/* 折叠展开：grid-template-rows 过渡（纯 CSS，不依赖 JS 过渡钩子） */
.apply-more {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;

  &.is-open {
    grid-template-rows: 1fr;
  }
}

.apply-more-inner {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.apply-actions {
  display: flex;
  justify-content: flex-end;
}

.apply-submit {
  background: var(--accent);
  color: #fff;
  border: 1px solid transparent; border-image: var(--px-frame-accent) 6 / calc(2 * var(--pxs)) stretch;
  padding: 9px 26px;
  --pxs: 3px; clip-path: var(--pxc);
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: filter 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    box-shadow: 0 2px 10px var(--shadow);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.apply-status {
  margin: 0;
  font-size: 0.85rem;
  padding: 10px 14px;
  --pxs: 3px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  background: var(--bg-secondary);

  &.is-success {
    color: var(--accent);
    border-image: var(--px-frame-accent-soft) 6 / calc(2 * var(--pxs)) stretch;
  }

  &.is-error {
    color: var(--fgColor-danger);
    background: var(--bgColor-danger-muted);
    border-image: var(--px-frame-danger-soft) 6 / calc(2 * var(--pxs)) stretch;
  }
}
</style>
