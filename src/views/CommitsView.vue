<template>
  <div class="commits-view">
    <!-- 返回按钮 -->
    <Button class="back-button" type="primary" @click="goBack">
      <span class="back-arrow">⬅</span>
    </Button>

    <!-- 顶部 -->
    <div class="commits-header">
      <h1 class="page-title">{{ repoName }}</h1>
      <div class="header-actions">
        <Button type="primary" size="small" @click="openProject">
          {{ $t('pageCommits.visitProject') }}
        </Button>
        <Button size="small" @click="openCommits">
          {{ $t('pageCommits.visitCommits') }}
        </Button>
      </div>
    </div>

    <!-- 加载 / 错误 / 空 -->
    <div v-if="loading" class="status-wrap loading-text">
      <span class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </span>
      <span>{{ $t('pageCommits.loading') }}</span>
    </div>
    <div v-else-if="error" class="status-wrap status-error">
      <span>{{ $t('pageCommits.loadFailed') }}</span>
      <Button size="small" @click="fetchCommits">{{ $t('pageCommits.retry') }}</Button>
    </div>
    <div v-else-if="commits.length === 0" class="status-wrap">
      <span>{{ $t('pageCommits.noCommits') }}</span>
    </div>

    <!-- 提交树 -->
    <div v-else class="timeline">
      <div
        v-for="(commit, index) in commits"
        :key="commit.sha"
        class="tl-row"
      >
        <!-- 左侧：纯图形列 -->
        <div class="tl-graph">
          <!-- 主干竖线（始终在中心） -->
          <div
            v-if="index > 0"
            class="tl-spine tl-spine--top"
          />
          <div
            v-if="index < commits.length - 1"
            class="tl-spine tl-spine--bottom"
          />

          <!-- 分支曲线 SVG：从上方某处弯曲汇入当前节点 -->
          <svg
            v-for="curve in incomingCurves(index)"
            :key="'curve-' + curve.fromRow"
            class="tl-curve"
            :style="{
              top: curve.svgTop + 'px',
              left: '0px',
              width: curve.svgW + 'px',
              height: curve.svgH + 'px',
            }"
            :viewBox="`0 0 ${curve.svgW} ${curve.svgH}`"
            preserveAspectRatio="none"
          >
            <path :d="curve.d" fill="none" class="tl-curve-path" />
          </svg>

          <!-- 节点圆点 -->
          <div
            class="tl-dot"
            :class="{ 'tl-dot--merge': isMerge(commit) }"
          />
        </div>

        <!-- 右侧：提交信息 -->
        <div class="tl-card">
          <div class="tl-msg">
            <span class="tl-msg-text">{{ firstLine(commit.commit.message) }}</span>
            <button
              v-if="hasMoreLines(commit.commit.message)"
              class="tl-expand-btn"
              :class="{ 'tl-expand-btn--open': isExpanded(commit.sha) }"
              @click="toggleExpand(commit.sha)"
            >
              <span class="tl-expand-icon">▾</span>
              <span class="tl-expand-label">{{ isExpanded(commit.sha) ? $t('pageCommits.collapse') : $t('pageCommits.expand') }}</span>
            </button>
          </div>

          <!-- 完整消息（展开时显示，去掉第一行） -->
          <transition name="msg-expand">
            <div v-if="isExpanded(commit.sha) && hasMoreLines(commit.commit.message)" class="tl-msg-full">
              <pre class="tl-msg-content">{{ restLines(commit.commit.message) }}</pre>
            </div>
          </transition>

          <div class="tl-meta">
            <a
              v-if="commit.committer?.login"
              :href="`https://github.com/${commit.committer.login}`"
              target="_blank"
              rel="noopener noreferrer"
              class="tl-avatar-link"
            >
              <img
                v-if="commit.committer?.avatar_url"
                :src="commit.committer.avatar_url"
                class="tl-avatar"
                loading="lazy"
              />
              <span v-else class="tl-avatar tl-avatar--ph">
                {{ initials(commit) }}
              </span>
            </a>
            <template v-else>
              <img
                v-if="commit.committer?.avatar_url"
                :src="commit.committer.avatar_url"
                class="tl-avatar"
                loading="lazy"
              />
              <span v-else class="tl-avatar tl-avatar--ph">
                {{ initials(commit) }}
              </span>
            </template>
            <a
              v-if="commit.committer?.login"
              :href="`https://github.com/${commit.committer.login}`"
              target="_blank"
              rel="noopener noreferrer"
              class="tl-author-link"
            >
              {{ commit.committer?.login || commit.commit.committer?.name || 'Unknown' }}
            </a>
            <span v-else class="tl-author">
              {{ commit.committer?.login || commit.commit.committer?.name || 'Unknown' }}
            </span>
            <span class="tl-sep">{{ $t('pageCommits.committedAt') }}</span>
            <time
              class="tl-date"
              :datetime="commit.commit.committer?.date"
              :title="formatFullTime(commit.commit.committer?.date || '')"
            >
              {{ formatRelativeTime(commit.commit.committer?.date || '') }}
            </time>
            <Button type="primary" size="small" class="tl-btn" @click="openCommit(commit.sha)">
              {{ $t('pageCommits.visit') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'animal-island-vue'
import { formatRelativeTime, formatFullTime } from '@/composables/useTime'

const router = useRouter()

const GITHUB_OWNER = 'Turing158'

const props = defineProps<{ repo?: string }>()

interface CommitData {
  sha: string
  html_url: string
  commit: {
    message: string
    committer: { name: string; email: string; date: string }
  }
  committer: { login: string; avatar_url: string } | null
  parents: { sha: string; url: string; html_url?: string }[]
}

const loading = ref(false)
const error = ref<string | null>(null)
const commits = ref<CommitData[]>([])

const repoName = computed(() => props.repo || 'StarFall-Minecraft-Launcher')

// ── 布局常量 ──
const ROW_H = 72    // 每行高度
const DOT = 12      // 圆点直径
const graphW = 56   // 图形列宽度
const spineX = graphW / 2  // 主干竖线 x 位置（居中）
const DOT_TOP = 15       // 圆点 top 值
const DOT_CENTER = DOT_TOP + DOT / 2  // 圆点中心距行顶 = 21px

function firstLine(msg: string) { return msg.split('\n')[0].trim() }
function restLines(msg: string) { return msg.split('\n').slice(1).join('\n').trimEnd() }
function isMerge(c: CommitData) { return c.parents.length > 1 }
function hasMoreLines(msg: string) { return msg.includes('\n') }

// 展开/折叠状态
const expandedSet = ref<Set<string>>(new Set())
function isExpanded(sha: string): boolean {
  return expandedSet.value.has(sha)
}
function toggleExpand(sha: string): void {
  const s = expandedSet.value
  if (s.has(sha)) {
    s.delete(sha)
  } else {
    s.add(sha)
  }
  // 触发响应式更新
  expandedSet.value = new Set(s)
}
function initials(c: CommitData) {
  return (c.committer?.login || c.commit.committer?.name || '?')[0].toUpperCase()
}
function openProject() { window.open(`https://github.com/${GITHUB_OWNER}/${repoName.value}`, '_blank') }
function openCommits() { window.open(`https://github.com/${GITHUB_OWNER}/${repoName.value}/commits`, '_blank') }
const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/projects')
  }
}

