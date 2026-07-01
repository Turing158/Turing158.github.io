import { ref, onUnmounted } from 'vue'

/**
 * 打字机效果 composable
 * @param text 要显示的完整文字
 * @param typeSpeed 打字速度（ms/字符）
 * @param deleteSpeed 删除速度（ms/字符）
 * @param pauseBeforeDelete 打完字后停留时间（ms）
 * @param pauseBeforeType 删完后停留时间（ms）
 */
export function useTypewriter(
  text: string,
  typeSpeed = 120,
  deleteSpeed = 60,
  pauseBeforeDelete = 2000,
  pauseBeforeType = 800,
) {
  const displayedText = ref('')
  const isTyping = ref(false)
  const isDeleting = ref(false)
  const showCursor = ref(true)

  let timer: ReturnType<typeof setTimeout> | null = null
  let charIndex = 0
  let phase: 'typing' | 'pausing-after-type' | 'deleting' | 'pausing-after-delete' = 'typing'

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function tick() {
    switch (phase) {
      case 'typing':
        if (charIndex < text.length) {
          charIndex++
          displayedText.value = text.slice(0, charIndex)
          isTyping.value = true
          isDeleting.value = false
          timer = setTimeout(tick, typeSpeed)
        } else {
          // 打字完成，进入暂停
          phase = 'pausing-after-type'
          isTyping.value = false
          timer = setTimeout(tick, pauseBeforeDelete)
        }
        break

      case 'pausing-after-type':
        // 暂停结束，开始删除
        phase = 'deleting'
        timer = setTimeout(tick, 0)
        break

      case 'deleting':
        if (charIndex > 0) {
          charIndex--
          displayedText.value = text.slice(0, charIndex)
          isDeleting.value = true
          timer = setTimeout(tick, deleteSpeed)
        } else {
          // 删除完成，进入暂停
          phase = 'pausing-after-delete'
          isDeleting.value = false
          timer = setTimeout(tick, pauseBeforeType)
        }
        break

      case 'pausing-after-delete':
        // 暂停结束，重新开始打字
        phase = 'typing'
        timer = setTimeout(tick, 0)
        break
    }
  }

  function start() {
    clearTimer()
    charIndex = 0
    phase = 'typing'
    displayedText.value = ''
    showCursor.value = true
    timer = setTimeout(tick, 500) // 初始延迟
  }

  function stop() {
    clearTimer()
    displayedText.value = text
    showCursor.value = false
  }

  start()

  onUnmounted(clearTimer)

  return {
    displayedText,
    isTyping,
    isDeleting,
    showCursor,
    start,
    stop,
  }
}
