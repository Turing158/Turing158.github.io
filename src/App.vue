<template>
  <div id="app-root">
    <ProgressBar />
    <MainLayout v-if="!isStandalone" />
    <StandaloneLayout v-else />
    <BlogTipContainer />
    <PwaInstallPrompt v-if="!isStandalone" />
    <PwaUpdatePrompt v-if="!isStandalone" />
    <PwaOfflinePage v-if="!isStandalone && !isOnline" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import StandaloneLayout from '@/layouts/StandaloneLayout.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import BlogTipContainer from '@/components/common/BlogTipContainer.vue'
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue'
import PwaUpdatePrompt from '@/components/common/PwaUpdatePrompt.vue'
import PwaOfflinePage from '@/components/common/PwaOfflinePage.vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()

const route = useRoute()
const isStandalone = computed(() => route.meta.layout === 'standalone')
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
