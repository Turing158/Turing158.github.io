<script setup lang="ts">
import { ref } from 'vue'

const isRetrying = ref(false)

// 重试连接
async function retryConnection() {
  isRetrying.value = true

  // 短暂延迟以显示加载状态
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 检查网络状态
  if (navigator.onLine) {
    // 在线，刷新页面
    window.location.reload()
  } else {
    // 仍然离线
    isRetrying.value = false
  }
}
</script>

<template>
  <div class="pwa-offline-page">
    <div class="pwa-offline-page__content">
      <!-- 离线图标 -->
      <div class="pwa-offline-page__icon">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M23.64 7c-.45-.34-4.93-4-11.64-4-1.5 0-2.89.19-4.15.48L18.18 13.8 23.64 7zm-6.6 8.22L3.27 1.44 2 2.72l2.05 2.06C1.91 5.17 1.5 5.51 1.5 5.51S1.42 5.59 1 9l2.06 2.06c.03.02.05.04.08.06L11 19l1.5-1.5 1.41 1.41L11 22l3.5-3.5 1.41 1.41L11 24l5.5-5.5-1.41-1.41L18.18 13.8l3.86 3.86 1.27-1.27-3.86-3.86z"
            fill="currentColor"
          />
        </svg>
      </div>

      <!-- 标题 -->
      <h1 class="pwa-offline-page__title">您当前处于离线状态</h1>

      <!-- 描述 -->
      <p class="pwa-offline-page__description">
        请检查您的网络连接，然后重试
      </p>

      <!-- 重试按钮 -->
      <button
        class="pwa-offline-page__retry-btn"
        :disabled="isRetrying"
        @click="retryConnection"
      >
        <svg
          v-if="isRetrying"
          class="pwa-offline-page__spinner"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ isRetrying ? '重试中...' : '重新连接' }}</span>
      </button>

      <!-- 提示信息 -->
      <p class="pwa-offline-page__hint">
        提示：已缓存的内容仍然可以访问
      </p>
    </div>

    <!-- 装饰元素 -->
    <div class="pwa-offline-page__decoration">
      <div class="pwa-offline-page__circle pwa-offline-page__circle--1"></div>
      <div class="pwa-offline-page__circle pwa-offline-page__circle--2"></div>
      <div class="pwa-offline-page__circle pwa-offline-page__circle--3"></div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.pwa-offline-page {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 24px;
  overflow: hidden;

  &__content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 400px;
  }

  &__icon {
    margin: 0 auto 24px;
    color: var(--text-secondary);
    opacity: 0.6;
    animation: float 3s ease-in-out infinite;
  }

  &__title {
    margin: 0 0 12px;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__description {
    margin: 0 0 32px;
    font-size: 16px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  &__retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 32px;
    border: none;
    border-radius: 12px;
    background: var(--accent);
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-strong);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  &__hint {
    margin: 24px 0 0;
    font-size: 14px;
    color: var(--text-secondary);
    opacity: 0.7;
  }

  &__decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;

    &--1 {
      width: 300px;
      height: 300px;
      background: var(--accent);
      top: -100px;
      right: -100px;
      animation: float 6s ease-in-out infinite;
    }

    &--2 {
      width: 200px;
      height: 200px;
      background: var(--accent);
      bottom: -50px;
      left: -50px;
      animation: float 8s ease-in-out infinite reverse;
    }

    &--3 {
      width: 150px;
      height: 150px;
      background: var(--accent);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 4s ease-in-out infinite;
    }
  }
}

// 动画
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.15;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

// 响应式
@media (max-width: 480px) {
  .pwa-offline-page {
    &__title {
      font-size: 20px;
    }

    &__description {
      font-size: 14px;
    }

    &__retry-btn {
      padding: 12px 24px;
      font-size: 14px;
    }
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .pwa-offline-page {
    &__icon,
    &__circle {
      animation: none;
    }

    &__spinner {
      animation: spin 2s linear infinite;
    }
  }
}
</style>
