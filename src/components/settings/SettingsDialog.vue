<!--
  设置中心（侧边栏底部四宫格「设置」按钮打开）

  设计要点：
  - 分组式设置行：左侧「图标 + 标题 + 说明」，右侧控件，窄屏自动换行堆叠
  - 控件一律用原生 input（radio / checkbox）+ label 包裹：单一命中区域、
    键盘方向键 / 空格直接可用、无障碍名称由 label 文本提供、无需自绘焦点管理
  - 遮罩类型带实时预览缩略图（迷你「页面 + 弹窗」示意图），不必关掉弹窗去试
  - 「恢复默认」为两步内联确认，避免误点直接抹掉全部偏好
-->
<template>
  <BlogDialog
    v-model="visible"
    :title="$t('settings.title')"
    width="680px"
    max-width="92vw"
    max-height="82vh"
  >
    <div class="settings-body">
      <!-- ── 外观与体验 ── -->
      <section class="settings-group">
        <h3 class="settings-group__title">{{ $t('settings.groupAppearance') }}</h3>

        <div class="settings-card">
          <!-- 语言 -->
          <div class="settings-row">
            <span class="settings-row__icon" aria-hidden="true">
              <SidebarIcon name="lang" :size="18" />
            </span>
            <div class="settings-row__text">
              <span id="set-language-label" class="settings-row__label">{{ $t('settings.language.label') }}</span>
              <span class="settings-row__desc">{{ $t('settings.language.desc') }}</span>
            </div>
            <div class="segmented" role="radiogroup" aria-labelledby="set-language-label">
              <label
                v-for="opt in languageOptions"
                :key="opt.value"
                class="segmented__item px-fade"
                :class="{ 'is-active': locale === opt.value }"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  name="settings-language"
                  :value="opt.value"
                  :checked="locale === opt.value"
                  @change="setLocale(opt.value)"
                />
                <span>{{ $t(opt.labelKey) }}</span>
              </label>
            </div>
          </div>

          <!-- 动画 -->
          <div class="settings-row">
            <span class="settings-row__icon" aria-hidden="true">
              <SidebarIcon :name="animationsEnabled ? 'animation' : 'animationOff'" :size="18" />
            </span>
            <div class="settings-row__text">
              <label class="settings-row__label" for="set-animations">{{ $t('settings.animation.label') }}</label>
              <span class="settings-row__desc">{{ $t('settings.animation.desc') }}</span>
            </div>
            <label class="switch">
              <input
                id="set-animations"
                class="visually-hidden"
                type="checkbox"
                :checked="animationsEnabled"
                @change="setAnimations(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch__track" aria-hidden="true"><span class="switch__knob" /></span>
              <span class="switch__state">
                {{ animationsEnabled ? $t('settings.stateOn') : $t('settings.stateOff') }}
              </span>
            </label>
          </div>

          <!-- 遮罩类型 -->
          <div class="settings-row settings-row--stacked">
            <span class="settings-row__icon" aria-hidden="true">
              <SidebarIcon name="layers" :size="18" />
            </span>
            <div class="settings-row__text">
              <span id="set-backdrop-label" class="settings-row__label">{{ $t('settings.backdrop.label') }}</span>
              <span class="settings-row__desc">{{ $t('settings.backdrop.desc') }}</span>
            </div>
            <div class="mask-grid" role="radiogroup" aria-labelledby="set-backdrop-label">
              <label
                v-for="opt in backdropOptions"
                :key="opt.value"
                class="mask-option px-fade"
                :class="{ 'is-active': dialogBackdrop === opt.value }"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  name="settings-backdrop"
                  :value="opt.value"
                  :checked="dialogBackdrop === opt.value"
                  @change="setDialogBackdrop(opt.value)"
                />
                <span class="mask-option__preview" :data-preview="opt.value" aria-hidden="true" />
                <span class="mask-option__label">{{ $t(opt.labelKey) }}</span>
              </label>
            </div>
          </div>

          <!-- 点击遮罩关闭 -->
          <div class="settings-row">
            <span class="settings-row__icon" aria-hidden="true">
              <SidebarIcon name="pointer" :size="18" />
            </span>
            <div class="settings-row__text">
              <label class="settings-row__label" for="set-close-overlay">{{ $t('settings.overlayClose.label') }}</label>
              <span class="settings-row__desc">{{ $t('settings.overlayClose.desc') }}</span>
            </div>
            <label class="switch">
              <input
                id="set-close-overlay"
                class="visually-hidden"
                type="checkbox"
                :checked="closeOnClickOverlay"
                @change="setCloseOnClickOverlay(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch__track" aria-hidden="true"><span class="switch__knob" /></span>
              <span class="switch__state">
                {{ closeOnClickOverlay ? $t('settings.stateOn') : $t('settings.stateOff') }}
              </span>
            </label>
          </div>
        </div>
      </section>

      <!-- ── 交互行为 ── -->
      <section class="settings-group">
        <h3 class="settings-group__title">{{ $t('settings.groupInteraction') }}</h3>

        <div class="settings-card">
          <!-- 工具点击操作 -->
          <fieldset class="settings-fieldset">
            <legend class="settings-legend">
              <SidebarIcon name="tools" :size="16" />
              <span>{{ $t('settings.toolClick.label') }}</span>
            </legend>
            <p class="settings-row__desc">{{ $t('settings.toolClick.desc') }}</p>
            <div class="choice-list">
              <label
                v-for="opt in toolClickOptions"
                :key="opt.value"
                class="choice"
                :class="{ 'is-active': toolClickAction === opt.value }"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  name="settings-tool-click"
                  :value="opt.value"
                  :checked="toolClickAction === opt.value"
                  @change="setToolClickAction(opt.value)"
                />
                <span class="choice__mark" aria-hidden="true" />
                <span class="choice__label">{{ $t(opt.labelKey) }}</span>
                <span class="choice__desc">{{ $t(opt.descKey) }}</span>
              </label>
            </div>
          </fieldset>

          <!-- 搜索点击操作 -->
          <fieldset class="settings-fieldset settings-fieldset--divided">
            <legend class="settings-legend">
              <SidebarIcon name="search" :size="16" />
              <span>{{ $t('settings.searchClick.label') }}</span>
            </legend>
            <p class="settings-row__desc">{{ $t('settings.searchClick.desc') }}</p>
            <div class="choice-list">
              <label
                v-for="opt in searchClickOptions"
                :key="opt.value"
                class="choice"
                :class="{ 'is-active': searchClickAction === opt.value }"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  name="settings-search-click"
                  :value="opt.value"
                  :checked="searchClickAction === opt.value"
                  @change="setSearchClickAction(opt.value)"
                />
                <span class="choice__mark" aria-hidden="true" />
                <span class="choice__label">{{ $t(opt.labelKey) }}</span>
                <span class="choice__desc">{{ $t(opt.descKey) }}</span>
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      <!-- ── 应用 ── -->
      <section class="settings-group">
        <h3 class="settings-group__title">{{ $t('settings.groupApp') }}</h3>

        <div class="settings-card">
          <div class="settings-row">
            <span class="settings-row__icon" aria-hidden="true">
              <SidebarIcon name="download" :size="18" />
            </span>
            <div class="settings-row__text">
              <span class="settings-row__label">{{ $t('settings.pwa.label') }}</span>
              <span class="settings-row__desc">{{ pwaHint }}</span>
            </div>
            <span v-if="isInstalled" class="settings-badge">
              <SidebarIcon name="check" :size="14" />
              {{ $t('settings.pwa.installed') }}
            </span>
            <button
              v-else
              class="settings-btn settings-btn--primary px-fade"
              type="button"
              :disabled="!canInstall || isInstalling"
              @click="handleInstall"
            >
              <SidebarIcon name="download" :size="15" />
              {{ isInstalling ? $t('settings.pwa.installing') : $t('settings.pwa.install') }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="settings-footer">
        <button
          class="settings-btn settings-btn--ghost px-fade"
          type="button"
          :disabled="!dirty"
          @click="onResetClick"
        >
          {{ confirmingReset ? $t('settings.resetConfirm') : $t('settings.reset') }}
        </button>
        <button class="settings-btn settings-btn--primary px-fade" type="button" @click="visible = false">
          {{ $t('settings.done') }}
        </button>
      </div>
    </template>
  </BlogDialog>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogDialog from '@/components/common/BlogDialog.vue'
import SidebarIcon from '@/components/sidebar/SidebarIcon.vue'
import BlogTip from '@/plugins/blog-tip'
import { setLocale } from '@/i18n'
import { useAnimations } from '@/composables/useAnimations'
import { usePwaInstall } from '@/composables/usePwaInstall'
import {
  useSettings,
  type DialogBackdrop,
  type SearchClickAction,
  type ToolClickAction,
} from '@/composables/useSettings'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const { t, locale } = useI18n()

const { animationsEnabled, setAnimations } = useAnimations()
const {
  closeOnClickOverlay,
  dialogBackdrop,
  toolClickAction,
  searchClickAction,
  setCloseOnClickOverlay,
  setDialogBackdrop,
  setToolClickAction,
  setSearchClickAction,
  resetSettings,
  isDirty,
} = useSettings()

const { isInstalled, isInstalling, canInstall, isIos, installApp } = usePwaInstall()

// ── 选项表 ──
const languageOptions = [
  { value: 'zh-CN', labelKey: 'settings.language.zh' },
  { value: 'en-US', labelKey: 'settings.language.en' },
] as const

const backdropOptions: { value: DialogBackdrop; labelKey: string }[] = [
  { value: 'blur', labelKey: 'settings.backdrop.blur' },
  { value: 'dim', labelKey: 'settings.backdrop.dim' },
  { value: 'light', labelKey: 'settings.backdrop.light' },
  { value: 'none', labelKey: 'settings.backdrop.none' },
]

const toolClickOptions: { value: ToolClickAction; labelKey: string; descKey: string }[] = [
  { value: 'dialog', labelKey: 'settings.toolClick.dialog', descKey: 'settings.toolClick.dialogDesc' },
  { value: 'newTab', labelKey: 'settings.toolClick.newTab', descKey: 'settings.toolClick.newTabDesc' },
  { value: 'samePage', labelKey: 'settings.toolClick.samePage', descKey: 'settings.toolClick.samePageDesc' },
]

const searchClickOptions: { value: SearchClickAction; labelKey: string; descKey: string }[] = [
  { value: 'samePage', labelKey: 'settings.searchClick.samePage', descKey: 'settings.searchClick.samePageDesc' },
  { value: 'newTab', labelKey: 'settings.searchClick.newTab', descKey: 'settings.searchClick.newTabDesc' },
]

// ── PWA 状态说明：已安装 > 可安装 > iOS 手动路径 > 不支持 ──
const pwaHint = computed(() => {
  if (isInstalled.value) return t('settings.pwa.installedDesc')
  if (canInstall.value) return t('settings.pwa.descCanInstall')
  if (isIos) return t('settings.pwa.iosHint')
  return t('settings.pwa.unavailable')
})

async function handleInstall() {
  const outcome = await installApp()
  if (outcome === 'accepted') {
    BlogTip.show(t('settings.pwa.installSuccess'), { type: 'success' })
  } else if (outcome === 'dismissed') {
    BlogTip.show(t('settings.pwa.installDismissed'), { type: 'info' })
  } else {
    BlogTip.show(t('settings.pwa.installFailed'), { type: 'warning' })
  }
}

// ── 恢复默认：两步内联确认（4 秒内未再点击自动撤销）──
const confirmingReset = ref(false)
const dirty = computed(() => isDirty())
let resetTimer: ReturnType<typeof setTimeout> | null = null

function clearResetTimer() {
  if (resetTimer !== null) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

function onResetClick() {
  if (!confirmingReset.value) {
    confirmingReset.value = true
    clearResetTimer()
    resetTimer = setTimeout(() => {
      confirmingReset.value = false
      resetTimer = null
    }, 4000)
    return
  }
  clearResetTimer()
  confirmingReset.value = false
  resetSettings()
  BlogTip.show(t('settings.resetDone'), { type: 'success' })
}

// 关闭弹窗时收掉未完成的确认态，避免下次打开还停在「确认恢复？」
watch(visible, (open) => {
  if (!open) {
    clearResetTimer()
    confirmingReset.value = false
  }
})

onUnmounted(clearResetTimer)
</script>

<style lang="less" scoped>
/* 视觉上隐藏但保留可聚焦 / 可被读屏识别（键盘 Tab 与方向键操作依赖它） */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-group__title {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.settings-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  --pxs: 3px;
  clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  padding: 4px;
}

/* ── 设置行 ── */
.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  min-height: 56px;

  & + .settings-row {
    border-top: 1px solid var(--border);
  }

  &--stacked {
    flex-wrap: wrap;
  }
}

.settings-row__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--bg-card);
  --pxs: 2px;
  clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  color: var(--accent);
}

