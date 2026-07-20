/**
 * format_token_usage.js
 * =====================
 * 用法
 * ----
 *     node format_token_usage.js <輸入檔.sql> <輸出檔.json>
 *
 * 範例
 * ----
 *     node format_token_usage.js usage.sql usage.json
 */

import { readFile, writeFile } from 'node:fs/promises'

// ---------------------------------------------------------------------------
// 表的欄位順序 / 預設值 / model 來源
// ---------------------------------------------------------------------------
const TABLES = {
  proxy: {
    prefix: 'INSERT INTO "proxy_request_logs"',
    columns: [
      'request_id', 'provider_id', 'app_type', 'model', 'request_model',
      'input_tokens', 'output_tokens', 'cache_read_tokens', 'cache_creation_tokens',
      'input_cost_usd', 'output_cost_usd', 'cache_read_cost_usd', 'cache_creation_cost_usd',
      'total_cost_usd', 'latency_ms', 'first_token_ms', 'duration_ms',
      'status_code', 'error_message', 'session_id', 'provider_type',
      'is_streaming', 'cost_multiplier', 'created_at',
      'data_source', 'pricing_model', 'input_token_semantics',
    ],
    defaults: {
      input_tokens: 0, output_tokens: 0,
      cache_read_tokens: 0, cache_creation_tokens: 0,
      input_cost_usd: '0', output_cost_usd: '0',
      cache_read_cost_usd: '0', cache_creation_cost_usd: '0',
      total_cost_usd: '0',
      status_code: 0,
    },
    modelKey: 'request_model',
  },
  rollups: {
    prefix: 'INSERT INTO "usage_daily_rollups"',
    columns: [
      'date', 'app_type', 'provider_id', 'model', 'request_model',
      'pricing_model', 'request_count', 'success_count',
      'input_tokens', 'output_tokens', 'cache_read_tokens', 'cache_creation_tokens',
      'total_cost_usd', 'avg_latency_ms', 'input_token_semantics',
    ],
    defaults: {
      input_tokens: 0, output_tokens: 0,
      cache_read_tokens: 0, cache_creation_tokens: 0,
      total_cost_usd: '0',
      request_count: 0,
      success_count: 0,
      avg_latency_ms: 0,
    },
    modelKey: 'model',
  },
}

// 前綴 -> 模式，供一行判別用
const PREFIX_TO_MODE = Object.fromEntries(
  Object.entries(TABLES).map(([mode, cfg]) => [cfg.prefix, mode]),
)
// 共同前綴（都一樣是 'INSERT INTO "'），加速判斷
const COMMON_PREFIX = 'INSERT INTO "'

// ---------------------------------------------------------------------------
// 公共函式
// ---------------------------------------------------------------------------
function parseSqlValues(line) {
  /** 解析一行 INSERT 的 VALUES (...) 部分，回傳 list。 */
  const start = line.indexOf('VALUES (') + 'VALUES ('.length
  const n = line.length
  const values = []
  let i = start

  while (i < n) {
    while (i < n && ' \t\r\n'.includes(line[i])) i++
    if (i >= n || line[i] === ')') break
    if (line[i] === ',') { i++; continue }

    if (line[i] === "'") {
      i++
      const chars = []
      while (i < n) {
        if (line[i] === "'") {
          if (i + 1 < n && line[i + 1] === "'") {
            chars.push("'")
            i += 2
          } else {
            i++
            break
          }
        } else {
          chars.push(line[i])
          i++
        }
      }
      values.push(chars.join(''))
    } else {
      let j = i
      while (j < n && line[j] !== ',' && line[j] !== ')') j++
      const token = line.slice(i, j).trim()
      if (token.toUpperCase() === 'NULL') values.push(null)
      else if (token.includes('.')) values.push(parseFloat(token))
      else values.push(parseInt(token, 10))
      i = j
    }
  }
  return values
}

function safeGet(vals, key, columns, defaults) {
  /** 取值：優先用 vals[idx]（非 null/undefined），否則用 defaults，否則 null。 */
  const idx = columns.indexOf(key)
  if (idx < vals.length) {
    const v = vals[idx]
    if (v !== null && v !== undefined) return v
  }
  return Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : null
}

