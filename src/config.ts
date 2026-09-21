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
// Gitalk OAuth token 由 tool-proxy（/github_access_token）转发到 GitHub
const GITALK_PROXY = 'https://tool-proxy.turing158.de5.net/github_access_token'
const GITALK_CLIENT_ID = import.meta.env.VITE_GITALK_CLIENT_ID || '0275b8f48f2a7e0ac1b0'

// --- 节假日 API ---
const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/publicholidays'
const HOLIDAY_COUNTRY = 'CN'

// --- Cline 推荐/免费模型 API ---
// 通过 Cloudflare Worker 代理（tool-proxy 的 /cline/model/recommended）转发 Cline 接口，规避浏览器 CORS
// 浏览器直连绝对地址；可用环境变量 VITE_CLINE_API_BASE 覆盖
const CLINE_MODELS_API = import.meta.env.VITE_CLINE_API_BASE
  ?? 'https://tool-proxy.turing158.de5.net/cline/model/recommended'

// --- Cline 全量模型目录 API ---
// tool-proxy 的 /cline/model/all 返回 OpenRouter 全量目录（{ data: ClineModel[] }），
// 搜索 Tab 以此为基础做本地过滤；可用环境变量 VITE_CLINE_ALL_API 覆盖
const CLINE_MODELS_ALL_API = import.meta.env.VITE_CLINE_ALL_API
  ?? 'https://tool-proxy.turing158.de5.net/cline/model/all'

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
    clientID: GITALK_CLIENT_ID,
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
    allApi: CLINE_MODELS_ALL_API,
  },
  cache: {
    articlesTTL: ARTICLES_CACHE_TTL,
  },
} as const

export type Config = typeof config
