import { onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import { useAchievements } from '@/composables/useAchievements'

/**
 * Konami Code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
 */
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

let currentIndex = 0
let enabled = false

function fireConfetti() {
  // Fire from both sides
  const defaults = {
    spread: 60,
    ticks: 100,
    gravity: 0.6,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c084fc'],
  }

  // Left burst
  confetti({
    ...defaults,
    angle: 60,
    origin: { x: 0, y: 0.6 },
    particleCount: 80,
  })

  // Right burst
  confetti({
    ...defaults,
    angle: 120,
    origin: { x: 1, y: 0.6 },
    particleCount: 80,
  })

  // Center burst (delayed)
  setTimeout(() => {
    confetti({
      ...defaults,
      angle: 90,
      origin: { x: 0.5, y: 0.4 },
      particleCount: 120,
      spread: 100,
      startVelocity: 45,
    })
  }, 150)

  // Second wave
  setTimeout(() => {
    confetti({
      ...defaults,
      angle: 60,
      origin: { x: 0, y: 0.5 },
      particleCount: 60,
      spread: 80,
    })
    confetti({
      ...defaults,
      angle: 120,
      origin: { x: 1, y: 0.5 },
      particleCount: 60,
      spread: 80,
    })
  }, 400)
}

function handleKeydown(e: KeyboardEvent) {
  if (!enabled) return

  const key = e.key

  // Reset if wrong key (but allow partial match restart)
  const expected = KONAMI_CODE[currentIndex]
  if (key.toLowerCase() === expected) {
    currentIndex++
    if (currentIndex === KONAMI_CODE.length) {
      // Sequence complete!
      fireConfetti()
      currentIndex = 0
      // 解锁成就：彩蛋猎人 + 隐藏导航
      const achievements = useAchievements()
      achievements.unlock('egg-hunter')
      achievements.unlockNav()
    }
  } else if (key === expected) {
    currentIndex++
    if (currentIndex === KONAMI_CODE.length) {
      fireConfetti()
      currentIndex = 0
      const achievements = useAchievements()
      achievements.unlock('egg-hunter')
      achievements.unlockNav()
    }
  } else {
    // Check if the current key could be the start of a new sequence
    // (handles cases like ArrowUp in the middle of rapid inputs)
    currentIndex = key.toLowerCase() === KONAMI_CODE[0] || key === KONAMI_CODE[0] ? 1 : 0
  }
}

export function useKonamiCode() {
  onMounted(() => {
    enabled = true
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    enabled = false
    window.removeEventListener('keydown', handleKeydown)
  })
}
