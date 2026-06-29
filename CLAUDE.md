# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Vue 3 + Vite + TypeScript 的个人博客系统。使用 Less 预处理器，vue-router 做路由，vue-i18n 做国际化，pinia 做状态管理。支持从本地 `content/` 目录或 GitHub 仓库加载 Markdown 文章。

## 技术栈

- **框架:** Vue 3 (Composition API, `<script setup>`)
- **构建:** Vite 6
- **语言:** TypeScript (~5.6.0, strict mode)
- **样式:** Less (scoped styles, CSS 变量)
- **路由:** vue-router 4 (Hash 模式, `createWebHashHistory`)
- **国际化:** vue-i18n 9 (zh-CN / en-US)
- **状态管理:** pinia 3
- **Markdown:** markdown-it + gray-matter + highlight.js
- **第三方 UI:** animal-island-vue (Button, Time, Divider)
- **评论系统:** gitalk
- **工具库:** axios, date-fns

## 命令

```bash
npm run dev          # 开发服务器 (端口 3000, 自动打开浏览器)
npm run build        # 生产构建
npm run preview      # 预览构建结果
npm run typecheck    # TypeScript 类型检查 (vue-tsc --noEmit)
npm run build:icons  # 生成 PWA 图标（从头像 URL 下载并生成多尺寸）
```

**注意:** 本项目使用 `python` 命令（非 `python3`）。

### 站点地图（手动运行）
构建前需手动运行站点地图生成（未在 prebuild 中自动触发）：
```bash
node scripts/generate-sitemap.mjs
```
生成 `dist/sitemap.xml`，包含所有静态页面和文章页面的 URL。

## 目录结构

```
src/
  layouts/
    MainLayout.vue          # 主布局（侧边栏 + 内容区 + TOC）
  components/
    article/
      ArticleTOCDrawer.vue  # 文章目录抽屉（固定高度 + 操作区 + 滚动进度）
      ShareButtons.vue      # 文章分享按钮（复制链接、微信、微博、Twitter）
    common/
      BlogDialog.vue        # 通用弹窗组件
      BlogInput.vue         # 通用输入框组件
      BlogSelect.vue        # 通用选择器组件
      BlogTipContainer.vue  # 消息提示容器（blog-tip 插件的视图层）
      MarkdownRenderer.vue  # Markdown 渲染器（含代码复制功能）
      ProgressBar.vue       # 页面加载进度条
      LoadingSpinner.vue    # 加载动画组件
      ResponsiveTime.vue    # 响应式时间组件
      PwaInstallPrompt.vue  # PWA 安装提示
      PwaUpdatePrompt.vue   # PWA 版本更新提示
      PwaOfflinePage.vue    # PWA 离线降级页面
    search/
      SearchDialog.vue      # 搜索对话框
      SearchCard.vue        # 搜索结果卡片
    sidebar/
      SidebarIcon.vue       # 侧边栏图标组件（SVG 图标集合）
  views/
    HomeView.vue            # 首页（时钟 + 节日倒计时 + 最近提交 + 最近文章）
    ArticlesView.vue        # 文章列表页
    ArticleDetailView.vue   # 文章详情页（含 gitalk 评论）
    ProjectsView.vue        # 项目页
    CommitsView.vue         # 提交记录页
    ReleasesView.vue        # 发行列表页
    ReleaseDetailView.vue   # 发行详情页
    ToolsView.vue           # 工具页
    AboutView.vue           # 关于页
    NotFoundView.vue         # 404 页面未找到
    ErrorView.vue           # 500 服务器错误
  composables/
    useArticles.ts          # 文章加载（本地 + GitHub API 双源）
    useGitalk.ts            # gitalk 评论初始化
    useGitalkCount.ts       # Gitalk 评论计数
    useHolidays.ts          # 节假日倒计时（nager.at API）
    useNetworkStatus.ts     # 网络状态检测
    usePwaUpdate.ts         # PWA 版本更新管理
    useReadingTime.ts       # 文章阅读时间估算
    useReleases.ts          # 发行版本获取
    useSearch.ts            # 搜索功能（基于 fuse.js 全文搜索）
    useSeo.ts               # SEO meta 标签管理（基于 @vueuse/head）
    useTheme.ts             # 主题切换 (forest / ocean / sunset)
    useTime.ts              # 时间格式化（相对时间 + 完整时间）
    useViewCount.ts         # 文章浏览量（LeanCloud 存储）
  config.ts                 # 全局配置（从 .env 读取，含默认值）
  data/
    projects.ts             # 项目数据（开发中/已完成/教程/搁置）
  generated/
    _articles.ts            # 自动生成：articles-plugin 构建时生成
  i18n/
    index.ts                # i18n 配置
    locales/zh-CN.json      # 中文语言包
    locales/en-US.json      # 英文语言包
  plugins/
    articles-plugin.ts      # Vite 插件：构建时扫描 content/ 目录生成 _articles.ts
    blog-tip.ts             # 消息提示插件（类似 toast）
  router/
    index.ts                # 路由配置（含进度条注册）
  stores/
    app.ts                  # Pinia store（articles 缓存 + recentCommits）
  styles/
    variables.css           # CSS 变量（3 套主题）
    global.css              # 全局样式
    animal-island-theme.css # animal-island-vue 主题覆盖
  types/
    article.ts              # Article / ArticleFrontmatter 类型定义
    search.ts               # Search 相关类型定义
  utils/
    md5.ts                  # MD5 加密工具
  App.vue                   # 根组件
  main.ts                   # 入口文件
  env.d.ts                  # 环境变量类型声明
```

