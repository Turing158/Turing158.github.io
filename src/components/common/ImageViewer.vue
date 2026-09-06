<template>
  <Teleport to="body">
    <Transition name="iv-fade">
      <div
        v-if="visible && currentImage"
        class="iv-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="t('imageViewer.title')"
        @click.self="close"
        @wheel.prevent="handleWheel"
      >
        <!-- 图片舞台：切换动画作用于 frame（无内联样式，避免覆盖动画类），视角 transform 挂在 img 上 -->
        <Transition :name="slideName">
          <div
            :key="currentImage.src"
            ref="frameRef"
            class="iv-frame"
            @dblclick="handleDblClick"
            @pointerdown="handlePointerDown"
          >
            <img
              ref="imgRef"
              class="iv-image"
              :class="{ 'iv-image-pending': !isCurrentLoaded }"
              :style="imageStyle"
              :src="currentImage.src"
              :alt="currentImage.alt"
              draggable="false"
              @load="handleImgLoad"
              @error="handleImgError"
            />
          </div>
        </Transition>

        <!-- 未加载完成 / 加载失败占位：占据层全屏可点，点空白处等同点击背景关闭 -->
        <div v-if="showPlaceholder" class="iv-placeholder" @click.self="close">
          <Transition name="iv-fade" mode="out-in">
            <LoadingSpinner v-if="isCurrentLoading" key="loading" variant="ring" size="large" color="#ffffff" />
            <div v-else key="error" class="iv-error-box">
              <svg class="iv-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48">
                <path d="M11 3l-1.5 5 2.5 2.5-2.5 3 2 3.5-1 4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6z" /><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8.5l1-4-2-3.5 2.5-3-2.5-2.5L13 3z" /><circle cx="16.8" cy="8.3" r="1.4" /><path d="m21 15.5-2.8-2.8-3.4 3.6" />
              </svg>
              <span class="iv-placeholder-text">{{ t('imageViewer.loadFailed') }}</span>
              <button class="iv-btn iv-retry" type="button" :title="t('common.reloadImage')" :aria-label="t('common.reloadImage')" @click="retryLoad">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                </svg>
              </button>
            </div>
          </Transition>
        </div>

        <!-- 顶部信息栏 -->
        <div class="iv-header">
          <span class="iv-caption" :title="currentImage.alt">{{ currentImage.alt }}</span>
          <span class="iv-counter">{{ index + 1 }} / {{ images.length }}</span>
          <button class="iv-btn iv-close" type="button" :title="t('imageViewer.close')" :aria-label="t('imageViewer.close')" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 左右切换 -->
        <template v-if="images.length > 1">
          <button class="iv-btn iv-nav iv-prev" type="button" :title="t('imageViewer.prev')" :aria-label="t('imageViewer.prev')" @click="step(-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button class="iv-btn iv-nav iv-next" type="button" :title="t('imageViewer.next')" :aria-label="t('imageViewer.next')" @click="step(1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </template>

        <!-- 底部工具栏 -->
        <div class="iv-toolbar">
          <button class="iv-btn" type="button" :title="t('imageViewer.zoomOut')" :aria-label="t('imageViewer.zoomOut')" @click="zoomBy(1 / ZOOM_STEP)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          <button class="iv-btn" type="button" :title="t('imageViewer.zoomIn')" :aria-label="t('imageViewer.zoomIn')" @click="zoomBy(ZOOM_STEP)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </button>
          <button class="iv-btn iv-reset" type="button" :title="t('imageViewer.reset')" :aria-label="t('imageViewer.reset')" @click="resetTransform">1:1</button>
          <span class="iv-scale" :title="t('imageViewer.scale')">{{ Math.round(scale * 100) }}%</span>
          <button class="iv-btn" type="button" :title="t('imageViewer.rotateLeft')" :aria-label="t('imageViewer.rotateLeft')" @click="rotate(-ROTATE_STEP)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 14 4 9 9 4" /><path d="M4 9h10a6 6 0 0 1 6 6v1" />
            </svg>
          </button>
          <button class="iv-btn" type="button" :title="t('imageViewer.rotateRight')" :aria-label="t('imageViewer.rotateRight')" @click="rotate(ROTATE_STEP)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 14 20 9 15 4" /><path d="M20 9H10a6 6 0 0 0-6 6v1" />
            </svg>
          </button>
          <span class="iv-divider" />
          <button class="iv-btn" type="button" :title="t('imageViewer.openOriginal')" :aria-label="t('imageViewer.openOriginal')" @click="openOriginal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export interface ImageViewerImage {
  src: string
  alt?: string
}

