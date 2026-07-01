<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <!-- 错误代码 -->
      <h1 class="not-found-code">404</h1>
      <h2 class="not-found-title">{{ $t('notFound.title') }}</h2>
      <p class="not-found-description">{{ $t('notFound.description') }}</p>

      <!-- 操作按钮 -->
      <div class="not-found-actions">
        <button class="not-found-btn" @click="goHome">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {{ $t('notFound.goHome') }}
        </button>
        <button class="not-found-btn not-found-btn--secondary" @click="goBack">
          {{ $t('notFound.goBack') }}
        </button>
      </div>

      <!-- 贪吃蛇小游戏 -->
      <div class="snake-section">
        <div class="snake-header">
          <span class="snake-title">🐍 {{ $t('notFound.snakeGame') }}</span>
          <div class="snake-scores">
            <span class="snake-score-item">
              {{ $t('notFound.score') }}: <strong>{{ score }}</strong>
            </span>
            <span class="snake-score-divider">|</span>
            <span class="snake-score-item">
              {{ $t('notFound.best') }}: <strong>{{ highScore }}</strong>
            </span>
          </div>
        </div>

        <div class="snake-canvas-wrap">
          <canvas
            ref="canvasRef"
            :width="canvasSize"
            :height="canvasSize"
            class="snake-canvas"
            @click="startGame"
          ></canvas>

          <!-- Overlay: 未开始 / 已结束 -->
          <div v-if="gameState !== 'playing'" class="snake-overlay" @click="startGame">
            <template v-if="gameState === 'idle'">
              <div class="snake-overlay-icon">🐍</div>
              <div class="snake-overlay-text">{{ $t('notFound.clickToStart') }}</div>
              <div class="snake-overlay-hint">{{ $t('notFound.snakeHint') }}</div>
            </template>
            <template v-else-if="gameState === 'over'">
              <div class="snake-overlay-icon">💀</div>
              <div class="snake-overlay-text">{{ $t('notFound.gameOver') }}</div>
              <div class="snake-overlay-sub">{{ $t('notFound.finalScore', { n: score }) }}</div>
              <div class="snake-overlay-hint">{{ $t('notFound.clickToRestart') }}</div>
            </template>
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { updateDocumentTitle } from '@/router'

const router = useRouter()
updateDocumentTitle('页面未找到')

// ─── 路由 ────────────────────────────────────────────
function goHome() { router.push('/') }
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}

// ─── 贪吃蛇游戏 ──────────────────────────────────────
const CANVAS_SIZE = 360
const GRID_SIZE = 15            // 15×15 格子
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE

const HIGH_SCORE_KEY = 'snake-high-score'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasSize = CANVAS_SIZE
const score = ref(0)
const highScore = ref(loadHighScore())
const gameState = ref<'idle' | 'playing' | 'over'>('idle')

type Pos = { x: number; y: number }
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

// 使用 reactive 对象存储游戏状态，避免 ref 拆包问题
const state = reactive({
  snake: [] as Pos[],
  food: { x: 0, y: 0 },
  direction: 'RIGHT' as Dir,
  nextDirection: 'RIGHT' as Dir,
  timer: 0 as ReturnType<typeof setTimeout> | number,
})
const EMPTY = { x: -1, y: -1 }

