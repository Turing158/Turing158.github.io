<template>
  <div ref="skyRef" class="sky-background" aria-hidden="true">
    <img
      v-for="c in clouds"
      :key="c.id"
      class="sky-cloud"
      :src="c.src"
      alt=""
      draggable="false"
      decoding="async"
      :style="{ width: `${c.w}px`, height: `${c.h}px`, zIndex: c.zIndex, '--o': c.opacity }"
      :ref="(el) => { c.el = el as HTMLImageElement | null; if (c.el) applyTransform(c) }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'

/** 云朵素材（public/cloud 下的像素云 SVG），ratio = 高/宽 */
const CLOUD_TYPES = [
  { src: '/cloud/cloud-01-compact.svg', ratio: 238 / 364 },
  { src: '/cloud/cloud-02-long.svg', ratio: 196 / 490 },
  { src: '/cloud/cloud-03-twin-peaks.svg', ratio: 252 / 420 },
  { src: '/cloud/cloud-04-tower.svg', ratio: 336 / 364 },
  { src: '/cloud/cloud-05-arch.svg', ratio: 266 / 490 },
  { src: '/cloud/cloud-06-windswept.svg', ratio: 252 / 546 },
  { src: '/cloud/cloud-07-cloudbank.svg', ratio: 294 / 574 },
] as const

interface Cloud {
  id: number
  src: string
  el: HTMLImageElement | null
  x: number
  y: number
  w: number
  h: number
  speed: number
  /** 本帧实际速度：追上前方的云时会被压到与对方同速，避免穿越 */
  effSpeed: number
  opacity: number
  zIndex: number
  bobAmp: number
  bobPeriod: number
  bobPhase: number
}

const skyRef = ref<HTMLDivElement | null>(null)
const clouds = shallowRef<Cloud[]>([])

let nextId = 1
let rafId = 0
let lastTime = 0
let nextSpawnAt = 0
let lastTypeId = -1
let skyW = 0
let skyH = 0

// 布局参数（resize 时重算）
let minW = 90
let maxW = 220
let maxClouds = 6

// 同高度层的后云贴近前云到该间距就同速前进（像被同一阵风带着走，聚成云带）
const FOLLOW_GAP = 36
const MIN_GAP = 6
// 允许的重叠上限（占较小一朵云面积的比例）；硬性要求是不得 ≥ 3/4，这里留足余量
const MAX_OVERLAP = 0.35

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function measure() {
  const sky = skyRef.value
  if (!sky) return
  skyW = sky.clientWidth
  skyH = sky.clientHeight
  minW = Math.max(70, Math.min(100, skyW * 0.07))
  maxW = Math.max(minW + 40, Math.min(230, skyW * 0.13))
  maxClouds = Math.max(3, Math.min(12, Math.round(skyW / 180)))
}

function pickType() {
  let i = Math.floor(Math.random() * CLOUD_TYPES.length)
  if (i === lastTypeId) i = (i + 1) % CLOUD_TYPES.length // 避免连续出现同款
  lastTypeId = i
  return CLOUD_TYPES[i]
}

/** 候选矩形与现役云的重叠面积是否超过上限（按较小一朵的面积计） */
function overlapsTooMuch(x: number, y: number, w: number, h: number): boolean {
  for (const a of clouds.value) {
    const hx = Math.min(x + w, a.x + a.w) - Math.max(x, a.x)
    if (hx <= 0) continue
    const hy = Math.min(y + h, a.y + a.h) - Math.max(y, a.y)
    if (hy <= 0) continue
    if (hx * hy > MAX_OVERLAP * Math.min(w * h, a.w * a.h)) return true
  }
  return false
}

function makeCloud(t: (typeof CLOUD_TYPES)[number], x: number, y: number, w: number, h: number): Cloud {
  const p = (w - minW) / Math.max(1, maxW - minW) // 0（最小/最远）~ 1（最大/最近）
  return {
    id: nextId++,
    src: t.src,
    el: null,
    x,
    y,
    w,
    h,
    // 系数均值≈1：只拉大各云快慢差异，不整体提速
    speed: (12 + 26 * p) * rand(0.7, 1.35),
    effSpeed: 0,
    opacity: rand(0.78, 1),
    // 负值层级：保持在内容之下；大云（近）画在上面，小云（远）垫底
    zIndex: -(3 - Math.round(p * 2)),
    bobAmp: rand(2.5, 6),
    bobPeriod: rand(6, 12),
    bobPhase: rand(0, Math.PI * 2),
  }
}

function pushCloud(c: Cloud) {
  clouds.value = [...clouds.value, c]
}

/** 从右侧屏幕外生成一朵云：随机高度，避开与现役云深度重叠 */
function trySpawnFromRight(): boolean {
  if (clouds.value.length >= maxClouds) return false
  const t = pickType()
  let w = rand(minW, maxW)
  let h = w * t.ratio
  const maxH = skyH * 0.7
  if (h > maxH) {
    h = maxH
    w = h / t.ratio
  }
  const pad = 4
  const yMin = pad
  const yMax = Math.max(yMin, skyH - h - pad)
  const x = skyW + 4
  for (let i = 0; i < 12; i++) {
    const y = rand(yMin, yMax)
    if (!overlapsTooMuch(x, y, w, h)) {
      pushCloud(makeCloud(t, x, y, w, h))
      return true
    }
  }
  return false
}