const props = defineProps<{
  visible: boolean
  images: ImageViewerImage[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

const ZOOM_STEP = 1.25
const MIN_SCALE = 0.25
const MAX_SCALE = 8
const ROTATE_STEP = 90

const index = ref(0)
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
// 切换方向：决定滑入动画从哪一侧进入
const slideDirection = ref<'next' | 'prev'>('next')

const frameRef = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)

const currentImage = computed(() => props.images[index.value])
const slideName = computed(() => (slideDirection.value === 'next' ? 'iv-slide-next' : 'iv-slide-prev'))
const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) rotate(${rotation.value}deg) scale(${scale.value})`,
  cursor: isDragging.value ? 'grabbing' : scale.value > 1 ? 'grab' : 'zoom-in',
}))

// ==================== 图片加载状态 ====================

// 已加载/已失败的图片集合（组件存活期内缓存，回看已加载图片不再出加载动画）
const loadedImages = reactive(new Set<string>())
const failedImages = reactive(new Set<string>())

const currentSrc = computed(() => currentImage.value?.src ?? '')
const isCurrentLoading = computed(
  () => !!currentSrc.value && !loadedImages.has(currentSrc.value) && !failedImages.has(currentSrc.value)
)
const isCurrentFailed = computed(() => !!currentSrc.value && failedImages.has(currentSrc.value))
const isCurrentLoaded = computed(() => !!currentSrc.value && loadedImages.has(currentSrc.value))
const showPlaceholder = computed(() => isCurrentLoading.value || isCurrentFailed.value)

// 加载状态一律按事件目标自身的 src 记录：
// 切换图片后，旧图的迟到 load/error 事件不能误标当前图片
const handleImgLoad = (e: Event) => {
  const src = (e.target as HTMLImageElement | null)?.src
  if (!src) return
  loadedImages.add(src)
  failedImages.delete(src)
}

const handleImgError = (e: Event) => {
  const src = (e.target as HTMLImageElement | null)?.src
  if (!src) return
  failedImages.add(src)
  loadedImages.delete(src)
}

// 缓存命中的图片可能不触发 load 事件，渲染完成后主动检查一次
const checkCurrentComplete = () => {
  const img = imgRef.value
  if (!img || !currentSrc.value || !img.complete) return
  if (img.naturalWidth > 0) loadedImages.add(currentSrc.value)
  else failedImages.add(currentSrc.value)
}

watch([() => props.visible, currentSrc], checkCurrentComplete, { flush: 'post' })

const retryLoad = () => {
  const src = currentSrc.value
  if (!src) return
  failedImages.delete(src)
  loadedImages.delete(src)
  const img = imgRef.value
  if (!img) return
  // 重置 src 触发重新请求（:src 绑定值未变，手动重赋不会被 Vue 覆盖）
  img.removeAttribute('src')
  requestAnimationFrame(() => {
    img.src = src
  })
}

// 以屏幕坐标 point 为锚点缩放：缩放前后锚点下的图像内容保持不动
// translate 是相对布局位置的偏移量，需借助 boundingRect 还原视觉中心后再计算新偏移
const zoomAt = (factor: number, point?: { x: number; y: number }) => {
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor))
  if (newScale === scale.value) return
  if (point && imgRef.value) {
    const rect = imgRef.value.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const baseX = centerX - translateX.value
    const baseY = centerY - translateY.value
    const ratio = newScale / scale.value
    translateX.value = point.x - (point.x - centerX) * ratio - baseX
    translateY.value = point.y - (point.y - centerY) * ratio - baseY
  }
  scale.value = newScale
}

const zoomBy = (factor: number) => {
  zoomAt(factor)
}

const rotate = (delta: number) => {
  rotation.value = (rotation.value + delta) % 360
}

const resetTransform = () => {
  scale.value = 1
  rotation.value = 0
  translateX.value = 0
  translateY.value = 0
}

const step = (delta: number) => {
  if (props.images.length === 0) return
  slideDirection.value = delta > 0 ? 'next' : 'prev'
  index.value = (index.value + delta + props.images.length) % props.images.length
}

const openOriginal = () => {
  if (currentImage.value) window.open(currentImage.value.src, '_blank', 'noopener')
}

const close = () => {
  emit('close')
}

// ==================== 指针交互（拖拽平移 / 双指缩放） ====================

const pointers = new Map<number, { x: number; y: number }>()
let pinchPrev: { dist: number; midX: number; midY: number } | null = null

const stopPointerListeners = () => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerUp)
}

const handlePointerDown = (e: PointerEvent) => {
  // 仅左键/触摸/笔可拖动，右键保留浏览器菜单
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  pinchPrev = null
  isDragging.value = true
  frameRef.value?.setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerUp)
}

const handlePointerMove = (e: PointerEvent) => {
  const prev = pointers.get(e.pointerId)
  if (!prev) return
  const now = { x: e.clientX, y: e.clientY }

  if (pointers.size >= 2) {
    // 双指：跟随中点平移，并以中点为锚点缩放
    pointers.set(e.pointerId, now)
    const [a, b] = Array.from(pointers.values())
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    if (pinchPrev && pinchPrev.dist > 0) {
      translateX.value += midX - pinchPrev.midX
      translateY.value += midY - pinchPrev.midY
      zoomAt(dist / pinchPrev.dist, { x: midX, y: midY })
    }
    pinchPrev = { dist, midX, midY }
  } else {
    // 单指：平移
    pointers.set(e.pointerId, now)
    translateX.value += now.x - prev.x
    translateY.value += now.y - prev.y
  }
}

const handlePointerUp = (e: PointerEvent) => {
  pointers.delete(e.pointerId)
  pinchPrev = null
  if (pointers.size === 0) {
    isDragging.value = false
    stopPointerListeners()
  }
}

// ==================== 滚轮缩放 / 双击缩放 ====================

const handleWheel = (e: WheelEvent) => {
  zoomAt(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, { x: e.clientX, y: e.clientY })
}

const handleDblClick = (e: MouseEvent) => {
  if (scale.value > 1.01) {
    resetTransform()
  } else {
    zoomAt(2.5, { x: e.clientX, y: e.clientY })
  }
}

// ==================== 键盘快捷键 ====================

const handleKeydown = (e: KeyboardEvent) => {
  if (!props.visible) return
  switch (e.key) {
    case 'Escape':
      close()
      break
    case '+':
    case '=':
      zoomBy(ZOOM_STEP)
      break
    case '-':
    case '_':
      zoomBy(1 / ZOOM_STEP)
      break
    case '0':
      resetTransform()
      break
    case 'r':
    case 'R':
      rotate(ROTATE_STEP)
      break
    case 'ArrowLeft':
      step(-1)
      break
    case 'ArrowRight':
      step(1)
      break
  }
}

// ==================== 滚动锁定与状态重置 ====================

let prevBodyOverflow = ''

const lockScroll = () => {
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.body.style.overflow = prevBodyOverflow
}

// 打开时按 initialIndex 定位并重置视角
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      index.value = Math.min(Math.max(props.initialIndex ?? 0, 0), Math.max(props.images.length - 1, 0))
      resetTransform()
      lockScroll()
    } else {
      unlockScroll()
      pointers.clear()
      pinchPrev = null
      isDragging.value = false
      stopPointerListeners()
    }
  }
)

// 图片切换时重置视角
watch(index, resetTransform)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (props.visible) unlockScroll()
  stopPointerListeners()
})
</script>

<style lang="less" scoped>
.iv-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.88);
  user-select: none;
  touch-action: none;
}

/* 视角变换载体：内联 transform（缩放/旋转/平移）挂在这一层 */
.iv-frame {
  position: relative;
  transition: transform 0.08s ease-out;
  touch-action: none;

  &:active {
    transition: none;
  }
}

/* 切换图片：进入的图片置于上层滑入，离开的图片绝对定位原地淡出 */
.iv-slide-next-enter-active,
.iv-slide-prev-enter-active {
  position: relative;
  z-index: 1;
}

.iv-slide-next-leave-active,
.iv-slide-prev-leave-active {
  position: absolute;
}

.iv-slide-next-enter-active,
.iv-slide-next-leave-active,
.iv-slide-prev-enter-active,
.iv-slide-prev-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.iv-slide-next-enter-from {
  opacity: 0;
  transform: translateX(56px);
}

.iv-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-56px);
}

.iv-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-56px);
}

.iv-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(56px);
}

.iv-image {
  display: block;
  max-width: 90vw;
  max-height: 88vh;
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
  border-radius: 4px;
  cursor: inherit;
  -webkit-user-drag: none;
}

/* 未就绪（加载中/失败）时隐藏图片内容并撑起占位尺寸 */
.iv-image-pending {
  visibility: hidden;
  min-width: min(320px, 80vw);
  min-height: min(240px, 60vh);
}

.iv-placeholder {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.iv-error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.iv-placeholder-icon {
  opacity: 0.6;
}

.iv-placeholder-text {
  font-size: 0.9rem;
}

.iv-retry {
  width: auto;
  min-width: 44px;
  padding: 0 14px;
  font-size: 0.85rem;
}

.iv-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent);
  color: #fff;
}

.iv-caption {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.85;
}

.iv-counter {
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  flex-shrink: 0;
}

.iv-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, transform 0.2s ease;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  &:active {
    transform: scale(0.92);
  }
}

.iv-close {
  background: transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
}

.iv-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);

  &:hover {
    background: rgba(0, 0, 0, 0.65);
  }

  &:active {
    transform: translateY(-50%) scale(0.92);
  }
}

.iv-prev {
  left: 16px;
}

.iv-next {
  right: 16px;
}

.iv-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.iv-reset {
  width: auto;
  min-width: 44px;
  padding: 0 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.iv-scale {
  min-width: 52px;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
  user-select: none;
}

.iv-divider {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 2px;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .iv-image {
    max-width: 96vw;
    max-height: 78vh;
  }

  .iv-nav {
    top: auto;
    bottom: 84px;
    transform: none;
    width: 40px;
    height: 40px;

    &:active {
      transform: scale(0.92);
    }
  }

  .iv-toolbar {
    bottom: 12px;
    padding: 6px 8px;
    gap: 4px;
  }

  .iv-scale,
  .iv-divider {
    display: none;
  }
}

/* 进出场动画 */
.iv-fade-enter-active,
.iv-fade-leave-active {
  transition: opacity 0.22s ease;
}

.iv-fade-enter-from,
.iv-fade-leave-to {
  opacity: 0;
}
</style>
