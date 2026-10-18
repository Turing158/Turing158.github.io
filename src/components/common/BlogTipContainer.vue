<template>
  <div
    ref="stackRef"
    class="blog-tip-stack"
    aria-live="polite"
    aria-relevant="additions"
  >
    <div
      v-for="tip in tips"
      :key="tip.id"
      class="blog-tip"
      :class="[
        `blog-tip--${tip.type}`,
        {
          'is-leaving': tip.leaving,
          'is-open': tip.opened,
          'is-peek': tip.peeking,
          'is-hidden': tip.hidden,
        },
      ]"
      :style="{
        '--depth': tip.depth,
        '--z': 200 - tip.depth,
        '--open-h': tip.openHeight ? `${tip.openHeight}px` : undefined,
        // 进度条时长必须跟随本条自己的 duration：项目里有 30+ 处传 2000/3000/4000
        '--tip-life': `${tip.duration}ms`,
      }"
      :data-tip-id="tip.id"
      role="button"
      tabindex="0"
      :aria-label="`关闭此提醒：${tip.message}`"
      @mouseenter="onEnter(tip)"
      @mouseleave="onLeave(tip)"
      @focus="onFocus($event, tip)"
      @blur="onBlur(tip)"
      @click="dismiss(tip)"
      @keydown="onKeydown($event, tip)"
    >
      <article class="blog-tip__card">
        <div class="blog-tip__inner">
          <!-- 图标为代码内固定的 8×8 像素图案，不含任何外部输入 -->
          <span class="blog-tip__icon" v-html="iconSvg(tip.type)" />
          <p class="blog-tip__msg">{{ tip.message }}</p>
          <span v-if="tip.count > 1" class="blog-tip__count" aria-hidden="true">
            ×{{ tip.count }}
          </span>
          <span v-if="tip.duration > 0" class="blog-tip__timer" aria-hidden="true">
            <!-- key 随 restartToken 变化即重建元素，让进度条动画从头播放 -->
            <i :key="tip.restartToken" :class="{ 'is-paused': tip.paused }" />
          </span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  dismiss,
  pauseLife,
  startLife,
  tips,
  type TipItem,
  type TipType,
} from '@/plugins/blog-tip'

const stackRef = ref<HTMLElement | null>(null)

/* 像素图标：8×8 网格用 rect 拼，配合 shape-rendering: crispEdges 保持硬边 */
const ICON_ROWS: Record<TipType, string[]> = {
  info: [
    '..####..',
    '..####..',
    '........',
    '.######.',
    '..####..',
    '..####..',
    '..####..',
    '.######.',
  ],
  success: [
    '........',
    '.....###',
    '....###.',
    '...###..',
    '##.##...',
    '.###....',
    '..#.....',
    '........',
  ],
  warning: [
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '..####..',
    '........',
    '..####..',
    '..####..',
  ],
  error: [
    '##....##',
    '.##..##.',
    '..####..',
    '...##...',
    '...##...',
    '..####..',
    '.##..##.',
    '##....##',
  ],
}

function iconSvg(type: TipType): string {
  const rows = ICON_ROWS[type] ?? ICON_ROWS.info
  let rects = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] === '#') {
        let w = 1
        while (row[x + w] === '#') w++ // 合并同行连续像素
        rects += `<rect x="${x}" y="${y}" width="${w}" height="1"/>`
        x += w
      } else {
        x++
      }
    }
  })
  return `<svg viewBox="0 0 8 8" fill="currentColor" aria-hidden="true">${rects}</svg>`
}

function elementOf(tip: TipItem): HTMLElement | null {
  return stackRef.value?.querySelector<HTMLElement>(`[data-tip-id="${tip.id}"]`) ?? null
}

