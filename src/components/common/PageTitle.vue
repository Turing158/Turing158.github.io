<template>
  <h1 class="page-title">
    <span v-if="icon" class="page-title__slot" aria-hidden="true">
      <img :src="`/title-icons/${ICON_FILES[icon]}`" alt="" draggable="false" />
    </span>
    <span class="page-title__text"><slot /></span>
  </h1>
</template>

<script setup lang="ts">
/** 页面标题（各视图共用）：MC 物品栏槽位图标 + 附魔扫光文字。
 *
 *  图标为原版物品栏贴图（16×16），取自 minecraft.wiki（Mojang 版权素材，粉丝站点惯例用途），
 *  下载于 2026-10，存放于 public/title-icons/；动态物品（附魔书 / 附魔金苹果 / 指南针）
 *  为原版动画抽帧重编码的 GIF。
 *
 *  映射：文章=enchanted-book 附魔书 · 项目=crafting-table 工作台 · 工具=anvil 铁砧
 *        发行=dispenser 发射器 · 友链=spyglass 望远镜 · 关于=oak-hanging-sign 悬挂式告示牌
 *        成就=enchanted-golden-apple 附魔金苹果 · 提交=compass 指南针 */
const ICON_FILES = {
  'enchanted-book': 'enchanted-book.gif',
  'crafting-table': 'crafting-table.png',
  'anvil': 'anvil.png',
  'dispenser': 'dispenser.png',
  'spyglass': 'spyglass.png',
  'oak-hanging-sign': 'oak-hanging-sign.png',
  'enchanted-golden-apple': 'enchanted-golden-apple.gif',
  'compass': 'compass.gif',
} as const

defineProps<{
  icon: keyof typeof ICON_FILES
}>()
</script>

<style scoped>
/* 行布局：槽位 + 文字。字号/边距/颜色仍由各视图的 .page-title 作用域样式控制 */
.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title__slot {
  flex: none;
  width: 36px;
  height: 36px;
  /* MC 物品栏槽位：灰底 + 左上暗 / 右下亮的双向内嵌（经典 3D 凹槽） */
  background: #8b8b8b;
  box-shadow: inset 3px 3px 0 #373737, inset -3px -3px 0 #ffffff;
  display: grid;
  place-items: center;
}

.page-title__slot img {
  display: block;
  width: 24px;
  height: 24px;
  /* 16×16 贴图最近邻放大，保住硬边像素感 */
  image-rendering: pixelated;
}

/* 附魔扫光：一道紫色亮光周期性掠过文字（附魔物品的 glint）。
   两端用 var(--text-primary)，浅色/暗色主题自动适配 */
.page-title__text {
  display: inline-block;
  min-width: 0;
  background: linear-gradient(
    110deg,
    var(--text-primary) 42%,
    #8a5bbf 48%,
    #e2cbff 51%,
    #8a5bbf 54%,
    var(--text-primary) 60%
  );
  background-size: 260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: page-title-glint 4.2s ease-in-out infinite;
}

@keyframes page-title-glint {
  0%,
  52% {
    background-position: 130% 0;
  }
  100% {
    background-position: -30% 0;
  }
}
</style>
