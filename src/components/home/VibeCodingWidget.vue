<template>
  <div class="widget vibe-widget">
    <div v-if="loading" class="widget-content cube-anim">
      <CubeLoader :text="$t('common.loading')" />
    </div>
    <template v-else>
        <div class="vibe-header">
          <div class="vibe-title">
            <span class="slot"><img :src="ICON.diamondPickaxe" alt="" draggable="false" /></span>
            <span class="vibe-name">{{ $t('home.vibe.title') }}</span>
            <span class="live-chip" :class="{ off: !online }">
              <span class="lamp" :class="{ on: online }">
                <img :src="ICON.redstoneLamp" alt="" draggable="false" />
              </span>
              <span>{{ online ? $t('home.vibe.online') : $t('home.vibe.offline') }}</span>
              <span class="en">{{ online ? 'LIVE' : 'IDLE' }}</span>
            </span>
          </div>
        </div>

        <!-- 窗口区：未命中缓存时显示加载态；无记录时渲染 28 个空格子 -->
        <div v-if="windowLoading" class="window-loading">
          <CubeLoader :text="$t('common.loading')" />
        </div>
        <div v-else class="vibe-grid">
          <div
            v-for="(cell, i) in days"
            :key="cell.date"
            class="vibe-cell"
            :class="{ on: cell.requests > 0, ['lv' + levelOf(cell.requests)]: cell.requests > 0, today: i === 27 && offset === 0 }"
            :style="{ '--i': i }"
          >
            <i class="face"></i>
            <span
              class="vibe-tip"
              :class="{ below: Math.floor(i / 7) === 0, 'align-l': i % 7 <= 1, 'align-r': i % 7 >= 5 }"
            >
              <i>
                <span class="d">{{ cell.dateLabel }}</span>
                <template v-if="cell.requests > 0">
                  <span class="s ok">
                    <img :src="ICON.redstone" alt="" draggable="false" />
                    {{ $t('home.vibe.dayVibing', { n: cell.requests }) }}
                  </span>
                  <span class="m">
                    <img :src="ICON.experienceBottle" alt="" draggable="false" />
                    {{ $t('home.vibe.dayTokens', { n: fmtK(cell.tokens) }) }}
                    · <img :src="ICON.clock" alt="" draggable="false" />{{ $t('home.vibe.avgLatency', { s: cell.avgLatS }) }}
                  </span>
                  <span class="m" v-if="cell.topModel">{{ $t('home.vibe.mainModel', { name: cell.topModel }) }}</span>
                </template>
                <template v-else>
                  <span class="s rest">{{ $t('home.vibe.restDay') }}</span>
                </template>
              </i>
            </span>
          </div>
        </div>
        <div class="vibe-foot">
          <div class="win-nav">
            <button
              type="button"
              class="win-btn"
              :disabled="!canGoPrev"
              :aria-label="$t('home.vibe.prevWindow')"
              @click="shiftWindow(-1)"
            >
              <span class="px-arrow" aria-hidden="true">&lt;</span>
            </button>
            <span class="win-range">{{ rangeLabel }}</span>
            <button
              type="button"
              class="win-btn"
              :disabled="!canGoNext"
              :aria-label="$t('home.vibe.nextWindow')"
              @click="shiftWindow(1)"
            >
              <span class="px-arrow" aria-hidden="true">&gt;</span>
            </button>
          </div>
          <span class="vibe-legend">
            <span>{{ $t('home.vibe.less') }}</span>
            <i class="lv1"></i><i class="lv2"></i><i class="lv3"></i><i class="lv4"></i>
            <span>{{ $t('home.vibe.more') }}</span>
          </span>
        </div>

        <!-- 统计与格子同窗：窗口拉取中先隐藏，避免闪现全 0 -->
        <div v-if="!windowLoading" class="vibe-stats">
          <span v-if="topModel" class="chip">
            <img :src="ICON.netherStar" alt="" draggable="false" />
            {{ $t('home.vibe.topModel', { name: topModel }) }}
          </span>
          <span class="chip">
            <img :src="ICON.bookAndQuill" alt="" draggable="false" />
            {{ $t('home.vibe.activeDays', { n: activeDays }) }}
          </span>
          <span class="chip">
            <img :src="ICON.blazePowder" alt="" draggable="false" />
            {{ $t('home.vibe.streak', { n: streak }) }}
          </span>
          <span class="chip">
            <img :src="ICON.redstone" alt="" draggable="false" />
            {{ $t('home.vibe.totalReq', { n: fmtN(totalRequests) }) }}
          </span>
          <span class="chip">
            <img :src="ICON.experienceBottle" alt="" draggable="false" />
            {{ $t('home.vibe.tokens', { n: fmtK(totalTokens) }) }}
          </span>
        </div>

        <!-- 排行：标题常驻，窗口拉取中在标题下原地显示 loading，翻页不再整块消失 -->
        <div class="vibe-rank">
          <div class="rank-head">
            {{ $t('home.vibe.rankTitle') }}
            <span class="en">MODEL RANKS · TOP 3</span>
          </div>
          <div v-if="windowLoading" class="rank-loading">
            <CubeLoader :text="$t('common.loading')" />
          </div>
          <template v-else-if="rankTop.length > 0">
            <div v-for="(m, i) in rankTop" :key="m.model" class="rank-row">
              <span class="slot sm"><img :src="ICON[rankIcon(i)]" alt="" draggable="false" /></span>
              <span class="rank-main">
                <span class="rank-line1">
                  <span class="rank-name" :title="m.model">{{ m.model }}</span>
                  <span class="rank-val">{{ fmtN(m.requests) }}</span>
                </span>
                <span class="rank-line2">
                  <XpBar class="rank-xp" :value="barWidth(m)" />
                  <span class="rank-tok">
                    <img :src="ICON.experienceBottle" alt="" draggable="false" />
                    {{ fmtK(m.tokens) }}
                  </span>
                </span>
              </span>
            </div>
            <div v-if="rankRestCount > 0" class="rank-rest">
              {{ $t('home.vibe.rankRest', { n: rankRestCount, m: fmtN(rankRestRequests) }) }}
            </div>
          </template>
          <!-- 无数据占位：3 行同构骨架撑住布局，出数据时高度不跳动 -->
          <template v-else>
            <div v-for="i in 3" :key="'sk' + i" class="rank-row rank-skel" :style="{ '--i': i }">
              <span class="slot sm"></span>
              <span class="rank-main">
                <span class="rank-line1">
                  <i class="sk sk-name"></i><i class="sk sk-val"></i>
                </span>
                <span class="rank-line2">
                  <i class="sk sk-bar"></i><i class="sk sk-tok"></i>
                </span>
              </span>
            </div>
          </template>
        </div>
      </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CubeLoader from '@/components/common/CubeLoader.vue'
