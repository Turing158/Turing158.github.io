import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { articlesPlugin } from './src/plugins/articles-plugin'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [vue(), articlesPlugin(), VitePWA({
    registerType: 'autoUpdate',
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
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  }), cloudflare()],
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
  },
})