<template>
  <div
    ref="dividerRef"
    class="terrain-divider"
    :class="`terrain-divider--${size}`"
    role="separator"
    tabindex="0"
    aria-label="草方块花田像素分割线"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @pointercancel="onPointerLeave"
    @blur="onPointerLeave"
    @focus="onFocus"
  >
    <div ref="trackRef" class="terrain-track" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
// 移植自 grass-terrain-divider-v2.html：草方块花田像素分割线
// 模板、样式与全部动画/交互逻辑均来自原文件，仅做组件化封装（尺寸预设 + 生命周期挂载）
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** md：完整展示尺寸（70px，草方块 36-52px）；sm：紧凑尺寸，适合标题下的分组分割线 */
    size?: 'md' | 'sm'
  }>(),
  { size: 'md' },
)

const dividerRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

// 与 CSS 中的 clamp() 保持一致：[最小值, 最大值, 视口宽度占比]
const UNIT_PRESETS = {
  md: { min: 36, max: 52, vw: 0.05 },
  sm: { min: 22, max: 30, vw: 0.03 },
} as const

const flowerTypes = [
  'daisy', 'dandelion', 'poppy', 'azure', 'cornflower',
  'allium', 'orange-tulip', 'pink-tulip', 'blue-orchid',
]

const flowerCrowns: Record<string, string> = {
  daisy: `
    <rect class="petal-white" x="-1" y="-10" width="3" height="1"/>
    <rect class="petal-white" x="-2" y="-9" width="5" height="1"/>
    <rect class="petal-white" x="-2" y="-8" width="2" height="1"/>
    <rect class="petal-white" x="1" y="-8" width="2" height="1"/>
    <rect class="petal-white" x="-2" y="-7" width="5" height="1"/>
    <rect class="petal-white" x="-1" y="-6" width="3" height="1"/>
    <rect class="center-light" x="0" y="-8" width="1" height="1"/>`,
  dandelion: `
    <rect class="petal-yellow" x="-1" y="-10" width="3" height="1"/>
    <rect class="petal-yellow" x="-2" y="-9" width="5" height="3"/>
    <rect class="center" x="0" y="-8" width="1" height="1"/>`,
  poppy: `
    <rect class="petal-red" x="-2" y="-9" width="5" height="2"/>
    <rect class="petal-red" x="-3" y="-7" width="2" height="2"/>
    <rect class="petal-red" x="2" y="-7" width="2" height="2"/>
    <rect class="center-dark" x="0" y="-7" width="1" height="1"/>`,
  azure: `
    <rect class="petal-azure" x="0" y="-9" width="1" height="1"/>
    <rect class="petal-azure" x="-2" y="-8" width="5" height="2"/>
    <rect class="petal-azure" x="0" y="-6" width="1" height="1"/>
    <rect class="center-light" x="0" y="-7" width="1" height="1"/>`,
  cornflower: `
    <rect class="petal-blue" x="-2" y="-10" width="1" height="2"/>
    <rect class="petal-blue" x="2" y="-10" width="1" height="2"/>
    <rect class="petal-blue" x="-3" y="-8" width="7" height="2"/>
    <rect class="petal-blue" x="-1" y="-6" width="3" height="1"/>
    <rect class="center-dark" x="0" y="-8" width="1" height="1"/>`,
  allium: `
    <rect class="petal-purple" x="-1" y="-11" width="3" height="1"/>
    <rect class="petal-purple" x="-2" y="-10" width="5" height="4"/>
    <rect class="petal-pink" x="-1" y="-9" width="1" height="1"/>
    <rect class="petal-pink" x="1" y="-7" width="1" height="1"/>`,
  'orange-tulip': `
    <rect class="petal-orange" x="-2" y="-10" width="1" height="2"/>
    <rect class="petal-orange" x="2" y="-10" width="1" height="2"/>
    <rect class="petal-orange" x="-2" y="-8" width="5" height="3"/>
    <rect class="petal-yellow" x="0" y="-7" width="1" height="1"/>`,
  'pink-tulip': `
    <rect class="petal-pink" x="-2" y="-10" width="1" height="2"/>
    <rect class="petal-pink" x="2" y="-10" width="1" height="2"/>
    <rect class="petal-pink" x="-2" y="-8" width="5" height="3"/>
    <rect class="petal-white" x="0" y="-7" width="1" height="1"/>`,
  'blue-orchid': `
    <rect class="petal-cyan" x="-1" y="-10" width="3" height="2"/>
    <rect class="petal-cyan" x="-3" y="-8" width="3" height="2"/>
    <rect class="petal-cyan" x="1" y="-8" width="3" height="2"/>
    <rect class="petal-blue" x="-1" y="-6" width="3" height="1"/>
    <rect class="center-light" x="0" y="-8" width="1" height="1"/>`,
}

