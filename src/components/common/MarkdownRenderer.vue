<template>
  <!-- 外层必须保持单根：本组件被父级 <Transition> 包裹，多根 fragment 无法参与过渡动画 -->
  <div class="markdown-renderer-root">
    <div class="markdown-renderer markdown-body" v-html="html" ref="containerRef" />
    <ImageViewer
      :visible="viewerVisible"
      :images="viewerImages"
      :initial-index="viewerIndex"
      @close="viewerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ImageViewer, { type ImageViewerImage } from '@/components/common/ImageViewer.vue'

const props = defineProps<{
  html: string
}>()

const { t } = useI18n()
const containerRef = ref<HTMLElement | null>(null)

// ==================== 图片加载状态（加载占位 / 失败占位） ====================

// 占位容器持久存在，状态间仅切换类名：内容层（转圈/裂图/图片）以透明度过渡，
// 容器边框与背景保持稳定不做动画

const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  const wrap = img.closest('.markdown-img-wrap')
  if (wrap) {
    wrap.classList.remove('is-loading', 'is-error')
    wrap.classList.add('is-loaded')
  }
  img.classList.add('markdown-img-enter')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  let wrap = img.closest('.markdown-img-wrap') as HTMLElement | null
  if (!wrap) {
    // 绑定后才失败的已加载图片没有占位容器，现场补一个
    wrap = mountImageWrap(img)
  }
  wrap.classList.remove('is-loading')
  wrap.classList.add('is-error')
}

// 失败层点击重试：容器切回加载态，原图元素重新请求（重试参数绕过失败缓存）
const handleRetryClick = (e: Event) => {
  const wrap = (e.target as HTMLElement).closest('.markdown-img-wrap') as HTMLElement | null
  const img = wrap?.querySelector('img')
  if (!wrap || !img) return
  wrap.classList.remove('is-error')
  wrap.classList.add('is-loading')
  const base = (wrap.dataset.src || img.src).replace(/([?&])retry=\d+/, '')
  img.src = `${base}${base.includes('?') ? '&' : '?'}retry=${Date.now()}`
}

// 构建持久占位容器：加载层 + 失败层（调用方负责替换后把 img 装入容器）
const buildImageWrap = (img: HTMLImageElement) => {
  const alt = img.alt || '图片'
  const escapedAlt = alt.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))
  const wrap = document.createElement('div')
  wrap.className = 'markdown-img-wrap is-loading'
  wrap.dataset.src = img.src
  wrap.innerHTML = `<div class="markdown-img-layer is-loading-layer"><span class="cube-loader" style="--cube-size: 28px" aria-hidden="true"><span class="cube3d"><i></i><i></i><i></i><i></i><i></i><i></i></span></span></div><div class="markdown-img-layer is-error-layer"><button class="markdown-image-retry" type="button" title="${t('common.reloadImage')}" aria-label="${t('common.reloadImage')}"><svg class="icon-cracked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3l-1.5 5 2.5 2.5-2.5 3 2 3.5-1 4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6z"/><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8.5l1-4-2-3.5 2.5-3-2.5-2.5L13 3z"/><circle cx="16.8" cy="8.3" r="1.4"/><path d="m21 15.5-2.8-2.8-3.4 3.6"/></svg><svg class="icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg></button><span class="markdown-image-error-alt">${escapedAlt}</span></div>`
  return wrap
}

// 用占位容器替换图片（先替换再装入，避免容器包含自身的替换报错）
const mountImageWrap = (img: HTMLImageElement) => {
  const wrap = buildImageWrap(img)
  img.replaceWith(wrap)
  wrap.appendChild(img)
  return wrap
}

