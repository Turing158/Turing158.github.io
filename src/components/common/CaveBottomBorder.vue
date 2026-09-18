<template>
  <div class="cave-bottom" aria-hidden="true">
    <!-- 地表层（下）：苔藓地表与黏土水洼，静态内容只光栅化一次 -->
    <svg ref="terrainRef" xmlns="http://www.w3.org/2000/svg"></svg>
    <!-- 植物容器（上）：每株植物、每道水面波光都是独立合成层，
         transform/opacity 动画全部由合成器在 GPU 上驱动 -->
    <div ref="plantsRef" class="cave-bottom-plants"></div>
    <!-- 植物符号表：各植物小 svg 片段通过 <use> 引用 -->
    <svg ref="defsRef" xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>
  </div>
</template>

<script setup lang="ts">
// 移植自繁茂洞穴下边框 HTML（薄地层版）：苔藓地表 + 草丛 + 杜鹃灌丛 + 黏土水洼。
// 纹理、随机种子、动画与全部绘制逻辑均来自原文件，仅做组件化封装
// （原 getElementById 改为模板 ref，初始化挂到 onMounted，销毁时断开 ResizeObserver）。
//
// GPU 优化：SVG 内部元素的 CSS 动画无法被合成器加速，每帧都要在 GPU 进程
// 重新光栅化。这里进一步把所有动画元素拆成独立合成层：每株植物是一个绝对
// 定位的 div（围绕根部 transform-origin 摆动），内部放 1 个静态小 svg 片段；
// 水面波光是纯 div。transform/opacity 动画完全由合成器驱动——纹理只光栅化
// 一次，之后每帧零重绘、零光栅化。地表态 SVG 同样独立成层长期缓存。
// 完全滚出视口时暂停全部动画（相位保留）。
//
// 画面一致性：包裹盒多留了最大摆角的旋转投影余量；波光 div 直接用屏幕
// 坐标（逻辑单位 × PIXEL），与原位置逐像素一致；波光与植物互不重叠，
// 绘制层级先后不影响最终画面（已用多相位冻结截图 + pixelmatch 验证）。
import { onBeforeUnmount, onMounted, ref } from 'vue'

const plantsRef = ref<HTMLDivElement | null>(null)
const terrainRef = ref<SVGSVGElement | null>(null)
const defsRef = ref<SVGSVGElement | null>(null)

const PIXEL = 2

// 保持植物和地表位置不变，只缩短地下部分。
const GROUND = 57
const UNDERGROUND = 11
const HEIGHT = GROUND + UNDERGROUND

let host: HTMLElement | null = null
let observer: ResizeObserver | null = null
let pauseObserver: IntersectionObserver | null = null
let previousWidth = 0
let frame = 0

function random(seed: number) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0

    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t)

    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function rect(x: number, y: number, w: number, h: number, fill: string, extra = '') {
  return `
    <rect
      x="${x}"
      y="${y}"
      width="${w}"
      height="${h}"
      fill="${fill}"
      ${extra}
    />
  `
}

function sprite(id: string, x: number, y: number, w: number, h: number) {
  return `
    <svg
      x="${x}"
      y="${y}"
      width="${w}"
      height="${h}"
      viewBox="0 0 ${w} ${h}"
      overflow="visible"
    >
      <use href="#${id}" width="${w}" height="${h}"/>
    </svg>
  `
}

type Bounds = { x: number; y: number; w: number; h: number }

// 植物静态画面的 svg 片段：与外层 div 同尺寸同 viewBox（局部坐标，
// 原点 = 摆动根部），只光栅化一次，随后由合成器随外层 div 一起旋转。
function fragment(vb: Bounds, content: string) {
  return `
    <svg
      width="${vb.w * PIXEL}"
      height="${vb.h * PIXEL}"
      viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"
      overflow="visible"
    >${content}</svg>`
}

// 包围盒（局部坐标，原点 = 摆动根部），预留最大摆角的旋转投影余量。
const windSettings = {
  grass: {
    left: -3,
    right: 4,
    middle: -1,
    duration: 3.8,
    vb: { x: -12, y: -18, w: 24, h: 20 }
  },

  tall: {
    left: -4,
    right: 5,
    middle: -1.6,
    duration: 4.6,
    vb: { x: -12, y: -32, w: 24, h: 34 }
  },

  bush: {
    left: -1.3,
    right: 1.8,
    middle: -.4,
    duration: 5.8,
    vb: { x: -17, y: -29, w: 34, h: 31 }
  }
}