// 原文件 <template id="terrainTemplate"> 的等价实现（Vue 会编译模板内的 template 标签，改由运行时克隆）
const unitTemplate = document.createElement('template')
unitTemplate.innerHTML = `
  <svg class="terrain-unit" viewBox="0 0 16 16" aria-hidden="true">
    <g class="flowers"></g>
    <g class="block">
      <rect class="grass-top" x="0" y="8" width="16" height="3"/>
      <rect class="grass-light" x="0" y="8" width="5" height="1"/>
      <rect class="grass-light" x="8" y="8" width="6" height="1"/>
      <rect class="grass-dark" x="2" y="10" width="3" height="2"/>
      <rect class="grass-dark" x="10" y="10" width="4" height="1"/>
      <rect class="grass-dark" x="14" y="11" width="2" height="2"/>

      <rect class="dirt" x="0" y="11" width="16" height="5"/>
      <rect class="soil-deep" x="0" y="15" width="16" height="1"/>
      <rect class="dirt-light" x="2" y="12" width="2" height="2"/>
      <rect class="dirt-light" x="9" y="11" width="2" height="1"/>
      <rect class="dirt-light" x="12" y="14" width="2" height="2"/>
      <rect class="dirt-dark" x="5" y="13" width="3" height="2"/>
      <rect class="dirt-dark" x="1" y="15" width="2" height="1"/>
      <rect class="pebble-light" x="6" y="11" width="1" height="1"/>
      <rect class="pebble-light" x="3" y="15" width="2" height="1"/>
      <rect class="pebble-dark" x="14" y="13" width="1" height="1"/>
    </g>
  </svg>`

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomFlowerLayout(previousCount = 0, previousPrimary = '') {
  const count = randomItem([1, 2, 3].filter((value) => value !== previousCount))
  const primary = randomItem(flowerTypes.filter((type) => type !== previousPrimary))
  const remaining = flowerTypes.filter((type) => type !== primary)
  const positions: Record<number, [number, number][]> = {
    1: [[6, 10]],
    2: [[4, 6], [10, 12]],
    3: [[3, 4], [8, 9], [12, 13]],
  }

  const layout = positions[count].map(([min, max], index) => {
    const type = index === 0 ? primary : randomItem(remaining.splice(Math.floor(Math.random() * remaining.length), 1))
    return { x: min + Math.floor(Math.random() * (max - min + 1)), y: 8, type }
  })
  return { layout, count, primary }
}

function flowerMarkup({ x, y, type }: { x: number; y: number; type: string }) {
  return `
    <g class="flower" transform="translate(${x} ${y})">
      <g class="flower-motion">
        <rect class="stem" x="0" y="-6" width="1" height="6"/>
        <rect class="leaf" x="-2" y="-3" width="2" height="1"/>
        ${flowerCrowns[type]}
      </g>
    </g>`
}

function units(): SVGElement[] {
  const track = trackRef.value
  return track ? ([...track.querySelectorAll<SVGElement>('.terrain-unit')] as SVGElement[]) : []
}

function setHovered(index: number) {
  const allUnits = units()
  allUnits.forEach((unit, unitIndex) => {
    if (unitIndex !== index) unit.classList.remove('is-hovered')
  })

  const target = allUnits[index]
  if (!target) return
  if (target.classList.contains('is-empty')) prepareEmptyUnit(target)
  target.classList.add('is-hovered')
}