const bindImageStates = () => {
  containerRef.value?.querySelectorAll('img').forEach((img) => {
    if (img.dataset.stateBound) return
    img.dataset.stateBound = '1'
    img.addEventListener('error', handleImageError)
    img.addEventListener('load', handleImageLoad)

    if (img.complete) {
      // 绑定前已完成：成功则无需处理，失败则包占位容器并直接置于失败态（覆盖 error 早于监听的情况）
      if (img.naturalWidth === 0) {
        const wrap = mountImageWrap(img)
        wrap.classList.remove('is-loading')
        wrap.classList.add('is-error')
      }
      return
    }
    // 未加载完成：包占位容器进入加载态
    mountImageWrap(img)
  })
}

const unbindImageStates = () => {
  if (!containerRef.value) return
  containerRef.value.querySelectorAll('img').forEach((img) => {
    img.removeEventListener('error', handleImageError)
    img.removeEventListener('load', handleImageLoad)
  })
}

// ==================== 图片查看器 ====================

const viewerVisible = ref(false)
const viewerImages = ref<ImageViewerImage[]>([])
const viewerIndex = ref(0)

const handleImageClick = (e: Event) => {
  const img = (e.target as HTMLElement).closest('img') as HTMLImageElement | null
  if (!img || !containerRef.value) return
  // 链接内的图片保留原有跳转行为；加载失败的图片已被占位元素替换
  if (img.closest('a[href]')) return
  const allImages = Array.from(containerRef.value.querySelectorAll('img'))
  const index = allImages.indexOf(img)
  if (index === -1) return
  viewerImages.value = allImages.map((el) => ({
    src: el.currentSrc || el.src,
    alt: el.alt || '',
  }))
  viewerIndex.value = index
  viewerVisible.value = true
}

// ==================== 复制代码 ====================

const handleCopyClick = async (e: Event) => {
  const btn = (e.target as HTMLElement).closest('.code-copy-btn') as HTMLElement | null
  if (!btn) return
  const b64 = btn.dataset.codeB64
  if (!b64) return
  try {
    const code = decodeURIComponent(escape(atob(b64)))
    await navigator.clipboard.writeText(code)
    btn.textContent = '已复制!'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.textContent = '复制'
      btn.classList.remove('copied')
    }, 1500)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = decodeURIComponent(escape(atob(b64)))
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    btn.textContent = '已复制!'
    btn.classList.add('copied')
    setTimeout(() => {
      btn.textContent = '复制'
      btn.classList.remove('copied')
    }, 1500)
  }
}

// ==================== 红石像素分割线 ====================

// 单节红石线 SVG：三色像素层 shadow/mid/light，配色与 outputs/redstone 设计稿一致
const REDSTONE_PIECE_SVG = `<svg class="redstone-piece" viewBox="0 0 16 16" aria-hidden="true">
  <g class="shadow"><rect x="4" y="6" width="1" height="1"/><rect x="5" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="3" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="10" y="8" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/><rect x="10" y="9" width="1" height="1"/></g>
  <g class="mid"><rect x="0" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="10" y="7" width="1" height="1"/><rect x="3" y="8" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/></g>
  <g class="light"><rect x="2" y="7" width="1" height="1"/><rect x="8" y="7" width="1" height="1"/><rect x="12" y="7" width="1" height="1"/><rect x="14" y="7" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/></g>
</svg>`

type RedstoneDividerHandle = { el: HTMLElement; dispose: () => void }

const redstoneHandles: RedstoneDividerHandle[] = []

const buildRedstoneDivider = () => {
  const divider = document.createElement('div')
  divider.className = 'redstone-divider'
  divider.setAttribute('role', 'separator')
  divider.setAttribute('aria-label', t('common.redstoneDivider'))
  const track = document.createElement('div')
  track.className = 'redstone-track'
  track.setAttribute('aria-hidden', 'true')
  divider.appendChild(track)
  return { divider, track }
}

