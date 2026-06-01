# CLAUDE.md — personal-blog

## 项目概述

基于 Vue 3 + Vite + TypeScript 的个人博客系统。使用 Less 预处理器，vue-router 做路由，vue-i18n 做国际化，pinia 做状态管理。支持从本地 `content/` 目录或 GitHub 仓库加载 Markdown 文章。

## 技术栈

- **框架:** Vue 3 (Composition API, `<script setup>`)
- **构建:** Vite 6
- **语言:** TypeScript (~5.6.0)
- **样式:** Less (scoped styles)
- **路由:** vue-router 4 (Hash 模式)
- **国际化:** vue-i18n 9 (zh-CN / en-US)
- **状态管理:** pinia 3
- **Markdown:** markdown-it + gray-matter + highlight.js
- **第三方 UI:** animal-island-vue (Button, Time, Divider)
- **评论系统:** gitalk
- **工具库:** axios, date-fns

## 目录结构

```
src/
  layouts/
    MainLayout.vue          # 主布局（侧边栏 + 内容区 + TOC）
  components/
    article/
      ArticleTOCDrawer.vue  # 文章目录抽屉（固定高度 + 操作区 + 滚动进度）
    common/
      BlogDialog.vue        # 通用弹窗组件
      BlogInput.vue         # 通用输入框组件
      BlogTipContainer.vue  # 消息提示容器（blog-tip 插件的视图层）
      MarkdownRenderer.vue  # Markdown 渲染器（含代码复制功能）
      ProgressBar.vue       # 页面加载进度条
    sidebar/
      SidebarIcon.vue       # 侧边栏图标组件（SVG 图标集合）
  views/
    HomeView.vue            # 首页（时钟 + 节日倒计时 + 最近提交 + 最近文章）
    ArticlesView.vue        # 文章列表页
    ArticleDetailView.vue   # 文章详情页（含 gitalk 评论）
    ProjectsView.vue        # 项目页
    AboutView.vue           # 关于页
    ToolsView.vue           # 工具页
  composables/
    useArticles.ts          # 文章加载（本地 + GitHub API 双源）
    useGitalk.ts            # gitalk 评论初始化
    useHolidays.ts          # 节假日倒计时（nager.at API）
    useTheme.ts             # 主题切换 (forest / ocean / sunset)
    useTime.ts              # 时间格式化（相对时间 + 完整时间）
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
| `/tools` | tools | 工具 |
| `/about` | about | 关于 |

使用 `createWebHashHistory` 哈希路由。

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

## 主题系统

- 3 套主题：`forest`（默认）/ `ocean` / `sunset`
- 通过 `data-theme` 属性设置在 `<html>` 上
- CSS 变量定义在 `src/styles/variables.css`
- 持久化到 `localStorage`（key: `blog-theme`）

## 国际化

- 中文（zh-CN）为默认语言和回退语言
- 语言包位于 `src/i18n/locales/`
- 持久化到 `localStorage`（key: `blog-lang`）

## 代码规范

- 使用 `<script setup lang="ts">` 写法
- 样式使用 `<style lang="less" scoped>`
- 缩进: 2 空格
- 组件命名: PascalCase
- 文件命名: PascalCase (组件) / camelCase (composables)

## 命令

```bash
npm run dev       # 开发服务器
npm run build     # 生产构建
npm run preview   # 预览构建结果
npm run typecheck # TypeScript 类型检查 (vue-tsc --noEmit)
```

## 注意事项

- 本项目使用 `python` 命令（非 `python3`）
- 路径分隔符使用 Windows 风格 (`\`)，但代码中使用 `/`
- 侧边栏宽度通过 CSS 变量 `--sidebar-width` 控制（默认 240px）
- 主题系统通过 `useTheme` composable 管理
- 节假日数据来自 `https://date.nager.at/api/v3/publicholidays/{year}/CN`
- 项目追踪的仓库：`StarFall-Minecraft-Launcher`
- 请用中文回复我