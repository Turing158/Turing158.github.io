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
            <Button type="primary" size="small" @click="open(project.url)">{{ $t('projects.visit') }}</Button>
          </div>
        </div>
      </TransitionGroup>

      <div v-else class="category-empty">暂无项目</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import { categories as projectCategories } from '@/data/projects'

const router = useRouter()
const categories = ref(projectCategories)
const showCards = ref(false)

onMounted(async () => {
  await nextTick()
  showCards.value = true
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
</style>