const initRedstoneDivider = (divider: HTMLElement, track: HTMLElement): (() => void) => {
  const pieces = () => Array.from(track.querySelectorAll<Element>('.redstone-piece'))

  const clearPower = () => {
    pieces().forEach((piece) => piece.classList.remove('is-powered', 'is-near'))
  }

  // 指针所在的单节满功率，相邻两节余辉
  const powerPiece = (activeIndex: number) => {
    pieces().forEach((piece, index) => {
      const distance = Math.abs(index - activeIndex)
      piece.classList.toggle('is-powered', distance === 0)
      piece.classList.toggle('is-near', distance > 0 && distance <= 2)
    })
  }

  // 按轨道宽度铺满单节；单元尺寸与 CSS clamp 公式一致，容器尺寸变化时重建
  const buildPieces = () => {
    const sampleWidth = Math.max(34, Math.min(48, window.innerWidth * 0.05)) - 2
    const amount = Math.ceil(track.clientWidth / sampleWidth) + 1
    track.replaceChildren()
    for (let index = 0; index < amount; index += 1) {
      track.insertAdjacentHTML('beforeend', REDSTONE_PIECE_SVG)
      track.lastElementChild?.setAttribute('data-index', String(index))
    }
  }

  const handlePointerMove = (event: PointerEvent) => {
    const target = (event.target as Element | null)?.closest('.redstone-piece')
    if (target) powerPiece(Number(target.getAttribute('data-index')))
  }

  divider.addEventListener('pointermove', handlePointerMove)
  divider.addEventListener('pointerleave', clearPower)

  const observer = new ResizeObserver(buildPieces)
  observer.observe(track)
  buildPieces()

  return () => {
    divider.removeEventListener('pointermove', handlePointerMove)
    divider.removeEventListener('pointerleave', clearPower)
    observer.disconnect()
  }
}

// 把容器内所有 hr 替换为红石分割线；v-html 更新后旧分割线随内容移除，回收其观察器与监听
const enhanceRedstoneDividers = () => {
  const container = containerRef.value
  if (!container) return
  for (let i = redstoneHandles.length - 1; i >= 0; i -= 1) {
    const handle = redstoneHandles[i]
    if (handle.el.isConnected) continue
    handle.dispose()
    redstoneHandles.splice(i, 1)
  }
  container.querySelectorAll('hr').forEach((hr) => {
    const { divider, track } = buildRedstoneDivider()
    hr.replaceWith(divider)
    redstoneHandles.push({ el: divider, dispose: initRedstoneDivider(divider, track) })
  })
}

// ==================== H1/H2 铁轨分割线 ====================

