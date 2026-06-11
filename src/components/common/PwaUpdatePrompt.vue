<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const { needRefresh, triggerUpdate, dismissUpdate } = usePwaUpdate()

const showPrompt = ref(false)
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

// 当 needRefresh 变为 true 时显示提示
watch(needRefresh, (value) => {
  if (value) {
    showPrompt.value = true
    startAutoDismiss()
  }
})

// 自动关闭倒计时
function startAutoDismiss() {
  clearAutoDismiss()
  autoDismissTimer = setTimeout(() => {
    dismiss()
  }, 10000) // 10秒后自动关闭
}

function clearAutoDismiss() {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
    autoDismissTimer = null
  }
}

// 立即更新
function handleUpdate() {
  clearAutoDismiss()
  triggerUpdate()
  showPrompt.value = false
}

// 稍后提醒
function dismiss() {
  clearAutoDismiss()
  dismissUpdate()
  showPrompt.value = false
}

// 清理定时器
onUnmounted(() => {
  clearAutoDismiss()
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="showPrompt" class="pwa-update-prompt">
      <div class="pwa-update-prompt__content">
        <div class="pwa-update-prompt__icon">
          <svg
            class="pwa-update-prompt__icon-svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div class="pwa-update-prompt__text">
          <h3>有新版本可用</h3>
          <p>点击更新以获取最新内容</p>
        </div>
        <button
          class="pwa-update-prompt__close"
          @click="dismiss"
          aria-label="关闭"
        >
          &times;
        </button>
      </div>
      <div class="pwa-update-prompt__actions">
        <button
          class="pwa-update-prompt__btn pwa-update-prompt__btn--dismiss"
          @click="dismiss"
        >
          稍后
        </button>
        <button
          class="pwa-update-prompt__btn pwa-update-prompt__btn--update"
          @click="handleUpdate"
        >
          立即更新
        </button>
      </div>
    </div>
  </transition>
</template>

<style lang="less" scoped>
.pwa-update-prompt {
  position: fixed;
  bottom: 20px;
  right: 20px;
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
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon-svg {
    animation: rotate 2s linear infinite;
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

    &--dismiss {
      background: var(--bg-secondary);
      color: var(--text-secondary);

      &:hover {
        background: var(--border);
      }
    }

    &--update {
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
  transform: translateY(20px);
}

// 旋转动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式：移动端居中显示
@media (max-width: 480px) {
  .pwa-update-prompt {
    left: 20px;
    right: 20px;
    bottom: 20px;
    min-width: auto;
    max-width: none;
  }
}
</style>
