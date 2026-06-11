<template>
  <div class="error-view">
    <div class="error-content">
      <!-- 500 图标 -->
      <div class="error-icon">
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
            fill="currentColor"
          />
        </svg>
      </div>

      <!-- 错误代码 -->
      <h1 class="error-code">500</h1>

      <!-- 错误标题 -->
      <h2 class="error-title">{{ $t('error.title') }}</h2>

      <!-- 错误描述 -->
      <p class="error-description">{{ $t('error.description') }}</p>

      <!-- 错误信息（如果有） -->
      <div v-if="errorMessage" class="error-message">
        <details>
          <summary>{{ $t('error.showDetails') }}</summary>
          <pre>{{ errorMessage }}</pre>
        </details>
      </div>

      <!-- 操作按钮 -->
      <div class="error-actions">
        <Button type="primary" class="error-btn" @click="retry">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
          {{ $t('error.retry') }}
        </Button>
        <Button class="error-btn error-btn--secondary" @click="goHome">
          {{ $t('error.goHome') }}
        </Button>
      </div>

      <!-- 帮助信息 -->
      <div class="error-help">
        <p class="help-text">
          {{ $t('error.helpText') }}
          <a href="mailto:support@example.com" class="help-link">
            {{ $t('error.contactSupport') }}
          </a>
        </p>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="error-decoration">
      <div class="gear gear-1">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
          />
        </svg>
      </div>
      <div class="gear gear-2">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
          />
        </svg>
      </div>
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from 'animal-island-vue'
import { updateDocumentTitle } from '@/router'

const router = useRouter()
const route = useRoute()

// 错误信息
const errorMessage = ref('')

// 更新页面标题
updateDocumentTitle('服务器错误')

// 从路由参数获取错误信息
onMounted(() => {
  if (route.params.message) {
    errorMessage.value = route.params.message as string
  } else if (route.query.message) {
    errorMessage.value = route.query.message as string
  }
})

// 重试
function retry() {
  window.location.reload()
}

// 返回首页
function goHome() {
  router.push('/')
}
</script>

<style lang="less" scoped>
.error-view {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
  overflow: hidden;
}

.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 480px;
}

.error-icon {
  margin: 0 auto 24px;
  color: var(--text-secondary);
  opacity: 0.6;
  animation: shake 0.5s ease-in-out;
}

.error-code {
  font-size: 96px;
  font-weight: 900;
  line-height: 1;
  margin: 0 0 16px;
  color: var(--accent);
  opacity: 0.8;
  letter-spacing: -2px;
}

.error-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.error-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 24px;
  line-height: 1.6;
}

.error-message {
  margin-bottom: 24px;
  text-align: left;

  details {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  pre {
    margin: 0;
    padding: 12px;
    background: var(--code-bg);
    border-radius: 4px;
    font-size: 0.85rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--text-secondary);
  }
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.25s ease;

  &--secondary {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border);

    &:hover {
      background: var(--border);
      color: var(--text-primary);
    }
  }
}

.error-help {
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.help-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.help-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: var(--accent-hover);
    text-decoration: underline;
  }
}

// 装饰元素
.error-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.gear {
  position: absolute;
  color: var(--accent);
  opacity: 0.05;

  svg {
    width: 100%;
    height: 100%;
  }
}

.gear-1 {
  top: 10%;
  right: 10%;
  animation: rotate 20s linear infinite;
}

.gear-2 {
  bottom: 20%;
  left: 5%;
  animation: rotate 15s linear infinite reverse;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: var(--accent);
}

.shape-1 {
  width: 250px;
  height: 250px;
  top: -80px;
  left: -80px;
  animation: float 8s ease-in-out infinite;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: -40px;
  right: 20%;
  animation: float 6s ease-in-out infinite reverse;
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-10px);
  }
  40% {
    transform: translateX(10px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

// 响应式
@media (max-width: 480px) {
  .error-code {
    font-size: 72px;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-btn {
    width: 100%;
    justify-content: center;
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .error-icon,
  .gear,
  .floating-shape {
    animation: none;
  }
}
</style>
