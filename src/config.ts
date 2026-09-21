/**
 * 博客配置文件
 *
 * 优先从 .env 读取环境变量（import.meta.env.VITE_*），
 * 若未配置则使用下方 JSON 默认值。
 * 保留 .env 是为了在部署平台（如 GitHub Pages / Vercel）上可以注入环境变量。
 */

// --- 统一后端基址 ---
// 原本分散在 5 个域名下的独立 Cloudflare Worker 已合并为 1 个
// （合并方案与源码：D:\EducationalData\cf\merged），全部路由统一挂在单域名下，
// 因此前端只需记一个基址，各服务按路径前缀区分：
//   <BASE>/article/*            浏览量（原 api.turing158.dpdns.org）
//   <BASE>/gitee/contribution   Gitee 动态（原 api.turing158.dpdns.org）
//   <BASE>/github/api/*         GitHub REST 代理（原 turing158.github-proxy.de5.net，
//                               新增 /github/api 前缀；owner 由 Worker 注入）
//   <BASE>/github/user/<login>  GitHub 用户信息（原 tool-proxy.turing158.de5.net）
//   <BASE>/github/access_token  Gitalk OAuth token（原 tool-proxy；
//                               旧路径 /github_access_token 已随合并废弃）
//   <BASE>/cline/model/*        Cline 模型目录（原 tool-proxy.turing158.de5.net）
//   <BASE>/friend-link/find/all 友链读取（原 blog.friendlink.de5.net）
//   <BASE>/friend-link/apply    友链申请（原 blog.add-friendlink.de5.net）
// 可用环境变量 VITE_BACKEND_BASE 覆盖；换域名时需同步 .env，vite.config.ts 与
// src/utils/apiEndpoint.ts 会自动跟随该变量，无需再改代码。
const BACKEND_BASE = (
  import.meta.env.VITE_BACKEND_BASE || 'https://api.turing158.dpdns.org'
).replace(/\/+$/, '')

// --- GitHub 配置 ---
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'Turing158'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'Turing158.github.io'

// --- GitHub REST 代理基址 ---
// 浏览器直连 api.github.com 是匿名调用（60 次/小时，按访客出口 IP 计），
// 站点上多处调用很容易打满，因此统一走合并后的 Worker：
//   GET <BASE>/github/api/repos/<repo>/...  → api.github.com/repos/Turing158/<repo>/...
//   GET <BASE>/github/api/users/events      → api.github.com/users/Turing158/events
// owner 由 Worker 写死注入，调用方**不要**写在路径里；Worker 侧注入 PAT 把额度提到
// 5000 次/小时并在边缘缓存。CORS 白名单由 Worker 的 NORMAL_OPERATE_ALLOW_ORIGIN 控制
// （只放行线上域名与 localhost:3000），因此本地开发统一走 Vite 同源代理，
// 调用一律经 src/utils/githubApi.ts。可用环境变量 VITE_GITHUB_API_BASE 覆盖。
const GITHUB_API_BASE = (
  import.meta.env.VITE_GITHUB_API_BASE ?? `${BACKEND_BASE}/github/api`
).replace(/\/+$/, '')

// --- GitHub 用户信息 API ---
// 合并后与 github/api 同域，仅路径前缀不同（Worker 侧 /github/user/<login>）
// 可用环境变量 VITE_GITHUB_USER_API 覆盖
const GITHUB_USER_API = (
  import.meta.env.VITE_GITHUB_USER_API ?? `${BACKEND_BASE}/github/user`
).replace(/\/+$/, '')

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
// Gitalk OAuth 换 token 由合并后的 Worker（/github/access_token）转发到 GitHub；
// 注意旧路径 /github_access_token 在合并后已 404，勿改回
const GITALK_PROXY = `${BACKEND_BASE}/github/access_token`
const GITALK_CLIENT_ID = import.meta.env.VITE_GITALK_CLIENT_ID || '0275b8f48f2a7e0ac1b0'

// --- 节假日 API ---
// 第三方公开接口，CORS 自身放行，保持直连不经代理
const HOLIDAY_API_BASE = 'https://date.nager.at/api/v3/publicholidays'
const HOLIDAY_COUNTRY = 'CN'

// --- Cline 推荐/免费模型 API ---
// 经合并后的 Worker（/cline/model/recommended）转发 Cline 接口，规避浏览器 CORS
// 可用环境变量 VITE_CLINE_API_BASE 覆盖
const CLINE_MODELS_API = import.meta.env.VITE_CLINE_API_BASE
  ?? `${BACKEND_BASE}/cline/model/recommended`

// --- Cline 全量模型目录 API ---
// Worker 的 /cline/model/all 返回 OpenRouter 全量目录（{ data: ClineModel[] }），
// 搜索 Tab 以此为基础做本地过滤；可用环境变量 VITE_CLINE_ALL_API 覆盖
const CLINE_MODELS_ALL_API = import.meta.env.VITE_CLINE_ALL_API
  ?? `${BACKEND_BASE}/cline/model/all`

// --- 缓存 TTL（毫秒） ---
const ARTICLES_CACHE_TTL = 5 * 60 * 1000 // 5 分钟

export const config = {
  /** 统一后端基址：合并后的单个 Worker（见文件头注释的路径分工） */
  backendBase: BACKEND_BASE,
  github: {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    /** GitHub REST 代理基址：GET <apiBase>/repos/<repo>/... 与 /users/<login>/... */
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
