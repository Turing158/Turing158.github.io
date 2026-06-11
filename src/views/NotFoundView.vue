<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <!-- 404 图标 -->
      <div class="not-found-icon">
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
      <h1 class="not-found-code">404</h1>

      <!-- 错误标题 -->
      <h2 class="not-found-title">{{ $t('notFound.title') }}</h2>

      <!-- 错误描述 -->
      <p class="not-found-description">{{ $t('notFound.description') }}</p>

      <!-- 操作按钮 -->
      <div class="not-found-actions">
        <Button type="primary" class="not-found-btn" @click="goHome">
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
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {{ $t('notFound.goHome') }}
        </Button>
        <Button class="not-found-btn not-found-btn--secondary" @click="goBack">
          {{ $t('notFound.goBack') }}
        </Button>
      </div>

      <!-- 推荐链接 -->
      <div class="not-found-suggestions">
        <p class="suggestions-title">{{ $t('notFound.suggestions') }}</p>
        <ul class="suggestions-list">
          <li>
            <router-link to="/articles" class="suggestion-link">
              {{ $t('notFound.viewArticles') }}
            </router-link>
          </li>
          <li>
            <router-link to="/projects" class="suggestion-link">
              {{ $t('notFound.viewProjects') }}
            </router-link>
          </li>
          <li>
            <router-link to="/about" class="suggestion-link">
              {{ $t('notFound.aboutMe') }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="not-found-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import { updateDocumentTitle } from '@/router'

const router = useRouter()

// 更新页面标题
updateDocumentTitle('页面未找到')

// 返回首页
function goHome() {
  router.push('/')
}

// 返回上一页
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style lang="less" scoped>
.not-found-view {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 480px;
}

.not-found-icon {
  margin: 0 auto 24px;
  color: var(--text-secondary);
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.not-found-code {
  font-size: 96px;
  font-weight: 900;
  line-height: 1;
  margin: 0 0 16px;
  color: var(--accent);
  opacity: 0.8;
  letter-spacing: -2px;
}

.not-found-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.not-found-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 32px;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 40px;
}

.not-found-btn {
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

.not-found-suggestions {
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.suggestions-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 16px;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.suggestion-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.25s ease;
  border: 1px solid var(--border);

  &:hover {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent);
  }
}

// 装饰元素
.not-found-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: var(--accent);
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  left: 20%;
  animation: float 7s ease-in-out infinite;
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

// 响应式
@media (max-width: 480px) {
  .not-found-code {
    font-size: 72px;
  }

  .not-found-title {
    font-size: 1.5rem;
  }

  .not-found-actions {
    flex-direction: column;
  }

  .not-found-btn {
    width: 100%;
    justify-content: center;
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .not-found-icon,
  .floating-shape {
    animation: none;
  }
}
</style>
