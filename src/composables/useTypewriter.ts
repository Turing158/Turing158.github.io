import { ref, onUnmounted } from 'vue'

/**
 * 打字机效果 composable（性能优化版）
 * - 使用 requestAnimationFrame 对齐浏览器刷新率
 * - 累积时间戳批量更新，减少 DOM 操作
 */
export function useTypewriter(
  text: string,
  typeSpeed = 120,
  deleteSpeed = 60,
) {
  const displayedText = ref('')
  const isTyping = ref(false)
  const isDeleting = ref(false)
  const showCursor = ref(true)

  let rafId: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let charIndex = 0
  let phase: 'typing' | 'pausing-after-type' | 'deleting' | 'pausing-after-delete' = 'typing'
  let lastTimestamp = 0
  let accumulatedTime = 0

  // 暂停时长（打字完成后 / 删除完成后）
  const pauseBeforeDelete = 2000
  const pauseBeforeType = 800

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function cancelRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function tick(timestamp: number) {
    if (!lastTimestamp) lastTimestamp = timestamp
    const delta = timestamp - lastTimestamp
    lastTimestamp = timestamp
    accumulatedTime += delta

    switch (phase) {
      case 'typing': {
        // 累积足够时间才更新一个字符，期间复用同一帧
        if (accumulatedTime >= typeSpeed) {
          accumulatedTime = 0
          if (charIndex < text.length) {
            charIndex++
            displayedText.value = text.slice(0, charIndex)
            isTyping.value = true
            isDeleting.value = false
          } else {
            phase = 'pausing-after-type'
            isTyping.value = false
          }
        }
        rafId = requestAnimationFrame(tick)
        break
      }

      case 'pausing-after-type':
        // 暂停指定时间后进入删除阶段
        if (accumulatedTime >= pauseBeforeDelete) {
          phase = 'deleting'
          lastTimestamp = 0
          accumulatedTime = 0
        }
        rafId = requestAnimationFrame(tick)
        break

      case 'deleting': {
        if (accumulatedTime >= deleteSpeed) {
          accumulatedTime = 0
          if (charIndex > 0) {
            charIndex--
            displayedText.value = text.slice(0, charIndex)
            isDeleting.value = true
          } else {
            phase = 'pausing-after-delete'
            isDeleting.value = false
          }
        }
        rafId = requestAnimationFrame(tick)
        break
      }

      case 'pausing-after-delete':
        // 暂停指定时间后重新开始打字
        if (accumulatedTime >= pauseBeforeType) {
          phase = 'typing'
          lastTimestamp = 0
          accumulatedTime = 0
        }
        rafId = requestAnimationFrame(tick)
        break
    }
  }

  function start() {
    clearTimer()
    cancelRaf()
    charIndex = 0
    phase = 'typing'
    displayedText.value = ''
    showCursor.value = true
    lastTimestamp = 0
    accumulatedTime = 0

    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    clearTimer()
    cancelRaf()
    displayedText.value = text
    showCursor.value = false
  }

  start()

  onUnmounted(() => {
    clearTimer()
    cancelRaf()
  })

  return {
    displayedText,
    isTyping,
    isDeleting,
    showCursor,
    start,
    stop,
  }
}
