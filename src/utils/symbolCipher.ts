/**
 * 符文加密机 —— 趣味符号加密纯函数
 *
 * 明文 → UTF-8 字节 → 与密钥流异或 → 逐字节查「符号字母表」得到密文。
 * 密文结构：校验头(2 符号，兼作皮肤指纹) + 逐字节符号 + 校验尾(1 符号，明文字节求和 mod 256)。
 *
 * 定位是趣味级混淆（防偷瞄，不防密码学攻击），密钥可空：
 * 空密钥使用固定种子，同一明文永远得到同一密文。
 *
 * 皮肤（4 套，各 256 个互异符号）从 Unicode 区段过滤生成：
 * 剔除未分配 / 组合符 / 空白 / 控制与格式字符，保证密文全部可见可复制。
 */

export interface CipherSkin {
  /** 皮肤标识（用于组件侧的 key / 事件上报） */
  id: 'star' | 'rune' | 'note' | 'emoji'
  /** 皮肤名称的 i18n key（由组件解析，本模块不依赖 vue-i18n） */
  labelKey: string
  /** 校验头：2 个专属符号，解码时用于识别皮肤 */
  guards: string
  /** 256 个互异符号，下标即字节值 */
  alphabet: string[]
  /** 符号 → 字节值 */
  reverse: Map<string, number>
  /** 前几个符号的样式示例（展示用） */
  sample: string
}

interface SkinDef {
  id: CipherSkin['id']
  labelKey: string
  guards: string
  ranges: [number, number][]
  exclude?: Set<number>
}

const SKIN_DEFS: SkinDef[] = [
  {
    id: 'star',
    labelKey: 'tools.cipher.skinStar',
    guards: '✦✧',
    ranges: [
      [0x25a0, 0x25ff], // 几何图形
      [0x2190, 0x21ff], // 箭头
      [0x2600, 0x27bf], // 杂项符号 + 杂锦符号
      [0x2b00, 0x2b5f], // 星形与补充箭头
    ],
  },
  {
    id: 'rune',
    labelKey: 'tools.cipher.skinRune',
    guards: 'ᚠᚢ',
    ranges: [
      [0x16a0, 0x16f8], // 卢恩
      [0x1680, 0x169c], // 欧甘
      [0x10900, 0x1091f], // 腓尼基
      [0x1f700, 0x1f77f], // 炼金术符号
      [0x1f780, 0x1f7f5], // 几何图形扩展
    ],
  },
  {
    id: 'note',
    labelKey: 'tools.cipher.skinNote',
    guards: '♪♫',
    ranges: [
      [0x2654, 0x2667], // 国际象棋 + 花色
      [0x2669, 0x266f], // 音乐记号
      [0x2680, 0x2689], // 骰子
      [0x1d100, 0x1d1dd], // 音乐符号（补充）
      [0x1f000, 0x1f02b], // 麻将牌
      [0x1f030, 0x1f09f], // 多米诺
    ],
  },
  {
    id: 'emoji',
    labelKey: 'tools.cipher.skinEmoji',
    guards: '🌿🔮',
    ranges: [
      [0x1f600, 0x1f64f], // 表情（排前面，优先入表）
      [0x1f300, 0x1f5ff], // 杂项图形与象形文字
      [0x1f680, 0x1f6c5], // 交通与地图
    ],
    exclude: new Set([0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff]), // 肤色修饰符
  },
]

// 不可入表的字符：未分配 / 控制 / 格式（含 ZWJ、变体选择符）/ 组合 / 空白
const BAD_RE = /[\p{Cn}\p{Cc}\p{Cf}\p{Mn}\p{Me}\p{Mc}\p{Zs}\p{Zl}\p{Zp}]/u

const ALPHABET_SIZE = 256
/** 校验头符号数 */
const GUARD_LEN = 2

