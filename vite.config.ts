import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { articlesPlugin } from './src/plugins/articles-plugin'

// ── 本地接口代理 ──
// 后端（Cloudflare Worker / 友链服务 / Gitalk token 代理）的 CORS 白名单只放行线上站点域名，
// 本地用 127.0.0.1、局域网 IP 或其它端口打开时会被浏览器拦截。
// 这里把这些远端地址映射到同源路径，前端在本地自动改用该路径（见 src/utils/apiEndpoint.ts）；
// 线上（GitHub Pages 纯静态托管，无代理能力）仍是直连绝对地址，请求方式保持不变。
const API_PROXY: Record<string, string> = {
  '/api/turing158': 'https://api.turing158.dpdns.org', // 浏览量、Gitee 动态
  '/api/friends': 'https://blog.friendlink.de5.net', // 友链列表
  '/api/friend-apply': 'https://blog.add-friendlink.de5.net', // 友链申请
  '/api/tool-proxy': 'https://tool-proxy.turing158.de5.net', // Cline 模型目录 + Gitalk OAuth token
}

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
      // 去掉代理前缀，转发到后端真实路径
      rewrite: (path: string) => path.replace(new RegExp(`^${prefix}`), ''),
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
            urlPattern: /\/api\/v3\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 20,
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