function openCommit(sha: string) { window.open(`https://github.com/${GITHUB_OWNER}/${repoName.value}/commit/${sha}`, '_blank') }

// ── Lane 分配算法 ──
// 核心思路：
//   - 所有节点默认在 lane 0（中央主干线）
//   - 当一个合并提交的 parent 不是紧邻的上一个节点时，
//     说明该 parent 在另一条分支上，需要画一条曲线汇入
//   - 为每个这样的"跳跃 parent"分配一个分支 lane（1, 2, 3…）
//   - 分支 lane 在图形列中位于主干左侧，曲线从左向右弯曲汇入

interface LaneInfo {
  lane: number            // 当前节点所在 lane（0 = 主干）
  incomingBranches: {     // 需要画曲线汇入的来源
    fromRow: number       // 来源 commit 的行号
    branchLane: number    // 来源所在的分支 lane
  }[]
}

const laneInfos = computed<LaneInfo[]>(() => {
  const result: LaneInfo[] = []
  const shaToIdx = new Map<string, number>()
  let nextBranchLane = 1
  // 记录每个"跳跃 parent"被分配的分支 lane
  const parentBranchLane = new Map<number, number>()

  commits.value.forEach((commit, i) => {
    shaToIdx.set(commit.sha, i)

    if (i === 0) {
      result.push({ lane: 0, incomingBranches: [] })
      return
    }

    const merge = isMerge(commit)
    const incomingBranches: LaneInfo['incomingBranches'] = []

    if (merge) {
      for (const p of commit.parents) {
        const pIdx = shaToIdx.get(p.sha)
        if (pIdx === undefined) continue

        if (pIdx === i - 1) {
          // 紧邻上一个节点 → 同 lane 直线连接，无需曲线
          continue
        } else {
          // 跳跃 parent → 需要分支曲线
          if (!parentBranchLane.has(pIdx)) {
            parentBranchLane.set(pIdx, nextBranchLane++)
          }
          const bl = parentBranchLane.get(pIdx)!
          incomingBranches.push({ fromRow: pIdx, branchLane: bl })
        }
      }
    }

    // 当前节点始终在 lane 0
    result.push({ lane: 0, incomingBranches })
  })

  return result
})