function prepareEmptyUnit(unit: SVGElement) {
  const flowers = unit.querySelector('.flowers') as SVGGElement | null
  if (!flowers) return
  const previous = flowers.querySelector('.flower-set:not(.is-retiring)')
  if (previous) {
    previous.classList.add('is-retiring')
    setTimeout(() => previous.remove(), 300)
  }

  const { layout, count, primary } = randomFlowerLayout(
    Number(unit.dataset.lastCount || 0), unit.dataset.lastPrimary || ''
  )
  unit.dataset.lastCount = String(count)
  unit.dataset.lastPrimary = primary

  const set = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  set.setAttribute('class', 'flower-set')
  set.innerHTML = layout.map(flowerMarkup).join('')
  flowers.append(set)
  // Commit the hidden pose before the hover class starts the growth transition.
  getComputedStyle(set.querySelector('.flower-motion') as Element).transform
}

function makeUnit(index: number): DocumentFragment {
  const fragment = unitTemplate.content.cloneNode(true) as DocumentFragment
  const unit = fragment.querySelector('.terrain-unit') as SVGElement
  const flowers = unit.querySelector('.flowers') as SVGGElement
  const isEmpty = Math.random() < 0.34

  unit.dataset.index = String(index)
  unit.classList.add(isEmpty ? 'is-empty' : 'has-flowers')
  if (!isEmpty) {
    const { layout } = randomFlowerLayout()
    flowers.innerHTML = `<g class="flower-set is-entering">${layout.map(flowerMarkup).join('')}</g>`
    requestAnimationFrame(() => {
      setTimeout(() => {
        const enteringSet = unit.querySelector('.flower-set.is-entering')
        if (enteringSet) enteringSet.classList.remove('is-entering')
      }, 920)
    })
  }
  return fragment
}

function unitWidth(): number {
  const { min, max, vw } = UNIT_PRESETS[props.size]
  return Math.max(min, Math.min(max, window.innerWidth * vw))
}

function buildTrack() {
  const track = trackRef.value
  if (!track) return
  const previousCount = track.childElementCount
  const amount = Math.ceil(track.clientWidth / unitWidth()) + 1
  if (previousCount === amount) return

  track.replaceChildren()
  for (let index = 0; index < amount; index += 1) {
    track.append(makeUnit(index))
  }
}

let pendingIndex = -1
let appliedIndex = -2
let frameId = 0

function applyPointerState() {
  frameId = 0
  if (pendingIndex === appliedIndex) return
  appliedIndex = pendingIndex
  setHovered(appliedIndex)
}

function queueHoveredIndex(index: number) {
  pendingIndex = index
  if (!frameId) frameId = requestAnimationFrame(applyPointerState)
}

function onPointerMove(event: PointerEvent) {
  const divider = dividerRef.value
  if (!divider) return
  const allUnits = units()
  if (!allUnits.length) return

  const bounds = divider.getBoundingClientRect()
  const progress = Math.max(0, Math.min(0.999, (event.clientX - bounds.left) / bounds.width))
  queueHoveredIndex(Math.floor(progress * allUnits.length))
}

function onPointerLeave() {
  queueHoveredIndex(-1)
}

function onFocus() {
  queueHoveredIndex(Math.floor(units().length / 2))
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  buildTrack()
  resizeObserver = new ResizeObserver(buildTrack)
  if (trackRef.value) resizeObserver.observe(trackRef.value)
})