import XpBar from '@/components/home/XpBar.vue'
import { apiFetch } from '@/utils/apiEndpoint'
import { config } from '@/config'

/** 首页 Vibe Coding 活动卡（方案 B · 浓度热力）。
 *
 *  数据：GET config.vibe.api?date=YYYY-MM-DD → { online, request_data, time }
 *  - date    窗口结束日，缺省 = 今天（上海时区）；接口固定返回以该日期结尾的
 *            连续 28 天记录，历史窗口由前端翻页时逐窗拉取并缓存
 *  - online   当前是否正在 vibe → 红石灯
 *  - request_data  date × model 逐条请求记录（requests / failed_requests /
 *    *_tokens / *_latency_ns 明细），组件内按 date 聚合成 4×7=28 格浓度热力
 *    （按行铺满，右下角 = 今天），按 model 聚合出 TOP 3 排行与主力模型
 *  - time     生成时间 → 「数据更新于 N 分钟前」
 *
 *  物品图标：minecraft.wiki 原版物品栏贴图（public/vibe-icons/），与 PageTitle 同源 */
const { t, locale } = useI18n()

const ICON_BASE = '/vibe-icons'
const ICON_FILES = {
  diamondPickaxe: 'diamond-pickaxe.png',
  netheritePickaxe: 'netherite-pickaxe.png',
  goldenPickaxe: 'golden-pickaxe.png',
  ironPickaxe: 'iron-pickaxe.png',
  stonePickaxe: 'stone-pickaxe.png',
  woodenPickaxe: 'wooden-pickaxe.png',
  redstoneLamp: 'redstone-lamp.png',
  redstone: 'redstone.png',
  experienceBottle: 'experience-bottle.png',
  bookAndQuill: 'book-and-quill.png',
  blazePowder: 'blaze-powder.png',
  netherStar: 'nether-star.png',
  clock: 'clock.gif',
} as const
type IconKey = keyof typeof ICON_FILES
const ICON = Object.fromEntries(
  Object.entries(ICON_FILES).map(([key, file]) => [key, `${ICON_BASE}/${file}`]),
) as Record<IconKey, string>