function loadHighScore(): number {
  try {
    return Number(sessionStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function saveHighScore(val: number) {
  try { sessionStorage.setItem(HIGH_SCORE_KEY, String(val)) } catch { /* noop */ }
}

function randomFood(): Pos {
  const occupied = new Set(state.snake.map(p => `${p.x},${p.y}`))
  const free: Pos[] = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return EMPTY
  return free[Math.floor(Math.random() * free.length)]
}

function initSnake() {
  const mid = Math.floor(GRID_SIZE / 2)
  state.snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ]
  state.direction = 'RIGHT'
  state.nextDirection = 'RIGHT'
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // ── 背景 ──
  ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--snake-bg').trim() || '#1a1a2e'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // ── 网格线 ──
  ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--snake-grid').trim() || 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let i = 1; i < GRID_SIZE; i++) {
    const p = i * CELL_SIZE
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, CANVAS_SIZE); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(CANVAS_SIZE, p); ctx.stroke()
  }

  // ── 食物 ──
  if (state.food.x >= 0) {
    ctx.shadowColor = '#ff4757'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ff4757'
    ctx.beginPath()
    const fx = state.food.x * CELL_SIZE + CELL_SIZE / 2
    const fy = state.food.y * CELL_SIZE + CELL_SIZE / 2
    ctx.arc(fx, fy, CELL_SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.beginPath()
    ctx.arc(fx - 3, fy - 3, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── 蛇 ──
  const head = state.snake[0]
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  gradient.addColorStop(0, '#4d96ff')
  gradient.addColorStop(1, '#6bcb77')

  for (let i = state.snake.length - 1; i >= 0; i--) {
    const seg = state.snake[i]
    const isHead = i === 0
    const x = seg.x * CELL_SIZE
    const y = seg.y * CELL_SIZE
    const padding = isHead ? 1 : 2
    const radius = 4

    ctx.fillStyle = isHead ? '#4d96ff' : gradient
    ctx.shadowColor = isHead ? '#4d96ff' : 'transparent'
    ctx.shadowBlur = isHead ? 10 : 0

    // 圆角矩形
    const r = Math.min(radius, CELL_SIZE / 2 - padding)
    ctx.beginPath()
    ctx.moveTo(x + padding + r, y + padding)
    ctx.lineTo(x + CELL_SIZE - padding - r, y + padding)
    ctx.quadraticCurveTo(x + CELL_SIZE - padding, y + padding, x + CELL_SIZE - padding, y + padding + r)
    ctx.lineTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding - r)
    ctx.quadraticCurveTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding, x + CELL_SIZE - padding - r, y + CELL_SIZE - padding)
    ctx.lineTo(x + padding + r, y + CELL_SIZE - padding)
    ctx.quadraticCurveTo(x + padding, y + CELL_SIZE - padding, x + padding, y + CELL_SIZE - padding - r)
    ctx.lineTo(x + padding, y + padding + r)
    ctx.quadraticCurveTo(x + padding, y + padding, x + padding + r, y + padding)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // 蛇眼睛
  if (state.snake.length > 0) {
    const h = state.snake[0]
    const hx = h.x * CELL_SIZE + CELL_SIZE / 2
    const hy = h.y * CELL_SIZE + CELL_SIZE / 2
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(hx - 4, hy - 3, 2.5, 0, Math.PI * 2)
    ctx.arc(hx + 4, hy - 3, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath()
    ctx.arc(hx - 4, hy - 3, 1.2, 0, Math.PI * 2)
    ctx.arc(hx + 4, hy - 3, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function tick() {
  state.direction = state.nextDirection

  // 计算新蛇头
  const head = state.snake[0]
  const newHead: Pos = { ...head }
  switch (state.direction) {
    case 'UP':    newHead.y--; break
    case 'DOWN':  newHead.y++; break
    case 'LEFT':  newHead.x--; break
    case 'RIGHT': newHead.x++; break
  }

  // 撞墙检测
  if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
    gameOver()
    return
  }

  // 撞自身检测
  if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    gameOver()
    return
  }

  state.snake.unshift(newHead)

  // 吃食物
  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    score.value++
    const f = randomFood()
    if (f === EMPTY) {
      // 所有格子填满（理论上不可能在 15×15 出现，但兜底）
      gameOver()
      return
    }
    state.food = f
  } else {
    state.snake.pop()
  }

  draw()
}

function gameOver() {
  gameState.value = 'over'
  if (state.timer) {
    clearTimeout(state.timer as number)
    state.timer = 0
  }
  if (score.value > highScore.value) {
    highScore.value = score.value
    saveHighScore(score.value)
  }
  draw()
}

function getSpeed(): number {
  // 分数越高速度越快，但有限度
  const base = 160
  const minSpeed = 60
  return Math.max(minSpeed, base - score.value * 4)
}

function loop() {
  if (gameState.value !== 'playing') return
  tick()
  if (gameState.value === 'playing') {
    state.timer = setTimeout(loop, getSpeed())
  }
}

function startGame() {
  if (gameState.value === 'playing') return
  score.value = 0
  initSnake()
  const f = randomFood()
  state.food = f === EMPTY ? { x: 5, y: 5 } : f
  gameState.value = 'playing'
  if (state.timer) clearTimeout(state.timer as number)
  draw()
  state.timer = setTimeout(loop, getSpeed())
}

function handleKeydown(e: KeyboardEvent) {
  if (gameState.value !== 'playing') return
  const dirMap: Record<string, Dir> = {
    ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
    w: 'UP', W: 'UP', s: 'DOWN', S: 'DOWN',
    a: 'LEFT', A: 'LEFT', d: 'RIGHT', D: 'RIGHT',
  }
  const newDir = dirMap[e.key]
  if (!newDir) return

  e.preventDefault()
  // 禁止反向
  const opposites: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
  if (opposites[newDir] === state.direction) return
  state.nextDirection = newDir
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  nextTick(() => {
    initSnake()
    state.food = { x: 7, y: 7 }
    draw()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (state.timer) clearTimeout(state.timer as number)
})
</script>

<style lang="less" scoped>
.not-found-view {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
}

.not-found-content {
  text-align: center;
  max-width: 480px;
}

.not-found-code {
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  margin: 0 0 8px;
  color: var(--accent);
  opacity: 0.7;
  letter-spacing: -2px;
}

.not-found-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.not-found-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 28px;
}

.not-found-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  background: var(--accent);
  color: #fff;

  &--secondary {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border);

    &:hover {
      background: var(--border);
      color: var(--text-primary);
    }
  }

  svg {
    flex-shrink: 0;
  }
}

// ─── 贪吃蛇 ─────────────────────────────────────────
.snake-section {
  margin-bottom: 28px;
}

.snake-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.snake-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.snake-scores {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.snake-score-item strong {
  color: var(--accent);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 1rem;
}

.snake-score-divider {
  opacity: 0.3;
}

.snake-canvas-wrap {
  position: relative;
  width: 360px;
  height: 360px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 20px color-mix(in srgb, var(--accent) 15%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--accent) 20%, transparent);
}

.snake-canvas {
  display: block;
  width: 360px;
  height: 360px;
  // 通过 CSS 变量传递颜色给 canvas 渲染
  --snake-bg: var(--bg-primary, #1a1a2e);
  --snake-grid: color-mix(in srgb, var(--text-secondary, #fff) 10%, transparent);
}

.snake-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(in srgb, var(--bg-primary) 70%, transparent);
  backdrop-filter: blur(2px);
  cursor: pointer;
  z-index: 2;
  border-radius: 12px;
  transition: background 0.3s ease;

  &:hover {
    background: color-mix(in srgb, var(--bg-primary) 60%, transparent);
  }
}

.snake-overlay-icon {
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 4px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.snake-overlay-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}

.snake-overlay-sub {
  font-size: 0.9rem;
  color: var(--accent);
  font-weight: 600;
}

.snake-overlay-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-top: 4px;
}

// ─── 推荐链接 ──────────────────────────────────────
.not-found-suggestions {
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.suggestions-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 14px;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.suggestion-link {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.85rem;
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

// ─── 响应式 ─────────────────────────────────────────
@media (max-width: 480px) {
  .not-found-code { font-size: 56px; }

  .not-found-actions { flex-direction: column; }
  .not-found-btn { width: 100%; justify-content: center; }

  .snake-canvas-wrap,
  .snake-canvas {
    width: 280px;
    height: 280px;
  }

  .snake-header {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 340px) {
  .snake-canvas-wrap,
  .snake-canvas {
    width: 220px;
    height: 220px;
  }
}

// 降低动画偏好（与Windows系统中的"窗口内的动画控件和元素"有冲突，全部都使用动画）
/* @media (prefers-reduced-motion: reduce) {
  .snake-overlay { backdrop-filter: none; }
} */
</style>
