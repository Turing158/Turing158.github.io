<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

// beforeinstallprompt 事件与「是否已安装」由 usePwaInstall 统一持有
// （设置面板的「安装到桌面」共用同一份状态，事件只会派发一次，不能各存一份）
const { isInstalled, canInstall, installApp, setSiteInstallUiAvailable } = usePwaInstall()

const showPrompt = ref(false)

// 横幅存在期间，才让 usePwaInstall 拦下浏览器自带的安装提示；
// 独立落地页不渲染本组件，浏览器提示因此保持原样
onMounted(() => setSiteInstallUiAvailable(true))
onUnmounted(() => setSiteInstallUiAvailable(false))

// 拿到安装机会后延迟 3 秒再弹横幅，避免首次访问就打扰
// immediate: 若事件在组件挂载前就已派发（main.ts 里更早注册监听），挂载时补一次
watch(
  canInstall,
  (available) => {
    if (!available) return
    setTimeout(() => {
      if (canInstall.value) showPrompt.value = true
    }, 3000)
  },
  { immediate: true },
)

// 已安装（含从设置面板完成安装）时收起横幅
watch(isInstalled, (installed) => {
  if (installed) showPrompt.value = false
})

async function handleInstall() {
  const outcome = await installApp()
  if (outcome === 'accepted') showPrompt.value = false
}

function dismissPrompt() {
  showPrompt.value = false
}
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
        <button class="pwa-prompt__btn pwa-prompt__btn--install" @click="handleInstall">
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
  --pxs: 4px; clip-path: var(--pxc);
  box-shadow: var(--shadow-strong);
  padding: 16px 20px;
  min-width: 320px;
  max-width: 400px;
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;

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
    --pxs: 3px; clip-path: var(--pxc);
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
    clip-path: var(--pxc-circle);
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
    --pxs: 3px; clip-path: var(--pxc);
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
