/**
 * HTML 后处理工具
 *
 * 供构建时（articles-plugin）和运行时（useArticles 的 GitHub fallback 路径）共享。
 * 确保本地文章与远程文章渲染结果一致：
 *   - 外部链接 target="_blank" rel="noopener noreferrer"
 *   - 代码块添加 base64 编码的复制按钮
 */

/** 解码 highlight.js 在语法高亮时转义的 HTML 实体 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * 给所有外链（非 #xxx 锚点）添加 target="_blank" rel="noopener noreferrer"。
 * 即使用户在 Markdown 中手写 <a> 标签也生效。
 */
export function addBlankTargetToLinks(html: string): string {
  return html.replace(/<a\s+([^>]*)>/g, (_m: string, attrs: string) => {
    if (/target=/.test(attrs)) {
      return `<a ${attrs}>`
    }
    if (/href\s*=\s*["']#/.test(attrs)) {
      return `<a ${attrs}>`
    }
    return `<a ${attrs} target="_blank" rel="noopener noreferrer">`
  })
}

/**
 * 给 <pre><code> 代码块外包裹 .code-block-wrapper，
 * 顶部显示语言标签，右上角添加 base64 编码代码的复制按钮。
 *
 * 复制按钮的点击由 MarkdownRenderer 的 handleCopyClick 统一处理。
 *
 * 使用 btoa/unescape/encodeURIComponent 而非 Buffer，使本函数可在
 * Node.js（构建时）和浏览器（运行时 fallback）中通用。
 * decode 端使用 MarkdownRenderer.handleCopyClick 中的
 * decodeURIComponent(escape(atob(b64))) 与之对应。
 */
export function enhanceCodeBlocks(html: string): string {
  const toBase64 = (str: string) =>
    btoa(unescape(encodeURIComponent(str)))

  return html.replace(
    /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
    (_m: string, attrs: string, code: string) => {
      const langMatch = attrs.match(/language-(\w+)/)
      const lang = langMatch ? langMatch[1] : ''
      const decoded = decodeHtmlEntities(code)
      const b64 = toBase64(decoded)
      return `<div class="code-block-wrapper">${lang ? `<span class="code-lang">${lang}</span>` : ''}<button class="code-copy-btn" data-code-b64="${b64}" title="复制代码">复制</button><pre><code${attrs}>${code}</code></pre></div>`
    }
  )
}
