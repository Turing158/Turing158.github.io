<template>
  <footer class="mc-footer" aria-label="村庄风格站点统计">
    <!-- 场景保持 152px；窄屏在组件内部横向滚动，不压缩文字与像素。 -->
    <div
      ref="scrollEl"
      class="world-scroll"
      tabindex="0"
      role="region"
      :aria-label="`村庄全景，窄屏可左右滚动查看全部 ${stats.length} 项统计`"
    >
      <div ref="worldEl" class="world">
        <canvas ref="canvasEl" class="scene" aria-hidden="true"></canvas>
        <ul class="stats" aria-label="站点统计">
          <li
            v-for="(stat, i) in stats"
            :key="`${stat.label}-${i}`"
            class="stat"
            :class="[stat.wood ?? 'oak', stat.mount ?? 'standing']"
            :style="{ '--x': statX(i) }"
            :aria-label="stat.aria ?? `${stat.value} ${stat.label}`"
          >
            <!-- 落地式：短木柱 -->
            <div v-if="mountOf(stat) === 'standing'" class="post" aria-hidden="true"></div>

            <!-- 贴墙式：墙面小屋 -->
            <template v-else-if="mountOf(stat) === 'wall'">
              <div class="facade" aria-hidden="true"></div>
              <div class="roof" aria-hidden="true"></div>
              <div class="window" aria-hidden="true"></div>
              <div class="foundation" aria-hidden="true"></div>
            </template>

            <!-- 完整方块底面悬挂式：横梁 + 双柱 + 双链 -->
            <template v-else-if="mountOf(stat) === 'hanging'">
              <div class="support overhead" aria-hidden="true"></div>
              <div class="pillar" aria-hidden="true"></div>
              <div class="pillar right" aria-hidden="true"></div>
              <div class="chain left" aria-hidden="true"></div>
              <div class="chain right" aria-hidden="true"></div>
            </template>

            <!-- 方块侧面悬挂式：墙块 + 托架 + 撑杆 -->
            <template v-else-if="mountOf(stat) === 'side'">
              <div class="wall-block" aria-hidden="true"></div>
              <div class="side-post" aria-hidden="true"></div>
              <div class="bracket" aria-hidden="true"></div>
              <div class="chain left" aria-hidden="true"></div>
              <div class="chain right" aria-hidden="true"></div>
            </template>

            <!-- 仅中心悬挂式：中柱 + 斜梁 + V 形链 -->
            <template v-else>
              <div class="pillar" aria-hidden="true"></div>
              <div class="branch" aria-hidden="true"></div>
              <div class="support overhead" aria-hidden="true"></div>
              <img class="v-chain" src="/footer/v-chain.svg" alt="" aria-hidden="true" />
            </template>

            <div class="board">
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.label }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <p class="copyright">{{ copyright }}</p>
  </footer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useVillageFooterStats } from '@/composables/useVillageFooterStats'
import type { VillageFooterStat } from '@/composables/useVillageFooterStats'

// 相邻告示牌中心距，与设计稿一致
const SIGN_GAP = 124

// 不传 props 时自动绑定 useFooterStats 的真实站点数据，仅作可选覆盖
const props = defineProps<{
  stats?: VillageFooterStat[]
  copyright?: string
}>()

const { stats: realStats, copyright: realCopyright } = useVillageFooterStats()

const stats = computed(() => props.stats ?? realStats.value)
const copyright = computed(() => props.copyright ?? realCopyright.value)

function statX(index: number): string {
  return `${(index - (stats.value.length - 1) / 2) * SIGN_GAP}px`
}

function mountOf(stat: VillageFooterStat) {
  return stat.mount ?? 'standing'
}

const worldEl = ref<HTMLElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const paused = ref(false)
// 仅由 visibilitychange 事件更新的可见性：内嵌预览面板永远上报 hidden 且从不发事件，
// 按 document.hidden 静态判断会让预览永远静止，故初始按可见处理
const pageVisible = ref(true)

let lastTick = 0
let frame = 0
let width = 1664
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null