// Minecraft 铁轨像素分割线：替换 h1/h2 原有的 border-bottom（样式见 global.css）。
// 材质与交互移植自 outputs/rail-divider 设计稿（public/rail-divider.svg 同源）：
// 普通铁轨平铺 + 随机分布的动力铁轨，悬停时动力轨点亮、矿车驶过并在动力轨上提速。
// 每个实例用自增 uid 生成独立 id，避免多实例间 pattern/use 互相串引用。
const buildRailDividerSvg = (uid: number) => {
  const patternId = `rail-tile-${uid}`
  const poweredId = `powered-rail-tile-${uid}`
  const cartId = `minecart-sprite-${uid}`
  return `<svg class="rail-divider-svg" width="100%" height="6" aria-hidden="true">
  <defs>
    <pattern id="${patternId}" width="16" height="5" patternUnits="userSpaceOnUse">
      <g>
        <rect x="0" y="1" width="3" height="1" fill="#a17a43"/><rect x="1" y="2" width="3" height="1" fill="#75572e"/><rect x="2" y="3" width="3" height="1" fill="#44321c"/>
        <rect x="8" y="1" width="3" height="1" fill="#8f6b39"/><rect x="9" y="2" width="3" height="1" fill="#654a27"/><rect x="10" y="3" width="3" height="1" fill="#3f2e1a"/>
      </g>
      <g>
        <rect x="0" y="0" width="16" height="1" fill="#626865"/><rect x="1" y="0" width="6" height="1" fill="#a7adaa"/><rect x="2" y="0" width="3" height="1" fill="#d6dad8"/><rect x="9" y="0" width="5" height="1" fill="#858c89"/><rect x="10" y="0" width="2" height="1" fill="#b8bdbb"/>
        <rect x="0" y="3" width="16" height="1" fill="#8d9491"/><rect x="2" y="3" width="5" height="1" fill="#b8bdbb"/><rect x="11" y="3" width="3" height="1" fill="#a5aba8"/><rect x="0" y="4" width="16" height="1" fill="#454b49"/><rect x="3" y="4" width="5" height="1" fill="#59605d"/><rect x="12" y="4" width="3" height="1" fill="#535957"/>
      </g>
    </pattern>
    <g id="${poweredId}">
      <rect class="power-red-highlight" x="0" y="1" width="3" height="1"/><rect class="power-red" x="1" y="2" width="3" height="1"/><rect class="power-red-deep" x="2" y="3" width="3" height="1"/>
      <rect class="power-red-highlight" x="8" y="1" width="3" height="1"/><rect class="power-red" x="9" y="2" width="3" height="1"/><rect class="power-red-deep" x="10" y="3" width="3" height="1"/>
      <rect class="power-gold-shadow" x="0" y="0" width="16" height="1"/><rect class="power-gold" x="1" y="0" width="6" height="1"/><rect class="power-gold-highlight" x="2" y="0" width="3" height="1"/><rect class="power-gold" x="9" y="0" width="5" height="1"/><rect class="power-gold-highlight" x="10" y="0" width="2" height="1"/>
      <rect class="power-gold" x="0" y="3" width="16" height="1"/><rect class="power-gold-highlight" x="2" y="3" width="5" height="1"/><rect class="power-gold-highlight" x="11" y="3" width="3" height="1"/><rect class="power-gold-shadow" x="0" y="4" width="16" height="1"/><rect class="power-gold" x="3" y="4" width="5" height="1"/><rect class="power-gold" x="12" y="4" width="3" height="1"/>
    </g>
    <symbol id="${cartId}" viewBox="0 0 16 6">
      <rect x="5" y="0" width="8" height="1" fill="#d4d8d6"/><rect x="6" y="0" width="5" height="1" fill="#f0f2f1"/><rect x="12" y="0" width="1" height="1" fill="#747c79"/>
      <rect x="2" y="1" width="13" height="1" fill="#9ba3a0"/><rect x="4" y="1" width="8" height="1" fill="#29312f"/><rect x="5" y="1" width="5" height="1" fill="#3d4643"/><rect x="12" y="1" width="3" height="1" fill="#606865"/>
      <rect x="0" y="2" width="16" height="1" fill="#77807d"/><rect x="1" y="2" width="13" height="1" fill="#8d9592"/><rect x="13" y="2" width="3" height="1" fill="#4f5754"/>
      <rect x="1" y="3" width="14" height="1" fill="#5b6461"/><rect x="2" y="3" width="9" height="1" fill="#737c79"/><rect x="3" y="3" width="1" height="1" fill="#b0b6b3"/><rect x="8" y="3" width="1" height="1" fill="#a0a7a4"/><rect x="13" y="3" width="2" height="1" fill="#444b49"/>
      <rect x="2" y="4" width="13" height="1" fill="#48504d"/><rect x="3" y="4" width="8" height="1" fill="#616a67"/><rect x="4" y="4" width="1" height="1" fill="#929996"/><rect x="12" y="4" width="3" height="1" fill="#343a38"/>
      <rect x="3" y="5" width="11" height="1" fill="#2e3432"/><rect x="4" y="5" width="6" height="1" fill="#4c5451"/><rect x="12" y="5" width="2" height="1" fill="#1f2423"/>
    </symbol>
  </defs>
  <g transform="translate(0 1)">
    <rect width="100%" height="5" fill="url(#${patternId})"/>
    <g class="powered-rails" data-template="#${poweredId}"></g>
  </g>
  <use class="minecart" href="#${cartId}" width="16" height="6" x="-16"/>
</svg>`
}

type RailDividerHandle = { el: HTMLElement; dispose: () => void }

const railHandles: RailDividerHandle[] = []
let railDividerSeq = 0

