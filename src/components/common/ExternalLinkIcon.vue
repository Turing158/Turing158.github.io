<template>
  <span class="external-link-icon" aria-hidden="true">
    <SidebarIcon name="externalLink" :size="size" />
  </span>
</template>

<script setup lang="ts">
import SidebarIcon from '@/components/sidebar/SidebarIcon.vue'

withDefaults(defineProps<{ size?: number }>(), {
  size: 14,
})
</script>

<style scoped>
.external-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  margin-left: 6px;
  opacity: 0.8;
}
</style>