.settings-row__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.settings-row__label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-row__desc {
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* ── 语言：分段控件 ── */
.segmented {
  display: flex;
  gap: 4px;
  padding: 4px;
  flex-shrink: 0;
  background: var(--bg-card);
  --pxs: 3px;
  clip-path: var(--pxc);
}

.segmented__item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  --pxs: 2px;
  clip-path: var(--pxc);
  /* 本项无 border，px-fade 叠加层必须同步取 0：该值需等于宿主 border 宽度，
     默认 1px 会让叠加层比宿主大 1px，与宿主切角错位、hover 时四角帧被 clip-path 啃掉 */
  --px-fade-inset: 0px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  &.is-active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    /* 负偏移把焦点环画在盒内：这些控件都带 clip-path 切角，正偏移的环会被裁掉 */
    outline-offset: -2px;
  }
}

/* ── 开关 ── */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 4px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch__track {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
  background: var(--toggle-bg);
  --pxs: 3px;
  clip-path: var(--pxc);
  transition: background-color 0.25s ease;
}

.switch__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: var(--toggle-knob);
  --pxs: 2px;
  clip-path: var(--pxc);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.switch__state {
  min-width: 2.6em;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.switch input:checked + .switch__track {
  background: var(--toggle-active);
}

.switch input:checked + .switch__track .switch__knob {
  transform: translateX(22px);
}

.switch input:focus-visible + .switch__track {
  outline: 2px solid var(--accent);
  /* 负偏移把焦点环画在盒内：轨道带 clip-path 切角，正偏移的环会被裁掉 */
  outline-offset: -2px;
}

/* ── 遮罩类型：带预览的选项格 ── */
.mask-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  flex-basis: 100%;
}