onBeforeUnmount(() => {
  if (frameId) cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<!-- 运行时动态生成的草方块/花朵元素无法获得 scoped 属性，样式按原文件保持全局并以 .terrain-* 前缀隔离 -->
<style lang="less">
.terrain-divider {
  height: 70px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  background: transparent;
  outline: none;
}

.terrain-divider--sm {
  height: 44px;
}

.terrain-track {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
}

.terrain-unit {
  width: clamp(36px, 5vw, 52px);
  height: clamp(36px, 5vw, 52px);
  flex: 0 0 auto;
  margin-left: -1px;
  display: block;
  overflow: visible;
  shape-rendering: crispEdges;
  image-rendering: pixelated;
}

.terrain-divider--sm .terrain-unit {
  width: clamp(22px, 3vw, 30px);
  height: clamp(22px, 3vw, 30px);
}

.terrain-unit .grass-top { fill: #6cac42; }
.terrain-unit .grass-light { fill: #8fbe53; }
.terrain-unit .grass-dark { fill: #4f8f32; }
.terrain-unit .dirt { fill: #79553a; }
.terrain-unit .dirt-light { fill: #966c4a; }
.terrain-unit .dirt-dark { fill: #593d29; }
.terrain-unit .soil-deep { fill: #49311f; }
.terrain-unit .pebble-light { fill: #b9855c; }
.terrain-unit .pebble-dark { fill: #3b2a1e; }

.terrain-unit .flower {
  opacity: 1;
  transition: opacity 140ms ease-out;
}

.terrain-unit .flower-motion {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: translateY(0) scale(1);
}

.terrain-unit .flower .stem { fill: #4a8f28; }
.terrain-unit .flower .leaf { fill: #55ab2d; }
.terrain-unit .flower .petal-white { fill: #f7f7f7; }
.terrain-unit .flower .petal-yellow { fill: #ffec4f; }
.terrain-unit .flower .petal-red { fill: #ed302c; }
.terrain-unit .flower .petal-blue { fill: #3468d7; }
.terrain-unit .flower .petal-azure { fill: #d6e8e8; }
.terrain-unit .flower .petal-purple { fill: #a26ad9; }
.terrain-unit .flower .petal-pink { fill: #f497bf; }
.terrain-unit .flower .petal-orange { fill: #f29a34; }
.terrain-unit .flower .petal-cyan { fill: #6aafd3; }
.terrain-unit .flower .center { fill: #bd6a22; }
.terrain-unit .flower .center-light { fill: #ffe056; }
.terrain-unit .flower .center-dark { fill: #70432d; }

.terrain-unit.is-empty .flower {
  opacity: 0;
  pointer-events: none;
}

.terrain-unit.is-empty .flower-motion {
  transform: translateY(7px) scaleY(0.08) scaleX(0.5);
  transition: transform 260ms cubic-bezier(0.2, 0.85, 0.35, 1.15);
}

.terrain-unit.is-empty.is-hovered .flower {
  opacity: 1;
}

.terrain-unit.is-empty.is-hovered .flower-motion {
  transform: translateY(0) scale(1);
}

.terrain-unit.is-empty .flower-set.is-retiring .flower {
  opacity: 0;
  pointer-events: none;
}

.terrain-unit.is-empty .flower-set.is-retiring .flower-motion {
  transform: translateY(7px) scaleY(0.08) scaleX(0.5);
}

.terrain-unit.has-flowers .flower-motion {
  animation: terrain-flower-breeze 760ms ease-in-out infinite alternate;
  animation-play-state: paused;
}

/* Initial flowers rise once on page load, then return to the paused breeze state. */
.terrain-unit.has-flowers .flower-set.is-entering .flower-motion {
  animation: terrain-flower-grow 620ms cubic-bezier(0.2, 0.85, 0.35, 1.05) both;
  animation-play-state: running;
}

.terrain-unit.has-flowers .flower-set.is-entering .flower:nth-child(2) .flower-motion {
  animation-delay: 90ms;
}

.terrain-unit.has-flowers .flower-set.is-entering .flower:nth-child(3) .flower-motion {
  animation-delay: 170ms;
}

.terrain-unit.has-flowers.is-hovered .flower-motion {
  animation-play-state: running;
}

.terrain-unit.has-flowers .flower:nth-child(2) .flower-motion {
  animation-delay: -180ms;
  animation-duration: 820ms;
}

.terrain-unit.has-flowers .flower:nth-child(3) .flower-motion {
  animation-delay: -360ms;
  animation-duration: 680ms;
}

@keyframes terrain-flower-breeze {
  0% { transform: rotate(-6deg) translateX(-0.45px); }
  50% { transform: rotate(1deg) translateX(0.1px); }
  100% { transform: rotate(6deg) translateX(0.45px); }
}

@keyframes terrain-flower-grow {
  0% { opacity: 0; transform: translateY(8px) scaleY(0.08) scaleX(0.52); }
  58% { opacity: 1; transform: translateY(-1px) scaleY(1.05) scaleX(0.98); }
  78% { transform: translateY(0.4px) scaleY(0.97) scaleX(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.terrain-divider:focus-visible {
  box-shadow: inset 0 0 0 3px #81b84c;
}

@media (max-width: 560px) {
  .terrain-divider {
    height: 60px;
  }

  .terrain-divider--sm {
    height: 40px;
  }
}
</style>