function buildSkin(def: SkinDef): CipherSkin {
  const uniq: string[] = []
  const seen = new Set<string>()
  const push = (ch: string) => {
    if (seen.has(ch)) return
    if (BAD_RE.test(ch)) return
    seen.add(ch)
    uniq.push(ch)
  }
  for (const g of def.guards) push(g)
  for (const [a, b] of def.ranges) {
    for (let cp = a; cp <= b; cp++) {
      if (def.exclude?.has(cp)) continue
      push(String.fromCodePoint(cp))
    }
  }
  if (uniq.length < GUARD_LEN + ALPHABET_SIZE) {
    throw new Error(`皮肤 ${def.id} 可用符号不足: ${uniq.length}`)
  }
  const alphabet = uniq.slice(GUARD_LEN, GUARD_LEN + ALPHABET_SIZE)
  return {
    id: def.id,
    labelKey: def.labelKey,
    guards: def.guards,
    alphabet,
    reverse: new Map(alphabet.map((ch, i) => [ch, i])),
    sample: alphabet.slice(0, 12).join(' '),
  }
}

/** 四套密文皮肤（模块加载时构建一次） */
export const CIPHER_SKINS: CipherSkin[] = SKIN_DEFS.map(buildSkin)

/** FNV-1a 32 位哈希：密钥字符串 → 种子（空串返回初值，非零） */
function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (const b of new TextEncoder().encode(str)) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** xorshift32 密钥流：每次调用产出一个字节（纯位移，跨引擎确定） */
function keystream(seed: number): () => number {
  let x = seed || 0x9e3779b9
  return () => {
    x ^= x << 13
    x >>>= 0
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    return x & 0xff
  }
}

/** 加密：明文 → [字节..., 校验和] → ⊕密钥流 → 逐字节查表 */
export function cipherEncrypt(text: string, key: string, skinIndex: number): string {
  const skin = CIPHER_SKINS[skinIndex] ?? CIPHER_SKINS[0]
  const plain = new TextEncoder().encode(text)
  let sum = 0
  for (const b of plain) sum += b
  const data: number[] = [...plain, sum & 0xff]
  const next = keystream(fnv1a(key))
  let out = skin.guards
  for (const b of data) out += skin.alphabet[b ^ next()]
  return out
}

export type CipherDecryptResult =
  | { ok: true; text: string; skin: CipherSkin }
  | { ok: false; reason: 'empty' | 'foreign' | 'bad' | 'invalid' }

/**
 * 解密：按校验头识别皮肤 → 逆查表 → ⊕密钥流 → 校验尾比对 → UTF-8 严格解码。
 * reason 含义：empty 输入为空 / foreign 混入字母表外字符 / bad 损坏或密钥错误 / invalid 缺少校验头。
 */
export function cipherDecrypt(text: string, key: string): CipherDecryptResult {
  const cleaned = text.replace(/\s+/g, '')
  if (!cleaned) return { ok: false, reason: 'empty' }
  for (const skin of CIPHER_SKINS) {
    if (!cleaned.startsWith(skin.guards)) continue
    // 注意用 guards.length 而非常量 2：🌿🔮 这类代理对校验头占 4 个 UTF-16 码元
    const body = [...cleaned.slice(skin.guards.length)]
    const next = keystream(fnv1a(key))
    const data: number[] = []
    for (const ch of body) {
      const idx = skin.reverse.get(ch)
      if (idx === undefined) return { ok: false, reason: 'foreign' }
      data.push(idx ^ next())
    }
    if (data.length === 0) return { ok: false, reason: 'bad' }
    const sum = data.pop() as number
    const calc = data.reduce((a, b) => a + b, 0) & 0xff
    if (sum !== calc) return { ok: false, reason: 'bad' }
    try {
      return {
        ok: true,
        text: new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(data)),
        skin,
      }
    } catch {
      return { ok: false, reason: 'bad' }
    }
  }
  return { ok: false, reason: 'invalid' }
}