.mask-option {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  cursor: pointer;
  background: var(--bg-card);
  --pxs: 2px;
  clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--bg-card-hover);
  }

  &.is-active {
    background: color-mix(in srgb, var(--accent) 16%, var(--bg-card));
  }

  &.is-active .mask-option__label {
    color: var(--text-primary);
    font-weight: 600;
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    /* 负偏移把焦点环画在盒内：这些控件都带 clip-path 切角，正偏移的环会被裁掉 */
    outline-offset: -2px;
  }
}

/* 迷你示意图：底层当作「页面」，::before 是遮罩，::after 是遮罩之上的弹窗。
   底层刻意画上「假正文」横条 —— 纯色背景下 backdrop-filter 看不出差别，
   有内容可糊，模糊 / 淡色 两种取值才演示得出来 */
.mask-option__preview {
  position: relative;
  display: block;
  height: 46px;
  overflow: hidden;
  background-color: var(--bg-primary);
  background-image: repeating-linear-gradient(
    to bottom,
    color-mix(in srgb, var(--text-secondary) 40%, transparent) 0 2px,
    transparent 2px 9px
  );
  background-size: calc(100% - 12px) 100%;
  background-position: 6px 0;
  background-repeat: no-repeat;
  --pxs: 2px;
  clip-path: var(--pxc);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
  }

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 52%;
    height: 46%;
    transform: translate(-50%, -50%);
    background: var(--bg-card);
    box-shadow: 0 0 0 1px var(--border-strong);
  }
}