function wind(content: string, rootX: number, rootY: number, kind: 'grass' | 'tall' | 'bush', seed: number) {
  const motion = windSettings[kind]
  const phase = Math.abs(seed)
  const duration = motion.duration + (phase % 7) * .13
  const delay = -(phase % 41) * .19
  const vb = motion.vb

  // 外层 div 定位包围盒并围绕根部（vb 原点）摆动。
  return `
    <div
      class="cave-sway"
      style="
        left:${(rootX + vb.x) * PIXEL}px;
        top:${(rootY + vb.y) * PIXEL}px;
        width:${vb.w * PIXEL}px;
        height:${vb.h * PIXEL}px;
        transform-origin:${-vb.x * PIXEL}px ${-vb.y * PIXEL}px;
        --wind-left: ${motion.left}deg;
        --wind-right: ${motion.right}deg;
        --wind-middle: ${motion.middle}deg;
        --wind-duration: ${duration}s;
        --wind-delay: ${delay}s;
      "
    >${fragment(vb, content)}</div>
  `
}

function terrainDefinitions() {
  const rng = random(6009)
  let texture = ''

  for (let i = 0; i < 42; i++) {
    texture += rect(
      Math.floor(rng() * 15),
      3 + Math.floor(rng() * 12),
      1 + Math.floor(rng() * 3),
      1 + Math.floor(rng() * 2),
      ['#496329', '#607b32', '#75863b', '#3d5427'][i % 4]
    )
  }

  return `
    <defs>
      <symbol id="bottom-moss" viewBox="0 0 16 16">
        ${rect(0, 0, 16, 16, '#566e2e')}
        ${texture}

        <path
          fill="#899d46"
          d="M0 0h16v2H0z"
        />

        <path
          fill="#a2ac52"
          d="M1 0h3v1H1zM7 0h4v1H7zM13 1h3v1h-3z"
        />

        <path
          fill="#6c8838"
          d="M0 2h5v2H0zM8 2h4v3H8zM14 2h2v2h-2z"
        />

        <path
          fill="#344b25"
          d="M0 15h16v1H0z"
        />
      </symbol>
    </defs>
  `
}

function plantDefinitions() {
  return `
    <defs>
      <symbol id="bottom-grass" viewBox="0 0 16 16">
        <path
          fill="#36572a"
          d="M7 16V8H5V4H3V2H1v4h2v4h2v6z
             M9 16V8h2V4h2V2h2v5h-2v4h-2v5z"
        />

        <path
          fill="#73963e"
          d="M6 16V9H4V5H2V3h2v2h2v4h2v7z
             M9 16V7h2V3h2v4h-2v9z"
        />

        <path
          fill="#a0b552"
          d="M7 16V5H6V1h2v4h1v11zM12 9h2v2h-2z"
        />

        <path
          fill="#557f32"
          d="M3 16v-4H1v-2h2v2h2v4z"
        />
      </symbol>

      <symbol id="bottom-tall-grass" viewBox="0 0 18 30">
        <path
          fill="#345627"
          d="M7 30V16H5v-6H3V4H1v8h2v7h2v11z
             M10 30V16h2V8h2V3h2v8h-2v8h-2v11z"
        />

        <path
          fill="#6e913a"
          d="M7 30V13H5V6H3V2h2v4h2v7h2v17z
             M10 30V12h2V5h2V1h2v5h-2v8h-2v16z"
        />

        <path
          fill="#a1b657"
          d="M8 30V9H7V0h2v9h1v21z"
        />

        <path
          fill="#83a546"
          d="M5 30V22H3v-6H1v-3h2v3h2v6h2v8z
             M12 30V22h2v-6h2v-4h2v5h-2v7h-2v6z"
        />

        <path
          fill="#486f2e"
          d="M7 21H5v-2h2zM10 16h2v2h-2zM8 26h3v4H8z"
        />
      </symbol>

      <symbol id="bottom-azalea" viewBox="0 0 30 27">
        <path
          fill="#5b4831"
          d="M13 27V15h4v12zM9 19h4v3H9z"
        />

        <path
          fill="#957746"
          d="M14 19h1v8h-1z"
        />

        <path
          fill="#294c2b"
          d="M5 3h6V0h10v3h6v5h3v10h-4v4H5v-3H0V9h3V5h2z"
        />

        <path
          fill="#426a32"
          d="M6 4h7V2h7v3h6v5h2v7h-5v3H6v-3H2v-6h4z"
        />

        <path
          fill="#63863d"
          d="M6 4h7V2h7v3h5v4H14v3H5V8h1z
             M3 12h6v4H3zM17 14h7v4h-7z"
        />

        <path
          fill="#8d9e4d"
          d="M7 4h4v2H7zM15 3h4v2h-4zM22 7h3v2h-3z"
        />

        <path
          fill="#355b2a"
          d="M9 10h4v4H9zM17 7h3v4h-3zM11 17h5v3h-5z"
        />
      </symbol>

      <symbol id="bottom-bloom" viewBox="0 0 7 7">
        <path
          fill="#754169"
          d="M2 0h3v2h2v3H5v2H2V5H0V2h2z"
        />

        <path
          fill="#c37cab"
          d="M2 0h2v2H2zM0 2h2v2H0zM4 2h2v2H4zM2 4h2v2H2z"
        />

        <path
          fill="#e9aecb"
          d="M2 2h2v2H2z"
        />
      </symbol>
    </defs>
  `
}