/** Worker 返回结构（附件 schema） */
interface VibeRecord {
  date: string
  model: string
  requests: number
  failed_requests: number
  input_tokens: number
  output_tokens: number
  reasoning_tokens: number
  cache_read_tokens: number
  cache_creation_tokens: number
  total_tokens: number
  total_latency_ns: number
  total_ttft_ns: number
  average_latency_ns: number
  average_ttft_ns: number
}
interface VibeSummary {
  online: boolean
  request_data: VibeRecord[]
  time: number
}

const loading = ref(true)
const online = ref<boolean | null>(null)
/** 各窗口原始记录缓存：key = 窗口结束日（YYYY-MM-DD），value = 该 28 天记录 */
const windowsCache = ref(new Map<string, VibeRecord[]>())
/** 在途请求（同窗口去重；失败不落缓存，翻走再翻回即可重试） */
const inflight = ref(new Set<string>())

/** 拉取一个窗口：接口固定返回以 date 结尾的连续 28 天记录 */
async function fetchWindow(endKey: string) {
  if (windowsCache.value.has(endKey) || inflight.value.has(endKey)) return
  inflight.value.add(endKey)
  try {
    const res = await apiFetch(`${config.vibe.api}?date=${endKey}`)
    if (res.ok) {
      const data: VibeSummary = await res.json()
      online.value = data.online
      windowsCache.value.set(endKey, data.request_data ?? [])
    }
  } catch {
    /* 接口失败按空数据处理 */
  } finally {
    inflight.value.delete(endKey)
  }
}

// ── 时间窗：每页 28 天，offset 0 = 右下角今天；负数向过去翻页 ──
const today = new Date(); today.setHours(0, 0, 0, 0)
const offset = ref(0)
/** 最多回看 12 页（336 天），防止无限翻进没有数据的过去 */
const MIN_OFFSET = -12
const windowEnd = computed(() => {
  const d = new Date(today)
  d.setDate(d.getDate() + offset.value * 28)
  return d
})

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 当前窗口结束日，即请求参数 ?date= 的值 */
const activeEnd = computed(() => isoDate(windowEnd.value))
/** 当前窗口的记录（命中缓存秒切；未命中时窗口区显示加载态） */
const activeRecords = computed<VibeRecord[]>(() => windowsCache.value.get(activeEnd.value) ?? [])
const windowLoading = computed(() =>
  !windowsCache.value.has(activeEnd.value) && inflight.value.has(activeEnd.value))


const canGoPrev = computed(() => offset.value > MIN_OFFSET)
const canGoNext = computed(() => offset.value < 0)
function shiftWindow(dir: number) {
  offset.value = Math.min(0, Math.max(MIN_OFFSET, offset.value + dir))
  void fetchWindow(activeEnd.value)
}

onMounted(async () => {
  await fetchWindow(activeEnd.value)
  loading.value = false
})