// ── 计算汇入某节点的曲线 ──
interface Curve {
  fromRow: number
  svgTop: number   // SVG 相对于图形列顶部的 top
  svgW: number
  svgH: number
  d: string        // path 数据
}

function incomingCurves(row: number): Curve[] {
  const curves: Curve[] = []
  const info = laneInfos.value[row]

  for (const br of info.incomingBranches) {
    const fromY = br.fromRow * ROW_H + DOT_CENTER  // 来源节点圆心 y
    const toY = row * ROW_H + DOT_CENTER            // 当前节点圆心 y
    const vertH = toY - fromY

    // 分支 lane 在主干左侧，每个分支 lane 占 14px
    const branchX = spineX - 8 - (br.branchLane * 14)
    const endX = spineX
    const horiz = endX - branchX  // 水平距离（正值）

    // SVG 从来源节点圆心下方开始，到当前节点圆心结束
    const svgTop = fromY + DOT / 2
    const svgH = vertH - DOT
    const svgW = horiz + 4

    // 贝塞尔曲线：从左上方弯曲到右下方
    // 起点 (0, 0) 对应分支 lane 位置
    // 终点 (horiz, svgH) 对应主干位置
    const cpx1 = horiz * 0.15
    const cpy1 = svgH * 0.4
    const cpx2 = horiz * 0.85
    const cpy2 = svgH * 0.6
    const d = `M 0 0 C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${horiz} ${svgH}`

    curves.push({ fromRow: br.fromRow, svgTop, svgW, svgH, d })
  }

  return curves
}

