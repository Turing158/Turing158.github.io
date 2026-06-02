<template>
  <!-- 移动端遮罩层 -->
  <transition name="toc-overlay">
    <div
      v-if="isMobile && isOpen && headings.length > 0"
      class="toc-overlay"
      @click="isOpen = false"
    />
  </transition>

  <transition name="toc-slide">
    <aside
      class="toc-drawer"
      v-if="isOpen && headings.length > 0"
    >
      <div class="toc-header">
        <span class="toc-icon">📑</span>
        <span class="toc-title">目录</span>
        <span class="toc-count">{{ headings.length }}</span>
        <button class="toc-close-btn" @click="isOpen = false" title="收起目录">✕</button>
      </div>
      <nav class="toc-nav">
        <template v-for="(heading, index) in headings" :key="heading.id">
          <!-- H2 父级 -->
          <template v-if="heading.level === 'h2'">
            <a
              :href="`#${heading.id}`"
              class="toc-link h2"
              :class="{ active: activeId === heading.id }"
              @click.prevent="scrollTo(heading.id)"
            >
              {{ heading.text }}
            </a>
            <!-- H3 子级容器，带展开/折叠动画 -->
            <transition name="toc-expand">
              <div
                v-show="expandedH2Id === heading.id"
                class="toc-h3-group"
              >
                <template v-for="sub in getH3Children(index)" :key="sub.id">
                  <a
                    :href="`#${sub.id}`"
                    class="toc-link h3"
                    :class="{ active: activeId === sub.id }"
                    @click.prevent="scrollTo(sub.id)"
                  >
                    {{ sub.text }}
                  </a>
                </template>
              </div>
            </transition>
          </template>
          <!-- 顶层 H3（没有父级 H2 的情况） -->
          <template v-else-if="heading.level === 'h3' && !hasParentH2(index)">
            <a
              :href="`#${heading.id}`"
              class="toc-link h3"
              :class="{ active: activeId === heading.id }"
              @click.prevent="scrollTo(heading.id)"
            >
              {{ heading.text }}
            </a>
          </template>
        </template>
      </nav>
      <div class="toc-actions">
        <div class="toc-actions-left">
          <Button class="toc-action-btn" type="default" size="small" @click="scrollToTop">⬆</Button>
          <Button class="toc-action-btn" type="default" size="small" @click="scrollToComments">💬</Button>
        </div>
        <span class="toc-progress">{{ readProgress }}%</span>
      </div>
    </aside>
  </transition>

  <!-- 收起状态下的浮动按钮 -->
  <button
    v-if="!isOpen && headings.length > 0"
    class="toc-float-btn"
    @click="isOpen = true"
    title="展开目录"
  >
    📑
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Button } from 'animal-island-vue'

export interface TocHeading {
  id: string
  level: string
  text: string
}

const props = defineProps<{
  headings: TocHeading[]
}>()

// 桌面端默认展开，移动端默认关闭
const isMobile = ref(window.innerWidth < 1024)
const isOpen = ref(!isMobile.value)

const onResize = () => {
  isMobile.value = window.innerWidth < 1024
}

watch(isMobile, (mobile) => {
  isOpen.value = !mobile
})

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const activeId = ref('')
const readProgress = ref(0)

// 当前展开的 H2 id（手风琴模式：只展开一个）
const expandedH2Id = ref<string | null>(null)

// 找到当前 H3 所属的父级 H2 id
const findParentH2 = (index: number): string | null => {
  for (let i = index - 1; i >= 0; i--) {
    if (props.headings[i].level === 'h2') {
      return props.headings[i].id
    }
  }
  return null
}

// 判断某个 H3 前面是否有父级 H2
const hasParentH2 = (index: number): boolean => {
  return findParentH2(index) !== null
}

