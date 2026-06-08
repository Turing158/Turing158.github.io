<template>
  <div id="app-root">
    <ProgressBar />
    <MainLayout />
    <BlogTipContainer />
    <PwaInstallPrompt />
  </div>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import BlogTipContainer from '@/components/common/BlogTipContainer.vue'
import PwaInstallPrompt from '@/components/common/PwaInstallPrompt.vue'
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