// ── 数据获取 ──
async function fetchCommits() {
  loading.value = true
  error.value = null
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repoName.value}/commits?per_page=30`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
    commits.value = (await res.json()) as CommitData[]
  } catch (e: any) {
    error.value = e.message || 'Unknown error'
    commits.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.repo, fetchCommits, { immediate: false })
onMounted(fetchCommits)
</script>

<style lang="less" scoped>
.commits-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

// ── 返回按钮 ──
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  .back-arrow {
    font-size: 1.1rem;
    transition: transform 0.3s ease;
  }

  &:hover {
    .back-arrow {
      transform: translateX(-4px);
    }
  }

  &:active {
    transform: scale(0.97);
  }
}

// ── 顶部 ──
.commits-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border);
  flex-wrap: wrap;
  gap: 12px;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

// ── 状态 ──
.status-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 0;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

// ── 时间线 ──
.timeline {
  display: flex;
  flex-direction: column;
}
.tl-row {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 72px;
}

// ── 左侧图形列 ──
.tl-graph {
  position: relative;
  flex-shrink: 0;
  width: 56px;
}

// 主干竖线
.tl-spine {
  position: absolute;
  left: 27px;  // spineX - 1px (线宽一半)
  width: 2px;
  background: var(--border);
  z-index: 0;

  &--top {
    top: 0;
    height: 21px;  // 上半段到圆点中心 (dot top:15 + radius:6 = 21)
  }
  &--bottom {
    top: 21px;
    bottom: 0;
  }
}

// 节点圆点
.tl-dot {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translate(-50%, 0);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  z-index: 2;
  flex-shrink: 0;
  transition: background 0.2s;

  &:hover{
    background: var(--accent-hover);
  }

  &--merge {
    background: var(--bg-card);
    border: 2.5px solid var(--accent);
  }
}

// 分支曲线
.tl-curve {
  position: absolute;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}
.tl-curve-path {
  stroke: var(--border);
  stroke-width: 2;
}

// ── 右侧提交信息卡片 ──
.tl-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5px 5px 10px 8px;
  gap: 8px;
  border: var(--border) solid 1px;
  border-radius: 5px;
  margin: 5px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.tl-card:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tl-msg {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
  line-height: 1.45;
}

.tl-meta {
  display: flex;
  align-items: end;
  gap: 6px;
  flex-wrap: wrap;
}

.tl-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;

  &--ph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
  }
}

.tl-avatar-link {
  display: inline-flex;
  flex-shrink: 0;
  text-decoration: none;
  cursor: pointer;
  border-radius: 50%;
  outline-offset: 2px;

  &:hover .tl-avatar {
    box-shadow: 0 0 0 2px var(--accent);
  }
}

.tl-author {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
}

.tl-author-link {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--accent);
    text-decoration: underline;
  }
}
.tl-sep {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.tl-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.tl-btn {
  margin-left: auto;
  flex-shrink: 0;
}

// ── 响应式 ──
@media (max-width: 768px) {
  .commits-view { padding: 20px 12px; }
  .commits-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: flex-end; }
  .tl-graph { width: 44px; }
  .tl-spine { left: 21px; }
}
	// ── 展开按钮 ──
	.tl-msg {
	  display: flex;
	  align-items: flex-start;
	  gap: 8px;
	}

	.tl-msg-text {
	  flex: 1;
	  min-width: 0;
	}

	.tl-expand-btn {
	  flex-shrink: 0;
	  display: inline-flex;
	  align-items: center;
	  gap: 4px;
	  padding: 2px 8px;
	  border: 1px solid var(--border);
	  border-radius: 6px;
	  background: var(--bg-secondary);
	  color: var(--text-secondary);
	  font-size: 0.75rem;
	  font-weight: 500;
	  cursor: pointer;
	  transition: background 0.2s, color 0.2s, border-color 0.2s;
	  white-space: nowrap;
	  line-height: 1.4;

	  &:hover {
	    background: var(--bg-card);
	    color: var(--accent);
	    border-color: var(--accent);
	  }

	  &--open {
	    color: var(--accent);
	    border-color: var(--accent);
	  }
	}

	.tl-expand-icon {
	  font-size: 0.9em;
	  transition: transform 0.25s ease;
	}

	.tl-expand-btn--open .tl-expand-icon {
	  transform: rotate(180deg);
	}

	// ── 完整消息区域 ──
	.tl-msg-full {
	  margin-top: 4px;
	  padding: 10px 14px;
	  background: var(--bg-secondary);
	  border-radius: 8px;
	  border: 1px solid var(--border);
	  overflow: hidden;
	}

	.tl-msg-content {
	  margin: 0;
	  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
	  font-size: 0.8rem;
	  line-height: 1.6;
	  color: var(--text-primary);
	  white-space: pre-wrap;
	  word-break: break-word;
	}

	// ── 展开/折叠过渡动画 ──
	.msg-expand-enter-active,
	.msg-expand-leave-active {
	  transition: max-height 0.3s ease, opacity 0.25s ease, padding 0.25s ease;
	  max-height: 500px;
	}

	.msg-expand-enter-from,
	.msg-expand-leave-to {
	  max-height: 0;
	  opacity: 0;
	  padding-top: 0;
	  padding-bottom: 0;
	}

</style>