## 路由

| 路径 | 名称 | 说明 |
|------|------|------|
| `/` | home | 首页 |
| `/articles` | articles | 文章列表 |
| `/article/:slug` | article-detail | 文章详情 |
| `/projects` | projects | 项目 |
| `/releases` | releases | 发行列表 |
| `/release/:repo` | release-detail | 发行详情 |
| `/tools` | tools | 工具 |
| `/about` | about | 关于 |
| `/commits/:repo?` | commits | 提交记录 |

使用 `createWebHashHistory('/')` 哈希路由。

### 独立页面（Standalone Layout）

| 路径 | 名称 | 说明 |
|------|------|------|
| `/sfmc` | sfmc | StarFall MC 启动器落地页（Minecraft 像素风） |
| `/starfall-forum` | starfall-forum | StarFall 论坛页面 |
| `/sfmc-jar` | sfmc-jar | SFMC JAR 下载落地页 |

路由通过 `meta: { layout: 'standalone' }` 标记，在主布局 (MainLayout) 的 `App.vue` 中判断：**独立页面不渲染 MainLayout**，独立设置页面标题，跳过博客标题模板和全局 SEO。页面代码位于 `src/views/standalone/`。

## 关键组件说明

### MainLayout.vue (`src/layouts/MainLayout.vue`)
- 左侧固定侧边栏（可折叠），包含导航菜单、主题切换、语言切换
- 导航图标有 hover/active 动画（弹跳 + 旋转）
- 右侧内容区，文章详情页附加 ArticleTOCDrawer
- TOC 通信方式：通过 `window.__updateTocHeadings` 全局函数从 ArticleDetailView 传递 headings
- 博客名：`Turing_ICE`
- 导航项：home / articles / projects / tools / about

### ArticleTOCDrawer.vue (`src/components/article/ArticleTOCDrawer.vue`)
- 桌面端（≥1024px）sticky 侧边栏，移动端滑出面板
- **固定高度:** `height: calc(100vh - 32px)`，内部 flex 布局
- **H2/H3 手风琴:** H2 点击直接跳转，H3 归属父级 H2，滚动到手风琴自动展开/折叠
- **展开动画:** `<transition>` + `max-height` / `opacity` CSS 过渡
- **底部操作区:** 50px 高度，左侧"回到顶部"按钮，右侧阅读进度百分比
- **阅读进度:** 根据 `window.scrollY / (docHeight - window.innerHeight)` 实时计算
- 桌面端默认展开，移动端默认关闭

### MarkdownRenderer.vue (`src/components/common/MarkdownRenderer.vue`)
- 使用 `v-html` 渲染 HTML
- 代码块复制功能：通过 base64 编码传递代码，事件委托监听点击
- `defineExpose({ getHeadings })` 暴露 heading 列表给父组件生成 TOC

### ProgressBar.vue (`src/components/common/ProgressBar.vue`)
- 页面顶部进度条，路由切换时模拟加载进度
- 通过 `registerProgress` 与路由守卫联动
- 进度：30% → 70% → 90% → 100% → 上移消失

### blog-tip.ts (`src/plugins/blog-tip.ts`)
- 自定义消息提示插件，类似 toast
- 支持 info / success / warning / error 四种类型
- 支持合并相同消息、暂停计时、安全移除（兜底定时器）
- 默认 3 秒后自动消失，duration=0 则不自动消失

## 内容目录

- Markdown 文章源文件位于 `content/` 目录，构建时由 `articles-plugin` Vite 插件扫描

## Markdown 渲染

- **markdown-it** 配合 **markdown-it-anchor** 渲染 HTML（anchor ID 用于 TOC 跳转）
- **highlight.js** 构建时预渲染代码高亮
- **github-markdown-css** 提供基础 Markdown 排版样式
- 代码块复制功能：通过 base64 编码传递代码，事件委托监听 `.copy-btn` 点击

## 搜索系统

