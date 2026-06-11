<template>
  <div class="standalone-layout">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// 独立页面布局：不渲染侧边栏等博客元素，
// 页面背景与配色由各独立页面自行负责（不使用博客主题变量）
</script>

<style lang="less" scoped>
.standalone-layout {
  min-height: 100vh;
}
</style>