interface DayCell {
  date: string
  dateLabel: string
  requests: number
  tokens: number
  avgLatS: string
  topModel: string
}

const days = computed<DayCell[]>(() => {
  const byDate = new Map<string, VibeRecord[]>()
  for (const r of activeRecords.value) {
    const list = byDate.get(r.date)
    if (list) list.push(r)
    else byDate.set(r.date, [r])
  }
  const fmtDay = new Intl.DateTimeFormat(locale.value, { month: 'long', day: 'numeric' })
  const cells: DayCell[] = []
  for (let i = 0; i < 28; i++) {
    const date = new Date(windowEnd.value)
    date.setDate(date.getDate() - (27 - i))
    const key = isoDate(date)
    const rows = byDate.get(key) ?? []
    const requests = rows.reduce((a, r) => a + successOf(r), 0)
    const tokens = rows.reduce((a, r) => a + r.total_tokens, 0)
    const latNs = rows.reduce((a, r) => a + r.total_latency_ns, 0)
    const top = rows.length ? rows.reduce((a, b) => (successOf(b) > successOf(a) ? b : a)) : null
    cells.push({
      date: key,
      dateLabel: `${fmtDay.format(date)} · ${dateLabelWeekday(date)}`,
      requests,
      tokens,
      avgLatS: requests > 0 ? (latNs / requests / 1e9).toFixed(2) : '0.00',
      topModel: top?.model ?? '',
    })
  }
  return cells
})

/** 当前窗口日期范围内的原始记录（统计 / 排行与格子同源同窗） */
const windowRecords = computed<VibeRecord[]>(() => {
  const start = days.value[0]?.date ?? ''
  const end = days.value[days.value.length - 1]?.date ?? ''
  return activeRecords.value.filter(r => r.date >= start && r.date <= end)
})

/** 窗口日期范围标签（如 2026-09-08 ~ 10-05） */
const rangeLabel = computed(() => {
  const start = days.value[0]?.date ?? ''
  const end = days.value[days.value.length - 1]?.date ?? ''
  return `${start} ~ ${end.slice(5)}`
})

/** 只统计成功请求：成功次数 = requests − failed_requests */
function successOf(r: VibeRecord): number {
  return Math.max(0, r.requests - r.failed_requests)
}

function dateLabelWeekday(d: Date): string {
  const key = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()] ?? 'sun'
  return t(`home.vibe.weekday.${key}`)
}

// ── 聚合统计 ──
const maxDayRequests = computed(() => Math.max(0, ...days.value.map(d => d.requests)))
/** 浓度档位：对当日峰值自适应分 4 档（接口量级变化不用改阈值） */
function levelOf(requests: number): number {
  if (requests <= 0) return 0
  const max = maxDayRequests.value
  if (max <= 0) return 4
  const ratio = requests / max
  return ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1
}

const activeDays = computed(() => days.value.filter(d => d.requests > 0).length)
const streak = computed(() => {
  let n = 0
  for (let i = days.value.length - 1; i >= 0 && days.value[i]?.requests; i--) n++
  return n
})
const totalRequests = computed(() => days.value.reduce((a, d) => a + d.requests, 0))
const totalTokens = computed(() => windowRecords.value.reduce((a, r) => a + r.total_tokens, 0))

interface ModelStat { model: string; requests: number; tokens: number }
const modelsRanked = computed<ModelStat[]>(() => {
  const map = new Map<string, ModelStat>()
  for (const r of windowRecords.value) {
    const m = map.get(r.model) ?? { model: r.model, requests: 0, tokens: 0 }
    m.requests += successOf(r)
    m.tokens += r.total_tokens
    map.set(r.model, m)
  }
  return [...map.values()].sort((a, b) => b.requests - a.requests)
})
/** 使用过最多的模型 */
const topModel = computed(() => modelsRanked.value[0]?.model ?? '')
const rankTop = computed(() => modelsRanked.value.slice(0, 3))
const rankRestCount = computed(() => Math.max(0, modelsRanked.value.length - 3))
const rankRestRequests = computed(() =>
  modelsRanked.value.slice(3).reduce((a, m) => a + m.requests, 0))