function grass(x: number, ground: number, tall = false) {
  const w = tall ? 18 : 16
  const h = tall ? 30 : 16
  const id = tall ? 'bottom-tall-grass' : 'bottom-grass'

  const content = sprite(id, -w / 2, -h, w, h)

  return wind(
    content,
    x + w / 2,
    ground,
    tall ? 'tall' : 'grass',
    x
  )
}

function bush(x: number, ground: number, flowering: boolean) {
  let content = sprite(
    'bottom-azalea',
    -15,
    -27,
    30,
    27
  )

  if (flowering) {
    const flowers = [
      [6, 4],
      [18, 5],
      [3, 13],
      [16, 14]
    ]

    for (const [dx, dy] of flowers) {
      content += sprite(
        'bottom-bloom',
        -15 + dx,
        -27 + dy,
        7,
        7
      )
    }
  }

  return wind(content, x + 15, ground, 'bush', x)
}

function pond(x: number, surface: number, seed: number) {
  const rng = random(seed)

  // 薄地层专用浅水洼：
  // 高度 13 个逻辑像素，其中 2 像素位于地表上方。
  let out = `
    <svg
      x="${x}"
      y="${surface - 2}"
      width="62"
      height="13"
      viewBox="0 0 62 13"
    >
      <!-- 黏土基底 -->
      <path
        fill="#626f72"
        d="M0 0h12v2h38V0h12v13H0z"
      />

      <!-- 阶梯状黏土岸线 -->
      <path
        fill="#98a2a0"
        d="M0 0h12v3h38V0h12v4h-6v3H6V4H0z"
      />

      <path
        fill="#b0b6ae"
        d="M0 0h11v1H0zM51 0h11v1H51zM6 4h8v1H6z"
      />

      <!-- 两侧黏土 -->
      <path
        fill="#7f8d8e"
        d="M0 7h8v3h5v3H0zM54 7h8v6H49v-3h5z"
      />

      <!-- 浅水 -->
      <path
        fill="#284f59"
        d="M10 4h42v4h-4v3H16V8h-6z"
      />

      <path
        fill="#356f79"
        d="M10 4h42v3h-5v2H16V7h-6z"
      />

      <path
        fill="#4a9296"
        d="M10 4h42v2H10z"
      />

      <path
        fill="#76afb0"
        d="M12 4h10v1H12zM37 4h12v1H37z"
      />
  `

  // 纹理只绘制在黏土岸边和底部。
  for (let i = 0; i < 14; i++) {
    const px = Math.floor(rng() * 60)
    let py = 7 + Math.floor(rng() * 6)

    if (px > 9 && px < 53) {
      py = 11 + (i % 2)
    }

    out += rect(
      px,
      py,
      2,
      1,
      i % 2 ? '#a0aaa7' : '#56686c'
    )
  }

  out += `
    </svg>
  `

  return out
}

// 水面波光改为纯 div 合成层（opacity 动画），坐标从水洼局部坐标
// 换算为屏幕坐标（逻辑单位 × PIXEL），与原位置逐像素一致。
// 波光与任何植物都不重叠，绘制层级先后不影响最终画面。
function pondGlints(x: number, surface: number) {
  return `
    <div
      class="water-glint"
      style="
        left:${(x + 17) * PIXEL}px;
        top:${(surface - 2 + 6) * PIXEL}px;
        width:${9 * PIXEL}px;
        height:${PIXEL}px;
      "
    ></div>

    <div
      class="water-glint"
      style="
        left:${(x + 35) * PIXEL}px;
        top:${(surface - 2 + 5) * PIXEL}px;
        width:${11 * PIXEL}px;
        height:${PIXEL}px;
        --delay:-1.5s;
      "
    ></div>

    <div
      class="water-glint"
      style="
        left:${(x + 29) * PIXEL}px;
        top:${(surface - 2 + 8) * PIXEL}px;
        width:${6 * PIXEL}px;
        height:${PIXEL}px;
        --delay:-2.7s;
      "
    ></div>
  `
}

