<template>
  <div class="tool-form cipher-tool">
    <!-- 明文 / 密文 -->
    <div class="cipher-label-row">
      <label class="tool-label">{{ $t('tools.cipher.inputLabel') }}</label>
      <span class="cipher-mode" :class="{ 'is-dec': dir === 'decrypt' }">
        {{ dir === 'encrypt' ? $t('tools.cipher.modeEnc') : $t('tools.cipher.modeDec') }}
      </span>
      <button class="cipher-linkish" type="button" @click="fillSample">
        ✨ {{ $t('tools.cipher.sample') }}
      </button>
    </div>
    <BlogInput
      v-model="input"
      type="textarea"
      :rows="4"
      :placeholder="$t('tools.cipher.placeholder')"
    />
    <div class="cipher-io-hint">{{ ioHint }}</div>

    <!-- 密钥 -->
    <label class="tool-label">
      {{ $t('tools.cipher.keyLabel') }}
      <span class="cipher-hint">{{ $t('tools.cipher.keyHint') }}</span>
    </label>
    <div class="cipher-key-row">
      <BlogInput
        v-model="key"
        :type="keyVisible ? 'text' : 'password'"
        :placeholder="$t('tools.cipher.keyPlaceholder')"
        class="cipher-key-input"
      >
        <template #suffix>
          <button
            class="cipher-eye"
            type="button"
            :title="$t('tools.cipher.toggleKey')"
            @click="keyVisible = !keyVisible"
          >{{ keyVisible ? '🙈' : '👁' }}</button>
        </template>
      </BlogInput>
      <Button size="small" @click="randomKey">🎲 {{ $t('tools.cipher.random') }}</Button>
    </div>

    <!-- 密文皮肤 -->
    <label class="tool-label">
      {{ $t('tools.cipher.skinLabel') }}
      <span class="cipher-hint">{{ $t('tools.cipher.skinHint') }}</span>
    </label>
    <div class="cipher-skins">
      <button
        v-for="(skin, i) in CIPHER_SKINS"
        :key="skin.id"
        type="button"
        class="cipher-skin-chip"
        :class="{ 'is-active': i === activeSkin }"
        @click="selectSkin(i)"
      >{{ $t(skin.labelKey) }}</button>
    </div>
    <div class="cipher-skin-sample">
      {{ $t('tools.cipher.skinSample', { sample: CIPHER_SKINS[activeSkin].sample }) }}
    </div>

    <!-- 操作 -->
    <div class="tool-actions">
      <Button type="primary" size="small" @click="setDir('encrypt')">✦ {{ $t('tools.cipher.encrypt') }}</Button>
      <Button size="small" @click="setDir('decrypt')">✧ {{ $t('tools.cipher.decrypt') }}</Button>
      <Button size="small" @click="swap">{{ $t('tools.cipher.swap') }} ⇄</Button>
      <Button size="small" @click="copyResult">{{ $t('tools.cipher.copy') }}</Button>
      <Button danger size="small" @click="clearAll">{{ $t('tools.cipher.clear') }}</Button>
    </div>

    <!-- 输出 -->
    <label class="tool-label">
      {{ $t('tools.cipher.outputLabel') }}
      <span class="cipher-hint">{{ $t('tools.cipher.outputHint') }}</span>
    </label>
    <div class="cipher-output">
      <template v-if="spanList">
        <span
          v-for="(sym, i) in spanList"
          :key="`${nonce}-${i}`"
          class="cipher-sym"
          :style="{ color: sym.color, '--d': sym.delay + 'ms' }"
          :title="sym.title"
        >{{ sym.ch }}</span>
      </template>
      <span v-else-if="outState.kind === 'symbols'" class="cipher-plain-text">{{ outState.out }}</span>
      <span v-else-if="outState.kind === 'text'" class="cipher-plain-text">{{ outState.text }}</span>
      <span v-else-if="outState.kind === 'error'" class="cipher-error">✖ {{ outState.msg }}</span>
      <span v-else class="cipher-idle-hint">{{ outState.msg }}</span>
    </div>
    <div class="cipher-stats">
      <template v-for="(seg, i) in statsSegments" :key="i">
        <span :class="{ 'is-ok': seg.ok, 'is-warn': seg.warn }">{{ seg.text }}</span>
        <span v-if="i < statsSegments.length - 1" class="cipher-stats-sep">◆</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import BlogInput from '@/components/common/BlogInput.vue'
import { Button } from 'animal-island-vue'
import { copyText } from '@/utils/copyText'
import { CIPHER_SKINS, cipherEncrypt, cipherDecrypt } from '@/utils/symbolCipher'

