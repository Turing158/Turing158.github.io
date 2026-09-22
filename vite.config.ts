import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { articlesPlugin } from './src/plugins/articles-plugin'

// ── 后端域名池 ──
// 多个域名各自部署了同一个合并版 Worker（源码 D:\EducationalData\cf\merged），
// 但分属不同 Cloudflare 账号（免费额度按账号计：10 万次/天）。
// 前端在额度耗尽时自动向后切换，因此本地代理也需要为池内每个域名各留一条映射。
// 这里显式读取 .env（Vite 配置阶段 import.meta.env 尚不可用），改 .env 即可，本文件自动跟随。
const BACKEND_BASE = (
  process.env.VITE_BACKEND_BASE || 'https://api.turing158.dpdns.org'
).replace(/\/+$/, '')

const BUILTIN_BACKUP_BASES = [
  'https://api.turing158.de5.net',
  'https://api.friendlink.de5.net',
  'https://api.github-proxy.de5.net',
  'https://api.add-friendlink.de5.net',
]

const BACKEND_POOL: string[] = (() => {
  const raw = process.env.VITE_BACKEND_POOL
  const list = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [BACKEND_BASE, ...BUILTIN_BACKUP_BASES]
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of list) {
    const normalized = item.replace(/\/+$/, '')
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out.length > 0 ? out : [BACKEND_BASE]
})()

// ── 本地接口代理 ──
// 后端 Worker 的 CORS 白名单由 NORMAL_OPERATE_ALLOW_ORIGIN 控制，只放行线上域名与
// localhost:3000。本地用 127.0.0.1、局域网 IP 或其它端口打开时会被浏览器拦截。
// 这里把池内每个远端地址映射到各自的同源路径，前端在本地自动改用该路径
// （见 src/utils/apiEndpoint.ts 与 src/utils/backendPool.ts）；
// 线上（GitHub Pages 纯静态托管，无代理能力）仍是直连绝对地址。
//
// ⚠️ 必须按前缀长度【降序】排列。Vite 用 `url.startsWith(context)` 判断命中
//    （见 doesProxyContextMatchUrl），而 `/api/turing158` 是 `/api/turing158-1`
//    的前缀串 —— 若索引 0 排在前面，`/api/turing158-1/...` 会被它抢先吃掉，
//    错转发到索引 0 的域名。降序后长前缀先匹配，歧义消除。
//    命名规则必须与 src/utils/backendPool.ts 的 proxyPrefixFor() 保持一致。
const API_PROXY: Record<string, string> = Object.fromEntries(
  BACKEND_POOL.map((base, index) => [
    index === 0 ? '/api/turing158' : `/api/turing158-${index}`,
    base,
  ]).sort((a, b) => b[0].length - a[0].length)
)

// 转发时把 Origin 伪装成线上站点域名，避免后端按白名单判定为非法来源
const SITE_ORIGIN = 'https://blog.turing158.cc.cd'

const apiProxy: Record<string, ProxyOptions> = Object.fromEntries(
  Object.entries(API_PROXY).map(([prefix, target]) => [
    prefix,
    {
      target,
      changeOrigin: true,
      secure: true,
      headers: { Origin: SITE_ORIGIN },
      // 去掉代理前缀，转发到后端真实路径。
      // 必须要求 `/` 或结尾边界：否则 `/api/turing158-1/...` 会被 `/api/turing158`
      // 的规则吃掉前缀、错转发到索引 0 的域名（两个前缀互为前缀串）。
      rewrite: (path: string) => path.replace(new RegExp(`^${prefix}(?=/|$)`), ''),
    } satisfies ProxyOptions,
  ])
)

export default defineConfig({
  plugins: [
    vue(),
    articlesPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Turing_ICE Blog',
        short_name: 'Turing_ICE',
        description: '基于 Vue 3 + Vite 的个人博客系统',
        theme_color: '#4a7c59',
        background_color: '#f5f0e8',
        display: 'standalone',
        scope: './',
        start_url: './',
        orientation: 'portrait-primary',
        categories: ['blog', 'technology'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: '文章列表',
            short_name: '文章',
            description: '查看所有文章',
            url: './#/articles',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: '工具集',
            short_name: '工具',
            description: '开发者工具',
            url: './#/tools',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB，允许大文件缓存
        skipWaiting: true,
        clientsClaim: true,
        // SPA 离线回退：导航请求失败时返回 index.html
        navigateFallback: 'index.html',
        // 排除不需要回退的路径（如 API 请求）
        navigateFallbackDenylist: [
          /^\/api\//, // GitHub API 请求
          /^\/icons\//, // 图标文件已在 precache 中
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // GitHub REST 与其余后端接口统一走合并后的 Worker（Worker 侧已注入 PAT + 边缘缓存），
            // 这里再缓存一层，避免离线/开发环境反复回源。
            // 域名池内的主机名按 BACKEND_POOL 动态生成，切换备用域名后缓存依然命中；
            // 每个域名各有独立缓存（Workbox 按 URL 区分），这是可接受的。
            urlPattern: new RegExp(
              `^https://(${BACKEND_POOL.map((b) =>
                b.replace(/^https?:\/\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              ).join('|')})/github/api/`
            ),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 5,
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // 按需加载的文章 HTML 文件（public/articles/<md5>.html）
            urlPattern: /\/articles\/[0-9a-f]{32}\.html$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'article-html-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
    proxy: apiProxy,
  },
  preview: {
    // npm run preview 时同样启用，方便本地校验构建产物
    proxy: apiProxy,
  },
})
