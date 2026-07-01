<template>
  <div class="projects-view">
    <h1 class="page-title">{{ $t('projects.title') }}</h1>

    <div v-for="category in categories" :key="category.key" class="project-category">
      <div class="category-header">
        <span class="category-icon">{{ category.icon }}</span>
        <h2 class="category-title">{{ $t(category.label) }}</h2>
        <span class="category-count">{{ category.projects.length }}</span>
      </div>

      <TransitionGroup
        v-if="category.projects.length > 0 && showCards"
        name="project-card"
        tag="div"
        class="projects-grid"
        :class="{ 'projects-grid--compact': category.key === 'blog' }"
        appear
      >
        <div
          v-for="(project, index) in category.projects"
          :key="project.name"
          class="project-card"
          :style="{ '--delay': index * 60 + 'ms' }"
        >
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-desc">{{ project.description }}</p>
          <div class="project-tech">
            <span v-for="tech in project.tech" :key="tech" class="tech-tag">{{ tech }}</span>
          </div>
          <div class="project-actions">
            <Button size="small" @click="open(`${project.url}/issues`)">{{ $t('projects.issues') }}</Button>
            <Button size="small" @click="goToCommits(project.url)">{{ $t('projects.commits') }}</Button>
            <Button
              type="primary"
              size="small"
              @click="open(project.url)"
              @mousedown="startLongPress(project)"
              @mouseup="cancelLongPress"
              @mouseleave="cancelLongPress"
              @touchstart.prevent="startLongPress(project)"
              @touchend.prevent="cancelLongPress"
            >{{ $t('projects.visit') }}</Button>
          </div>
        </div>
      </TransitionGroup>

      <div v-else class="category-empty">暂无项目</div>
    </div>

    <!-- 长按选择弹窗 -->
    <BlogDialog v-model="showPlatformDialog" :title="dialogTitle" :width="360" :show-close="true" :close-on-click-overlay="true">
      <div class="platform-dialog-content">
        <button class="platform-btn platform-btn--github" @click="openGithub">
          <svg class="platform-btn__icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </button>
        <button class="platform-btn platform-btn--gitee" @click="openGitee">
          <img class="platform-btn__icon" src="https://gitee.com/favicon.ico" alt="Gitee" />
          <span>Gitee</span>
        </button>
      </div>
    </BlogDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import BlogDialog from '@/components/common/BlogDialog.vue'
import { categories as projectCategories } from '@/data/projects'
import { usePageSeo } from '@/composables/useSeo'
import { registerContextProvider } from '@/composables/contextMenuRegistry'
import { useI18n } from 'vue-i18n'
import BlogTip from '@/plugins/blog-tip'

// SEO
usePageSeo('项目', '开发中的项目、已完成项目和教程', '#/projects')

const router = useRouter()
const categories = ref(projectCategories)
const showCards = ref(false)

// 长按相关
const showPlatformDialog = ref(false)
const longPressProject = ref<{ name: string; url: string } | null>(null)
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const LONG_PRESS_DURATION = 600

onMounted(async () => {
  await nextTick()
  showCards.value = true
})

onBeforeUnmount(() => {
  clearLongPressTimer()
})

function open(url: string) {
  window.open(url, '_blank')
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/[^/]+\/([^/?#]+)/)
  return match ? match[1] : ''
}

function goToCommits(url: string) {
  const repo = extractRepoName(url)
  if (repo) {
    router.push({ name: 'commits', params: { repo } })
  }
}

function clearLongPressTimer() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function startLongPress(project: { name: string; url: string }) {
  clearLongPressTimer()
  longPressTimer.value = setTimeout(() => {
    longPressProject.value = project
    showPlatformDialog.value = true
    longPressTimer.value = null
  }, LONG_PRESS_DURATION)
}

function cancelLongPress() {
  clearLongPressTimer()
}

const dialogTitle = ref('')

watch(showPlatformDialog, (val) => {
  if (val && longPressProject.value) {
    dialogTitle.value = longPressProject.value.name
  }
})

function openGithub() {
  if (longPressProject.value) {
    open(longPressProject.value.url)
  }
  showPlatformDialog.value = false
}

function openGitee() {
  if (longPressProject.value) {
    const repoName = extractRepoName(longPressProject.value.url)
    open(`https://gitee.com/turing-ice/${repoName}`)
  }
  showPlatformDialog.value = false
}

// ── 右键菜单上下文提供者 ──
const { t } = useI18n()

const unregisterContextMenu = registerContextProvider((target) => {
  // 仅在项目卡片上右键时提供
  const card = target.closest('.project-card') as HTMLElement | null
  if (!card) return []

  // 从卡片中提取项目名称并查找对应 URL
  const projectName = card.querySelector('.project-name')?.textContent || ''
  const projectUrl = findProjectUrl(projectName)

  if (!projectUrl) return []

  const items = []
  const repoName = extractRepoName(projectUrl)
  const githubUrl = projectUrl

  // 前往项目
  items.push({
    id: 'visit-project',
    label: t('contextMenu.visitProject'),
    icon: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    action: () => {
      window.open(githubUrl, '_blank')
    },
  })

  // 项目提交
  items.push({
    id: 'project-commits',
    label: t('contextMenu.projectCommits'),
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    action: () => {
      if (repoName) {
        router.push({ name: 'commits', params: { repo: repoName } })
      }
    },
  })

  // 复制项目链接
  items.push({
    id: 'copy-project-link',
    label: t('contextMenu.copyProjectLink'),
    icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    action: () => {
      navigator.clipboard.writeText(githubUrl).then(() => {
        BlogTip.show(t('tools.copied'), { type: 'success', duration: 2000 })
      }).catch(() => {
        BlogTip.show(t('contextMenu.copyFailed'), { type: 'error', duration: 2000 })
      })
    },
  })

  return items
})

/** 根据项目名称查找 URL */
function findProjectUrl(name: string): string {
  for (const cat of categories.value) {
    const project = cat.projects.find(p => p.name === name)
    if (project) return project.url
  }
  return ''
}

onUnmounted(() => {
  unregisterContextMenu()
})
</script>

<style lang="less" scoped>
.projects-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: var(--text-primary);
}

.project-category {
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border);
}

.category-icon {
  font-size: 1.4rem;
}

.category-title {
  font-size: 1.3rem;
  color: var(--text-primary);
  flex: 1;
}

.category-count {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.category-empty {
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 24px;
  text-align: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px dashed var(--border);
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  &--compact {
    grid-template-columns: repeat(2, 1fr);
  }
}

.project-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }
}

/* 项目卡片入场动画：从上往下落下（必须在 .project-card 之后，确保优先级） */
.project-card-enter-active {
  transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0ms);
}

.project-card-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.project-card-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.project-card-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.project-name {
  font-size: 1.05rem;
  color: var(--text-primary);
}

.project-desc {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.6;
  flex: 1;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tech-tag {
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

.project-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* 长按平台选择弹窗 */
.platform-dialog-content {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.platform-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    object-fit: contain;
    border-radius: 3px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow);
  }

  &:active {
    transform: scale(0.96);
  }

  &--github {
    &:hover {
      background: #24292f;
      color: #fff;
      border-color: #24292f;
    }
  }

  &--gitee {
    &:hover {
      background: #c71d23;
      color: #fff;
      border-color: #c71d23;

      .platform-btn__icon {
        filter: brightness(2);
      }
    }
  }
}
</style>
