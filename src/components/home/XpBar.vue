<template>
  <div class="xp-bar" role="img" :aria-label="`经验条 ${clamped}%`">
    <div class="xp-fill" :style="{ width: `${clamped}%` }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/** MC 原版经验条（xpbar 贴图 182×5，Mojang 物料、粉丝站点惯例用途，
 *  存放 public/vibe-icons/ 与 PageTitle 同口径）：空贴图做轨道、满贴图按
 *  百分比裁剪填充，2 倍像素化渲染保持原版颗粒感 */
const props = defineProps<{
  /** 填充百分比 0~100 */
  value: number
}>()

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.value))))
</script>

<style scoped>
.xp-bar {
  position: relative;
  height: 10px; /* 贴图原生 5px 的整数 2 倍，pixelated 下颗粒均匀 */
  /* 贴图缩进 4px（content-box），右端帽区域下方无深色垫底，圆角缺口才能透出卡片底色 */
  padding-right: 4px;
  background: url('/vibe-icons/xpbar-empty.png') left top / auto 100% repeat-x content-box;
  image-rendering: pixelated;

  /* 右端帽：贴图只有左端带圆角，把左端 2px 水平镜像贴到右缘；
     未填满时露出空贴图帽，填满后被填充层的绿帽盖住 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    background: url('/vibe-icons/xpbar-empty.png') left top / auto 100% repeat-x;
    transform: scaleX(-1);
    image-rendering: pixelated;
  }
}

.xp-fill {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  z-index: 1;
  /* 同轨道：贴图缩进 4px，绿帽缺口透出下方的卡片底色 */
  padding-right: 4px;
  background: url('/vibe-icons/xpbar-full.png') left top / auto 100% repeat-x content-box;
  image-rendering: pixelated;

  /* 填充层的右端绿帽（任意百分比都以圆角收尾），层级高于轨道帽 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 4px;
    background: url('/vibe-icons/xpbar-full.png') left top / auto 100% repeat-x;
    transform: scaleX(-1);
    image-rendering: pixelated;
  }
}
</style>
