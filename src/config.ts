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

// --- Gitalk OAuth 配置 ---
const GITALK_CLIENT_ID = import.meta.env.VITE_GITALK_CLIENT_ID || '0275b8f48f2a7e0ac1b0'
const GITALK_CLIENT_SECRET = import.meta.env.VITE_GITALK_CLIENT_SECRET || '173a61730904837485e645de785bc24d0379d936'

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
const GITALK_PROXY = 'https://proxy-gitalk-api.netlify.app/github_access_token'

// --- 节假日 API ---
const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/publicholidays'
const HOLIDAY_COUNTRY = 'CN'

// --- 缓存 TTL（毫秒） ---
const ARTICLES_CACHE_TTL = 5 * 60 * 1000 // 5 分钟

export const config = {
  github: {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
  },
  gitalk: {
    clientID: GITALK_CLIENT_ID,
    clientSecret: GITALK_CLIENT_SECRET,
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
  cache: {
    articlesTTL: ARTICLES_CACHE_TTL,
  },
} as const

export type Config = typeof config
