# 🌿 Turing_ICE 的个人博客 & 工具站

基于 Vue 3 + Vite + TypeScript 构建的个人站点，集 **博客**、**在线开发工具箱**、**GitHub 数据展示** 与 **成就彩蛋系统** 于一体，支持 PWA 离线访问、多主题、国际化与 SEO 优化。

## ✨ 功能特性

### 📝 博客系统

- **Markdown 文章** — 构建时渲染（markdown-it + highlight.js），代码高亮、代码块一键复制
- **文章目录（TOC）** — 自动生成 H2/H3 层级目录，手风琴折叠、滚动进度追踪
- **阅读时间估算** — 中文约 300 字/分钟、英文约 200 词/分钟
- **文章浏览量** — 基于 LeanCloud 存储，列表与详情页展示
- **评论系统** — 基于 gitalk，以 GitHub Issue 作为评论存储（OAuth 经代理转发）
- **全站搜索** — 基于 fuse.js 的全文搜索，支持文章与工具
- **SEO 优化** — 每个页面独立设置 title / meta / OG / JSON-LD，构建时自动生成 `sitemap.xml`
- **文章分享** — 复制链接、微信、微博、Twitter 分享按钮

### 🧰 在线工具箱（21 个纯前端工具）

| 分类 | 工具 |
|------|------|
| 编解码 / 加密 | JSON 格式化、Base64 编解码、MD5、SHA-1/256/512 |
| 文本处理 | 文本统计、代码差异对比、SQL 格式化、Lorem Ipsum 生成器 |
| 代码 / 正则 | 正则表达式测试（铁路图可视化）、在线代码运行（JS / HTML） |
| 转换 | 颜色转换（HEX/RGB/HSL）、时间戳转换、Cron 表达式编辑器 |
| 生成 / 检测 | 随机数生成器、随机字符串生成器、密码强度检测 |
| 数据可视化 | Token 用量图表（浏览器本地生成 SVG） |
| 查询 | 节日查询（任意年份/国家）、Cline 免费模型列表、GitHub 账号信息 |

所有工具均在浏览器本地运行，无需后端；支持工具卡片拖拽重排与独立工具详情页。

### 🐙 GitHub 数据展示

- **项目页** — 按类别展示项目（开发中 / 已完成 / 博客 / 教程 / 搁置）
- **提交记录页** — 追踪指定仓库的最近提交
- **发行页** — 展示仓库 Release 列表与详情

### 🎮 体验与趣味

- **多主题切换** — 3 套主题：`forest`（森林）/ `ocean`（海洋）/ `sunset`（日落）
- **国际化** — 中文 / 英文双语切换
- **成就系统** — 探索 / 特殊 / 秘密三类成就徽章，解锁条件自动追踪
- **Konami Code 彩蛋** — 输入 `↑↑↓↓←→←→BA` 触发撒花 🎉
- **节假日倒计时** — 首页实时显示距下一个法定节假日的天数
- **页脚趣味统计** — 博客运行天数、文章总数、总字数
- **响应式布局** — 侧边栏可折叠，适配桌面端和移动端
- **加载进度条** — 路由切换时顶部模拟加载进度
- **消息提示** — 自定义 toast 插件（info / success / warning / error）

### 📱 PWA

- **离线访问** — Service Worker 缓存静态资源与 API 响应，自定义离线降级页
- **版本更新** — 自动检测新版本，右下角提示一键更新
- **安装提示** — 支持添加到主屏幕（含 iOS Safari 检测）
- **缓存策略** — 字体 CacheFirst（1 年）、图片 CacheFirst（30 天）、GitHub API NetworkFirst（5 分钟）

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API, `<script setup>`) |
| 构建 | Vite 6 + vite-plugin-pwa |
| 语言 | TypeScript ~5.6 (strict mode) |
| 样式 | Less (scoped styles + CSS 变量主题) |
| 路由 | vue-router 4 (Hash 模式) |
| 状态管理 | pinia 3 |
| 国际化 | vue-i18n 9 (zh-CN / en-US) |
| Markdown | markdown-it + markdown-it-anchor + gray-matter + highlight.js |
| 搜索 | fuse.js |
| 评论 | gitalk |
| UI 组件 | animal-island-vue |
| HTTP | axios |

## 🌐 在线访问

