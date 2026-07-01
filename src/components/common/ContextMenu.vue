<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="visible"
        class="context-menu"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
        @contextmenu.stop
      >
        <!-- 品牌标识（无功能） -->
        <div class="context-menu-brand">
          <span class="brand-text">Turing_ICE</span>
        </div>

        <div v-if="!sidebarOnly" class="context-menu-divider"></div>

        <!-- 上下文菜单项（由各页面注册） -->
        <button
          v-for="item in contextItems"
          :key="item.id"
          class="context-menu-item"
          :class="{ 'context-menu-item--danger': item.danger }"
          @click="handleItemClick(item)"
        >
          <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg>
          <span class="item-label">{{ item.label }}</span>
        </button>

        <!-- 复制文本（仅当选中文本时显示，侧边栏右键不显示） -->
        <button
          v-if="selectedText && !sidebarOnly"
          class="context-menu-item"
          @click="copyText"
        >
          <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span class="item-label">{{ t('contextMenu.copyText') }}</span>
        </button>

        <!-- 返回上一页（始终在最后，侧边栏右键不显示） -->
        <button v-if="!sidebarOnly" class="context-menu-item" @click="goBack">
          <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span class="item-label">{{ t('contextMenu.goBack') }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useContextMenu } from '@/composables/useContextMenu'
import { useI18n } from 'vue-i18n'
import type { ContextMenuItem } from '@/composables/contextMenuRegistry'

const { t } = useI18n()
const { visible, x, y, selectedText, contextItems, sidebarOnly, goBack, copyText, hide } = useContextMenu()

function handleItemClick(item: ContextMenuItem) {
  item.action()
  hide()
}
</script>

<style lang="less" scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--shadow-strong), 0 2px 8px var(--shadow);
  backdrop-filter: blur(12px);
  user-select: none;
}

/* ── 品牌标识 ── */
.context-menu-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px 8px;
}

.brand-text {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--accent);
  opacity: 0.8;
  cursor: default;
  display: inline-block;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  transform-origin: center center;

  &:hover {
    opacity: 1;
    transform: scale(1.18) rotate(-3deg);
  }
}

/* ── 分割线 ── */
.context-menu-divider {
  height: 1px;
  margin: 4px 10px;
  background: var(--border);
  border-radius: 1px;
}

/* ── 菜单项 ── */
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--accent);
    color: #fff;

    .item-icon {
      stroke: #fff;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &--danger:hover {
    background: #e53e3e;
    color: #fff;

    .item-icon {
      stroke: #fff;
    }
  }
}

.item-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  stroke: var(--text-secondary);
  transition: stroke 0.15s ease;
}

.item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 入场 / 离场动画 ── */
.context-menu-enter-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.context-menu-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.context-menu-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}

.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .brand-text {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
