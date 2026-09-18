<template>
  <div class="cave-top" aria-hidden="true">
    <!-- 摆动植物容器（下）：每株植物、每个浆果光晕、每颗粒子都是独立合成层，
         transform/opacity 动画全部由合成器在 GPU 上驱动 -->
    <div ref="plantsRef" class="cave-top-plants"></div>
    <!-- 洞顶层（上）：静态纹理只光栅化一次，绘制在最上层遮住植物与洞顶的接缝 -->
    <svg ref="terrainRef" xmlns="http://www.w3.org/2000/svg"></svg>
    <!-- 植物符号表：各植物小 svg 片段通过 <use> 引用 -->
    <svg ref="defsRef" xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>
  </div>
</template>

<script setup lang="ts">
// 移植自繁茂洞穴上边框 HTML：苔藓洞顶 + 垂藤 + 发光浆果 + 孢子飘落。
// 纹理、随机种子、动画与全部绘制逻辑均来自原文件，仅做组件化封装
// （原 getElementById 改为模板 ref，初始化挂到 onMounted，销毁时断开 ResizeObserver）。
//
// GPU 优化：SVG 内部元素的 CSS 动画无法被合成器加速，每帧都要在 GPU 进程
// 重新光栅化。这里进一步把所有动画元素拆成独立合成层：每株植物是一个绝对
// 定位的 div（围绕悬挂点 transform-origin 摆动），内部放 1~3 个静态小 svg
// 片段；浆果光晕、飘落孢子是纯 div。transform/opacity 动画完全由合成器
// 驱动——纹理只光栅化一次，之后每帧零重绘、零光栅化。地表态 SVG 同样
// 独立成层长期缓存。完全滚出视口时暂停全部动画（相位保留）。
//
// 画面一致性：包裹盒多留了最大摆角的旋转投影余量；SVG 的 px 是用户单位
// （×pixel 才是屏幕 px），HTML 的 px 就是屏幕 px，故孢子轨迹的 39 单位
// 落差写作 39×pixel；光晕 div 与其前后 svg 片段按原绘制顺序穿插，遮挡
// 关系逐像素不变（已用多相位冻结截图 + pixelmatch 验证）。
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 每个逻辑像素的渲染边长（px）。默认 2，即原版的 2 倍整数像素；调小可整体等比缩小画面（不裁切）。 */
    pixel?: number
    /** 悬挂植物整体右移的逻辑像素数（×pixel = 实际 px）。用于让最长的垂藤避开宿主页面特定位置，0 保持原版布局。 */
    plantOffset?: number
  }>(),
  { pixel: 2, plantOffset: 0 },
)

const plantsRef = ref<HTMLDivElement | null>(null)
const terrainRef = ref<SVGSVGElement | null>(null)
const defsRef = ref<SVGSVGElement | null>(null)