基于 **fuse.js** 全文搜索（组件入口 `src/components/search/SearchDialog.vue`）：
- 搜索字段：标题、标签、描述、文章内容
- 在 `useSearch.ts` 中初始化 fuse 实例，文章加载完成后建立索引

## SEO 系统

使用 `@vueuse/head` 的 `useHead`（包装在 `src/composables/useSeo.ts`）：
- 路由 `afterEach` 钩子中设置 `og:title` / `og:description` / `og:url` / `og:type`
- 独立页面（standalone layout）跳过全局 SEO，由页面自行调用 `useHead`
- 站点地图：`node scripts/generate-sitemap.mjs` 构建后手动生成

## 文章系统

### 数据流
1. **构建时:** `articles-plugin` Vite 插件扫描 `content/*.md`，用 gray-matter 解析 frontmatter，markdown-it 渲染 HTML，生成 `src/generated/_articles.ts`
2. **运行时:** `useArticles` composable 优先读取本地生成的 `_articles.ts`，如果配置了 GitHub 环境变量则同时请求 GitHub API 并合并
3. **缓存:** Pinia store 缓存文章列表，TTL 5 分钟

### 文章内容格式 (`content/*.md`)
```markdown
---
title: 文章标题
date: 2024-02-01
tags: [标签1, 标签2]
description: 文章摘要
cover: 封面图URL（可选）
---

Markdown 正文...
```

### 环境变量 (`.env`)
| 变量 | 说明 |
|------|------|
| `VITE_GITHUB_OWNER` | GitHub 用户名 |
| `VITE_GITHUB_REPO` | GitHub 仓库名 |
| `VITE_GITALK_CLIENT_ID` | Gitalk OAuth App Client ID |
| `VITE_GITALK_CLIENT_SECRET` | Gitalk OAuth App Client Secret |
| `VITE_LEAN_CLOUD_APP_ID` | LeanCloud App ID（用于文章浏览量） |
| `VITE_LEAN_CLOUD_APP_KEY` | LeanCloud App Key |
| `VITE_LEAN_CLOUD_SERVER_URL` | LeanCloud 服务器地址 |

## 配置系统 (`src/config.ts`)

配置优先级：`.env` 环境变量 > 代码默认值

```typescript
// 访问配置
import { config } from '@/config'

config.github.owner    // GitHub 用户名
config.gitalk.clientID // Gitalk Client ID
config.blog.title      // 博客标题 'Turing_ICE'
config.developingRepos // 开发中项目仓库列表
config.cache.articlesTTL // 文章缓存 TTL (5分钟)
```

**关键特性:**
- 使用 `import.meta.env.VITE_*` 读取环境变量
- 提供本地开发默认值（GitHub 配置默认指向 `Turing158/Turing158.github.io`）
- Gitalk 配置内置默认 OAuth 凭据
- Gitalk 通过 Netlify 代理转发 OAuth token 请求：`config.gitalk.proxy`
- 同时支持 Gitee 配置：`config.gitee.owner`
- 标题模板: `{current_page} | Blog - {blog_title}`

## 主题系统

- 3 套主题：`forest`（默认）/ `ocean` / `sunset`
- 通过 `data-theme` 属性设置在 `<html>` 上
- CSS 变量定义在 `src/styles/variables.css`
- 持久化到 `localStorage`（key: `blog-theme`）

## 国际化

- 中文（zh-CN）为默认语言和回退语言
- 语言包位于 `src/i18n/locales/`
- 持久化到 `localStorage`（key: `blog-lang`）

## 项目数据 (`src/data/projects.ts`)

项目按类别组织：
- `developing` — 开发中项目（用于获取最近提交）
- `completed` — 已完成项目
- `blog` — 博客相关项目
- `tutorial` — 教程项目
- `shelved` — 搁置项目

每个项目包含：`name`, `description`, `tech[]`, `url`

## 代码规范

- 使用 `<script setup lang="ts">` 写法
- 样式使用 `<style lang="less" scoped>`
- 缩进: 2 空格
- 组件命名: PascalCase
- 文件命名: PascalCase (组件) / camelCase (composables)
- 路径别名: `@/` 指向 `src/`
- TypeScript strict mode 已启用 (`strict: true`)

## 部署

GitHub Actions 自动部署到 GitHub Pages (`.github/workflows/deploy.yml`)

**触发条件:** 推送至 `master` 分支

**部署步骤:**
1. `npm ci` 安装依赖
2. `npm run build` 构建（注入环境变量）
3. `actions/deploy-pages@v4` 部署

**GitHub Secrets 配置:**
- `GITHUB_OWNER` — GitHub 用户名
- `GITHUB_REPO` — 仓库名
- `GITALK_CLIENT_ID` — Gitalk OAuth App Client ID
- `GITALK_CLIENT_SECRET` — Gitalk OAuth App Client Secret