/** 同帧内先解除高度限制测量真实展开高度，再原样恢复，不产生中间绘制 */
function measureOpenHeight(el: HTMLElement): number {
  const inner = el.querySelector<HTMLElement>('.blog-tip__inner')
  if (!inner) return 0
  const prevMax = inner.style.maxHeight
  const prevTransition = inner.style.transition
  inner.style.transition = 'none'
  inner.style.maxHeight = 'none'
  const height = inner.offsetHeight
  inner.style.maxHeight = prevMax
  inner.style.transition = prevTransition
  return height
}

/**
 * 卡包层叠深度 + 容器容量分配。
 * 容器装不下时，从最旧的开始逐个折成「卡边」，仍不够则整条隐藏；
 * 最新的那条永远优先完整显示，牺牲顺序严格由旧到新。
 */
function refreshLayout() {
  const list = tips.value
  const n = list.length

  // depth 0 = 最新（数组首位），完整浮在最上；越旧越往下沉、越淡、阴影越近
  list.forEach((tip, i) => {
    tip.depth = Math.min(i, 4)
  })
  if (!n) return

  const stackEl = stackRef.value
  if (!stackEl) return

  // 可用高度直接读 CSS 的 max-height，保持单一事实源；读不到再按 33% 视口兜底
  const cs = getComputedStyle(stackEl)
  const avail = parseFloat(cs.maxHeight) || window.innerHeight * 0.33
  const ROW = parseFloat(cs.getPropertyValue('--tip-row-h')) || 44
  const PEEK = parseFloat(cs.getPropertyValue('--tip-peek-h')) || 10
  const GAP = parseFloat(cs.gap) || 10

  // 每条「想要的高度」：正在展开的用实测值，其余按一行
  const wants = list.map((tip) => (tip.opened && tip.openHeight ? tip.openHeight : ROW))

  // 单条展开不许独吞整个容器：至少给其它条留一条卡边的位置
  const room = avail - (n > 1 ? PEEK : 0)
  wants.forEach((h, i) => {
    if (h > room) wants[i] = Math.max(ROW, room)
  })

  // 样式里的 :hover / :focus 保护会让 is-peek、is-hidden 对「用户正指向或聚焦」的卡片失效，
  // 所以那条的实际渲染高度一定是 wants[i]，按 10px 估会误判成「装得下」而溢出容器
  const engaged = (tip: TipItem) => tip.opened || tip.focused

  const heightOf = (plan: string[]) => {
    let sum = 0
    let count = 0
    plan.forEach((state, i) => {
      const h = engaged(list[i])
        ? wants[i]
        : state === 'full'
          ? wants[i]
          : state === 'peek'
            ? PEEK
            : 0
      if (h <= 0) return
      sum += h + (count++ ? GAP : 0) // display:none 的那条不产生 gap
    })
    return sum
  }

  const plan: string[] = new Array(n).fill('full')
  // 下界必须是 1：i=0 是最新那条，永远保持完整，不参与折叠/隐藏
  for (let i = n - 1; i >= 1 && heightOf(plan) > avail; i--) plan[i] = 'peek'
  for (let i = n - 1; i >= 1 && heightOf(plan) > avail; i--) {
    if (engaged(list[i])) continue // 别把用户正指着的那张卡直接 display:none 掉
    plan[i] = 'hidden'
  }

  list.forEach((tip, i) => {
    tip.peeking = plan[i] === 'peek'
    tip.hidden = plan[i] === 'hidden'
  })
}

function onEnter(tip: TipItem) {
  const el = elementOf(tip)
  if (el) tip.openHeight = measureOpenHeight(el)
  tip.opened = true
  refreshLayout() // 展开会挤占空间，更旧的立刻退让成卡边
  if (tip.pauseOnHover) pauseLife(tip)
}

function onLeave(tip: TipItem) {
  if (tip.leaving) return // 正在离场：元素即将被移除，不要再改它的状态
  if (tip.focused) return // 键盘聚焦中保持展开，由 blur 负责收起
  tip.opened = false
  refreshLayout() // 收起后把空间还给更旧的气泡
  startLife(tip) // 移出即重新计满，而不是续接剩余时间
}

