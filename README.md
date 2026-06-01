# 🌿 Turing_ICE 的个人博客

基于 Vue 3 + Vite + TypeScript 构建的个人博客系统，支持 Markdown 文章渲染、多主题切换、国际化以及 gitalk 评论系统。

## ✨ 功能特性

- **Markdown 文章渲染** — 支持代码高亮、代码块一键复制
- **文章目录（TOC）** — 自动生成 H2/H3 层级目录，支持手风琴折叠、阅读进度追踪
- **多主题切换** — 3 套精心设计的主题：`forest`（森林）/ `ocean`（海洋）/ `sunset`（日落）
- **国际化** — 中文 / 英文双语切换
- **评论系统** — 基于 gitalk，以 GitHub Issue 作为评论存储
- **响应式布局** — 侧边栏可折叠，适配桌面端和移动端
- **节假日倒计时** — 实时显示距离下一个法定节假日的天数
- **页面加载进度条** — 路由切换时模拟加载进度
- **GitHub 文章源** — 支持从本地 `content/` 目录或 GitHub 仓库加载文章

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite 6 |
| 语言 | TypeScript ~5.6.0 |
| 样式 | Less (scoped styles) |
| 路由 | vue-router 4 (Hash 模式) |
| 国际化 | vue-i18n 9 |
| 状态管理 | pinia 3 |
| Markdown | markdown-it + gray-matter + highlight.js |
| 评论 | gitalk |
| UI 组件 | animal-island-vue |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆仓库
git clone https://github.com/Turing158/personal-blog.git
cd personal-blog

# 安装依赖
npm install
```

### 配置

复制 `.env.example` 为 `.env` 并根据需要填写：

```bash
cp .env.example .env
```

### 运行

```bash
# 开发服务器（默认端口 3000）
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
├── content/              # Markdown 文章源文件
├── src/
│   ├── components/       # 公共组件
│   │   ├── article/      # 文章相关组件（TOC 抽屉）
│   │   ├── common/       # 通用组件（MarkdownRenderer, ProgressBar 等）
│   │   └── sidebar/      # 侧边栏组件
│   ├── composables/      # 组合式函数（useArticles, useTheme, useTime 等）
│   ├── generated/        # 构建时自动生成的文章索引
│   ├── i18n/             # 国际化配置和语言包
│   ├── layouts/          # 布局组件（MainLayout）
│   ├── plugins/          # Vite 插件和自定义插件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── styles/           # 全局样式和主题变量
│   ├── types/            # TypeScript 类型定义
│   ├── views/            # 页面视图
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── .github/workflows/    # GitHub Actions 部署配置
├── .env.example          # 环境变量模板
└── vite.config.ts        # Vite 配置
```

## 📝 文章格式

在 `content/` 目录下创建 `.md` 文件，使用 YAML frontmatter 定义元数据：

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

## 🔧 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `VITE_GITHUB_OWNER` | GitHub 用户名（用于 GitHub API 加载文章） | 否 |
| `VITE_GITHUB_REPO` | GitHub 仓库名 | 否 |
| `VITE_GITALK_CLIENT_ID` | Gitalk OAuth App Client ID | 否 |
> 不配置环境变量时，默认从本地 `content/` 目录加载文章。

## 📦 部署

项目配置了 GitHub Actions 自动部署到 GitHub Pages。推送至 `master` 分支时会自动触发构建和部署。

需要在 GitHub 仓库的 Settings → Secrets → Actions 中配置以下 secrets：

- `GITHUB_OWNER` — GitHub 用户名
- `GITHUB_REPO` — 仓库名
- `GITALK_CLIENT_ID` — Gitalk OAuth App Client ID
- `GITALK_CLIENT_SECRET` — Gitalk OAuth App Client Secret

## 📄 License

[MIT](LICENSE)
