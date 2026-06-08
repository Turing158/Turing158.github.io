<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTheme, type ThemeName } from '@/composables/useTheme'
import { useI18n } from 'vue-i18n'

const { theme, setTheme, systemMode, systemLightTheme, systemDarkTheme, toggleSystemMode, setSystemLightTheme, setSystemDarkTheme } = useTheme()
const { t } = useI18n()

// 菜单显示状态
const showMenu = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// 亮色主题列表（不含 dark）
const lightThemes: { key: Exclude<ThemeName, 'dark'>; icon: string; labelKey: string }[] = [
  { key: 'forest', icon: '🌲', labelKey: 'theme.forest' },
  { key: 'ocean', icon: '🌊', labelKey: 'theme.ocean' },
  { key: 'sunset', icon: '🌅', labelKey: 'theme.sunset' },
]

// 暗色主题列表（目前仅暗蓝色）
const darkThemes: { key: ThemeName; icon: string; labelKey: string }[] = [
  { key: 'dark', icon: '🌙', labelKey: 'theme.dark' },
]

// 所有主题（普通模式用）
const allThemes: { key: ThemeName; icon: string; labelKey: string }[] = [
  ...lightThemes,
  { key: 'dark', icon: '🌙', labelKey: 'theme.dark' },
]

// 当前是否为暗色模式
const isDark = computed(() => theme.value === 'dark')

// 快速切换（点击在 forest 和 dark 之间切换）
function quickToggle() {
  if (theme.value === 'dark') {
    setTheme('forest')
  } else {
    setTheme('dark')
  }
}

// 切换菜单
function toggleMenu() {
  showMenu.value = !showMenu.value
}

// 关闭菜单
function closeMenu() {
  showMenu.value = false
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.theme-toggle')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="theme-toggle" ref="containerRef">
    <!-- 系统模式切换按钮 -->
    <button
      class="theme-toggle__btn theme-toggle__btn--system"
      :class="{ 'is-active': systemMode }"
      @click="toggleSystemMode"
      :aria-label="systemMode ? '关闭系统模式' : '开启系统模式'"
      :title="systemMode ? '关闭系统模式' : '开启系统模式'"
    >
      <svg class="system-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      <span class="system-label">{{ t('theme.system') }}</span>
    </button>

    <!-- 快速切换按钮（太阳/月亮） -->
    <button
      class="theme-toggle__btn theme-toggle__btn--switch"
      :class="{ 'is-dark': isDark }"
      @click="quickToggle"
      :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
      :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
    >
      <span class="theme-toggle__icon">
        <transition name="icon-fade" mode="out-in">
          <span v-if="isDark" class="icon moon" key="moon">🌙</span>
          <span v-else class="icon sun" key="sun">☀️</span>
        </transition>
      </span>
    </button>

    <!-- 主题选择器下拉 -->
    <div class="theme-toggle__dropdown">
      <button
        class="theme-toggle__btn theme-toggle__btn--selector"
        @click="toggleMenu"
        :aria-expanded="showMenu"
        aria-label="选择主题"
        title="选择主题"
      >
        <svg class="palette-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/>
          <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/>
          <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/>
          <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
      </button>

      <transition name="dropdown">
        <div v-if="showMenu" class="theme-toggle__menu">
          <!-- 系统模式下的亮色主题选择 -->
          <template v-if="systemMode">
            <div class="theme-toggle__section-header">{{ t('theme.systemLight') }}</div>
            <button
              v-for="item in lightThemes"
              :key="'light-' + item.key"
              class="theme-toggle__item"
              :class="{ 'is-active': systemLightTheme === item.key }"
              @click="setSystemLightTheme(item.key)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-label">{{ t(item.labelKey) }}</span>
              <svg v-if="systemLightTheme === item.key" class="item-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <div class="theme-toggle__divider"/>
            <div class="theme-toggle__section-header">{{ t('theme.systemDark') }}</div>
            <button
              v-for="item in darkThemes"
              :key="'dark-' + item.key"
              class="theme-toggle__item"
              :class="{ 'is-active': systemDarkTheme === item.key }"
              @click="setSystemDarkTheme(item.key)"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-label">{{ t(item.labelKey) }}</span>
              <svg v-if="systemDarkTheme === item.key" class="item-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </template>

          <!-- 普通模式：直接选择主题 -->
          <template v-else>
            <button
              v-for="item in allThemes"
              :key="item.key"
              class="theme-toggle__item"
              :class="{ 'is-active': theme === item.key }"
              @click="setTheme(item.key); closeMenu()"
            >
              <span class="item-icon">{{ item.icon }}</span>
              <span class="item-label">{{ t(item.labelKey) }}</span>
              <svg v-if="theme === item.key" class="item-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </template>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="less" scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 4px;

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;

    &:hover {
      background: var(--border);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    &--system {
      width: auto;
      height: 32px;
      padding: 0 10px;
      gap: 6px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid transparent;

      &:hover {
        background: var(--border);
        color: var(--text-primary);
      }

      &.is-active {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);

        &:hover {
          background: var(--accent-hover);
        }
      }
    }

    &--switch {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--toggle-bg);

      &:hover {
        background: var(--border-strong);
      }

      &.is-dark {
        background: #1e293b;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);

        &:hover {
          background: #334155;
        }
      }
    }

    &--selector {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }
  }

  &__system-icon {
    flex-shrink: 0;
  }

  &__system-label {
    white-space: nowrap;
    line-height: 1;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
  }

  &__dropdown {
    position: relative;
  }

  &__menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 6px;
    min-width: 140px;
    box-shadow: var(--shadow-strong);
    z-index: 1000;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: var(--bg-secondary);
    }

    &.is-active {
      color: var(--accent);
      background: var(--bg-secondary);
    }

    .item-icon {
      font-size: 16px;
      line-height: 1;
    }

    .item-label {
      flex: 1;
      text-align: left;
    }

    .item-check {
      color: var(--accent);
    }
  }

  &__section-header {
    padding: 6px 10px 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: default;
  }

  &__divider {
    height: 1px;
    margin: 4px 0;
    background: var(--border);
  }
}

// 图标切换动画
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.2s ease;
}

.icon-fade-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.icon-fade-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

// 下拉菜单动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