const { t } = useI18n()

// ── 状态 ──
type OutState =
  | { kind: 'hint'; msg: string }
  | { kind: 'symbols'; out: string; owners: string[] }
  | { kind: 'text'; text: string }
  | { kind: 'error'; msg: string }

const input = ref('')
const key = ref('')
const keyVisible = ref(false)
const activeSkin = ref(0)
const dir = ref<'encrypt' | 'decrypt'>('encrypt')
const outState = ref<OutState>({ kind: 'hint', msg: '' })
const statsSegments = ref<{ text: string; ok?: boolean; warn?: boolean }[]>([])
/** 每次输出变化自增，作为 span 的 key 前缀让入场动画重放 */
const nonce = ref(0)

// 符号配色（主题无关的中调色，明暗主题下都可读）
const PALETTE = ['#E8A33D', '#D96C6C', '#5FB3D9', '#9C8AE0', '#6FCF8E', '#E0709A']
/** 超过该符号数改用纯文本渲染，避免一次塞入过多 DOM */
const MAX_SPANS = 500

const ioHint = computed(() =>
  dir.value === 'encrypt'
    ? t('tools.cipher.ioHintEnc')
    : t('tools.cipher.ioHintDec'),
)

// ── 字节 → 原字符映射（悬停提示「这个符号来自哪个字」） ──
function byteOwners(text: string): string[] {
  const enc = new TextEncoder()
  const owners: string[] = []
  for (const ch of text) {
    const n = enc.encode(ch).length
    for (let k = 0; k < n; k++) owners.push(ch)
  }
  return owners
}

// ── 输出渲染：符号模式下每个符号一个 span（配色 + 悬停提示） ──
const spanList = computed(() => {
  const st = outState.value
  if (st.kind !== 'symbols') return null
  const chars = [...st.out]
  if (chars.length > MAX_SPANS + 2) return null
  return chars.map((ch, i) => {
    const isGuard = i < 2
    const isSum = i === chars.length - 1
    const owner = isSum
      ? t('tools.cipher.sumTip')
      : isGuard
        ? t('tools.cipher.guardTip')
        : st.owners[i - 2] ?? t('tools.cipher.unknownChar')
    return {
      ch,
      title: `${ch} ← ${owner}`,
      color: isGuard || isSum ? 'var(--accent)' : PALETTE[(i - 2) % PALETTE.length],
      delay: Math.min(i * 6, 400),
    }
  })
})

// ── 主流程 ──
function run() {
  nonce.value++
  const text = input.value
  if (!text.trim()) {
    outState.value = {
      kind: 'hint',
      msg: dir.value === 'encrypt' ? t('tools.cipher.emptyHint') : t('tools.cipher.emptyHintDec'),
    }
    statsSegments.value = []
    return
  }

  if (dir.value === 'encrypt') {
    const out = cipherEncrypt(text, key.value, activeSkin.value)
    outState.value = { kind: 'symbols', out, owners: byteOwners(text) }
    const bytes = new TextEncoder().encode(text).length
    statsSegments.value = [
      { text: t('tools.cipher.statsPlain', { chars: text.length, bytes }) },
      { text: t('tools.cipher.statsCipher', { n: [...out].length }) },
      { text: t('tools.cipher.roundtrip'), ok: true },
      { text: t('tools.cipher.skinUsed', { skin: t(CIPHER_SKINS[activeSkin.value].labelKey) }) },
    ]
    return
  }

  const r = cipherDecrypt(text, key.value)
  if (!r.ok) {
    if (r.reason === 'empty') {
      outState.value = { kind: 'hint', msg: t('tools.cipher.emptyHintDec') }
      statsSegments.value = []
      return
    }
    outState.value = { kind: 'error', msg: t(`tools.cipher.err${r.reason.charAt(0).toUpperCase()}${r.reason.slice(1)}`) }
    statsSegments.value = [
      {
        text: r.reason === 'bad' ? t('tools.cipher.errBadKeyHint') : t('tools.cipher.errForeignHint'),
        warn: true,
      },
    ]
    return
  }

  outState.value = { kind: 'text', text: r.text }
  const idx = CIPHER_SKINS.indexOf(r.skin)
  if (idx !== -1 && idx !== activeSkin.value) {
    // 解密自动识别皮肤：胶囊跟着切换
    activeSkin.value = idx
  }
  statsSegments.value = [
    { text: t('tools.cipher.decOk'), ok: true },
    { text: t('tools.cipher.decSkin', { skin: t(r.skin.labelKey) }) },
    { text: t('tools.cipher.decChars', { n: r.text.length }) },
  ]
}

