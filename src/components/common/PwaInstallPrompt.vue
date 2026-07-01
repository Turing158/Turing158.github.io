<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAchievements } from '@/composables/useAchievements'

const deferredPrompt = ref<Event | null>(null)
const showPrompt = ref(false)
const isInstalled = ref(false)

// 检查是否已安装
function checkInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled.value = true
    return true
  }
  // iOS 检查
  if ((window.navigator as any).standalone === true) {
    isInstalled.value = true
    return true
  }
  return false
}

// 处理安装提示
function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e
  // 延迟显示提示，避免首次访问就弹窗
  setTimeout(() => {
    if (!isInstalled.value) {
      showPrompt.value = true
    }
  }, 3000)
}

// 点击安装
async function installApp() {
  if (!deferredPrompt.value) return
  ;(deferredPrompt.value as any).prompt()
  const { outcome } = await (deferredPrompt.value as any).userChoice
  if (outcome === 'accepted') {
    showPrompt.value = false
  }
  deferredPrompt.value = null
}

// 关闭提示
function dismissPrompt() {
  showPrompt.value = false
}

onMounted(() => {
  if (checkInstalled()) return
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    showPrompt.value = false
    // 成就系统：PWA 安装完成
    useAchievements().unlock('install-pwa')
  })
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="showPrompt" class="pwa-prompt">
      <div class="pwa-prompt__content">
        <div class="pwa-prompt__icon">
          <img src="/icons/icon-192.png" alt="Turing_ICE" />
        </div>
        <div class="pwa-prompt__text">
          <h3>安装应用</h3>
          <p>将博客添加到主屏，离线也能阅读</p>
        </div>
        <button class="pwa-prompt__close" @click="dismissPrompt" aria-label="关闭">
          &times;
        </button>
      </div>
      <div class="pwa-prompt__actions">
        <button class="pwa-prompt__btn pwa-prompt__btn--cancel" @click="dismissPrompt">
          稍后再说
        </button>
        <button class="pwa-prompt__btn pwa-prompt__btn--install" @click="installApp">
          立即安装
        </button>
      </div>
    </div>
  </transition>
</template>

<style lang="less" scoped>
.pwa-prompt {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-strong);
  padding: 16px 20px;
  min-width: 320px;
  max-width: 400px;
  border: 1px solid var(--border);

  &__content {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__text {
    flex: 1;

    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary);
    }
  }

  &__close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: var(--text-secondary, #999);
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__btn {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &--cancel {
      background: var(--bg-secondary);
      color: var(--text-secondary);

      &:hover {
        background: var(--border);
      }
    }

    &--install {
      background: var(--accent);
      color: #fff;

      &:hover {
        background: var(--accent-hover);
      }
    }
  }
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