/* 四种遮罩取值 —— 与 BlogDialog 遮罩层的实际样式保持一致 */
.mask-option__preview[data-preview='blur']::before {
  background: color-mix(in srgb, var(--text-primary) 35%, transparent);
  backdrop-filter: blur(4px);
}

.mask-option__preview[data-preview='dim']::before {
  background: rgba(0, 0, 0, 0.62);
}

.mask-option__preview[data-preview='light']::before {
  background: color-mix(in srgb, var(--bg-card) 60%, transparent);
  backdrop-filter: blur(2px);
}

.mask-option__preview[data-preview='none']::before {
  background: transparent;
}

.mask-option__label {
  font-size: 0.76rem;
  text-align: center;
  color: var(--text-secondary);
}

/* ── 单选列表（工具 / 搜索点击操作）── */
.settings-fieldset {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: none;

  &--divided {
    border-top: 1px solid var(--border);
  }
}

.settings-legend {
  /* 浮动使 legend 进入 fieldset 的内边距区域，避免标题悬在卡片顶边或分隔线上。 */
  float: left;
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin: 0 0 6px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-fieldset > .settings-row__desc {
  clear: both;
}

/* ── 单选列表（工具 / 搜索点击操作）──
   一组只用一个列表，不再逐项套边框：区块卡本身已有帧，再套 2~3 层框会又重又空。
   标签与说明同排分列（标签定宽成列、说明占余下宽度），选中态由「标记填充 + 淡底」
   两重提示表达，不只靠颜色 */
.choice-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 负外距抵消行内左右 padding：行内容与上面的图例文字左对齐，
     而 hover / 选中底色能铺满整行宽度，读起来仍是一条列表 */
  margin: 6px -10px 0;
}

