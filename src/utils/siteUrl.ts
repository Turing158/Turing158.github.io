/**
 * 站点 URL 拼接与编码
 *
 * 供运行时（useSeo 的 canonical / og:url）与构建时（prerender-plugin 的 sitemap / 预渲染页）
 * 共用，确保二者产物**逐字节一致** —— 不一致会被 Search Console 判为
 * 「重复网页，用户指定的规范网页与 Google 选择的规范网页不同」。
 *
 * 文章 slug 直接来自 content/*.md 文件名，含中文、空格与方括号
 * （如 `2024-02-15-Minecraft论坛[Minecraft Forum]`），因此必须按 segment 编码：
 * 裸空格与方括号属于非法 URL，直接拼进 <loc> 会导致 sitemap 校验失败。
 */

/** 默认站点域名。可用 VITE_SITE_URL 覆盖（见 src/config.ts） */
export const DEFAULT_SITE_URL = 'https://blog.turing158.cc.cd'

/**
 * 规范化基址：去掉末尾斜杠，保证拼接结果只有一个分隔斜杠。
 */
function normalizeBase(base: string): string {
  return base.replace(/\/+$/, '')
}

/**
 * 把路由 path 编码为可安全放进 URL / XML 的形式。
 *
 * 按 `/` 切段后逐段 `encodeURIComponent`，因此 `/` 本身保留，
 * 而中文、空格、方括号、`#`、`?` 等全部被百分号编码。
 */
export function encodePath(path: string): string {
  const [pathname, search = ''] = path.split('?')
  const encoded = pathname
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return search ? `${encoded}?${new URLSearchParams(search).toString()}` : encoded
}

/**
 * 拼出站点的绝对 URL（用于 canonical / og:url / sitemap 的 <loc>）。
 *
 * @param path 站内路径，可带前导斜杠（`/articles`）或 hash 形式的历史路径
 * @param base 站点基址，默认 {@link DEFAULT_SITE_URL}
 */
export function absoluteUrl(path: string, base: string = DEFAULT_SITE_URL): string {
  const root = normalizeBase(base)
  // 已经是绝对地址（外部链接）时原样返回
  if (/^https?:\/\//i.test(path)) return path

  const withoutHash = path.replace(/^#/, '')
  const trimmed = withoutHash.replace(/^\/+/, '')
  if (!trimmed) return `${root}/`
  return `${root}/${encodePath(trimmed)}`
}

/**
 * 去掉 path 的前导斜杠与 `#`，得到 vue-router 可直接使用的站内路径。
 *
 * `'#/article/x'` → `'/article/x'`；`'/'` → `'/'`
 */
export function toRouterPath(path: string): string {
  const cleaned = path.replace(/^#/, '')
  if (!cleaned.startsWith('/')) return `/${cleaned}`
  return cleaned
}
