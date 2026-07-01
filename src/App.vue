<template>
  <div id="app-root">
    <ProgressBar />
    <MainLayout v-if="!isStandalone" />
    <StandaloneLayout v-else />
    <BlogTipContainer />
    <PwaInstallPrompt v-if="!isStandalone" />
    <PwaUpdatePrompt v-if="!isStandalone" />
    <PwaOfflinePage v-if="!isStandalone && !isOnline" />
    <ContextMenu />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import StandaloneLayout from '@/layouts/StandaloneLayout.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import BlogTipContainer from '@/components/common/BlogTipContainer.vue'
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue'
import PwaUpdatePrompt from '@/components/common/PwaUpdatePrompt.vue'
import PwaOfflinePage from '@/components/common/PwaOfflinePage.vue'
import ContextMenu from '@/components/common/ContextMenu.vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useKonamiCode } from '@/composables/useKonamiCode'
import { useAchievements } from '@/composables/useAchievements'
import { useI18n } from 'vue-i18n'
import BlogTip from '@/plugins/blog-tip'

const { isOnline } = useNetworkStatus()
useKonamiCode()
// 初始化成就系统（触发时间成就检查等）
useAchievements()

const route = useRoute()
const isStandalone = computed(() => route.meta.layout === 'standalone')

const { t, locale } = useI18n()

// 监听成就解锁事件，显示 toast 通知
function onAchievementUnlock(e: Event) {
  const detail = (e as CustomEvent).detail
  if (!detail) return
  const name = locale.value === 'en-US' ? detail.nameEn : detail.name
  const message = t('achievements.latestUnlock', { name })
  BlogTip.show(message, { type: 'success', duration: 4000 })
}

onMounted(() => {
  window.addEventListener('achievement-unlock', onAchievementUnlock)
})

onUnmounted(() => {
  window.removeEventListener('achievement-unlock', onAchievementUnlock)
})
</script>

<style lang="less">
#app-root {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