/** 初始铺几朵散布在视野里的云，避免开场天空空荡 */
function preSeed() {
  const count = Math.min(maxClouds, Math.max(2, Math.round(skyW / 450)))
  for (let n = 0; n < count; n++) {
    const t = pickType()
    let w = rand(minW, maxW)
    let h = w * t.ratio
    const maxH = skyH * 0.7
    if (h > maxH) {
      h = maxH
      w = h / t.ratio
    }
    const pad = 4
    const yMax = Math.max(pad, skyH - h - pad)
    for (let i = 0; i < 14; i++) {
      const x = rand(-w * 0.2, Math.max(-w * 0.2, skyW - w))
      const y = rand(pad, yMax)
      if (!overlapsTooMuch(x, y, w, h)) {
        pushCloud(makeCloud(t, x, y, w, h))
        break
      }
    }
  }
}

/** 把云的当前坐标写到 DOM（位置完全由 transform 承担） */
function applyTransform(c: Cloud) {
  const bob = c.bobAmp * Math.sin((performance.now() / 1000 / c.bobPeriod) * Math.PI * 2 + c.bobPhase)
  const ry = Math.min(Math.max(c.y + bob, 0), Math.max(0, skyH - c.h))
  if (c.el) c.el.style.transform = `translate3d(${c.x.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick)
  const dt = Math.min((now - lastTime) / 1000, 0.05) // 钳制切后台回来的时间跳变
  lastTime = now

  if (now >= nextSpawnAt) {
    nextSpawnAt = trySpawnFromRight() ? now + rand(1400, 3600) : now + rand(600, 1200)
  }

  // 间距约束：按 x 从前往后扫，同高度层的后云追上前云时压成同速（不穿越、不深叠）
  const sorted = [...clouds.value].sort((a, b) => a.x - b.x)
  for (const c of sorted) c.effSpeed = c.speed
  for (let i = 1; i < sorted.length; i++) {
    const c = sorted[i]
    for (let j = i - 1; j >= 0; j--) {
      const f = sorted[j]
      const vy = Math.min(c.y + c.h, f.y + f.h) - Math.max(c.y, f.y)
      if (vy <= Math.min(c.h, f.h) * 0.18) continue // 高度层错开，互不影响
      const gap = c.x - (f.x + f.w)
      if (gap < FOLLOW_GAP) {
        if (c.effSpeed > f.effSpeed) c.effSpeed = f.effSpeed
        // 仅修正极小间隙（resize 等边缘情况），避免可见的瞬移
        if (gap > -MIN_GAP && gap < MIN_GAP) c.x = f.x + f.w + MIN_GAP
      }
    }
  }

  const alive: Cloud[] = []
  for (const c of clouds.value) {
    c.x -= c.effSpeed * dt
    if (c.x + c.w < -8) continue // 完全移出左边界，回收
    alive.push(c)
    applyTransform(c)
  }
  if (alive.length !== clouds.value.length) clouds.value = alive
}

function startLoop() {
  if (rafId) return
  lastTime = performance.now()
  nextSpawnAt = lastTime + rand(800, 2000)
  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    measure()
    // 天空高度变化后把云夹回可视范围
    for (const c of clouds.value) {
      c.y = Math.min(c.y, Math.max(4, skyH - c.h - 4))
    }
  }, 150)
}

// 注：不响应系统的"减少动态效果"偏好——云朵动画是本站的核心视觉设计，
// 且动画仅有极缓慢的平移 + 微幅上下浮动，强度远低于一般动效
onMounted(() => {
  measure()
  // 预热素材，避免云朵首次出现时闪动
  for (const t of CLOUD_TYPES) {
    const img = new Image()
    img.src = t.src
  }
  preSeed()
  window.addEventListener('resize', onResize)
  startLoop()
})

onBeforeUnmount(() => {
  stopLoop()
  window.removeEventListener('resize', onResize)
  if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<style scoped>
/* 固定在视口顶部的天空：z-index -1 配合 .main-layout 的层叠上下文，
   压在页面背景之上、所有内容之下 */
.sky-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 25vh;
  min-height: 120px;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  /* 天顶较深的蓝 → 地平线附近的浅蓝 → 底部渐隐融入页面背景 */
  background: linear-gradient(
    180deg,
    var(--sky-top, #4a90d9) 0%,
    var(--sky-mid, #7ab5e8) 42%,
    var(--sky-horizon, #cfe7f8) 70%,
    transparent 100%
  );
}

.sky-cloud {
  position: absolute;
  top: 0;
  left: 0;
  /* 主题整体云量 × 单朵随机透明度 */
  opacity: calc(var(--sky-cloud-opacity, 1) * var(--o, 1));
  will-change: transform;
  user-select: none;
}
</style>
