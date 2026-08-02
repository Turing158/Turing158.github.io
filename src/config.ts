/**
 * 博客配置文件
 *
 * 优先从 .env 读取环境变量（import.meta.env.VITE_*），
 * 若未配置则使用下方 JSON 默认值。
 * 保留 .env 是为了在部署平台（如 GitHub Pages / Vercel）上可以注入环境变量。
 */

// --- GitHub 配置 ---
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'Turing158'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'Turing158.github.io'

// --- Gitee 配置 ---
const GITEE_OWNER = import.meta.env.VITE_GITEE_OWNER || 'turing-ice'

// --- 博客元信息 ---
const BLOG_TITLE = 'Turing_ICE'
const BLOG_AUTHOR = 'Turing158'

// --- 浏览器标题模板 ---
// 可用变量: {current_page} — 当前页面名称
const TITLE_TEMPLATE = '{current_page} | Blog - {blog_title}'

// --- 开发中项目仓库列表（用于获取最近提交） ---
const DEVELOPING_REPOS = [
  'StarFall-Minecraft-Launcher',
  'Turing158.github.io',
]

// --- 评论代理 ---
const GITALK_PROXY = 'https://gitalk.turing158.de5.net/github_access_token'

// --- 节假日 API ---
const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/publicholidays'
const HOLIDAY_COUNTRY = 'CN'

// --- Cline 推荐模型 API ---
// 通过 Cloudflare Worker 代理（dev-docs/work.js 的 /cline/model/recommended）转发 Cline 接口，规避浏览器 CORS
// - 本地开发走 Vite proxy（vite.config.ts 的 server.proxy 把 /api 转发到后端）
// - 生产环境直连后端绝对地址
const CLINE_MODELS_API = import.meta.env.VITE_CLINE_API_BASE
  ?? (import.meta.env.DEV ? '/api/cline/model/recommended' : 'https://api.turing158.dpdns.org/cline/model/recommended')

// --- 缓存 TTL（毫秒） ---
const ARTICLES_CACHE_TTL = 5 * 60 * 1000 // 5 分钟

export const config = {
  github: {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  },
  gitee: {
    owner: GITEE_OWNER,
  },
  gitalk: {
    proxy: GITALK_PROXY,
  },
  blog: {
    title: BLOG_TITLE,
    author: BLOG_AUTHOR,
    titleTemplate: TITLE_TEMPLATE,
  },
  developingRepos: DEVELOPING_REPOS,
  holiday: {
    apiBase: HOLIDAY_API_BASE,
    country: HOLIDAY_COUNTRY,
  },
  cline: {
    apiBase: CLINE_MODELS_API,
  },
  cache: {
    articlesTTL: ARTICLES_CACHE_TTL,
  },
} as const

export type Config = typeof config