function parseProviderMap(text) {
  /** 從 INSERT INTO "providers" 建出 {id: name} 對照表。 */
  const prov = {}
  let buf = null

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('INSERT INTO "providers"')) {
      buf = line
      if (buf.trimEnd().endsWith(');')) {
        const vals = parseSqlValues(buf)
        prov[vals[0]] = vals[2]
        buf = null
      }
    } else if (buf !== null) {
      buf += '\n' + line
      if (line.trimEnd().endsWith(');')) {
        const vals = parseSqlValues(buf)
        prov[vals[0]] = vals[2]
        buf = null
      }
    }
  }
  return prov
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDateFromTs(ts) {
  /** 將 created_at（Unix timestamp，秒）轉為 yyyy/MM/dd。 */
  if (ts == null) return null
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
}

function formatDateFromStr(dateStr) {
  /** 將 date 欄位（預期 yyyy-MM-dd）轉為 yyyy/MM/dd。 */
  if (!dateStr) return null
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  return String(dateStr)
}

// ---------------------------------------------------------------------------
// 輸出一行（共用欄位）
// ---------------------------------------------------------------------------
function buildRow(vals, columns, defaults, modelKey, provMap, mode) {
  /** 將一組解析後的 vals 轉為輸出 dict；Returns null 表示該跳過。 */
  // proxy 模式只保留 status_code = 200
  if (mode === 'proxy' && safeGet(vals, 'status_code', columns, defaults) !== 200) {
    return null
  }

  const pid = safeGet(vals, 'provider_id', columns, defaults)
  const provider = (pid != null && provMap[pid] != null) ? provMap[pid] : ''

  let date
  if (mode === 'proxy') {
    const ts = safeGet(vals, 'created_at', columns, defaults)
    date = formatDateFromTs(ts)
  } else {
    date = formatDateFromStr(safeGet(vals, 'date', columns, defaults))
  }

  return {
    date,
    provider,
    model: safeGet(vals, modelKey, columns, defaults),
    tokens: {
      input: safeGet(vals, 'input_tokens', columns, defaults),
      output: safeGet(vals, 'output_tokens', columns, defaults),
      cache_read: safeGet(vals, 'cache_read_tokens', columns, defaults),
      cache_creation: safeGet(vals, 'cache_creation_tokens', columns, defaults),
    },
    costs: {
      total: safeGet(vals, 'total_cost_usd', columns, defaults),
      unit: 'USD',
    },
  }
}

// ---------------------------------------------------------------------------
// 主解析：一次讀檔，同時收集兩表
// ---------------------------------------------------------------------------
function parseFile(text) {
  const provMap = parseProviderMap(text)

  const rows = []
  let buf = null
  let bufMode = null

  for (const line of text.split(/\r?\n/)) {
    // 快速判斷：只處理 INSERT INTO " 開頭的行、或正在緩衝的多行語句
    if (line.startsWith(COMMON_PREFIX)) {
      for (const [prefix, mode] of Object.entries(PREFIX_TO_MODE)) {
        if (line.startsWith(prefix)) {
          buf = line
          bufMode = mode
          if (buf.trimEnd().endsWith(');')) {
            const vals = parseSqlValues(buf)
            const cfg = TABLES[bufMode]
            const row = buildRow(vals, cfg.columns, cfg.defaults, cfg.modelKey, provMap, bufMode)
            if (row !== null) rows.push(row)
            buf = null
            bufMode = null
          }
          break
        }
      }
    } else if (buf !== null) {
      buf += '\n' + line
      if (line.trimEnd().endsWith(');')) {
        const vals = parseSqlValues(buf)
        const cfg = TABLES[bufMode]
        const row = buildRow(vals, cfg.columns, cfg.defaults, cfg.modelKey, provMap, bufMode)
        if (row !== null) rows.push(row)
        buf = null
        bufMode = null
      }
    }
  }

  return rows
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
async function main() {
  const DOC = `format_token_usage.js
從 usage.sql 同時解析 proxy_request_logs 與 usage_daily_rollups，輸出 JSON。
用法：node format_token_usage.js <輸入檔.sql> <輸出檔.json>`

  const args = process.argv.slice(2)
  if (args.length !== 2) {
    console.log(DOC)
    console.log(`[錯誤] 用法：node ${process.argv[1]} <輸入檔.sql> <輸出檔.json>`)
    process.exit(1)
  }

  const [inputPath, outputPath] = args

  const text = await readFile(inputPath, 'utf-8')
  const rows = parseFile(text)
  await writeFile(outputPath, JSON.stringify(rows, null, 2), 'utf-8')

  // 粗略統計：對應到的 provider 數（不含空字串）
  const providers = new Set(rows.map((r) => r.provider))
  providers.delete('')
  console.log(`完成！結果已寫入：${outputPath}`)
  console.log(`  總筆數：${rows.length}`)
  console.log(`  對應到的 provider 數：${providers.size}`)
}

main()
