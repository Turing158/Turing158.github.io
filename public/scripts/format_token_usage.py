"""
parse_usage.py
==============
用法
----
    python parse_usage.py <輸入檔.sql> <輸出檔.json>

範例
----
    python parse_usage.py usage.sql usage.json
"""

import json
import sys
from datetime import datetime


# ---------------------------------------------------------------------------
# 表的欄位順序 / 預設值 / model 來源
# ---------------------------------------------------------------------------
TABLES = {
    "proxy": {
        "prefix": 'INSERT INTO "proxy_request_logs"',
        "columns": [
            "request_id", "provider_id", "app_type", "model", "request_model",
            "input_tokens", "output_tokens", "cache_read_tokens", "cache_creation_tokens",
            "input_cost_usd", "output_cost_usd", "cache_read_cost_usd", "cache_creation_cost_usd",
            "total_cost_usd", "latency_ms", "first_token_ms", "duration_ms",
            "status_code", "error_message", "session_id", "provider_type",
            "is_streaming", "cost_multiplier", "created_at",
            "data_source", "pricing_model", "input_token_semantics",
        ],
        "defaults": {
            "input_tokens": 0, "output_tokens": 0,
            "cache_read_tokens": 0, "cache_creation_tokens": 0,
            "input_cost_usd": "0", "output_cost_usd": "0",
            "cache_read_cost_usd": "0", "cache_creation_cost_usd": "0",
            "total_cost_usd": "0",
            "status_code": 0,
        },
        "model_key": "request_model",
    },
    "rollups": {
        "prefix": 'INSERT INTO "usage_daily_rollups"',
        "columns": [
            "date", "app_type", "provider_id", "model", "request_model",
            "pricing_model", "request_count", "success_count",
            "input_tokens", "output_tokens", "cache_read_tokens", "cache_creation_tokens",
            "total_cost_usd", "avg_latency_ms", "input_token_semantics",
        ],
        "defaults": {
            "input_tokens": 0, "output_tokens": 0,
            "cache_read_tokens": 0, "cache_creation_tokens": 0,
            "total_cost_usd": "0",
            "request_count": 0,
            "success_count": 0,
            "avg_latency_ms": 0,
        },
        "model_key": "model",
    },
}

# 前綴 -> 模式，供一行判別用
PREFIX_TO_MODE = {cfg["prefix"]: mode for mode, cfg in TABLES.items()}
# 共同前綴長度（都一樣是 'INSERT INTO "'），加速判斷
COMMON_PREFIX = 'INSERT INTO "'


# ---------------------------------------------------------------------------
# 公共函式
# ---------------------------------------------------------------------------
def parse_sql_values(line):
    """解析一行 INSERT 的 VALUES (...) 部分，回傳 list。"""
    i = line.index("VALUES (") + len("VALUES (")
    n = len(line)
    values = []
    while i < n:
        while i < n and line[i] in " \t\r\n":
            i += 1
        if i >= n or line[i] == ")":
            break
        if line[i] == ",":
            i += 1
            continue
        if line[i] == "'":
            i += 1
            chars = []
            while i < n:
                if line[i] == "'":
                    if i + 1 < n and line[i + 1] == "'":
                        chars.append("'")
                        i += 2
                    else:
                        i += 1
                        break
                else:
                    chars.append(line[i])
                    i += 1
            values.append("".join(chars))
        else:
            j = i
            while j < n and line[j] not in ",)":
                j += 1
            token = line[i:j].strip()
            if token.upper() == "NULL":
                values.append(None)
            elif "." in token:
                values.append(float(token))
            else:
                values.append(int(token))
            i = j
    return values


def safe_get(vals, key, columns, defaults):
    """取值：優先用 vals[idx]（非 None），否則用 defaults，否則 None。"""
    idx = columns.index(key)
    if idx < len(vals):
        v = vals[idx]
        if v is not None:
            return v
    return defaults.get(key, None)


