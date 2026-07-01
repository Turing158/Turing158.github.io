<!--
  密码强度检测工具
  实时分析密码强度，显示进度条、检查清单和破解时间估算
-->
<template>
  <div class="tool-form">
    <!-- 密码输入 -->
    <label class="tool-label">{{ $t('tools.passwordStrength.inputLabel') }}</label>
    <div class="ps-input-wrap">
      <BlogInput
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="$t('tools.passwordStrength.placeholder')"
        @input="onInput"
      />
      <button
        class="ps-toggle-visibility"
        :title="$t('tools.passwordStrength.toggleVisibility')"
        @click="showPassword = !showPassword"
      >
        <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </button>
    </div>

    <!-- 强度进度条 -->
    <div v-if="password" class="ps-strength-section">
      <div class="ps-strength-header">
        <span class="tool-label">{{ $t('tools.passwordStrength.strength') }}</span>
        <span class="ps-level-text" :class="`level-${level.class}`">{{ level.label }}</span>
      </div>
      <div class="ps-bar-track">
        <div
          class="ps-bar-fill"
          :class="`level-${level.class}`"
          :style="{ width: level.percent + '%' }"
        ></div>
      </div>

      <!-- 破解时间估算 -->
      <div class="ps-crack-time">
        <span class="ps-crack-label">{{ $t('tools.passwordStrength.crackTime') }}</span>
        <span class="ps-crack-value">{{ crackTimeText }}</span>
      </div>

      <!-- 检查清单 -->
      <div class="ps-checklist">
        <div class="ps-check-title">{{ $t('tools.passwordStrength.requirements') }}</div>
        <div
          v-for="item in checks"
          :key="item.key"
          class="ps-check-item"
          :class="{ passed: item.passed }"
        >
          <span class="ps-check-icon">{{ item.passed ? '✅' : '❌' }}</span>
          <span class="ps-check-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <div v-if="!password" class="ps-empty-hint">
      {{ $t('tools.passwordStrength.emptyHint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'

const { t } = useI18n()
const password = ref('')
const showPassword = ref(false)

function onInput() {
  // 触发 computed 更新
}

// 检查项
interface CheckItem {
  key: string
  label: string
  passed: boolean
}

const checks = computed<CheckItem[]>(() => {
  const pwd = password.value
  return [
    {
      key: 'length',
      label: t('tools.passwordStrength.checkLength'),
      passed: pwd.length >= 8,
    },
    {
      key: 'lowercase',
      label: t('tools.passwordStrength.checkLowercase'),
      passed: /[a-z]/.test(pwd),
    },
    {
      key: 'uppercase',
      label: t('tools.passwordStrength.checkUppercase'),
      passed: /[A-Z]/.test(pwd),
    },
    {
      key: 'number',
      label: t('tools.passwordStrength.checkNumber'),
      passed: /\d/.test(pwd),
    },
    {
      key: 'symbol',
      label: t('tools.passwordStrength.checkSymbol'),
      passed: /[^a-zA-Z0-9]/.test(pwd),
    },
  ]
})

// 得分计算（0-100）
function calculateScore(pwd: string): number {
  if (!pwd) return 0
  let score = 0

  // 基础长度分（最高 25）
  score += Math.min(25, Math.floor(pwd.length * 2.5))

  // 字符多样性（最高 25）
  const hasLower = /[a-z]/.test(pwd)
  const hasUpper = /[A-Z]/.test(pwd)
  const hasDigit = /\d/.test(pwd)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pwd)
  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  score += varietyCount * 6

  // 复杂度加分（最高 50）
  // 同时包含大小写 +10
  if (hasLower && hasUpper) score += 10
  // 包含数字 + 符号 +10
  if (hasDigit && hasSymbol) score += 10
  // 长度超过 12 +10
  if (pwd.length >= 12) score += 10
  // 长度超过 16 +10
  if (pwd.length >= 16) score += 10
  // 组合加分：4 种字符 + 长密码 +10
  if (varietyCount === 4 && pwd.length >= 12) score += 10

  return Math.min(100, score)
}

// 强度级别
const level = computed(() => {
  const s = calculateScore(password.value)
  if (s < 25) return { label: t('tools.passwordStrength.weak'), class: 'weak', percent: Math.max(5, s) }
  if (s < 50) return { label: t('tools.passwordStrength.fair'), class: 'fair', percent: s }
  if (s < 75) return { label: t('tools.passwordStrength.strong'), class: 'strong', percent: s }
  return { label: t('tools.passwordStrength.veryStrong'), class: 'very-strong', percent: s }
})

// 破解时间估算
const crackTimeText = computed(() => {
  const pwd = password.value
  if (!pwd) return '—'

  // 基于熵值估算
  let pool = 0
  if (/[a-z]/.test(pwd)) pool += 26
  if (/[A-Z]/.test(pwd)) pool += 26
  if (/\d/.test(pwd)) pool += 10
  if (/[^a-zA-Z0-9]/.test(pwd)) pool += 33

  if (pool === 0) return '—'

  const entropy = Math.log2(pool) * pwd.length

  // 按每秒 10^9 次猜测计算（现代 GPU）
  const guessesPerSecond = 1e9
  const seconds = Math.pow(2, entropy) / guessesPerSecond

  if (seconds < 1) return t('tools.passwordStrength.instant')
  if (seconds < 60) return t('tools.passwordStrength.seconds', { n: Math.floor(seconds) })
  if (seconds < 3600) return t('tools.passwordStrength.minutes', { n: Math.floor(seconds / 60) })
  if (seconds < 86400) return t('tools.passwordStrength.hours', { n: Math.floor(seconds / 3600) })
  if (seconds < 2592000) return t('tools.passwordStrength.days', { n: Math.floor(seconds / 86400) })
  if (seconds < 31536000) return t('tools.passwordStrength.months', { n: Math.floor(seconds / 2592000) })
  if (seconds < 315360000) return t('tools.passwordStrength.years', { n: Math.floor(seconds / 31536000) })
  return t('tools.passwordStrength.centuries')
})
</script>

<style scoped>
.ps-input-wrap {
  position: relative;
}

.ps-input-wrap :deep(.blog-input) {
  padding-right: 44px;
}

.ps-toggle-visibility {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s, background 0.2s;
}

.ps-toggle-visibility:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

/* 强度部分 */
.ps-strength-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ps-strength-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ps-level-text {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
}

.level-weak {
  color: #e74c3c;
}

.level-fair {
  color: #f39c12;
}

.level-strong {
  color: #2ecc71;
}

.level-very-strong {
  color: #27ae60;
}

.ps-bar-track {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.ps-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.ps-bar-fill.level-weak {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
}

.ps-bar-fill.level-fair {
  background: linear-gradient(90deg, #f39c12, #e67e22);
}

.ps-bar-fill.level-strong {
  background: linear-gradient(90deg, #2ecc71, #27ae60);
}

.ps-bar-fill.level-very-strong {
  background: linear-gradient(90deg, #2ecc71, #1abc9c);
}

/* 破解时间 */
.ps-crack-time {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.ps-crack-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.ps-crack-value {
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--accent);
}

/* 检查清单 */
.ps-checklist {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.ps-check-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.ps-check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.ps-check-item.passed {
  color: var(--text-primary);
}

.ps-check-icon {
  font-size: 0.75rem;
  flex-shrink: 0;
}

.ps-check-label {
  line-height: 1.4;
}

/* 空状态提示 */
.ps-empty-hint {
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-align: center;
  padding: 24px 0;
  opacity: 0.6;
}
</style>