// 矿车动画：悬停启动，驶过动力轨区段时平滑提速到 2 倍，跑完全程后隔 1s 循环
const setupRailDivider = (divider: HTMLElement): (() => void) => {
  const svg = divider.querySelector<SVGElement>('.rail-divider-svg')
  const minecart = svg?.querySelector<SVGElement>('.minecart')
  const poweredLayer = svg?.querySelector<SVGElement>('.powered-rails')
  if (!svg || !minecart || !poweredLayer) return () => {}

  const tileSize = 16
  const boostTail = 48
  const restartDelay = 1000
  const isPowered = () => divider.matches(':hover')
  let poweredZones: Array<{ start: number; end: number }> = []
  let isRunning = false
  let restartTimer = 0

  const cancelRestart = () => {
    if (restartTimer) {
      window.clearTimeout(restartTimer)
      restartTimer = 0
    }
  }

  const queueNextMinecart = () => {
    cancelRestart()
    if (!isPowered()) return

    restartTimer = window.setTimeout(() => {
      restartTimer = 0
      if (isPowered()) runMinecart()
    }, restartDelay)
  }

  const shuffled = (values: number[]) => {
    const copy = [...values]
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]]
    }
    return copy
  }

  const buildPoweredRails = () => {
    const width = svg.getBoundingClientRect().width
    const tileCount = Math.max(8, Math.ceil(width / tileSize))
    const firstTile = 2
    const lastTile = Math.max(firstTile, tileCount - 7)
    const candidates = Array.from(
      { length: lastTile - firstTile + 1 },
      (_, index) => firstTile + index
    )
    const targetCount = Math.max(
      2,
      Math.min(8, Math.round(tileCount * 0.13 + Math.random()))
    )
    const selected: number[] = []

    shuffled(candidates).forEach((tileIndex) => {
      if (
        selected.length < targetCount &&
        selected.every((selectedIndex) => Math.abs(selectedIndex - tileIndex) > 2)
      ) {
        selected.push(tileIndex)
      }
    })

    shuffled(candidates).forEach((tileIndex) => {
      if (selected.length < targetCount && !selected.includes(tileIndex)) {
        selected.push(tileIndex)
      }
    })

    selected.sort((left, right) => left - right)
    poweredLayer.replaceChildren()
    const template = svg.querySelector(poweredLayer.dataset.template || '')

    selected.forEach((tileIndex) => {
      if (!template) return
      const poweredRail = template.cloneNode(true) as SVGElement
      poweredRail.removeAttribute('id')
      poweredRail.classList.add('powered-segment')
      poweredRail.setAttribute('transform', `translate(${tileIndex * tileSize} 0)`)
      poweredLayer.append(poweredRail)
    })

    poweredZones = selected.map((tileIndex) => ({
      start: tileIndex * tileSize,
      end: (tileIndex + 1) * tileSize + boostTail,
    }))
  }

  const runMinecart = () => {
    if (isRunning) return

    cancelRestart()
    isRunning = true
    minecart.style.opacity = '1'

    const width = svg.getBoundingClientRect().width
    const travelDistance = width + 32
    const baseSpeed = travelDistance / 2400
    let distance = 0
    let speedFactor = 1
    let lastTime = 0

    const frame = (time: number) => {
      if (!lastTime) lastTime = time
      const delta = Math.min(34, time - lastTime)
      lastTime = time

      const cartCenter = -8 + distance
      const isBoosted = isPowered() && poweredZones.some(
        (zone) => cartCenter >= zone.start && cartCenter <= zone.end
      )
      const targetFactor = isBoosted ? 2 : 1
      speedFactor += (targetFactor - speedFactor) * Math.min(1, delta / 70)
      distance += baseSpeed * speedFactor * delta

      minecart.style.transform = `translateX(${Math.round(distance)}px)`

      if (distance < travelDistance) {
        requestAnimationFrame(frame)
        return
      }

      minecart.style.opacity = '0'
      minecart.style.transform = 'translateX(0)'
      isRunning = false
      queueNextMinecart()
    }

    requestAnimationFrame(frame)
  }

  const handlePointerEnter = () => {
    cancelRestart()
    runMinecart()
  }

  buildPoweredRails()
  // 容器宽度变化（如图片加载完成引起回流）时重建动力轨区段
  const observer = new ResizeObserver(buildPoweredRails)
  observer.observe(svg)
  divider.addEventListener('pointerenter', handlePointerEnter)
  divider.addEventListener('pointerleave', cancelRestart)

  return () => {
    observer.disconnect()
    divider.removeEventListener('pointerenter', handlePointerEnter)
    divider.removeEventListener('pointerleave', cancelRestart)
    cancelRestart()
  }
}

