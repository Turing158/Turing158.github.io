/**
 * Shared highlight.js setup with on-demand language loading.
 *
 * Both render paths (build-time articles-plugin and the runtime GitHub
 * fallback in useArticles) import from here so they share one lean core,
 * one language registry and one markdown-it configuration.
 *
 * Core entry point: highlight.js/lib/core (no languages). Languages are
 * registered lazily from the curated map below via dynamic import only for
 * languages actually present in a given article.
 *
 * This replaces the previous `import hljs from 'highlight.js'` which pulled
 * in all 384 languages (~900KB). Now we bundle only ~76KB core + per-article
 * language chunks (~3-21KB each).
 */

import hljs from 'highlight.js/lib/core'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'

// ---------------------------------------------------------------------------
// Curated language registry
//
// Each entry maps a fence name (the word after ```) to a dynamic-import thunk.
// Only these languages can be loaded on demand; anything not in this map, or in
// the IGNORE set below, is rendered as escaped plain text (see highlight()).
//
// Typos / aliases commonly written in markdown fences are included explicitly.
// Keys are normalized to lowercase in scanCodeLanguages().
// ---------------------------------------------------------------------------

type LangThunk = () => Promise<{ default: (hljs: typeof import('highlight.js/lib/core').default) => void }>

const LANGUAGES: Record<string, LangThunk> = {
  // JavaScript / TypeScript / friends
  javascript: () => import('highlight.js/lib/languages/javascript'),
  js: () => import('highlight.js/lib/languages/javascript'),
  jsx: () => import('highlight.js/lib/languages/javascript'), // sane alias
  typescript: () => import('highlight.js/lib/languages/typescript'),
  ts: () => import('highlight.js/lib/languages/typescript'),
  tsx: () => import('highlight.js/lib/languages/typescript'),
  coffeescript: () => import('highlight.js/lib/languages/coffeescript'),
  css: () => import('highlight.js/lib/languages/css'),
  scss: () => import('highlight.js/lib/languages/scss'),
  less: () => import('highlight.js/lib/languages/less'),
  stylus: () => import('highlight.js/lib/languages/stylus'),

  // Markup
  xml: () => import('highlight.js/lib/languages/xml'),
  html: () => import('highlight.js/lib/languages/xml'),
  svg: () => import('highlight.js/lib/languages/xml'),
  xhtml: () => import('highlight.js/lib/languages/xml'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  md: () => import('highlight.js/lib/languages/json'), // closest match

  // Systems / compiled
  c: () => import('highlight.js/lib/languages/c'),
  cpp: () => import('highlight.js/lib/languages/cpp'),
  'c++': () => import('highlight.js/lib/languages/cpp'),
  csharp: () => import('highlight.js/lib/languages/csharp'),
  'c#': () => import('highlight.js/lib/languages/csharp'),
  java: () => import('highlight.js/lib/languages/java'),
  go: () => import('highlight.js/lib/languages/go'),
  golang: () => import('highlight.js/lib/languages/go'),
  rust: () => import('highlight.js/lib/languages/rust'),
  rs: () => import('highlight.js/lib/languages/rust'),
  kotlin: () => import('highlight.js/lib/languages/kotlin'),
  swift: () => import('highlight.js/lib/languages/swift'),
  scala: () => import('highlight.js/lib/languages/scala'),

  // Scripting
  python: () => import('highlight.js/lib/languages/python'),
  py: () => import('highlight.js/lib/languages/python'),
  python_repl: () => import('highlight.js/lib/languages/python-repl'),
  'python-repl': () => import('highlight.js/lib/languages/python-repl'),
  ruby: () => import('highlight.js/lib/languages/ruby'),
  rb: () => import('highlight.js/lib/languages/ruby'),
  php: () => import('highlight.js/lib/languages/php'),
  perl: () => import('highlight.js/lib/languages/perl'),
  lua: () => import('highlight.js/lib/languages/lua'),
  r: () => import('highlight.js/lib/languages/r'),

  // Shell / ops / config
  bash: () => import('highlight.js/lib/languages/bash'),
  sh: () => import('highlight.js/lib/languages/bash'),
  shell: () => import('highlight.js/lib/languages/shell'),
  zsh: () => import('highlight.js/lib/languages/bash'),
  powershell: () => import('highlight.js/lib/languages/powershell'),
  dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
  docker: () => import('highlight.js/lib/languages/dockerfile'),
  makefile: () => import('highlight.js/lib/languages/makefile'),
  nginx: () => import('highlight.js/lib/languages/nginx'),
  apache: () => import('highlight.js/lib/languages/apache'),
  ini: () => import('highlight.js/lib/languages/ini'),
  toml: () => import('highlight.js/lib/languages/ini'), // reasonable visual
  vim: () => import('highlight.js/lib/languages/vim'),
  diff: () => import('highlight.js/lib/languages/diff'),
  patch: () => import('highlight.js/lib/languages/diff'),

  // Serialization
  json: () => import('highlight.js/lib/languages/json'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  yml: () => import('highlight.js/lib/languages/yaml'),
  sql: () => import('highlight.js/lib/languages/sql'),

  // Web services
  graphql: () => import('highlight.js/lib/languages/graphql'),
  http: () => import('highlight.js/lib/languages/http'),

  // Fallbacks mapped to plaintext
  plaintext: () => import('highlight.js/lib/languages/plaintext'),
  text: () => import('highlight.js/lib/languages/plaintext'),
  txt: () => import('highlight.js/lib/languages/plaintext'),
}

const LANGUAGE_NAMES = new Set(Object.keys(LANGUAGES))

/**
 * Fence names that are NOT highlight languages — handled by other renderers:
 * e.g. math/katex, mermaid, flow, tree, decorative info boxes. These
 * short-circuit without attempting plaintext and produce no <code> class styling.
 */
const IGNORE = new Set(['math', 'mermaid', 'flow', 'tree', 'info', 'none'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape raw code with HTML entities — plain-text fallback path. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Scan markdown source and return the unique set of fence languages.
 * Matches the token after an opening ``` (first non-space word, lowercased).
 */
export function scanCodeLanguages(src: string): Set<string> {
  const langs = new Set<string>()
  const fenceRe = /^```\s*([^\s```]+)/
  for (const line of src.split(/\r?\n/)) {
    const m = fenceRe.exec(line)
    if (m) langs.add(m[1].toLowerCase())
  }
  return langs
}

/**
 * Register every language present in `src` that exists in the curated map.
 * Unknown languages are silently skipped (they render as plain text).
 * Safe to call repeatedly — hljs.getLanguage() guards against double-imports.
 * Returns the set of languages that ended up registered for this content.
 */
export async function registerLanguages(src: string): Promise<Set<string>> {
  const langs = scanCodeLanguages(src)
  const toLoad: Array<Promise<void>> = []

  for (const lang of langs) {
    if (IGNORE.has(lang)) continue
    if (!LANGUAGE_NAMES.has(lang)) continue // unknown → plain text fallback
    if (hljs.getLanguage(lang)) continue // already registered
    toLoad.push(
      LANGUAGES[lang]().then((mod) => {
        const def = mod.default
        if (def) {
          hljs.registerLanguage(lang, def as any)
        }
      }),
    )
  }

  await Promise.all(toLoad)

  // Return what is now registered (useful for tests/debugging)
  const registered = new Set<string>()
  for (const lang of langs) if (hljs.getLanguage(lang)) registered.add(lang)
  return registered
}

// ---------------------------------------------------------------------------
// Shared markdown-it instance (single source of truth for both render paths)
// ---------------------------------------------------------------------------

export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string) {
    const key = lang?.toLowerCase() ?? ''

    // Treated as raw, unhighlighted blocks by other renderers → leave as-is.
    if (!key || IGNORE.has(key)) return ''

    if (LANGUAGE_NAMES.has(key) && hljs.getLanguage(key)) {
      try {
        return hljs.highlight(str, { language: key }).value
      } catch {
        // fall through to plain-text
      }
    }

    // Previously unknown/under-recognized language returned '', silently
    // eating the code block entirely. Now return escaped, classed plain text
    // so the block is preserved and remains copyable by htmlPostProcess.
    return `<pre><code class="language-${escapeHtml(key)}">${escapeHtml(str)}</code></pre>`
  },
}).use(anchor, {
  // Keep article title text as id for manual anchor link consistency
  slugify: (s: string) => s.toString().trim(),
  permalink: false,
})

// External links open in new tab (skip page-internal anchor links).
// Defined exactly once here and shared by both render paths.
md.renderer.rules.link_open = function (tokens, idx, options, _env, self) {
  const token = tokens[idx]
  const href = token.attrGet('href') || ''
  // Skip anchor links (href="#...")
  if (href.startsWith('#')) {
    return self.renderToken(tokens, idx, options)
  }
  const aIndex = token.attrIndex('target')
  if (aIndex < 0) {
    token.attrPush(['target', '_blank'])
  } else if (token.attrs) {
    token.attrs[aIndex][1] = '_blank'
  }
  const relIndex = token.attrIndex('rel')
  if (relIndex < 0) {
    token.attrPush(['rel', 'noopener noreferrer'])
  }
  return self.renderToken(tokens, idx, options)
}

/**
 * One-shot helper: register the languages used in `content`, then render.
 * Use this from the runtime fallback to replace the old renderMarkdown().
 */
export async function renderMarkdownAsync(content: string): Promise<string> {
  await registerLanguages(content)
  return md.render(content)
}