// 心跳放在 Worker 里：页面被判定 hidden 后，链式 setInterval 会被浏览器深度节流到
// 分钟级、MessageChannel 消息也可能不投递（预览面板里动画近乎静止），而 Worker 定时器
// 不受页签可见性影响；是否重绘由主线程 beat 按 paused/pageVisible 把关，后台页签只是
// 空跳心跳，成本可忽略
let ticker: Worker | null = null
let tickerUrl: string | null = null
let tickerFallback: ReturnType<typeof setInterval> | null = null

function beat() {
  if (paused.value || !pageVisible.value) return
  const now = Date.now()
  // 按实际间隔补偿帧数，个别掉拍时云、水波的速度仍接近实时
  frame += Math.max(1, Math.round((now - lastTick) / 180))
  lastTick = now
  draw()
}

function startTicker() {
  try {
    const src =
      'let id=null;onmessage=e=>{if(e.data==="stop"){if(id){clearInterval(id);id=null}}else if(id===null)id=setInterval(()=>postMessage(0),180)}'
    tickerUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))
    ticker = new Worker(tickerUrl)
    ticker.onmessage = beat
    ticker.postMessage('start')
  } catch {
    // Worker 不可用（如严格 CSP）时退回普通定时器：真实前台页面不受节流影响
    tickerFallback = setInterval(beat, 180)
  }
}

function toggleMotion() {
  paused.value = !paused.value
  if (!paused.value) lastTick = Date.now()
  beat()
}

function onVisibilityChange() {
  // 真实浏览器：切到后台停画、回前台恢复；预览面板不发事件，保持常画
  pageVisible.value = !document.hidden
}

// ── 天空配色：跟随 <html data-theme>（forest/ocean/sunset/dark），与站点 --sky-* 变量同基调 ──
type SkyKey = 'forest' | 'ocean' | 'sunset' | 'dark'

interface SkyPalette {
  sky: string
  band: string
  sun: string
  cloud: string
  cloudShade: string
  night?: boolean
}

const SKY_PALETTES: Record<SkyKey, SkyPalette> = {
  forest: { sky: '#e5e9cc', band: '#dce3b8', sun: '#f6edb2', cloud: '#f9f8e5', cloudShade: '#f2f1d9' },
  ocean: { sky: '#d6e5e8', band: '#c9dde2', sun: '#f9f4d0', cloud: '#f4fbfd', cloudShade: '#e3f0f4' },
  sunset: { sky: '#f4e0bd', band: '#eecfa2', sun: '#ffbe7a', cloud: '#ffedd6', cloudShade: '#f8d8b8' },
  dark: { sky: '#10192a', band: '#182639', sun: '#e6e9ee', cloud: '#33415c', cloudShade: '#273450', night: true },
}

function resolveSkyKey(): SkyKey {
  const t = document.documentElement.getAttribute('data-theme')
  return t === 'ocean' || t === 'sunset' || t === 'dark' ? t : 'forest'
}

let skyKey: SkyKey = resolveSkyKey()