// 获取某个 H2 后面所有连续的 H3 子项
const getH3Children = (h2Index: number): TocHeading[] => {
  const children: TocHeading[] = []
  for (let i = h2Index + 1; i < props.headings.length; i++) {
    if (props.headings[i].level === 'h2') break
    if (props.headings[i].level === 'h3') {
      children.push(props.headings[i])
    }
  }
  return children
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (isMobile.value) {
    isOpen.value = false
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToComments = () => {
  const el = document.getElementById('gitalk-container')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  if (isMobile.value) {
    isOpen.value = false
  }
}

const onScroll = () => {
  const headingElements = props.headings
    .map((h) => document.getElementById(h.id))
    .filter(Boolean) as HTMLElement[]

  if (headingElements.length === 0) return

  const scrollY = window.scrollY + 100
  let currentActive = ''
  for (let i = headingElements.length - 1; i >= 0; i--) {
    if (headingElements[i].offsetTop <= scrollY) {
      currentActive = headingElements[i].id
      break
    }
  }
  if (!currentActive && headingElements.length > 0) {
    currentActive = headingElements[0].id
  }

  if (currentActive !== activeId.value) {
    activeId.value = currentActive

    const activeIndex = props.headings.findIndex((h) => h.id === currentActive)
    if (activeIndex >= 0 && props.headings[activeIndex].level === 'h3') {
      const parentId = findParentH2(activeIndex)
      expandedH2Id.value = parentId
    } else {
      expandedH2Id.value = null
    }
  }

  // 计算阅读进度
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight > 0) {
    readProgress.value = Math.min(100, Math.round((window.scrollY / docHeight) * 100))
  } else {
    readProgress.value = 100
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  setTimeout(onScroll, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style lang="less" scoped>
.toc-drawer {
  width: 260px;
  height: calc(100vh - 32px);
  position: sticky;
  top: 16px;
  align-self: flex-start;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: -2px 0 16px var(--shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 16px;
}

.toc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.toc-icon {
  font-size: 1.1rem;
}

.toc-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  flex: 1;
}

.toc-count {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
}

.toc-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-secondary);
    color: var(--accent);
  }
}

.toc-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px 12px;
}

.toc-link {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 7px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 2px solid transparent;
  flex-shrink: 0;

  &:hover {
    color: var(--accent);
    background: var(--bg-secondary);
  }

  &.active {
    color: var(--accent);
    font-weight: 600;
    border-left-color: var(--accent);
    background: var(--bg-secondary);
  }

  &.h2 {
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
  }

  &.h3 {
    padding-left: 28px;
    font-size: 0.8rem;
  }
}

/* H3 子级容器 */
.toc-h3-group {
  overflow: hidden;
}

/* 底部操作区 */
.toc-actions {
  height: 50px;
  flex-shrink: 0;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.toc-actions-left {
  display: flex;
  gap: 6px;
}

.toc-action-btn {
  font-size: 0.85rem !important;
  padding: 0 !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
}

.toc-progress {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 展开/折叠动画 */
.toc-expand-enter-active,
.toc-expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.25s ease;
  max-height: 500px;
  opacity: 1;
}

.toc-expand-enter-from,
.toc-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.toc-float-btn {
  position: fixed;
  right: 16px;
  top: 80px;
  z-index: 200;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 1.1rem;
  box-shadow: 0 2px 12px var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;

  &:hover {
    background: var(--accent);
    color: #fff;
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.95);
  }
}

.toc-slide-enter-active,
.toc-slide-leave-active {
  transition: width 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.toc-slide-enter-from,
.toc-slide-leave-to {
  width: 0;
  opacity: 0;
}

/* 移动端遮罩层 */
.toc-overlay {
  position: fixed;
  inset: 0;
  z-index: 198;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.toc-overlay-enter-active,
.toc-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.toc-overlay-enter-from,
.toc-overlay-leave-to {
  opacity: 0;
}

@media (max-width: 1023px) {
  .toc-drawer {
    position: fixed;
    right: 0;
    top: 0;
    z-index: 199;
    width: 280px;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    border-left: 1px solid var(--border);
    border-top: none;
    border-right: none;
    border-bottom: none;
    box-shadow: -4px 0 20px var(--shadow);
    margin-right: 0;
  }

  .toc-float-btn {
    right: 16px;
    top: 16px;
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