/** 名次 → 镐材质档位（下界合金 > 钻石 > 金 > 铁 > 石 > 木） */
const RANK_ICONS = ['netheritePickaxe', 'diamondPickaxe', 'goldenPickaxe', 'ironPickaxe', 'stonePickaxe', 'woodenPickaxe'] as const
function rankIcon(i: number): IconKey {
  return RANK_ICONS[Math.min(i, RANK_ICONS.length - 1)] ?? 'woodenPickaxe'
}
function barWidth(m: ModelStat): number {
  const max = modelsRanked.value[0]?.requests ?? m.requests
  return Math.max(4, Math.round((m.requests / Math.max(1, max)) * 100))
}

function fmtN(n: number): string {
  return n.toLocaleString('en-US')
}
function fmtK(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}
</script>

<style lang="less" scoped>
/* 行内物品图标统一 14px 像素化（贴图为 16×16 原版物品栏尺寸） */
img {
  image-rendering: pixelated;
}

.vibe-widget {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.vibe-header {
  margin-bottom: 14px;
}

.vibe-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 0;
}

/* 标题按内容宽收缩（min-width: max-content）保证不缩写出省略号：
   卡片放不下「标题 + 徽章」时徽章整体换到第二行右端，而不是挤掉标题 */
.vibe-name {
  flex: 1;
  min-width: max-content;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* MC 物品栏槽位（PageTitle 同款：灰底 + 左上暗 / 右下亮内嵌） */
.slot {
  width: 34px;
  height: 34px;
  flex: none;
  background: #8b8b8b;
  box-shadow: inset 3px 3px 0 #373737, inset -3px -3px 0 #ffffff;
  display: grid;
  place-items: center;

  img {
    width: 22px;
    height: 22px;
    display: block;
  }

  &.sm {
    width: 24px;
    height: 24px;
    box-shadow: inset 2px 2px 0 #373737, inset -2px -2px 0 #ffffff;

    img {
      width: 16px;
      height: 16px;
    }
  }
}

/* E+A 在线徽章：像素描边 chip + 红石灯 + LIVE/IDLE 像素字（online 驱动），置于标题行右端 */
.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px 3px 6px;
  margin-left: auto;
  flex: none;
  --pxs: 2px; clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame-accent) 6 / calc(2 * var(--pxs)) stretch;
  background: color-mix(in srgb, var(--accent) 12%, transparent);

  .en {
    font-family: var(--font-pixel);
    font-size: 8px;
    letter-spacing: 1px;
    color: var(--accent);
  }

  &.off {
    border-image-source: var(--px-frame);
    background: transparent;

    .en {
      color: var(--text-secondary);
    }
  }
}

/* 在线灯：红石灯贴图，online 时提亮 + 呼吸光 */
.lamp {
  position: relative;
  display: inline-flex;

  img {
    width: 16px;
    height: 16px;
    display: block;
  }

  &.on img {
    filter: brightness(1.9) saturate(1.35)
      drop-shadow(0 0 4px color-mix(in srgb, var(--accent-bright) 75%, transparent));
  }

  &.on::after {
    content: '';
    position: absolute;
    inset: -3px;
    --pxs: 2px; clip-path: var(--pxc);
    background: color-mix(in srgb, var(--accent-bright) 30%, transparent);
    animation: vibe-lamp-glow 2.4s steps(2) infinite;
    z-index: -1;
  }
}

