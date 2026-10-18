import { ref, computed } from 'vue'
import { useAchievements } from '@/composables/useAchievements'

/**
 * PWA 安装（beforeinstallprompt 事件共享）
 *
 * 原先 deferredPrompt / 是否已安装 / 触发安装 三件事都锁在 PwaInstallPrompt.vue 内部，
 * 设置面板的「安装到桌面」需要同一份事件对象 —— `beforeinstallprompt` 只会派发一次，
 * 且事件用过一次即作废（再次 prompt() 抛 InvalidStateError），
 * 因此提到模块级单例：弹窗横幅与设置面板共用同一个 deferredPrompt，不会互相抢。
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)
const isInstalling = ref(false)
let listenersBound = false
// 站内是否提供了安装入口（横幅 / 设置面板都只在主布局渲染）。
// 独立落地页（/sfmc 等）没有任何站内入口，此时必须保留浏览器自带的安装提示，
// 否则就是「既不让浏览器提示、自己也不提供」。
let siteInstallUiAvailable = false

/** 已作为独立应用运行（PWA / iOS 添加到主屏） */
function checkInstalled(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari：navigator.standalone
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true
  return false
}

/** iOS / iPadOS：没有 beforeinstallprompt，只能引导用户手动「添加到主屏幕」 */
function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  // iPadOS 13+ 的 UA 与 macOS 相同，靠触点数区分
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function usePwaInstall() {
  /** 可以走浏览器原生安装流程（事件已就绪且尚未安装） */
  const canInstall = computed(() => deferredPrompt.value !== null && !isInstalled.value)

  /**
   * 须在挂载前调用一次：注册 beforeinstallprompt / appinstalled。
   * 幂等 —— 多处调用只绑定一次监听。
   */
  const initPwaInstall = () => {
    if (listenersBound || typeof window === 'undefined') return
    listenersBound = true

    isInstalled.value = checkInstalled()

    window.addEventListener('beforeinstallprompt', (e) => {
      // 拦下浏览器自带的安装提示，安装入口统一由站内 UI 提供；
      // 但站内没有入口时（如独立落地页）不拦，交给浏览器自己提示
      if (siteInstallUiAvailable) e.preventDefault()
      deferredPrompt.value = e as BeforeInstallPromptEvent
    })

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      deferredPrompt.value = null
      // 成就系统：PWA 安装完成
      useAchievements().unlock('install-pwa')
    })
  }

  /**
   * 由站内安装入口（PwaInstallPrompt 横幅）在挂载 / 卸载时调用：
   * 只有站内确实提供了安装入口，才去拦浏览器的默认提示
   */
  const setSiteInstallUiAvailable = (available: boolean) => {
    siteInstallUiAvailable = available
  }

  /**
   * 触发安装。返回用户的选择结果：
   * - accepted：已安装
   * - dismissed：用户取消（事件已作废，需刷新后浏览器才会再次派发）
   * - unavailable：当前环境无法程序化安装（iOS / 已安装 / 非 HTTPS 等）
   */
  const installApp = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const event = deferredPrompt.value
    if (!event || isInstalling.value) return 'unavailable'

    isInstalling.value = true
    try {
      await event.prompt()
      const { outcome } = await event.userChoice
      if (outcome === 'accepted') isInstalled.value = true
      // 无论接受还是取消，这个事件都不能再用
      deferredPrompt.value = null
      return outcome
    } catch {
      deferredPrompt.value = null
      return 'unavailable'
    } finally {
      isInstalling.value = false
    }
  }

  return {
    isInstalled,
    isInstalling,
    canInstall,
    isIos: detectIos(),
    initPwaInstall,
    setSiteInstallUiAvailable,
    installApp,
  }
}
