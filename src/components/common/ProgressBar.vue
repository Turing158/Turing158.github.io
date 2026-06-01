<template>
  <div class="progress-bar" :class="{ active: loading, finishing }" :style="{ width: `${progress}%` }" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { registerProgress } from '@/router'

const progress = ref(0)
const loading = ref(false)
const finishing = ref(false)
let timers: ReturnType<typeof setTimeout>[] = []

function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers = []
}

function addTimer(fn: () => void, delay: number) {
  timers.push(setTimeout(fn, delay))
}

function start() {
  clearTimers()
  finishing.value = false
  loading.value = true
  progress.value = 30
  addTimer(() => { progress.value = 70 }, 200)
  addTimer(() => { progress.value = 90 }, 600)
}

function done() {
  clearTimers()
  progress.value = 100
  // 宽度到 100% 后，开始上移动画
  addTimer(() => {
    finishing.value = true
  }, 350)
  // 上移动画结束后重置
  addTimer(() => {
    loading.value = false
    finishing.value = false
    progress.value = 0
  }, 700)
}

onMounted(() => {
  registerProgress({ onStart: start, onDone: done })
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style lang="less" scoped>
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  z-index: 9999;
  box-shadow: 0 0 8px var(--accent);
  width: 0;
  opacity: 0;
  transition: width 0.35s ease, transform 0.35s ease, opacity 0.2s ease;

  &.active {
    opacity: 1;
  }

  &.finishing {
    transform: translateY(-100%);
    opacity: 0;
  }
}
</style>