def parse_provider_map(sql_path):
    """從 INSERT INTO "providers" 建出 {id: name} 對照表。"""
    prov = {}
    buf = None
    with open(sql_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith('INSERT INTO "providers"'):
                buf = line
                if buf.rstrip().endswith(");"):
                    stmt = buf
                    buf = None
                else:
                    continue
            elif buf is not None:
                buf += line
                if line.rstrip().endswith(");"):
                    stmt = buf
                    buf = None
                else:
                    continue
            else:
                continue

            vals = parse_sql_values(stmt)
            prov[vals[0]] = vals[2]
    return prov


def format_date_from_ts(ts):
    """將 created_at（Unix timestamp）轉為 yyyy/MM/dd。"""
    if ts is None:
        return None
    return datetime.fromtimestamp(ts).strftime("%Y/%m/%d")


def format_date_from_str(date_str):
    """將 date 欄位（預期 yyyy-MM-dd）轉為 yyyy/MM/dd。"""
    if not date_str:
        return None
    try:
        return datetime.strptime(str(date_str), "%Y-%m-%d").strftime("%Y/%m/%d")
    except ValueError:
        return str(date_str)


# ---------------------------------------------------------------------------
# 輸出一行（共用欄位）
# ---------------------------------------------------------------------------
SHARED_TOKEN_KEYS = ("input_tokens", "output_tokens", "cache_read_tokens", "cache_creation_tokens")


def build_row(vals, columns, defaults, model_key, prov_map, mode):
    """將一組解析後的 vals 轉為輸出 dict；Returns None 表示該跳過。"""
    # proxy 模式只保留 status_code = 200
    if mode == "proxy" and safe_get(vals, "status_code", columns, defaults) != 200:
        return None

    pid = safe_get(vals, "provider_id", columns, defaults)
    provider = prov_map.get(pid, "") if pid else ""

    if mode == "proxy":
        ts = safe_get(vals, "created_at", columns, defaults)
        date = format_date_from_ts(ts)
    else:
        date = format_date_from_str(safe_get(vals, "date", columns, defaults))

    return {
        "date": date,
        "provider": provider,
        "model": safe_get(vals, model_key, columns, defaults),
        "tokens": {
            "input": safe_get(vals, "input_tokens", columns, defaults),
            "output": safe_get(vals, "output_tokens", columns, defaults),
            "cache_read": safe_get(vals, "cache_read_tokens", columns, defaults),
            "cache_creation": safe_get(vals, "cache_creation_tokens", columns, defaults),
        },
        "costs": {
            "total": safe_get(vals, "total_cost_usd", columns, defaults),
            "unit": "USD",
        },
    }


# ---------------------------------------------------------------------------
# 主解析：一次讀檔，同時收集兩表
# ---------------------------------------------------------------------------
def parse_file(input_path):
    prov_map = parse_provider_map(input_path)

    rows = []
    buf = None
    buf_mode = None

    with open(input_path, "r", encoding="utf-8") as f:
        for line in f:
            # 快速判斷：只處理 INSERT INTO " 開頭的列、或正在緩衝的多行語句
            if line.startswith(COMMON_PREFIX):
                for prefix, mode in PREFIX_TO_MODE.items():
                    if line.startswith(prefix):
                        buf = line
                        buf_mode = mode
                        if buf.rstrip().endswith(");"):
                            stmt, buf = buf, None
                            vals = parse_sql_values(stmt)
                            row = build_row(vals, TABLES[buf_mode]["columns"],
                                            TABLES[buf_mode]["defaults"],
                                            TABLES[buf_mode]["model_key"],
                                            prov_map, buf_mode)
                            if row is not None:
                                rows.append(row)
                            buf_mode = None
                        break
            elif buf is not None:
                buf += line
                if line.rstrip().endswith(");"):
                    stmt, buf = buf, None
                    vals = parse_sql_values(stmt)
                    row = build_row(vals, TABLES[buf_mode]["columns"],
                                    TABLES[buf_mode]["defaults"],
                                    TABLES[buf_mode]["model_key"],
                                    prov_map, buf_mode)
                    if row is not None:
                        rows.append(row)
                    buf_mode = None

    return rows


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        print(f"[錯誤] 用法：python {sys.argv[0]} <輸入檔.sql> <輸出檔.json>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    rows = parse_file(input_path)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    # 粗略統計：用 date+provider+model+costs.total 估計 proxy/rollups 比例
    print(f"完成！結果已寫入：{output_path}")
    print(f"  總筆數：{len(rows)}")
    print(f"  對應到的 provider 數：{len(set(r['provider'] for r in rows) - {''})}")


if __name__ == "__main__":
    main()