// ── 交互 ──
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function schedule() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(run, 150)
}
watch([input, key], schedule)
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

function setDir(d: 'encrypt' | 'decrypt') {
  dir.value = d
  run()
}

function selectSkin(i: number) {
  activeSkin.value = i
  run()
}

function swap() {
  const st = outState.value
  const out = st.kind === 'symbols' ? st.out : st.kind === 'text' ? st.text : ''
  if (!out) return
  input.value = out
  dir.value = dir.value === 'encrypt' ? 'decrypt' : 'encrypt'
  run()
}

function copyResult() {
  const st = outState.value
  const out = st.kind === 'symbols' ? st.out : st.kind === 'text' ? st.text : ''
  if (!out) return
  copyText(out, t('tools.copied'))
}

function clearAll() {
  input.value = ''
  key.value = ''
  run()
}

function randomKey() {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let s = ''
  for (let i = 0; i < 10; i++) s += pool[Math.floor(Math.random() * pool.length)]
  key.value = s
  keyVisible.value = true
}

function fillSample() {
  input.value = t('tools.cipher.sampleText')
  dir.value = 'encrypt'
  run()
}
</script>

<style lang="less" scoped>
.cipher-tool {
  --cipher-font: 'Segoe UI Symbol', 'Segoe UI Emoji', 'Noto Color Emoji', 'Noto Sans SC', sans-serif;
}

/* 标签行：标签 + 模式胶囊 + 示例入口 */
.cipher-label-row {
  display: flex;
  align-items: center;
  gap: 8px;

  .tool-label {
    margin: 0;
    flex-shrink: 0;
  }
}

.cipher-mode {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg-secondary);
  padding: 2px 10px;
  --pxs: 2px; clip-path: var(--pxc);
  border: 1px solid transparent; border-image: var(--px-frame-accent) 6 / calc(2 * var(--pxs)) stretch;
  transition: color 0.2s, border-image 0.2s;

  &.is-dec {
    color: #C97B2D;
    border-image-source: var(--px-frame);
  }
}

.cipher-linkish {
  margin-left: auto;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--accent);
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

.cipher-io-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.85;
}

.cipher-hint {
  font-weight: 400;
  font-size: 0.75rem;
  opacity: 0.85;
  margin-left: 4px;
}

/* 密钥行 */
.cipher-key-row {
  display: flex;
  gap: 8px;
  align-items: stretch;

  .cipher-key-input {
    flex: 1;

    :deep(.blog-input-field) {
      letter-spacing: 1px;
    }
  }
}

.cipher-eye {
  background: none;
  border: none;
  padding: 0 4px;
  font-size: 0.9rem;
  cursor: pointer;
  line-height: 1;
  color: var(--text-secondary);
  transition: color 0.2s;

  &:hover { color: var(--accent); }
}

/* 皮肤胶囊 */
.cipher-skins {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cipher-skin-chip {
  cursor: pointer;
  user-select: none;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: inherit;
  padding: 5px 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  transition: color 0.15s, background 0.15s, border-image 0.15s, transform 0.15s;

  &:hover {
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  &.is-active {
    color: #fff;
    background: var(--accent);
    border-image-source: var(--px-frame-accent);
  }
}

.cipher-skin-sample {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-family: var(--cipher-font);
  letter-spacing: 1px;
}

/* 输出区 */
.cipher-output {
  min-height: 96px;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid transparent; border-image: var(--px-frame) 6 / calc(2 * var(--pxs)) stretch;
  --pxs: 3px; clip-path: var(--pxc);
  padding: 12px 14px;
  font-family: var(--cipher-font);
  font-size: 1.2rem;
  line-height: 1.5;
  letter-spacing: 3px;
  word-break: break-all;
}

/* 悬停仅显示原文提示（title），不做放大 */
.cipher-sym {
  display: inline-block;
  animation: cipher-pop 0.22s both;
  animation-delay: var(--d);
  cursor: default;
}

@keyframes cipher-pop {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.5);
  }
}

.cipher-plain-text {
  font-size: 0.9rem;
  letter-spacing: normal;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.cipher-error {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: normal;
  color: var(--fgColor-danger);
}

.cipher-idle-hint {
  font-size: 0.85rem;
  letter-spacing: normal;
  color: var(--text-secondary);
}

/* 统计行 */
.cipher-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);

  .is-ok { color: var(--accent); font-weight: 700; }
  .is-warn { color: #C97B2D; font-weight: 700; }
}

.cipher-stats-sep {
  opacity: 0.4;
}
</style>