/** 只有「键盘聚焦」才锁定展开。鼠标按下同样会让 tabindex 元素获得焦点，若一并锁定：
 *  按住气泡拖到气泡外松手 → mouseleave 不再补发 → 气泡永久展开且不再倒计时（「卡住」），
 *  直到点击别处触发 blur 才恢复。:focus-visible 正是用来区分这两者的。 */
function isKeyboardFocus(el: HTMLElement | null): boolean {
  if (!el) return false
  try {
    return el.matches(':focus-visible')
  } catch {
    return true // 不支持 :focus-visible 的旧浏览器退回原行为
  }
}

function onFocus(e: FocusEvent, tip: TipItem) {
  if (!isKeyboardFocus(e.currentTarget as HTMLElement | null)) return
  tip.focused = true
  const el = elementOf(tip)
  if (el) tip.openHeight = measureOpenHeight(el)
  tip.opened = true
  refreshLayout()
  pauseLife(tip)
}

function onBlur(tip: TipItem) {
  tip.focused = false
  tip.opened = false
  refreshLayout()
  startLife(tip)
}

/** 兜底：原生拖拽启动或指针移出窗口时，mouseleave 可能根本不派发，opened 会永久留在
 *  true。鼠标一松开就按真实指针位置校准一次，覆盖上面那条修复管不到的路径。 */
function onGlobalMouseUp() {
  let changed = false
  tips.value.forEach((tip) => {
    if (!tip.opened || tip.focused || tip.leaving) return
    const el = elementOf(tip)
    if (el && el.matches(':hover')) return // 指针确实还在卡上，不动它
    tip.opened = false
    startLife(tip)
    changed = true
  })
  if (changed) refreshLayout()
}

function onKeydown(e: KeyboardEvent, tip: TipItem) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  dismiss(tip)
}

watch(
  () => tips.value.length,
  () => nextTick(refreshLayout)
)

onMounted(() => {
  refreshLayout()
  window.addEventListener('resize', refreshLayout)
  window.addEventListener('mouseup', onGlobalMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshLayout)
  window.removeEventListener('mouseup', onGlobalMouseUp)
})
</script>

<style lang="less" scoped>
.blog-tip-stack {
  /* 容器最大高度 = 窗口高度的 33%。vh/dvh 是视口相对长度，窗口高度变化时浏览器会实时
     重算，无需 JS 介入；resize 监听只负责重新分配「装几条完整」。
     刻意不写 overflow: hidden —— hover 时卡片要向上抽出 3px，裁切会把最上面那条的
     像素描边切平；「装不下」由 refreshLayout 负责。 */
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-height: 33vh;
  max-height: 33dvh;
  pointer-events: none; /* 不遮挡页面，单个气泡再打开 */

  --tip-row-h: 44px; /* 折叠态一行的高度：10 + 22 + 12，与 __inner 内容严格等值 */
  --tip-peek-h: 10px; /* 装不下时旧气泡折成的「卡边」高度 */
  --tip-min-w: 264px;
  --tip-max-w: 380px;
  --tip-dur-in: 260ms;
  /* 必须与 blog-tip.ts 的 LEAVE_ANIMATION_MS 一致 */
  --tip-dur-out: 220ms;
  --tip-dur-open: 240ms;
  --tip-ease-out: cubic-bezier(.2, .9, .3, 1.08);
  --tip-ease: cubic-bezier(.22, .85, .3, 1);
}

/* 外壳：定位、宽度约束、进出场动画 */
.blog-tip {
  position: relative;
  /* 层级走自定义属性，不能用内联 z-index —— 内联优先级高于选择器，会让下面的 :hover 失效 */
  z-index: var(--z, 200);
  pointer-events: auto;
  width: fit-content;
  min-width: var(--tip-min-w);
  max-width: var(--tip-max-w);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  animation: blog-tip-in var(--tip-dur-in) var(--tip-ease-out) both;
}

