import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(true)
let onlineHandler: (() => void) | null = null
let offlineHandler: (() => void) | null = null

/**
 * Composable for tracking network online/offline status
 */
export function useNetworkStatus() {
  const initNetworkStatus = () => {
    // 初始化网络状态
    isOnline.value = navigator.onLine

    // 监听在线事件
    onlineHandler = () => {
      isOnline.value = true
    }

    // 监听离线事件
    offlineHandler = () => {
      isOnline.value = false
    }

    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
  }

  const cleanup = () => {
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler)
      onlineHandler = null
    }
    if (offlineHandler) {
      window.removeEventListener('offline', offlineHandler)
      offlineHandler = null
    }
  }

  onMounted(() => {
    initNetworkStatus()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isOnline,
    initNetworkStatus,
    cleanup
  }
}