// 上边框逻辑高度 88；实际占位高度 = 88 × pixel（默认 2 倍 → 176px）。
const HEIGHT = 88

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
      x="${x}" y="${y}"
      width="${w}" height="${h}"
      fill="${fill}" ${extra}
    />
  `
}

function sprite(id: string, x: number, y: number, w: number, h: number) {
  return `
    <svg
      x="${x}" y="${y}"
      width="${w}" height="${h}"
      viewBox="0 0 ${w} ${h}"
      overflow="visible"
    >
      <use href="#${id}" width="${w}" height="${h}"/>
    </svg>
  `
}

type Bounds = { x: number; y: number; w: number; h: number }

// 植物静态画面的 svg 片段：与外层 div 同尺寸同 viewBox（局部坐标，
// 原点 = 悬挂点），只光栅化一次，随后由合成器随外层 div 一起旋转。
function fragment(vb: Bounds, content: string) {
  const px = props.pixel

  return `
    <svg
      width="${vb.w * px}"
      height="${vb.h * px}"
      viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}"
      overflow="visible"
    >${content}</svg>`
}

function terrainDefinitions() {
  const rng = random(6107)
  let texture = ''

  for (let i = 0; i < 35; i++) {
    texture += rect(
      Math.floor(rng() * 15),
      Math.floor(rng() * 14),
      1 + Math.floor(rng() * 3),
      1 + Math.floor(rng() * 2),
      ['#405626', '#536d2d', '#6c8037', '#819343'][i % 4]
    )
  }

  return `
    <defs>
      <symbol id="top-moss" viewBox="0 0 16 16">
        ${rect(0, 0, 16, 16, '#526b2e')}
        ${texture}

        <path fill="#2e4523"
          d="M0 13h4v1h4v-1h3v2h5v1H0z"/>

        <path fill="#9aa84c"
          d="M1 2h3v1H1zM9 4h2v1H9zM6 9h3v1H6z"/>
      </symbol>

      <symbol id="top-stone" viewBox="0 0 16 8">
        ${rect(0, 0, 16, 8, '#343e38')}

        <path fill="#485148"
          d="M0 1h6v2H0zM9 0h5v2H9zM5 5h6v2H5z"/>

        <path fill="#242f2b"
          d="M1 6h3v1H1zM11 3h5v2h-5z"/>
      </symbol>
    </defs>
  `
}

function plantDefinitions() {
  return `
    <defs>
      <symbol id="top-leaf-left" viewBox="0 0 8 7">
        <path fill="#304b24"
          d="M0 0h5v2h3v5H4V5H1V3H0z"/>

        <path fill="#597b30"
          d="M0 0h4v1h2v3H3V3H1V2H0z"/>

        <path fill="#91a448"
          d="M1 0h3v1H1zM3 2h2v1H3z"/>
      </symbol>

      <symbol id="top-leaf-right" viewBox="0 0 8 7">
        <path fill="#304b24"
          d="M3 0h5v3H7v2H4v2H0V2h3z"/>

        <path fill="#648735"
          d="M4 0h4v2H7v1H5v1H2V2h2z"/>

        <path fill="#a1ae50"
          d="M5 0h2v1H5zM3 2h2v1H3z"/>
      </symbol>

      <symbol id="top-berry" viewBox="0 0 7 9">
        <path fill="#5e6326"
          d="M3 0h1v3H3zM1 2h5v2H1z"/>

        <path fill="#9d511d"
          d="M1 3h5v1h1v4H5v1H1V8H0V4h1z"/>

        <path fill="#eaa52f"
          d="M1 4h5v3H5v1H1z"/>

        <path fill="#ffdb68"
          d="M1 4h3v3H1z"/>

        <path fill="#fff0a0"
          d="M2 4h1v1H2z"/>
      </symbol>

      <symbol id="top-flower" viewBox="0 0 24 22">
        <path fill="#344e2c"
          d="M10 0h4v4h6v3h-5v3H8V7H3V4h7z"/>

        <path fill="#6b893b"
          d="M6 3h5v3H6zM14 3h4v3h-4z"/>

        <path fill="#773d55"
          d="M2 8h5V6h10v2h5v3h2v4h-6v3h-3v4H9v-4H6v-3H0v-4h2z"/>

        <path fill="#b9607b"
          d="M2 9h6V7h8v2h6v5h-6v4h-2v3h-4v-3H8v-4H2z"/>

        <path fill="#df8c9e"
          d="M3 9h5v2H6v2H2v-2h1z
             M16 9h5v4h-4v-2h-1z
             M10 15h4v5h-4z"/>

        <path fill="#f3b3b7"
          d="M3 9h4v1H3zM18 9h3v1h-3zM10 18h2v2h-2z"/>

        <path fill="#56723a" d="M8 9h8v6H8z"/>
        <path fill="#9eae57" d="M9 10h6v4H9z"/>
        <path fill="#d2d57d" d="M10 11h3v2h-3z"/>
        <path fill="#394b2b" d="M11 14h2v2h-2z"/>
      </symbol>
    </defs>
  `
}

// 垂藤：局部坐标原点位于藤蔓顶部中央（悬挂点）。
// 包围盒预留 ±3.2° 摆角的旋转投影余量，保证内容永不溢出。
function vine(x: number, y: number, length: number, seed: number) {
  const rng = random(seed)
  const px = props.pixel
  const phase = Math.abs(seed)
  const vb = { x: -16, y: -3, w: 32, h: length + 17 }

  // 外层 div 定位包围盒并围绕悬挂点（vb 原点）摆动。
  let out = `
    <div
      class="cave-sway"
      style="
        left:${(x + 8 + vb.x) * px}px;
        top:${(y + vb.y) * px}px;
        width:${vb.w * px}px;
        height:${vb.h * px}px;
        transform-origin:${-vb.x * px}px ${-vb.y * px}px;
        --wind-left: -2.4deg;
        --wind-right: 3.2deg;
        --wind-middle: -.8deg;
        --wind-duration: ${5.2 + (phase % 9) * .21}s;
        --wind-delay: ${-(phase % 37) * .23}s;
      "
    >`

  // 光晕是独立合成层（opacity 动画），把它前后的静态画面切成
  // 多个小 svg 片段，保持与原版完全一致的绘制与遮挡顺序。
  let art = ''
  const flush = () => {
    if (art) {
      out += fragment(vb, art)
      art = ''
    }
  }

  art += rect(-1, 0, 2, length, '#3c592b')
  art += rect(-1, 0, 1, length - 2, '#779146')

  for (let n = 3; n < length - 4; n += 8) {
    const left = Math.floor(n / 8) % 2 === 0

    art += sprite(
      left ? 'top-leaf-left' : 'top-leaf-right',
      left ? -8 : 0,
      n,
      8,
      7
    )

    if (rng() > .43) {
      const bx = left ? -1 : -6
      const by = n + 2

      flush()

      // 三层静态透明矩形垫在光晕层纹理里，外层 opacity 呼吸时
      // 一次性套用（与 SVG 组 opacity 的「先展平再套透明度」一致）。
      out += `
        <div
          class="berry-light"
          style="
            left:${(bx - 6 - vb.x) * px}px;
            top:${(by - 4 - vb.y) * px}px;
            width:${19 * px}px;
            height:${17 * px}px;
            --glow-delay:-${(rng() * 5).toFixed(2)}s;
          "
        >
          <div style="left:0;top:0;width:100%;height:100%;background:#f2b94c;opacity:.035"></div>
          <div style="left:${3 * px}px;top:${2 * px}px;width:${13 * px}px;height:${13 * px}px;background:#f2b94c;opacity:.07"></div>
          <div style="left:${5 * px}px;top:${4 * px}px;width:${9 * px}px;height:${9 * px}px;background:#f5c85c;opacity:.08"></div>
        </div>
      `

      art = sprite('top-berry', bx, by, 7, 9)
    }
  }

  art += sprite('top-leaf-left', -7, length - 3, 8, 7)
  flush()

  return out + `</div>`
}

function blossom(x: number, y: number, seed: number) {
  const rng = random(seed)
  const px = props.pixel
  const phase = Math.abs(seed)
  const vb = { x: -14, y: -2, w: 28, h: 28 }

  let out = `
    <div
      class="cave-sway"
      style="
        left:${(x + 12 + vb.x) * px}px;
        top:${(y + vb.y) * px}px;
        width:${vb.w * px}px;
        height:${vb.h * px}px;
        transform-origin:${-vb.x * px}px ${-vb.y * px}px;
        --wind-left: -1.5deg;
        --wind-right: 2deg;
        --wind-middle: -.4deg;
        --wind-duration: ${6.6 + (phase % 9) * .21}s;
        --wind-delay: ${-(phase % 37) * .23}s;
      "
    >${fragment(vb, sprite('top-flower', -12, 0, 24, 22))}</div>`

  // 粒子独立于花朵摆动，飘落后不会跟随花朵旋转。
  for (let i = 0; i < 10; i++) {
    const dx = Math.floor(rng() * 9) - 4
    const drift = 3 + Math.floor(rng() * 12)
    const duration = 4.5 + rng() * 4
    const delay = -rng() * 10

    out += `
      <div
        class="spore"
        style="
          left:${(x + 12 + dx) * px}px;
          top:${(y + 19 + Math.floor(rng() * 3)) * px}px;
          width:${(i % 4 === 0 ? 2 : 1) * px}px;
          height:${px}px;
          background:${i % 3 === 0 ? '#d1d789' : '#a6bd68'};
          --drift:${drift * px}px;
          --fall:${39 * px}px;
          --duration:${duration.toFixed(2)}s;
          --delay:${delay.toFixed(2)}s;
        "
      ></div>`
  }

  return out
}

function draw() {
  if (!plantsRef.value || !terrainRef.value || !defsRef.value || !host) return
  const width = Math.max(
    1,
    Math.ceil(host.clientWidth / props.pixel)
  )

  terrainRef.value.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`)
  terrainRef.value.setAttribute('width', String(width * props.pixel))
  terrainRef.value.setAttribute('height', String(HEIGHT * props.pixel))

  const rng = random(1789)
  let terrain = ''
  let plants = ''

  // 苔藓洞顶和不规则的覆地苔藓边缘。
  for (let x = -16; x < width + 16; x += 16) {
    const y = -5 + Math.floor(rng() * 7)

    terrain += sprite('top-moss', x, y, 16, 16)
    terrain += rect(x + 2, y + 15, 10, 2, '#647b34')
    terrain += rect(x + 4, y + 17, 5, 1, '#879547')

    if (rng() > .55) {
      terrain += rect(x + 11, y + 15, 3, 4, '#3f5c2b')
    }
  }

  for (let x = 0; x < width; x += 16) {
    terrain += sprite('top-stone', x, -4, 16, 8)
  }

  // 植物按 plantOffset 整体右移：从偏左一个周期的锚点起步，
  // 保证左移出的藤蔓仍能补满左边缘（洞顶苔藓是连续纹理，无需跟随移动）。
  for (let x = props.plantOffset - 160, i = 0; x < width; x += 160, i++) {
    plants += vine(x + 8, 11, 46, 91 + i)
    plants += vine(x + 34, 13, 27, 123 + i)
    plants += blossom(x + 66, 13, 210 + i)
    plants += vine(x + 106, 12, 57, 510 + i)
    plants += vine(x + 133, 10, 35, 720 + i)
  }

  // 洞顶在上方图层，依旧遮住植物与洞顶的接缝。
  plantsRef.value.innerHTML = plants
  terrainRef.value.innerHTML = terrainDefinitions() + terrain
  defsRef.value.innerHTML = plantDefinitions()
}