.blog-tip.is-leaving {
  animation: blog-tip-out var(--tip-dur-out) cubic-bezier(.4, 0, .7, .2) both;
  pointer-events: none;
}

/* hover / 聚焦的那张卡永远在最上层（压过 --depth 的层级） */
.blog-tip:hover,
.blog-tip.is-open {
  z-index: 300;
}

/* 像素硬阴影：画在外壳的伪元素上（外壳不裁切，阴影才不会被 clip-path 吃掉）。
   inset / --pxs 与 __inner 一致，阴影即卡片形状的纯平移副本，四角阶梯完全重合 */
.blog-tip::before {
  content: '';
  position: absolute;
  inset: 3px;
  z-index: 0;
  background: var(--shadow-strong);
  --pxs: 3px;
  clip-path: var(--pxc);
  /* 越老的卡阴影越近（越「平」），最新的浮得最高 */
  transform: translate(calc(4px - var(--depth, 0) * .8px), calc(4px - var(--depth, 0) * .8px));
  transition: transform var(--tip-dur-open) var(--tip-ease);
}

/* 描边层：四个方向的硬 drop-shadow 沿「已裁剪轮廓」向外均匀扩张 3px。
   不用「外层实底 padding + 内层小 --pxs 的 clip-path」双层嵌套：两个不同步进的阶梯
   多边形台阶位置互不对齐，角落描边厚度会在 1px 与 3px 之间跳变。
   注意 drop-shadow 必须挂在不裁切的父元素上、clip-path 挂在子元素上。 */
.blog-tip__card {
  position: relative;
  z-index: 1;
  padding: 3px; /* 给向外的描边留位，避免描边溢出到相邻气泡 */
  filter:
    drop-shadow(3px 0 0 var(--tip-color))
    drop-shadow(-3px 0 0 var(--tip-color))
    drop-shadow(0 3px 0 var(--tip-color))
    drop-shadow(0 -3px 0 var(--tip-color));
  /* 卡包层叠：越老的卡越往下沉、越淡，最新的完整浮在最上 */
  transform: translateY(calc(var(--depth, 0) * 3px)) scale(calc(1 - var(--depth, 0) * .018));
  opacity: calc(1 - var(--depth, 0) * .07);
  transition:
    transform var(--tip-dur-open) var(--tip-ease),
    opacity var(--tip-dur-open) var(--tip-ease);
}

/* 这张卡「抽出来」向上浮到最前 */
.blog-tip:hover .blog-tip__card,
.blog-tip.is-open .blog-tip__card {
  transform: translateY(-3px) scale(1);
  opacity: 1;
}

.blog-tip:hover::before,
.blog-tip.is-open::before {
  transform: translate(6px, 6px); /* 卡片抽出后阴影拉远，浮起感 */
}

/* 卡片本体：像素圆角 + 卡片底色 + 内容内边距 */
.blog-tip__inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 11px 12px;
  background: var(--bg-card);
  --pxs: 3px; /* 与 ::before 阴影同一步进，形状严格一致 */
  clip-path: var(--pxc);
  overflow: hidden;
  max-height: var(--tip-row-h);
  transition: max-height var(--tip-dur-open) var(--tip-ease);
}

.blog-tip:hover .blog-tip__inner,
.blog-tip.is-open .blog-tip__inner {
  max-height: var(--open-h, 220px); /* 实测值由脚本写入 */
}

.blog-tip__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  background: var(--tip-color);
  color: var(--tip-on);
  --pxs: 2px;
  clip-path: var(--pxc);

  /* 图标来自 v-html，不带 scoped 属性，必须用 :deep 才能命中 */
  :deep(svg) {
    display: block;
    width: 13px;
    height: 13px;
    shape-rendering: crispEdges;
  }
}

