<template>
  <div class="tool-form color-converter">
    <div class="color-picker-section">
      <div class="color-picker-wrapper">
        <input type="color" v-model="value" class="color-picker" />
        <div class="color-swatch" :style="{ backgroundColor: value }"></div>
      </div>
    </div>
    <div class="color-previews">
      <div class="color-item">
        <span class="color-label">HEX</span>
        <div class="color-input-wrapper">
          <BlogInput
            v-model="hexInput"
            placeholder="#000000"
            @input="onHexInput"
          />
          <Button size="small" @click="copyColor('hex')">{{ $t('tools.copy') }}</Button>
        </div>
      </div>
      <div class="color-item">
        <span class="color-label">RGB</span>
        <div class="color-input-wrapper">
          <BlogInput
            v-model="rgbInput"
            placeholder="rgb(0, 0, 0)"
            @input="onRgbInput"
          />
          <Button size="small" @click="copyColor('rgb')">{{ $t('tools.copy') }}</Button>
        </div>
      </div>
      <div class="color-item">
        <span class="color-label">HSL</span>
        <div class="color-input-wrapper">
          <BlogInput
            v-model="hslInput"
            placeholder="hsl(0, 0%, 0%)"
            @input="onHslInput"
          />
          <Button size="small" @click="copyColor('hsl')">{{ $t('tools.copy') }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import { copyText } from '@/utils/copyText'

const { t } = useI18n()
const value = ref('#4a90d9')
const hexInput = ref('#4A90D9')
const rgbInput = ref('rgb(74, 144, 217)')
const hslInput = ref('hsl(209, 66%, 57%)')

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  return h
}

const colorHex = computed(() => value.value.toUpperCase())

const colorRgb = computed(() => {
  const hex = normalizeHex(value.value)
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return 'rgb(?, ?, ?)'
  return `rgb(${r}, ${g}, ${b})`
})

const colorHsl = computed(() => {
  const hex = normalizeHex(value.value)
  const rVal = parseInt(hex.substring(0, 2), 16)
  const gVal = parseInt(hex.substring(2, 4), 16)
  const bVal = parseInt(hex.substring(4, 6), 16)
  if (isNaN(rVal) || isNaN(gVal) || isNaN(bVal)) return 'hsl(?, ?, ?)'
  let r = rVal / 255, g = gVal / 255, b = bVal / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
})

watch(value, () => {
  hexInput.value = colorHex.value
  rgbInput.value = colorRgb.value
  hslInput.value = colorHsl.value
})

function onHexInput() {
  const hex = hexInput.value.trim()
  if (/^#?[0-9A-Fa-f]{6}$/.test(hex) || /^#?[0-9A-Fa-f]{3}$/.test(hex)) {
    value.value = hex.startsWith('#') ? hex : `#${hex}`
  }
}

function onRgbInput() {
  const match = rgbInput.value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      value.value = hex
    }
  }
}

function onHslInput() {
  const match = hslInput.value.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (match) {
    const h = parseInt(match[1]) / 360
    const s = parseInt(match[2]) / 100
    const l = parseInt(match[3]) / 100

    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    const hex = '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
    value.value = hex
  }
}

function copyColor(type: string) {
  const map: Record<string, string> = { hex: hexInput.value, rgb: rgbInput.value, hsl: hslInput.value }
  copyText(map[type], t('tools.copied'))
}
</script>

<style scoped>
.color-converter {
  gap: 20px;
}
.color-picker-section {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
.color-picker-wrapper {
  position: relative;
  display: inline-block;
}
.color-picker {
  width: 120px;
  height: 120px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: none;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}
.color-swatch {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--border);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), transparent 50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.15);
    border-color: var(--accent);
    &::before { opacity: 1; }
  }
  &:active { transform: scale(0.98); }
}
.color-previews {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.color-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.color-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  width: 48px;
  text-align: right;
}
.color-input-wrapper {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  :deep(.animal-input) {
    flex: 1;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9rem;
  }
  :deep(.animal-button) {
    flex-shrink: 0;
    min-width: 64px;
  }
}
</style>
