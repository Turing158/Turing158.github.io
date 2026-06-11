import { ref, onMounted } from 'vue'

const needRefresh = ref(false)
const offlineReady = ref(false)

/**
 * Composable for managing PWA service worker updates
 * 通过监听 SW 的 controllerchange 事件来检测新版本
 */
export function usePwaUpdate() {
  let newWorker: ServiceWorker | null = null

  // 检查是否有新版本等待激活
  const checkForUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' })
    }
  }

  // 激活新版本
  const triggerUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // 关闭更新提示
  const dismissUpdate = () => {
    needRefresh.value = false
  }

  // 监听 SW 更新
  const setupUpdateListener = () => {
    if (!('serviceWorker' in navigator)) return

    // 监听 controllerchange 事件（当新 SW 激活时触发）
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // 新 SW 已激活，刷新页面以加载新内容
      window.location.reload()
    })

    // 监听 SW 消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        needRefresh.value = true
        newWorker = event.data.worker
      }
    })

    // 检查 registration.waiting
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        // 有等待中的 SW
        needRefresh.value = true
        newWorker = registration.waiting
      }

      // 监听 updatefound 事件
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 新 SW 已安装，提示用户更新
              needRefresh.value = true
              newWorker = installingWorker
            }
          })
        }
      })
    })
  }

  onMounted(() => {
    setupUpdateListener()
  })

  return {
    needRefresh,
    offlineReady,
    triggerUpdate,
    dismissUpdate,
  }
}
