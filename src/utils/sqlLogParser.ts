/**
 * sqlLogParser.ts
 * ==============
 * 解析 cc-switch 导出的 usage.sql，得到 Token 用量 JSON。
 *
 * 同时解析两种 INSERT 语句：
 *   - proxy_request_logs（明细）
 *   - usage_daily_rollups（日汇总）
 *
 * 回传格式：Array<{
 *   date: string | null,        // yyyy/MM/dd
 *   provider: string,
 *   model: string | null,
 *   tokens: { input: number, output: number, cache_read: number, cache_creation: number },
 *   costs: { total: string, unit: string }
 * }>
 */

export interface TokenUsageRow {
  date: string | null
  provider: string
  model: string | null
  tokens: {
    input: number
    output: number
    cache_read: number
    cache_creation: number
  }
  costs: {
    total: string
    unit: string
  }
}

interface TableConfig {
  prefix: string
  columns: string[]
  defaults: Record<string, number | string>
  modelKey: string
}

const TABLES: Record<string, TableConfig> = {
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
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      input_cost_usd: '0',
      output_cost_usd: '0',
      cache_read_cost_usd: '0',
      cache_creation_cost_usd: '0',
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
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cache_creation_tokens: 0,
      total_cost_usd: '0',
      request_count: 0,
      success_count: 0,
      avg_latency_ms: 0,
    },
    modelKey: 'model',
  },
}

const PREFIX_TO_MODE = new Map<string, string>()
for (const [mode, cfg] of Object.entries(TABLES)) {
  PREFIX_TO_MODE.set(cfg.prefix, mode)
}

const COLUMN_INDEX: Record<string, Record<string, number>> = {}
for (const [mode, cfg] of Object.entries(TABLES)) {
  const idx: Record<string, number> = {}
  cfg.columns.forEach((name, i) => { idx[name] = i })
  COLUMN_INDEX[mode] = idx
}

/**
 * 解析单行（或合并后多行）INSERT 的 VALUES (...) 部分，回传数组。
 */
function parseSqlValues(line: string): (string | number | null)[] {
  const start = line.indexOf('VALUES (') + 'VALUES ('.length
  const n = line.length
  const values: (string | number | null)[] = []
  let i = start

  while (i < n) {
    while (i < n && ' \t\r\n'.includes(line[i])) i++
    if (i >= n || line[i] === ')') break
    if (line[i] === ',') { i++; continue }

    if (line[i] === "'") {
      i++
      const chars: string[] = []
      while (i < n) {
        if (line[i] === "'") {
          if (i + 1 < n && line[i + 1] === "'") { chars.push("'"); i += 2 }
          else { i++; break }
        } else {
          chars.push(line[i]); i++
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

/**
 * 安全取值：vals[idx]（非 null）→ defaults → null
 */
function safeGet(vals: (string | number | null)[], key: string, mode: string): string | number | null {
  const idx = COLUMN_INDEX[mode][key]
  if (idx < vals.length && vals[idx] !== null && vals[idx] !== undefined) {
    return vals[idx]
  }
  return Object.prototype.hasOwnProperty.call(TABLES[mode].defaults, key) ? TABLES[mode].defaults[key] : null
}

/**
 * 将 SQL 文本按换行切分并合并多行 INSERT，yield 每句完整语句及其所属模式。
 */
function * iterateStatements(text: string): Generator<{ stmt: string; mode: string }> {
  const lines = text.split(/\r?\n/)
  let buf: string | null = null
  let bufMode: string | null = null

  for (const line of lines) {
    if (line.startsWith('INSERT INTO "')) {
      const mode = matchMode(line)
      if (mode) {
        buf = line
        bufMode = mode
        if (buf.trimEnd().endsWith(');')) {
          yield { stmt: buf, mode: bufMode }
          buf = null
          bufMode = null
        }
      }
    } else if (buf !== null && bufMode !== null) {
      buf += '\n' + line
      if (line.trimEnd().endsWith(');')) {
        yield { stmt: buf, mode: bufMode }
        buf = null
        bufMode = null
      }
    }
  }
}

function matchMode(line: string): string | null {
  for (const [prefix, mode] of PREFIX_TO_MODE) {
    if (line.startsWith(prefix)) return mode
  }
  return null
}

/**
 * 建出 { provider_id: name } 对照表。
 */
function parseProviderMap(text: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const { stmt } of iterateStatements(text)) {
    if (!stmt.startsWith('INSERT INTO "providers"')) continue
    const vals = parseSqlValues(stmt)
    const pid = vals[0]
    const name = vals[2]
    if (pid !== null && pid !== undefined) map[String(pid)] = String(name ?? '')
  }
  return map
}

/**
 * Unix timestamp → yyyy/MM/dd
 */
function formatDateFromTs(ts: number): string {
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

/**
 * date 栏位（预期 yyyy-MM-dd）→ yyyy/MM/dd
 */
function formatDateFromStr(dateStr: string | null): string | null {
  if (!dateStr) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr).trim())
  if (m) return `${m[1]}/${m[2]}/${m[3]}`
  return String(dateStr)
}

/**
 * 将一组解析后的 vals 转为输出 dict；返回 null 表示该跳过。
 */
function buildRow(vals: (string | number | null)[], mode: string, provMap: Record<string, string>): TokenUsageRow | null {
  if (mode === 'proxy' && safeGet(vals, 'status_code', mode) !== 200) {
    return null
  }

  const cfg = TABLES[mode]
  const pid = safeGet(vals, 'provider_id', mode)
  const provider = (pid !== null && pid !== undefined && provMap[String(pid)]) ? provMap[String(pid)] : ''

  let date: string | null = null
  if (mode === 'proxy') {
    const ts = safeGet(vals, 'created_at', mode)
    if (ts != null) date = formatDateFromTs(Number(ts))
  } else {
    date = formatDateFromStr(safeGet(vals, 'date', mode) as string | null)
  }

  return {
    date,
    provider,
    model: safeGet(vals, cfg.modelKey, mode) as string | null,
    tokens: {
      input: safeGet(vals, 'input_tokens', mode) as number,
      output: safeGet(vals, 'output_tokens', mode) as number,
      cache_read: safeGet(vals, 'cache_read_tokens', mode) as number,
      cache_creation: safeGet(vals, 'cache_creation_tokens', mode) as number,
    },
    costs: {
      total: safeGet(vals, 'total_cost_usd', mode) as string,
      unit: 'USD',
    },
  }
}

/**
 * 传入 .sql 文本，回传解析后的 Token 用量数组。
 */
export function parseSqlText(text: string): TokenUsageRow[] {
  const provMap = parseProviderMap(text)
  const rows: TokenUsageRow[] = []

  for (const { stmt, mode } of iterateStatements(text)) {
    if (mode !== 'proxy' && mode !== 'rollups') continue
    const vals = parseSqlValues(stmt)
    const row = buildRow(vals, mode, provMap)
    if (row !== null) rows.push(row)
  }

  return rows
}

/**
 * 传入浏览器 File 对象（.sql），回传解析后的 Token 用量数组。
 */
export async function parseSqlFile(file: File): Promise<TokenUsageRow[]> {
  const text = await file.text()
  return parseSqlText(text)
}

export default { parseSqlText, parseSqlFile }