.choice {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 8px 10px;
  cursor: pointer;
  background: transparent;
  --pxs: 2px;
  /* 圆心孔的填色：必须始终等于行底，否则选中/悬停时会露出一块硬色斑 */
  --mark-hole: var(--bg-secondary);
  clip-path: var(--pxc);
  transition: background-color 0.18s ease;

  &:hover {
    /* 区块卡底色就是 --bg-secondary，hover 必须用 --bg-card 才看得出反馈 */
    background: var(--bg-card);
    --mark-hole: var(--bg-card);
  }

  &.is-active {
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-card));
    --mark-hole: color-mix(in srgb, var(--accent) 12%, var(--bg-card));
  }

  &:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    /* 负偏移把焦点环画在盒内：这些控件都带 clip-path 切角，正偏移的环会被裁掉 */
    outline-offset: -2px;
  }
}

/* 自绘单选标记：16px 同心像素圆，由 20 格圆方程采样结果等比缩放（见 variables.css）。
   三层同心：本体画环、::before 盖内孔、::after 画中心点。
   clip-path 挖不出真空，内孔只能靠「与行底同色」的 ::before 盖出来，
   所以 --mark-hole 必须随 .choice 的三种底色同步变化（见上）。
   选中环用 --accent-hover 而非 --accent：后者在浅色主题下与行底仅 2.9~3.1:1，
   达不到 WCAG 1.4.11 要求的 3:1，深一档后为 3.9~5.2:1。 */
.choice__mark {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  background: var(--text-secondary);
  clip-path: var(--pxc-radio);
  transition: background-color 0.18s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--mark-hole);
    clip-path: var(--pxc-radio-in);
    transition: background-color 0.18s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--accent-hover);
    clip-path: var(--pxc-radio-dot);
    opacity: 0;
    transition: opacity 0.16s ease;
  }
}

/* 悬停时环转强调色，作为「可点」的即时反馈。
   这里【不能】用 --text-primary：它在浅色主题下对比度高达 12:1（近黑），
   会比选中环 --accent-hover（约 4.5:1）更"重"，悬停反而比选中更抢眼，
   视觉层级倒置。用 --accent 则形成「灰环 → 绿色环 → 绿色环+圆点」的递进。 */
.choice:hover .choice__mark {
  background: var(--accent);
}

.choice.is-active .choice__mark {
  background: var(--accent-hover);

  &::after {
    opacity: 1;
  }
}

/* 选中行左侧竖条：颜色之外的第二重提示（色弱用户也能分辨选中项） */
.choice.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 4px;
  background: var(--accent-hover);
}

/* 标签定宽成列，说明紧随其后占余下宽度：所有选项的说明左边缘对齐，读起来是一列 */
.choice__label {
  flex: 0 0 auto;
  min-width: 4.8em;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-primary);
}

.choice__desc {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

/* ── 按钮 / 徽标 ── */
.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 16px;
  flex-shrink: 0;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-card);
  --pxs: 3px;
  clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;

  &:focus-visible {
    outline: 2px solid var(--accent);
    /* 负偏移把焦点环画在盒内：这些控件都带 clip-path 切角，正偏移的环会被裁掉 */
    outline-offset: -2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--accent);
    color: #fff;

    &:hover:not(:disabled) {
      background: var(--accent-hover);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--text-secondary);
    /* 边框沿用基类的像素帧，不用 box-shadow 环：直角矩形环被 clip-path 切角后四角会缺一块 */

    &:hover:not(:disabled) {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
}

.settings-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  --pxs: 2px;
  clip-path: var(--pxc);
}

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* ── 窄屏：设置行换行堆叠，遮罩选项两列 ── */
@media (max-width: 560px) {
  .settings-row {
    flex-wrap: wrap;
  }

  .segmented,
  .switch {
    width: 100%;
  }

  .segmented__item {
    flex: 1;
  }

  .mask-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* 窄屏装不下一行：说明换到第二行，缩进到与标签左对齐（标记宽 16 + 间距 10） */
  .choice {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .choice__desc {
    flex: 1 1 100%;
    padding-left: 26px;
  }

  .settings-footer {
    flex-direction: column;
  }

  .settings-btn {
    width: 100%;
  }
}
</style>
