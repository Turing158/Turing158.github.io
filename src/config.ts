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

// --- GitHub API 代理基址 ---
// 浏览器直连 api.github.com 是匿名调用（60 次/小时，按访客出口 IP 计），
// 站点上多处调用很容易打满，因此统一改走自建 Cloudflare Worker：
//   GET /repos/<repo>/...    → https://api.github.com/repos/Turing158/<repo>/...
//   GET /users/<login>/...   → https://api.github.com/users/<login>/...
// owner 由 Worker 写死注入，调用方**不要**写在路径里；Worker 侧注入 PAT 把额度提到
// 5000 次/小时并在边缘缓存，CORS 已放行线上域名与 localhost。
// 源码：D:\EducationalData\cf\github-proxy\worker.js；可用环境变量 VITE_GITHUB_API_BASE 覆盖
const GITHUB_API_BASE = import.meta.env.VITE_GITHUB_API_BASE
  ?? 'https://turing158.github-proxy.de5.net'

// --- GitHub 用户信息 API ---
// 旧通道：tool-proxy 的 /github/user/<login>（仅支持用户信息，其余端点仍需上面的 github-proxy）
// 作为 github-proxy 不可用时的兜底保留，可用环境变量 VITE_GITHUB_USER_API 覆盖
const GITHUB_USER_API = import.meta.env.VITE_GITHUB_USER_API
  ?? 'https://tool-proxy.turing158.de5.net/github/user'

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
    /** github-proxy 基址：GET <apiBase>/repos/<repo>/... 与 /users/<login>/... */
    apiBase: GITHUB_API_BASE,
    userApi: GITHUB_USER_API,
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