onMounted(() => {
  const mountedHost = plantsRef.value!.parentElement!
  host = mountedHost
  mountedHost.style.height = `${HEIGHT * props.pixel}px`
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

// ResizeObserver 只响应宽度变化，参数变更时需手动重绘
watch(
  () => [props.plantOffset, props.pixel],
  () => {
    if (host) draw()
  },
)
</script>

<!--
  运行时通过 innerHTML 注入的元素无法获得 scoped 属性，
  样式保持全局；类名（cave-top / cave-top-plants / cave-sway /
  berry-light / spore）已确认与站点现有样式无冲突。
-->
<style lang="less">
.cave-top {
  position: relative;
  width: 100%;
  height: 176px;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  isolation: isolate;
}

/* 静态洞顶层与符号表 */
.cave-top > svg {
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
.cave-top-plants {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 植物画面的小 svg 片段：只光栅化一次，随外层合成层旋转。
   仅匹配片段根节点，嵌套精灵 svg 仍由 x/y 特性定位。 */
.cave-top-plants .cave-sway > svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  shape-rendering: crispEdges;
  image-rendering: pixelated;
}

/*
 * 每株植物一个独立合成层：div 定位到包围盒，围绕悬挂点
 * （transform-origin）摆动。rotate 动画由合成器驱动，
 * 纹理光栅化一次后每帧零重绘。
 */
.cave-top .cave-sway {
  position: absolute;
  will-change: transform;
  animation: hanging-sway
    var(--wind-duration, 6s)
    ease-in-out
    var(--wind-delay, 0s)
    infinite;
}

.berry-light {
  position: absolute;
  will-change: opacity;
  animation: berry-breathe
    5s ease-in-out var(--glow-delay, 0s) infinite alternate;
}

.berry-light > div {
  position: absolute;
}

.spore {
  position: absolute;
  opacity: 0;
  will-change: transform, opacity;
  animation: spore-fall
    var(--duration, 7s)
    linear
    var(--delay, 0s)
    infinite;
}

/* 完全滚出视口时暂停所有动画，避免滚动阅读时的无效合成。 */
.cave-top.cave-paused .cave-sway,
.cave-top.cave-paused .berry-light,
.cave-top.cave-paused .spore {
  animation-play-state: paused;
}

@keyframes hanging-sway {
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

@keyframes berry-breathe {
  from { opacity: .45; }
  to   { opacity: .95; }
}

@keyframes spore-fall {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }
  12% {
    opacity: .85;
  }
  55% {
    opacity: .6;
  }
  100% {
    opacity: 0;
    /* 原轨迹：drift 逻辑单位 × 39 逻辑单位；SVG 里 px=用户单位
       （×pixel 才是屏幕 px），HTML 里 px 就是屏幕 px，故按 pixel
       换算：drift 单位 → drift×pixel px，39 单位 → 78px（pixel=2）。 */
    transform: translate(var(--drift, 16px), var(--fall, 78px));
  }
}
</style>