// 在每个 h1/h2 后面插入铁轨分割线（同一标题只绑一次；html 变化时容器整体重建，标记随旧 DOM 消失）
const enhanceHeadingDividers = () => {
  const container = containerRef.value
  if (!container) return
  for (let i = railHandles.length - 1; i >= 0; i -= 1) {
    const handle = railHandles[i]
    if (handle.el.isConnected) continue
    handle.dispose()
    railHandles.splice(i, 1)
  }
  container.querySelectorAll('h1, h2').forEach((heading) => {
    const el = heading as HTMLElement
    if (el.dataset.railDividerBound) return
    el.dataset.railDividerBound = '1'
    const divider = document.createElement('div')
    divider.className = `rail-divider is-${el.tagName.toLowerCase()}`
    divider.setAttribute('role', 'separator')
    divider.setAttribute('aria-label', t('common.railDivider'))
    divider.innerHTML = buildRailDividerSvg(++railDividerSeq)
    el.insertAdjacentElement('afterend', divider)
    railHandles.push({ el: divider, dispose: setupRailDivider(divider) })
  })
}

// ==================== TOC ====================

const getHeadings = () => {
  if (!containerRef.value) return []
  const headings = containerRef.value.querySelectorAll('h2, h3')
  return Array.from(headings).map((el, i) => {
    if (!el.id) {
      el.id = `heading-${el.tagName}-${i}`
    }
    return {
      id: el.id,
      level: el.tagName.toLowerCase(),
      text: el.textContent || '',
    }
  })
}

defineExpose({ getHeadings })

// ==================== 锚点滚动 ====================

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '')

const handleAnchorClick = (e: Event) => {
  const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  if (!link) return
  const href = link.getAttribute('href')
  if (!href || href === '#') return
  const targetId = decodeURIComponent(href.slice(1))
  let target: HTMLElement | null = document.getElementById(targetId)
  if (!target && containerRef.value) {
    const want = slugify(targetId)
    const headings = containerRef.value.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    target =
      Array.from(headings).find(
        (h) => slugify(h.id) === want || slugify(h.textContent || '') === want
      ) || null
  }
  if (target) {
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ==================== 生命周期 ====================

watch(
  () => props.html,
  () => {
    setTimeout(() => {
      bindImageStates()
      enhanceRedstoneDividers()
      enhanceHeadingDividers()
    }, 0)
  },
  { immediate: true }
)

onMounted(() => {
  containerRef.value?.addEventListener('click', handleCopyClick)
  containerRef.value?.addEventListener('click', handleAnchorClick)
  containerRef.value?.addEventListener('click', handleImageClick)
  containerRef.value?.addEventListener('click', handleRetryClick)
  bindImageStates()
  enhanceRedstoneDividers()
  enhanceHeadingDividers()
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('click', handleCopyClick)
  containerRef.value?.removeEventListener('click', handleAnchorClick)
  containerRef.value?.removeEventListener('click', handleImageClick)
  containerRef.value?.removeEventListener('click', handleRetryClick)
  unbindImageStates()
  while (redstoneHandles.length) {
    redstoneHandles.pop()?.dispose()
  }
  while (railHandles.length) {
    railHandles.pop()?.dispose()
  }
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  padding: 0;
  line-height: 1.8;
}
</style>