- **主站：** [https://blog.turing158.cc.cd](https://blog.turing158.cc.cd)
- **备用：** [https://turing158.github.io](https://turing158.github.io)

站点支持 PWA，通过浏览器"安装"或"添加到主屏幕"即可离线使用全部文章与工具。

## 🗺 页面导览

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 主页 | 时钟 + 节假日倒计时 + 最近提交 + 最近文章 |
| `/articles` | 文章列表 | 按标签筛选，显示阅读时间与浏览量 |
| `/article/:slug` | 文章详情 | TOC 目录、评论、分享、代码高亮 |
| `/projects` | 项目 | 按状态分类的项目展示 |
| `/releases` `/release/:repo` | 发行 | 仓库 Release 列表与详情 |
| `/commits/:repo?` | 提交记录 | 追踪仓库的最近提交 |
| `/tools` `/tools/:id` | 工具箱 | 21 个在线工具与工具详情页 |
| `/achievements` | 成就 | 已解锁徽章与待解锁条件 |
| `/about` | 关于 | 关于站长 |

另有若干不套用主布局的独立落地页：`/sfmc`（StarFall 启动器）、`/starfall-forum`（论坛）、`/sfmc-jar`（JAR 下载页）。

## 🔍 核心模块解析

- **文章系统** — 构建时 `articles-plugin` Vite 插件扫描 `content/*.md`，解析 frontmatter 并预渲染 HTML，生成文章索引（`src/generated/_articles.ts`）；运行时 `useArticles` 读取本地索引，同时可合并 GitHub API 数据，结果由 Pinia 缓存 5 分钟
- **搜索系统** — 文章加载完成后由 `useSearch` 建立 fuse.js 索引（标题 / 标签 / 描述 / 正文），工具元数据来自 `src/data/tools.ts` 一并纳入搜索
- **SEO 系统** — 各视图通过 `useSeo` / `useArticleSeo` 设置独立 meta，随语言切换响应式更新；`sitemap.xml` 在构建收尾阶段自动写出
- **主题系统** — 3 套主题以 CSS 变量定义于 `src/styles/variables.css`，通过 `<html>` 上的 `data-theme` 属性切换并持久化到 localStorage
- **成就系统** — `useAchievements` 追踪路由访问、文章阅读、工具使用等行为，解锁记录存于 localStorage； Konami Code 彩蛋复用同一套解锁机制并触发撒花
- **PWA** — vite-plugin-pwa 配置 `autoUpdate` 注册、SPA 离线回退与多级运行时缓存，配套安装提示、更新提示与离线降级页三个组件

## ❓ 常见问题

**工具会把我的数据上传到服务器吗？**
不会。工具箱内所有工具均为纯前端实现，输入内容只在浏览器本地处理（Token 用量图等需上传文件的场景也在本地解析，不经网络）。

**为什么评论时需要授权 GitHub？**
评论基于 gitalk，每篇文章对应一个 GitHub Issue，评论即 Issue 评论，因此需要 GitHub OAuth 授权。

**离线状态下为什么还能访问？**
站点是 PWA，Service Worker 已缓存页面与静态资源，断网时会展示缓存的最近版本或离线提示页。

**成就里的"秘密成就"是什么？**
部分成就不直接显示解锁条件，需要你在站点里探索——试试键盘上那串经典的上上下下左右左右 BA。

**文章浏览量数据存在哪里？**
由 LeanCloud 提供 存储，仅记录每篇文章的累计访问次数。

## 📁 项目结构

```
├── content/               # Markdown 文章源文件
├── src/
│   ├── components/
│   │   ├── article/       # 文章相关组件（TOC 抽屉、分享按钮）
│   │   ├── common/        # 通用组件（MarkdownRenderer、ProgressBar、PWA 提示等）
│   │   ├── search/        # 搜索对话框与结果卡片
│   │   ├── sidebar/       # 侧边栏图标组件
│   │   └── tools/         # 工具箱组件（21 个在线工具）
│   ├── composables/       # 组合式函数（useArticles、useSeo、useTheme、useAchievements 等）
│   ├── data/              # 静态数据（项目列表、工具元数据、成就定义）
│   ├── generated/         # 构建时自动生成的文章索引（勿手动编辑）
│   ├── i18n/              # 国际化语言包（zh-CN / en-US）
│   ├── layouts/           # 主布局（侧边栏 + 内容区 + TOC）
│   ├── plugins/           # Vite 插件（articles-plugin）与消息提示插件（blog-tip）
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── styles/            # 全局样式与 3 套主题变量
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数（md5 等）
│   ├── views/             # 页面视图
│   │   └── standalone/    # 独立落地页（不套用主布局）
│   ├── config.ts          # 全局配置（.env 优先，含默认值）
│   └── main.ts            # 入口文件
├── scripts/               # 独立脚本（sitemap、PWA 图标生成）
├── patches/               # patch-package 补丁
├── .github/workflows/     # GitHub Actions 部署配置
├── .env.example           # 环境变量模板
└── vite.config.ts         # Vite 配置（含 PWA）
```