## PWA 系统

### 功能特性
- **离线访问:** Service Worker 缓存静态资源和 API 响应
- **版本更新:** 自动检测新版本并提示用户更新
- **安装提示:** 支持添加到主屏幕（standalone 模式）
- **离线降级:** 自定义离线页面，替代浏览器默认提示

### 核心组件

#### PwaInstallPrompt.vue (`src/components/common/PwaInstallPrompt.vue`)
- 安装提示横幅，延迟 3 秒显示
- 检测 `beforeinstallprompt` 事件
- 支持 iOS Safari `standalone` 检测

#### PwaUpdatePrompt.vue (`src/components/common/PwaUpdatePrompt.vue`)
- 版本更新通知，右下角 toast 样式
- 自动 10 秒后消失
- 点击"立即更新"触发 SW 更新并刷新页面

#### PwaOfflinePage.vue (`src/components/common/PwaOfflinePage.vue`)
- 全屏离线降级页面
- 显示离线图标和重试按钮
- 支持主题切换（CSS 变量）
- 包含装饰性动画效果

### Composables

#### useNetworkStatus.ts (`src/composables/useNetworkStatus.ts`)
- 监听 `online` / `offline` 事件
- 提供响应式 `isOnline` 状态
- 自动清理事件监听器

#### usePwaUpdate.ts (`src/composables/usePwaUpdate.ts`)
- 使用 `virtual:pwa-register/vue` 的 `useRegisterSW`
- 监听 `onNeedRefresh` 和 `onOfflineReady` 事件
- 提供 `triggerUpdate()` 方法激活新版本

### 配置 (vite.config.ts)
```typescript
VitePWA({
  registerType: 'autoUpdate',  // 自动更新 SW
  workbox: {
    navigateFallback: 'index.html',  // SPA 离线回退
    navigateFallbackDenylist: [/^\/api\//],  // 排除 API 请求
    runtimeCaching: [/* 缓存策略 */]
  }
})
```

### 缓存策略
- **字体:** CacheFirst，1 年过期
- **图片:** CacheFirst，30 天过期，最多 60 个
- **GitHub API:** NetworkFirst，5 分钟过期，超时 10 秒

## 文章浏览量系统

使用 LeanCloud 作为后端存储，实现文章浏览计数功能：

### 数据模型
- **Class 名称:** `ArticleViewCount`
- **字段:**
  - `slug` (String): 文章标识
  - `count` (Number): 浏览次数

### 环境变量
需要在 `.env` 或部署平台配置：
```env
VITE_LEAN_CLOUD_APP_ID=your-app-id
VITE_LEAN_CLOUD_APP_KEY=your-app-key
VITE_LEAN_CLOUD_SERVER_URL=https://your-domain.lc-cn-n1-shared.com
```

### 功能说明
- 文章详情页访问时自动增加浏览量
- 文章列表页显示每篇文章的浏览量
- 使用内存缓存减少 API 请求
- 支持国际化显示（中文："次浏览"，英文："views"）

### 浏览量数字格式化
根据浏览量大小自动调整显示格式：

| 范围 | 显示格式 | 示例 |
|------|---------|------|
| < 1万 | 原始数字 | 9,999 |
| 1万 - 10万 | 万 + 4位小数 | 1.2345 万 |
| 10万 - 100万 | 万 + 3位小数 | 12.345 万 |
| 100万 - 1000万 | 万 + 2位小数 | 123.45 万 |
| 1000万 - 1亿 | 万 + 1位小数 | 1234.5 万 |
| ≥ 1亿 | 亿 + 1位小数 | 1.2 亿 |

## 文章阅读时间估算

根据文章字数计算预计阅读时间：
- **中文：** 约 300 字/分钟
- **英文：** 约 200 词/分钟

### 计算逻辑
1. 移除 Markdown 语法（代码块、链接、图片、标题标记等）
2. 统计中文字符数和英文单词数
3. 分别计算阅读时间后求和
4. 最少显示 1 分钟

### 显示位置
- 文章列表页：每张文章卡片显示时钟图标 + "X 分钟阅读"
- 文章详情页：标题下方显示

## 注意事项

- 路径分隔符使用 Windows 风格 (`\`)，但代码中使用 `/`
- 侧边栏宽度通过 CSS 变量 `--sidebar-width` 控制（默认 240px）
- 主题系统通过 `useTheme` composable 管理
- 节假日数据来自 `https://date.nager.at/api/v3/publicholidays/{year}/CN`
- 项目追踪的仓库：`StarFall-Minecraft-Launcher`
- 文章插件会在构建时自动生成 `src/generated/_articles.ts`，**不要手动编辑此文件**
- PWA 功能需要 HTTPS 环境（开发环境 localhost 除外）