/* 折叠态 1 行省略号，展开态自然换行 */
.blog-tip__msg {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  line-height: 22px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  word-break: break-word;
}

.blog-tip:hover .blog-tip__msg,
.blog-tip.is-open .blog-tip__msg {
  -webkit-line-clamp: 99;
}

/* 同消息合并计数 */
.blog-tip__count {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  background: var(--tip-color);
  color: var(--tip-on);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  --pxs: 2px;
  clip-path: var(--pxc);
}

/* 倒计时进度条：真实反映剩余时间 */
.blog-tip__timer {
  position: absolute;
  left: 11px;
  right: 11px;
  bottom: 6px;
  height: 3px;
  background: var(--border);
  transition: opacity var(--tip-dur-open) linear;

  > i {
    display: block;
    height: 100%;
    background: var(--tip-color);
    transform-origin: left center;
    animation: blog-tip-timer var(--tip-life, 5000ms) linear forwards;
  }

  > i.is-paused {
    animation-play-state: paused;
  }
}

@keyframes blog-tip-timer {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* 类型配色：success / warning / error 与 variables.css 的 --px-frame-tip-* 取同一组色值 */
.blog-tip--info {
  --tip-color: var(--accent);
  --tip-on: #fff;
}
.blog-tip--success {
  --tip-color: #4caf50;
  --tip-on: #fff;
}
.blog-tip--warning {
  --tip-color: #ff9800;
  --tip-on: #33240a;
}
.blog-tip--error {
  --tip-color: #e74c3c;
  --tip-on: #fff;
}

/* 装不下时：折成「卡边」。:not() 保证被 hover / 聚焦的那条仍能正常抽出展开 */
.blog-tip.is-peek:not(:hover):not(.is-open) .blog-tip__inner {
  max-height: var(--tip-peek-h);
}
/* 卡边只剩一截，进度条会被裁得残缺，隐掉更干净（计时照常走） */
.blog-tip.is-peek:not(:hover):not(.is-open) .blog-tip__timer {
  opacity: 0;
}
.blog-tip.is-hidden {
  display: none;
}

/* 键盘可见焦点：焦点环画在裁剪过的卡片本体上，才会跟着像素圆角走 */
.blog-tip:focus-visible {
  outline: none;
}
.blog-tip:focus-visible .blog-tip__card {
  transform: translateY(-3px) scale(1);
  opacity: 1;
}
.blog-tip:focus-visible .blog-tip__inner {
  box-shadow: inset 0 0 0 3px var(--accent);
}

/* 按下：轻微下沉 + 微缩、阴影收近，给一点按压反馈。
   幅度刻意做小（相对 hover 态仅下沉 2px、缩放 1.5%），并把过渡缩短到 80ms 让按压干脆，
   松开时回到 240ms 的柔和回弹。必须排在 :hover / :focus-visible 之后 —— 同特异性下后者胜出。 */
.blog-tip:active .blog-tip__card {
  transform: translateY(-1px) scale(.985);
  transition-duration: 80ms;
}

.blog-tip:active::before {
  transform: translate(3px, 3px);
  transition-duration: 80ms;
}

@keyframes blog-tip-in {
  0% {
    opacity: 0;
    transform: translateY(-18px) scale(.94);
  }
  60% {
    opacity: 1;
    transform: translateY(3px) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes blog-tip-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-14px) scale(.92);
  }
}

/* 小屏：宽度按视口放开，不做层叠下沉避免贴边溢出 */
@media (max-width: 480px) {
  .blog-tip-stack {
    top: 14px;
    left: 14px;
    right: 14px;
    transform: none;
    align-items: stretch;
  }

  .blog-tip {
    width: auto;
    min-width: 0;
    max-width: none;
  }

  .blog-tip__card {
    transform: none;
    opacity: 1;
  }

  .blog-tip::before {
    transform: translate(4px, 4px);
  }
}
</style>