// 夜间地景调色：把任意地景色压暗并微微偏蓝，得到月光下的效果；天空/云/日月不走此函数
function nightTint(color: string): string {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color)
  if (!m) return color
  const n = parseInt(m[1], 16)
  const r = Math.min(255, Math.round(((n >> 16) & 255) * 0.36 + 10))
  const g = Math.min(255, Math.round(((n >> 8) & 255) * 0.42 + 13))
  const b = Math.min(255, Math.round((n & 255) * 0.52 + 16))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}${m[2] ?? ''}`
}

const tinted = (color: string) => (SKY_PALETTES[skyKey].night ? nightTint(color) : color)

const rect = (x: number, y: number, w: number, h: number, color: string) => {
  if (!ctx) return
  ctx.fillStyle = tinted(color)
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

// 天空元素专用：始终使用色板原色，不参与夜间压暗
function rawRect(x: number, y: number, w: number, h: number, color: string) {
  if (!ctx) return
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function polygon(points: [number, number][], color: string) {
  if (!ctx) return
  ctx.fillStyle = tinted(color)
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx!.lineTo(Math.round(x), y) : ctx!.moveTo(Math.round(x), y)))
  ctx!.closePath()
  ctx!.fill()
}

function cloud(x: number, y: number) {
  const p = SKY_PALETTES[skyKey]
  rawRect(x, y, 40, 6, p.cloud)
  rawRect(x + 8, y - 5, 22, 5, p.cloud)
  rawRect(x - 6, y + 6, 58, 4, p.cloudShade)
}

function tree(x: number, y: number, s = 1, birch = false) {
  if (!ctx) return
  ctx.save()
  ctx.translate(Math.round(x), y)
  ctx.scale(s, s)
  rect(-4, -39, 9, 39, birch ? '#d7d2b4' : '#746043')
  rect(1, -36, 3, 36, birch ? '#a6aa8e' : '#594c31')
  if (birch) {
    rect(-4, -26, 5, 3, '#525b41')
    rect(0, -13, 4, 3, '#525b41')
  }
  rect(-24, -56, 46, 25, '#536e39')
  rect(-18, -66, 34, 13, '#6b8447')
  rect(-29, -49, 55, 13, '#637e3e')
  rect(-22, -57, 13, 11, '#7f9954')
  rect(4, -61, 10, 9, '#7d9650')
  rect(8, -42, 17, 9, '#496836')
  for (let i = 0; i < 17; i++) {
    const px = (i * 17) % 46 - 23
    const py = (i * 11) % 27 - 60
    rect(px, py, 4, 3, i % 2 ? '#728b48' : '#5d793e')
  }
  ctx.restore()
}

function house(x: number, y: number, scale = 1) {
  if (!ctx) return
  ctx.save()
  ctx.translate(Math.round(x), y)
  ctx.scale(scale, scale)
  rect(0, -43, 75, 43, '#c7b887')
  rect(66, -43, 17, 43, '#9c8c61')
  for (let i = 0; i < 5; i++) rect(0, -40 + i * 9, 75, 2, '#ad9b6d')
  rect(0, -43, 6, 43, '#736047')
  rect(61, -43, 7, 43, '#736047')
  rect(26, -25, 18, 25, '#756344')
  rect(29, -22, 12, 21, '#967d4d')
  rect(38, -11, 2, 2, '#3f422b')
  rect(10, -30, 12, 13, '#665b3c')
  rect(12, -28, 8, 9, '#abc5b7')
  rect(49, -30, 11, 13, '#665b3c')
  rect(51, -28, 7, 9, '#abc5b7')
  for (let i = 0; i < 6; i++) rect(-8 + i * 6, -47 - i * 5, 96 - i * 12, 5, i % 2 ? '#76623f' : '#8e7549')
  rect(0, -4, 83, 5, '#7d8066')
  for (let i = 0; i < 6; i++) rect(i * 14, -3, 10, 3, '#92917b')
  ctx.restore()
}

function fence(x: number, y: number, n = 4) {
  rect(x, y - 12, n * 14, 3, '#a78d56')
  rect(x, y - 6, n * 14, 3, '#887346')
  for (let i = 0; i <= n; i++) {
    rect(x + i * 14, y - 16, 4, 18, '#766240')
    rect(x + i * 14, y - 16, 4, 3, '#b39a64')
  }
}

function villager(x: number, y: number) {
  rect(x - 2, y, 19, 3, '#637a4533')
  rect(x + 2, y - 12, 4, 12, '#4b4830')
  rect(x + 10, y - 12, 4, 12, '#4b4830')
  rect(x, y - 27, 16, 19, '#95694b')
  rect(x + 2, y - 27, 12, 18, '#ad8057')
  rect(x - 2, y - 24, 20, 6, '#a5835c')
  rect(x + 2, y - 24, 12, 3, '#c0986c')
  rect(x + 1, y - 42, 14, 15, '#ba946b')
  rect(x + 1, y - 42, 14, 4, '#816446')
  rect(x + 2, y - 35, 12, 2, '#5c5037')
  rect(x + 3, y - 33, 3, 2, '#526648')
  rect(x + 10, y - 33, 3, 2, '#526648')
  rect(x + 7, y - 33, 4, 9, '#98764f')
  rect(x + 8, y - 32, 3, 6, '#b59060')
}

function cow(x: number, y: number) {
  rect(x, y - 19, 29, 14, '#584b38')
  rect(x + 3, y - 18, 8, 7, '#e7e4ce')
  rect(x + 15, y - 13, 9, 6, '#d8d9c1')
  rect(x + 3, y - 5, 4, 5, '#4a4131')
  rect(x + 22, y - 5, 4, 5, '#4a4131')
  rect(x + 25, y - 25, 13, 15, '#64543f')
  rect(x + 24, y - 27, 3, 6, '#d3d2b7')
  rect(x + 35, y - 27, 3, 6, '#d3d2b7')
  rect(x + 27, y - 20, 3, 3, '#eee9d8')
  rect(x + 35, y - 20, 2, 3, '#ece8d6')
  rect(x + 28, y - 19, 2, 2, '#34362a')
  rect(x + 25, y - 14, 13, 5, '#b99a84')
  rect(x - 3, y - 18, 3, 10, '#584b38')
}

function sheep(x: number, y: number) {
  rect(x + 3, y - 8, 4, 8, '#96876b')
  rect(x + 22, y - 8, 4, 8, '#96876b')
  rect(x, y - 21, 30, 15, '#e9e7d4')
  rect(x + 3, y - 24, 23, 4, '#f6f2df')
  rect(x, y - 9, 28, 4, '#c6ccb3')
  rect(x + 25, y - 22, 12, 13, '#b5a78a')
  rect(x + 24, y - 23, 14, 4, '#eeecdb')
  rect(x + 28, y - 18, 2, 2, '#3e4432')
  rect(x + 34, y - 18, 2, 2, '#3e4432')
}

function chicken(x: number, y: number) {
  rect(x + 3, y - 5, 2, 5, '#b58b3c')
  rect(x + 9, y - 5, 2, 5, '#b58b3c')
  rect(x, y - 14, 14, 10, '#f1eed9')
  rect(x + 3, y - 12, 7, 6, '#d8ddc5')
  rect(x + 10, y - 22, 8, 10, '#f7f1dc')
  rect(x + 12, y - 24, 4, 3, '#b25636')
  rect(x + 15, y - 18, 2, 2, '#3d4230')
  rect(x + 17, y - 16, 5, 3, '#c5a14a')
  rect(x + 13, y - 12, 3, 4, '#b95336')
}

function fox(x: number, y: number) {
  rect(x, y - 13, 26, 10, '#ba713e')
  rect(x + 4, y - 11, 20, 5, '#d68848')
  rect(x + 3, y - 4, 3, 4, '#53462e')
  rect(x + 21, y - 4, 3, 4, '#53462e')
  rect(x + 22, y - 21, 12, 13, '#d3894c')
  rect(x + 22, y - 25, 4, 6, '#645338')
  rect(x + 30, y - 25, 4, 6, '#645338')
  rect(x + 24, y - 23, 2, 3, '#d3894c')
  rect(x + 25, y - 12, 12, 4, '#ece3c7')
  rect(x + 32, y - 15, 2, 2, '#3b4130')
  rect(x - 11, y - 15, 13, 7, '#c88044')
  rect(x - 16, y - 15, 6, 7, '#eee5cb')
}

function draw() {
  if (!ctx) return
  const p = SKY_PALETTES[skyKey]
  ctx.clearRect(0, 0, width, 152)
  rawRect(0, 0, width, 152, p.sky)
  rawRect(0, 55, width, 75, p.band)
  if (p.night) {
    // 星子：位置固定散布，随帧微闪，位于天底之后、山脉之前，被山体自然遮挡
    for (let i = 0; i < 22; i++) {
      const sx = (i * 197 + 53) % Math.max(width, 1)
      const sy = 4 + (i * 83) % 46
      if ((frame + i * 5) % 14 !== 13) rawRect(sx, sy, 2, 2, i % 3 ? '#c7d3ea' : '#8fa0c4')
    }
  }
  rawRect(width - 119, 13, 20, 20, p.sun)
  rawRect(width - 124, 18, 30, 10, p.sun)
  cloud(220 + (frame % 20), 18)
  cloud(width * 0.45, 11)
  cloud(width - 360 + (frame % 14), 24)
  const ridge: [number, number][] = [[0, 81], [0, 57], [37, 57], [37, 36], [69, 36], [69, 17], [107, 17], [107, 7], [132, 7], [132, 21], [154, 21], [154, 38], [174, 38], [174, 54], [203, 54], [203, 72], [260, 72], [260, 105], [0, 105]]
  polygon(ridge, '#a1b197')
  polygon([[107, 7], [132, 7], [132, 21], [145, 21], [145, 30], [122, 30], [122, 24], [91, 24], [91, 17], [107, 17]], '#e8ebd7')
  polygon([[130, 33], [156, 33], [156, 51], [180, 51], [180, 65], [210, 65], [210, 92], [254, 92], [254, 112], [130, 112]], '#899c7a')
  for (let i = 0; i < 27; i++) {
    const x = 28 + (i * 29) % 164
    const y = 45 + (i * 17) % 42
    rect(x, y, 8, 4, i % 3 ? '#93a686' : '#b0bca0')
  }
  polygon([[width - 320, 105], [width - 320, 78], [width - 283, 78], [width - 283, 64], [width - 241, 64], [width - 241, 47], [width - 209, 47], [width - 209, 35], [width - 172, 35], [width - 172, 49], [width - 126, 49], [width - 126, 61], [width - 71, 61], [width - 71, 81], [width, 81], [width, 113]], '#b5c39b')
  for (let x = 290; x < width - 260; x += 94) {
    rect(x, 77, 44, 32, '#b8c69d')
    rect(x + 8, 69, 27, 10, '#b8c69d')
  }
  rect(0, 104, width, 26, '#92aa60')
  rect(0, 113, width, 17, '#a2b66b')
  for (let x = 0; x < width; x += 16) {
    rect(x, 106, 8, 3, x % 32 ? '#9cb368' : '#829d52')
    rect(x + 4, 125, 5, 3, '#91a65e')
  }
  const center = width / 2
  rect(center - 443, 121, 888, 9, '#c0b583')
  for (let x = center - 435; x < center + 445; x += 22) rect(x, 125, 8, 2, '#d4c79b')
  polygon([[111, 29], [126, 29], [126, 68], [139, 68], [139, 86], [151, 86], [151, 104], [180, 104], [180, 111], [216, 111], [216, 119], [253, 119], [253, 130], [202, 130], [202, 125], [167, 125], [167, 118], [138, 118], [138, 108], [127, 108], [127, 88], [118, 88], [118, 70], [111, 70]], '#79aaa1')
  rect(114, 31, 4, 37, '#bbd5bc')
  rect(121, 42, 3, 43, '#9bc3af')
  rect(128, 73, 4, 29, '#afd1b6')
  for (let i = 0; i < 8; i++) {
    const y = 36 + (i * 11 + frame * 2) % 64
    rect(y < 68 ? 114 : 130, y, 5, 2, '#d4e5c9')
  }
  rect(151, 107, 21, 2, '#c3dbc0')
  rect(174 + (frame % 8), 118, 17, 2, '#b9d5bb')
  rect(211 + (frame % 10), 125, 19, 2, '#bdd8bd')
  house(244, 107, 0.74)
  house(width - 240, 107, 0.82)
  house(width - 347, 96, 0.52)
  tree(35, 115, 1.2)
  tree(width - 42, 118, 1.18)
  tree(width - 115, 113, 0.8, true)
  tree(201, 103, 0.64, true)
  fence(width - 252, 121, 5)
  fence(269, 120, 3)
  rect(161, 115, 48, 5, '#917744')
  for (let x = 161; x < 209; x += 8) rect(x, 115, 2, 5, '#685735')
  rect(161, 109, 48, 3, '#b0975b')
  rect(161, 107, 4, 14, '#79603c')
  rect(205, 107, 4, 14, '#79603c')
  villager(center - 442, 125)
  villager(center + 192, 124)
  cow(width - 192, 127)
  sheep(78, 126)
  chicken(center - 312, 124)
  fox(center + 453, 128)
  chicken(width - 304, 123)
  for (let x = 12; x < width; x += 61) {
    if (x > center - 425 && x < center + 426) continue
    rect(x, 119, 2, 5, '#617b40')
    rect(x - 2, 117, 6, 3, x % 2 ? '#d9bf6a' : '#e7e5c4')
  }
  rect(0, 129, width, 1, '#7d9650')
}

function resize() {
  const world = worldEl.value
  const canvas = canvasEl.value
  if (!world || !canvas) return
  width = Math.round(world.getBoundingClientRect().width)
  canvas.width = width
  canvas.height = 152
  ctx = canvas.getContext('2d')
  if (ctx) ctx.imageSmoothingEnabled = false
  draw()
}

onMounted(() => {
  const world = worldEl.value
  const scroll = scrollEl.value
  const canvas = canvasEl.value
  if (!world || !scroll || !canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(world)
  resize()
  scroll.scrollLeft = Math.max(0, (world.offsetWidth - scroll.clientWidth) / 2)

  // 主题切换（手动或跟随系统）都通过 data-theme 生效，这里统一捕获并重绘天空
  themeObserver = new MutationObserver(() => {
    const next = resolveSkyKey()
    if (next === skyKey) return
    skyKey = next
    draw()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  document.addEventListener('visibilitychange', onVisibilityChange)
  startTicker()
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (ticker) {
    ticker.terminate()
    ticker = null
  }
  if (tickerUrl) {
    URL.revokeObjectURL(tickerUrl)
    tickerUrl = null
  }
  if (tickerFallback) {
    clearInterval(tickerFallback)
    tickerFallback = null
  }
  resizeObserver?.disconnect()
  resizeObserver = null
  themeObserver?.disconnect()
  themeObserver = null
})

defineExpose({ paused, toggleMotion })
</script>

<style lang="less">
/* 主题覆盖需作用到 html[data-theme]，scoped 编译器会丢弃 :global(X) 的后代部分，故用全局块；
   加 html 前缀使特异性高于 scoped 基础规则，不受注入顺序影响 */
html[data-theme='ocean'] .mc-footer {
  --vf-sky: #d6e5e8;
  --vf-sky-soft: #e0ecee;
  --vf-scroll-thumb: #4e7f92;
  --vf-scroll-track: #cfe0e4;
  --vf-outline: #3d6f86;
  --vf-copy-text: #3c5a66;
  --vf-copy-bg: #dfeaece8;
  --vf-copy-border: #6f8b9433;
  --vf-copy-dot: #6f93a0;
}

html[data-theme='sunset'] .mc-footer {
  --vf-sky: #f0dcb6;
  --vf-sky-soft: #f6e5c4;
  --vf-scroll-thumb: #a06b3f;
  --vf-scroll-track: #eddfc0;
  --vf-outline: #a15a2e;
  --vf-copy-text: #7a4a28;
  --vf-copy-bg: #f4e6cbe8;
  --vf-copy-border: #a3774633;
  --vf-copy-dot: #b98a55;
}

html[data-theme='dark'] .mc-footer {
  --vf-sky: #0e1622;
  --vf-sky-soft: #121c2b;
  --vf-scroll-thumb: #5d708c;
  --vf-scroll-track: #1a2534;
  --vf-outline: #7e94bd;
  --vf-copy-text: #9fb0c8;
  --vf-copy-bg: #131d2ce8;
  --vf-copy-border: #3c4d6633;
  --vf-copy-dot: #56688a;
}

/* 夜晚：木质结构件随场景压暗，告示板保持明亮（夜里亮灯的告示牌） */
html[data-theme='dark'] .mc-footer .stat :is(.post, .facade, .roof, .window, .foundation, .support, .pillar, .branch, .chain, .v-chain, .wall-block, .side-post, .bracket) {
  filter: brightness(0.55) saturate(0.72);
}
</style>

<style lang="less" scoped>
.mc-footer {
  height: 152px;
  position: relative;
  // CSS 背景层与画布色板保持同基调，避免主题切换/滚动边缘闪出旧色
  --vf-sky: #dfe5be;
  --vf-sky-soft: #e7ead0;
  --vf-scroll-thumb: #748c55;
  --vf-scroll-track: #dce4c5;
  --vf-outline: #527541;
  --vf-copy-text: #455236;
  --vf-copy-bg: #e3e7c7e8;
  --vf-copy-border: #74825933;
  --vf-copy-dot: #84945d;
  background: var(--vf-sky);
  isolation: isolate;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.world-scroll {
  height: 152px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--vf-scroll-thumb) var(--vf-scroll-track);

  &:focus-visible {
    outline: 3px solid var(--vf-outline);
    outline-offset: 5px;
  }
}

.world {
  height: 152px;
  min-width: 1240px;
  position: relative;
  overflow: hidden;
  background: var(--vf-sky-soft);
}

.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 152px;
  image-rendering: pixelated;
}

.stats {
  position: absolute;
  inset: 0;
  margin: 0;
  list-style: none;
  padding: 0;
  pointer-events: none;
}

.stat {
  position: absolute;
  left: calc(50% + var(--x));
  width: 100px;
  top: 0;
  height: 130px;
  transform: translateX(-50%);
  --base: #b99358;
  --grain: #9c783f;
  --light: #d2b174;
  --edge: #755329;
  --text: #291e10;

  &.spruce {
    --base: #755635;
    --grain: #614426;
    --light: #987044;
    --edge: #47311c;
    --text: #fff0d0;
  }

  &.birch {
    --base: #d8c895;
    --grain: #bdac77;
    --light: #eee1b3;
    --edge: #938151;
    --text: #322a17;
  }

  &.jungle {
    --base: #b88260;
    --grain: #9e6b4d;
    --light: #d69e77;
    --edge: #774931;
    --text: #271b12;
  }
}

.board {
  position: absolute;
  top: 55px;
  left: 2px;
  width: 96px;
  height: 47px;
  z-index: 4;
  border: 3px solid var(--edge);
  background: repeating-linear-gradient(0deg, transparent 0 12px, var(--grain) 12px 14px), var(--base);
  box-shadow: inset 2px 2px var(--light), inset -2px -2px var(--grain), 3px 3px 0 #36482633;
  text-align: center;
  color: var(--text);
  padding: 4px 3px 3px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 3px;
    height: 3px;
    top: 20px;
    background: var(--edge);
  }

  &::before {
    left: 3px;
  }

  &::after {
    right: 3px;
  }

  strong {
    display: block;
    font-weight: 700;
    font-size: 18px;
    line-height: 20px;
    font-family: Consolas, 'Courier New', monospace;
    letter-spacing: -0.6px;
    white-space: nowrap;
  }

  span {
    display: block;
    font-size: 11px;
    line-height: 15px;
    letter-spacing: 1px;
  }
}

.post {
  position: absolute;
  width: 8px;
  height: 28px;
  top: 99px;
  left: 46px;
  background: var(--base);
  border-left: 2px solid var(--edge);
  border-right: 2px solid var(--grain);
  z-index: 3;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: -10px;
    width: 24px;
    height: 3px;
    background: #4d61243b;
  }
}

.support {
  position: absolute;
  z-index: 2;
}

.overhead {
  top: 19px;
  left: -9px;
  width: 118px;
  height: 15px;
  background: repeating-linear-gradient(90deg, #62482c 0 7px, #79603b 7px 14px);
  border: 3px solid #513c26;
  box-shadow: inset 0 2px #96764c;
}

.pillar {
  position: absolute;
  left: -9px;
  top: 32px;
  width: 9px;
  height: 93px;
  background: #79603b;
  border-left: 3px solid #513c26;
  z-index: 1;

  &.right {
    left: auto;
    right: -9px;
  }
}

// 链条：1px 深色左缘已烘焙进 public/footer/chain.svg 平铺
.chain {
  position: absolute;
  top: 34px;
  width: 5px;
  height: 22px;
  background: url('/footer/chain.svg') repeat-y;
  background-size: 5px 7px;
  z-index: 3;

  &.left {
    left: 17px;
  }

  &.right {
    left: auto;
    right: 17px;
  }
}

.side {
  .wall-block {
    position: absolute;
    top: 21px;
    left: -16px;
    width: 17px;
    height: 38px;
    background: repeating-linear-gradient(0deg, #899081 0 8px, #686f62 8px 10px);
    border: 2px solid #626857;
  }

  .bracket {
    position: absolute;
    top: 29px;
    left: -2px;
    width: 104px;
    height: 7px;
    background: var(--base);
    border: 2px solid var(--edge);
    z-index: 3;
  }

  .side-post {
    position: absolute;
    top: 57px;
    left: -12px;
    width: 9px;
    height: 68px;
    background: #79634b;
    border-left: 3px solid #58432d;
  }

  .chain {
    top: 36px;
    height: 20px;
  }
}

.center {
  .overhead {
    left: 39px;
    top: 17px;
    width: 22px;
    height: 16px;
  }

  .branch {
    position: absolute;
    top: 16px;
    left: -12px;
    width: 64px;
    height: 7px;
    background: #675237;
    border-top: 2px solid #8f784d;
  }

  .pillar {
    top: 16px;
    height: 109px;
  }
}

.v-chain {
  position: absolute;
  top: 32px;
  left: 0;
  width: 100px;
  height: 25px;
  z-index: 3;
}

.wall {
  .board {
    top: 58px;
  }

  .facade {
    position: absolute;
    left: -12px;
    top: 47px;
    width: 124px;
    height: 79px;
    background: repeating-linear-gradient(0deg, transparent 0 9px, #aa9567 9px 11px), #cab684;
    border: 5px solid #756345;
    box-shadow: inset 5px 0 #b5a174, 5px 0 #3b49232b;
  }

  .roof {
    position: absolute;
    left: -22px;
    top: 17px;
    width: 144px;
    height: 34px;
    background: repeating-linear-gradient(0deg, #635035 0 6px, #816940 6px 10px);
    clip-path: polygon(35% 0, 65% 0, 65% 14%, 73% 14%, 73% 28%, 81% 28%, 81% 42%, 89% 42%, 89% 57%, 95% 57%, 95% 72%, 100% 72%, 100% 100%, 0 100%, 0 72%, 5% 72%, 5% 57%, 11% 57%, 11% 42%, 19% 42%, 19% 28%, 27% 28%, 27% 14%, 35% 14%);
    z-index: 3;
  }

  .foundation {
    position: absolute;
    left: -15px;
    top: 121px;
    width: 130px;
    height: 7px;
    background: repeating-linear-gradient(90deg, #7e8270 0 12px, #5f6957 12px 15px);
  }

  .window {
    position: absolute;
    top: 106px;
    left: 39px;
    width: 23px;
    height: 13px;
    background: linear-gradient(90deg, transparent 44%, #635335 44% 56%, transparent 56%), #9bb8b0;
    border: 3px solid #766346;
  }
}

.copyright {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--vf-copy-text);
  background: var(--vf-copy-bg);
  z-index: 6;
  font-size: 10px;
  letter-spacing: 0.5px;
  border-top: 1px solid var(--vf-copy-border);
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    width: 3px;
    height: 3px;
    background: var(--vf-copy-dot);
    margin: 0 12px;
  }
}
</style>