@keyframes vibe-lamp-glow {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

/* ── 4 高 × 7 宽 格子（28 天按行铺满，右下角 = 今天）──
   扁平化：无内嵌描边，空格 / 亮格都是平涂色块，仅保留像素圆角切角；
   壳层不裁剪（clip-path 会裁掉子树），视觉面在 .face，tooltip 留在壳层。
   格子用 1fr 平分卡片宽度（外层上限 312px = 7×36 + 6×10，超出居中留白），
   数学上不可能溢出卡片 —— 不依赖容器单位的解析结果（旧 iOS Safari 会把
   cqw 按边框盒 / viewport 兜底，按整屏宽排格子就会挤出卡片右缘）；
   间距仍随卡片宽度在 4~10px 间伸缩（cqw），不认识的浏览器回退固定 8px */
.vibe-grid {
  --gap: clamp(4px, calc((100cqw - 252px) / 6), 10px);
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  gap: var(--gap);
  width: 100%;
  max-width: 312px;
  margin: 0 auto;
}

/* 窗口加载态：占位高度约等于 4 行格子，翻页时卡片不跳动 */
.window-loading {
  min-height: 176px;
  display: grid;
  place-items: center;
}

.vibe-cell {
  position: relative;
  aspect-ratio: 1;
  animation: vibe-cell-pop 0.44s steps(2) both;
  animation-delay: calc(var(--i) * 20ms);

  /* 进场动画（fill both）让每个格子都是独立层叠上下文，内部 tooltip 的
     z-index 出不去、会被后绘制的下方行格子盖住 —— 悬停时抬高格子本身 */
  &:hover {
    z-index: 7;
  }

  .face {
    position: absolute;
    inset: 0;
    --pxs: 3px; clip-path: var(--pxc);
    background: var(--bg-secondary);
  }

  &.on .face {
    background: var(--accent);
  }

  /* 浓度档位：color-mix 沿 accent 由浅到深 */
  &.lv1 .face { background: color-mix(in srgb, var(--accent) 30%, var(--bg-primary)); }
  &.lv2 .face { background: color-mix(in srgb, var(--accent) 55%, var(--bg-primary)); }
  &.lv3 .face { background: color-mix(in srgb, var(--accent) 80%, var(--bg-primary)); }
  &.lv4 .face { background: var(--accent); }

  /* 今天：无描边框。呼吸光是垫在格子后面的同款像素圆角光斑（大 1 圈），
     方角 box-shadow 会从圆角缺口后漏光衬出"白角"，故用光斑自身裁圆角 */
  &.today::after {
    content: '';
    position: absolute;
    inset: -3px;
    z-index: -1;
    pointer-events: none;
  }

  &.today.on::after {
    --pxs: 4px; clip-path: var(--pxc);
    background: color-mix(in srgb, var(--accent-bright) 55%, transparent);
    animation: vibe-cell-pulse 2.6s 0.9s steps(2) infinite;
  }
}

@keyframes vibe-cell-pop {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes vibe-cell-pulse {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
}

/* ── 窗口导航行：左侧 [按钮+日期] 一组，图例独立置右 ── */
.vibe-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 9px;
  flex-wrap: wrap;
}

.win-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.win-btn {
  width: 22px;
  height: 22px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  --pxs: 2px; clip-path: var(--pxc);
  border: 1px solid transparent;
  border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  .px-arrow {
    font-family: var(--font-pixel);
    font-size: 11px;
    line-height: 1;
  }

  &:hover:not(:disabled) {
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

.win-range {
  font-family: var(--font-pixel);
  font-size: 8px;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 浓度图例 */
.vibe-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  color: var(--text-secondary);

  i {
    width: 10px;
    height: 10px;
    --pxs: 2px; clip-path: var(--pxc);
    display: inline-block;
  }

  .lv1 { background: color-mix(in srgb, var(--accent) 30%, var(--bg-primary)); }
  .lv2 { background: color-mix(in srgb, var(--accent) 55%, var(--bg-primary)); }
  .lv3 { background: color-mix(in srgb, var(--accent) 80%, var(--bg-primary)); }
  .lv4 { background: var(--accent); }
}

/* ── MC 拾取物品 tooltip（#100010F0 底 + 紫渐变描边，PageTitle A 方案同款）── */
.vibe-tip {
  position: absolute;
  bottom: calc(100% + 9px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  padding: 3px;
  --pxs: 3px; clip-path: var(--pxc);
  background: linear-gradient(135deg, #2d0a63, #50288c);
  filter: drop-shadow(0 3px 0 rgba(35, 43, 33, 0.22));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;

  /* 顶行翻到格子下方，贴边格子改对齐，防被卡片裁切 */
  &.below { bottom: auto; top: calc(100% + 9px); }
  &.align-l { left: 0; transform: none; }
  &.align-r { left: auto; right: 0; transform: none; }

  i {
    display: block;
    font-style: normal;
    --pxs: 3px; clip-path: var(--pxc);
    background: rgba(16, 0, 16, 0.94);
    padding: 6px 10px;
    white-space: nowrap;
    text-align: left;
  }

  .d { display: block; font-size: 0.66rem; color: #fcfcfc; }
  .s { display: block; font-size: 0.62rem; margin-top: 2px; }
  .s.ok { color: #55ff55; }
  .s.rest { color: #9a9a9a; }
  .m { display: block; font-size: 0.6rem; color: #aaaaaa; margin-top: 2px; }

  img {
    width: 11px;
    height: 11px;
    vertical-align: -1px;
    margin-right: 3px;
  }
}

.vibe-cell:hover .vibe-tip {
  opacity: 1;
}

/* ── 统计 chips ── */
.vibe-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 13px;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  --pxs: 2px; clip-path: var(--pxc);
  min-width: 0;

  img {
    width: 14px;
    height: 14px;
    flex: none;
  }

  b {
    color: var(--accent);
    font-weight: 800;
  }
}

/* ── 模型请求排行（XP 条 + 镐材质档位图标 + 模型名）── */
.vibe-rank {
  margin-top: 14px;
  padding-top: 11px;
  border-top: 1px dashed var(--border);
}

.rank-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-secondary);

  .en {
    font-family: var(--font-pixel);
    font-size: 8px;
    letter-spacing: 1px;
    opacity: 0.75;
  }
}

/* 排行加载态：标题常驻，下方原地占位约 3 行排行高度，翻页不跳动 */
.rank-loading {
  min-height: 96px;
  display: grid;
  place-items: center;
}

/* 无数据骨架占位：与真实排行同构（空槽位 + 灰条 + XP 底槽），步进闪烁 */
.rank-skel {
  .slot {
    opacity: 0.5;
  }

  .rank-line1,
  .rank-line2 {
    align-items: center;
  }

  .sk {
    display: block;
    height: 8px;
    background: color-mix(in srgb, var(--text-secondary) 25%, transparent);
    --pxs: 2px; clip-path: var(--pxc);
    animation: rank-skel-blink 1.4s steps(2) infinite;
    animation-delay: calc(var(--i) * 160ms);
  }

  .sk-name { flex: 1; max-width: 55%; }
  .sk-val { flex: none; width: 22px; margin-left: auto; }
  .sk-bar { flex: 1; background: color-mix(in srgb, var(--text-secondary) 14%, transparent); }
  .sk-tok { flex: none; width: 30px; }
}

@keyframes rank-skel-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 排行一行两行制：第一行 = 模型名 + 成功次数（像素字），第二行 = 经验条 + token 用量 */
.rank-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 8px;

  + .rank-row {
    margin-top: 9px;
  }
}

.rank-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rank-line1 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.rank-name {
  flex: 1;
  min-width: 0;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-val {
  flex: none;
  font-family: var(--font-pixel);
  font-size: 0.58rem;
  color: var(--text-secondary);
}

.rank-line2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rank-xp {
  flex: 1;
  min-width: 0;
}

.rank-tok {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-pixel);
  font-size: 0.58rem;
  color: var(--text-secondary);

  img {
    width: 12px;
    height: 12px;
  }
}

.rank-rest {
  margin-top: 8px;
  font-size: 0.62rem;
  color: var(--text-secondary);
  opacity: 0.85;
}
</style>