function draw() {
  if (!plantsRef.value || !terrainRef.value || !defsRef.value || !host) return
  const width = Math.max(
    1,
    Math.ceil(host.clientWidth / PIXEL)
  )

  terrainRef.value.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`)
  terrainRef.value.setAttribute('width', String(width * PIXEL))
  terrainRef.value.setAttribute('height', String(HEIGHT * PIXEL))

  let terrain = rect(
    0,
    GROUND,
    width,
    UNDERGROUND,
    '#34492a'
  )

  let plants = ''
  let water = ''
  let glints = ''

  const rng = random(9401)

  // 保持原始纹理尺寸，多余地层由 SVG 底边裁切。
  // 不再绘制原版的第二排苔藓块。
  for (let x = -16; x < width + 16; x += 16) {
    terrain += sprite(
      'bottom-moss',
      x,
      GROUND,
      16,
      16
    )

    if (rng() > .25) {
      const carpetWidth = 6 + Math.floor(rng() * 10)

      terrain += rect(
        x,
        GROUND - 2,
        carpetWidth,
        2,
        '#718d3b'
      )

      terrain += rect(
        x + 1,
        GROUND - 2,
        carpetWidth - 2,
        1,
        '#a0ac51'
      )
    }
  }

  for (let x = 0, i = 0; x < width; x += 220, i++) {
    plants += grass(x + 1, GROUND)
    plants += grass(x + 14, GROUND, true)
    plants += bush(x + 37, GROUND, true)
    plants += grass(x + 66, GROUND)

    water += pond(x + 84, GROUND, 290 + i)
    glints += pondGlints(x + 84, GROUND)

    plants += grass(x + 149, GROUND)
    plants += bush(x + 167, GROUND, i % 2 === 1)
    plants += grass(x + 197, GROUND, true)
    plants += grass(x + 208, GROUND)
  }

  // 地表与水洼在下方图层，植物与波光在上方图层。
  terrainRef.value.innerHTML = terrainDefinitions() + terrain + water
  plantsRef.value.innerHTML = plants + glints
  defsRef.value.innerHTML = plantDefinitions()
}

onMounted(() => {
  const mountedHost = plantsRef.value!.parentElement!
  host = mountedHost
  // 总高度：68 × 2 = 136px。
  // 地下高度：11 × 2 = 22px。
  mountedHost.style.height = `${HEIGHT * PIXEL}px`
  previousWidth = mountedHost.clientWidth

  draw()

  observer = new ResizeObserver(() => {
    const width = mountedHost.clientWidth

    if (width === previousWidth) return

    previousWidth = width
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(draw)
  })

  observer.observe(mountedHost)

  // 完全滚出视口时暂停动画：相位保留，回到视口后无缝继续，视觉无差异。
  pauseObserver = new IntersectionObserver(entries => {
    mountedHost.classList.toggle('cave-paused', !entries[0].isIntersecting)
  })
  pauseObserver.observe(mountedHost)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  pauseObserver?.disconnect()
  pauseObserver = null
  cancelAnimationFrame(frame)
})
</script>

<!--
  运行时通过 innerHTML 注入的元素无法获得 scoped 属性，
  样式保持全局；类名（cave-bottom / cave-bottom-plants /
  cave-sway / water-glint）已确认与站点现有样式无冲突。
-->
<style lang="less">
.cave-bottom {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  height: 136px;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  isolation: isolate;
}

/* 静态地表层与符号表 */
.cave-bottom > svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  max-width: none;
  overflow: hidden;
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  /* 独立合成层：静态纹理只光栅化一次长期缓存，不被任何动画波及。 */
  will-change: transform;
}

/* 摆动植物容器 */
.cave-bottom-plants {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 植物画面的小 svg 片段：只光栅化一次，随外层合成层旋转。
   仅匹配片段根节点，嵌套精灵 svg 仍由 x/y 特性定位。 */
.cave-bottom-plants .cave-sway > svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  shape-rendering: crispEdges;
  image-rendering: pixelated;
}

/*
 * 每株植物一个独立合成层：div 定位到包围盒，围绕根部
 * （transform-origin）摆动。rotate 动画由合成器驱动，
 * 纹理光栅化一次后每帧零重绘。
 */
.cave-bottom .cave-sway {
  position: absolute;
  will-change: transform;
  animation: plant-sway
    var(--wind-duration, 5s)
    ease-in-out
    var(--wind-delay, 0s)
    infinite;
}

.water-glint {
  position: absolute;
  background: #acd0c0;
  will-change: opacity;
  animation: water-shimmer
    4s steps(4, end)
    var(--delay, 0s)
    infinite;
}

/* 完全滚出视口时暂停所有动画，避免滚动阅读时的无效合成。 */
.cave-bottom.cave-paused .cave-sway,
.cave-bottom.cave-paused .water-glint {
  animation-play-state: paused;
}

@keyframes plant-sway {
  0%, 100% {
    transform: rotate(var(--wind-left, -2deg));
  }

  38% {
    transform: rotate(var(--wind-right, 3deg));
  }

  72% {
    transform: rotate(var(--wind-middle, -.7deg));
  }
}

@keyframes water-shimmer {
  0%, 100% { opacity: .22; }
  40%      { opacity: .75; }
  70%      { opacity: .38; }
}
</style>
