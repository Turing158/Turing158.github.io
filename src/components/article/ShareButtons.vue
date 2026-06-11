<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title: string
  description?: string
  url?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  url: '',
})

const emit = defineEmits<{
  share: [platform: string]
}>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 生成分享链接
const shareUrl = computed(() => {
  if (props.url) return props.url
  if (typeof window !== 'undefined') return window.location.href
  return ''
})

// 微信分享链接（使用二维码API）
const wechatShareUrl = computed(() => {
  const encodedUrl = encodeURIComponent(shareUrl.value)
  // 使用草料二维码API生成二维码
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`
})

// 微博分享链接
const weiboShareUrl = computed(() => {
  const params = new URLSearchParams({
    url: shareUrl.value,
    title: props.title,
  })
  return `https://service.weibo.com/share/share.php?${params.toString()}`
})

// Twitter/X 分享链接
const twitterShareUrl = computed(() => {
  const params = new URLSearchParams({
    url: shareUrl.value,
    text: props.title,
  })
  return `https://twitter.com/intent/tweet?${params.toString()}`
})

// 复制链接到剪贴板
async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true

    // 清除之前的定时器
    if (copyTimer) {
      clearTimeout(copyTimer)
    }

    // 2秒后重置状态
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)

    emit('share', 'copy')
  } catch (err) {
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl.value
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    copied.value = true
    if (copyTimer) {
      clearTimeout(copyTimer)
    }
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)

    emit('share', 'copy')
  }
}

// 打开分享窗口
function openShareWindow(url: string, platform: string) {
  const width = 600
  const height = 400
  const left = (window.innerWidth - width) / 2
  const top = (window.innerHeight - height) / 2

  window.open(
    url,
    `share-${platform}`,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
  )

  emit('share', platform)
}

// 分享到微信（显示二维码弹窗）
const showWechatQr = ref(false)

function openWechatShare() {
  showWechatQr.value = true
}

function closeWechatQr() {
  showWechatQr.value = false
}

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'

onUnmounted(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
  }
})
</script>

<template>
  <div class="share-buttons">
    <span class="share-label">分享文章</span>
    <div class="share-icons">
      <!-- 复制链接 -->
      <button
        class="share-btn share-btn--copy"
        :class="{ 'share-btn--copied': copied }"
        :title="copied ? '已复制' : '复制链接'"
        @click="copyLink"
      >
        <svg v-if="!copied" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="share-btn__tooltip">{{ copied ? '已复制' : '复制链接' }}</span>
      </button>

      <!-- 微信分享 -->
      <button
        class="share-btn share-btn--wechat"
        title="分享到微信"
        @click="openWechatShare"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-7 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          <path d="M9.5 2C5.36 2 2 4.91 2 8.5c0 1.93.96 3.66 2.47 4.87L4 15.5l2.5-1.11c.9.35 1.9.56 2.97.6-.03-.16-.03-.32-.03-.49 0-3.31 3.13-6 7-6 .34 0 .67.02 1 .06C16.77 5.67 13.45 2 9.5 2zm6.5 7c-3.31 0-6 2.24-6 5s2.69 5 6 5c.78 0 1.53-.14 2.22-.4L20 20l-.6-2.1C20.4 16.83 21 15.5 21 14c0-2.76-2.69-5-6-5z"/>
        </svg>
        <span class="share-btn__tooltip">微信</span>
      </button>

      <!-- 微博分享 -->
      <button
        class="share-btn share-btn--weibo"
        title="分享到微博"
        @click="openShareWindow(weiboShareUrl, 'weibo')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.405-.649.381-1.017.421-1.896-.009-2.52-.397-.576-1.27-.576-2.128-.576h-.012c-2.173 0-3.988 1.331-3.988 3.119 0 .197.021.387.061.569-.168.053-.342.112-.524.179-.776.283-1.357.646-1.357 1.235 0 .144.039.275.117.393.281.427 1.158.576 1.938.576.291 0 .593-.019.895-.056.543-.068 1.071-.169 1.492-.304.387-.124.816-.069 1.178.155.362.224.544.627.544 1.098 0 .706-.407 1.275-1.051 1.667-.645.393-1.479.629-2.329.629-1.496 0-2.873-.569-3.709-1.404-.836-.834-1.254-1.927-1.254-3.019 0-2.257 2.09-4.089 4.65-4.089 2.558 0 4.648 1.832 4.648 4.089 0 .45-.074.887-.215 1.306z"/>
        </svg>
        <span class="share-btn__tooltip">微博</span>
      </button>

      <!-- Twitter/X 分享 -->
      <button
        class="share-btn share-btn--twitter"
        title="分享到 Twitter/X"
        @click="openShareWindow(twitterShareUrl, 'twitter')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span class="share-btn__tooltip">X</span>
      </button>
    </div>

    <!-- 微信二维码弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showWechatQr" class="qr-overlay" @click="closeWechatQr">
          <div class="qr-modal" @click.stop>
            <div class="qr-header">
              <h3>微信扫码分享</h3>
              <button class="qr-close" @click="closeWechatQr" aria-label="关闭">
                &times;
              </button>
            </div>
            <div class="qr-body">
              <img :src="wechatShareUrl" alt="微信分享二维码" class="qr-code" />
              <p class="qr-tip">使用微信扫描二维码分享</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="less" scoped>
.share-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  border-top: 1px solid var(--border);
  margin-top: 32px;
}

.share-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.share-icons {
  display: flex;
  gap: 8px;
}

.share-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }

  &:active {
    transform: translateY(0);
  }

  // 复制链接
  &--copy {
    &:hover {
      background: var(--accent);
      color: #fff;
    }

    &--copied {
      background: var(--accent);
      color: #fff;
    }
  }

  // 微信
  &--wechat {
    &:hover {
      background: #07c160;
      color: #fff;
    }
  }

  // 微博
  &--weibo {
    &:hover {
      background: #e6162d;
      color: #fff;
    }
  }

  // Twitter/X
  &--twitter {
    &:hover {
      background: #000;
      color: #fff;
    }
  }

  &__tooltip {
    position: absolute;
    bottom: -32px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: var(--text-primary);
    color: var(--bg-primary);
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    border-radius: 4px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    pointer-events: none;

    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 4px solid var(--text-primary);
    }
  }

  &:hover &__tooltip {
    opacity: 1;
    visibility: visible;
    bottom: -28px;
  }
}

// 二维码弹窗
.qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.qr-modal {
  background: var(--bg-card);
  border-radius: 16px;
  width: 320px;
  max-width: 90vw;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-in 0.3s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.qr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.qr-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  color: var(--text-secondary);
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

.qr-body {
  padding: 24px;
  text-align: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.qr-tip {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
