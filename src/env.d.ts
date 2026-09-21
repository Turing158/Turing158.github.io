/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 浏览量 API 基址，未配置时使用默认后端地址（见 src/api/viewCount.ts） */
  readonly VITE_API_BASE?: string
  /** Cline 推荐/免费模型 API 基址，未配置时使用默认 tool-proxy 地址（见 src/config.ts） */
  readonly VITE_CLINE_API_BASE?: string
  /** Cline 全量模型目录 API（搜索 Tab 数据源），未配置时使用默认 tool-proxy 地址（见 src/config.ts） */
  readonly VITE_CLINE_ALL_API?: string
  /** GitHub 用户信息 API 基址（tool-proxy 的 /github/user），未配置时使用默认值（见 src/config.ts） */
  readonly VITE_GITHUB_USER_API?: string
  /** GitHub REST 代理基址（Cloudflare Worker github-proxy），未配置时使用默认值（见 src/config.ts） */
  readonly VITE_GITHUB_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  /** 百度统计全局队列，由 index.html 中的 hm.js 片段初始化；SPA 内补报 PV 时使用 */
  _hmt?: any[][]
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'gray-matter' {
  interface MatterValue {
    data: Record<string, any>
    content: string
    excerpt?: string
  }
  function matter(input: string): MatterValue
  export default matter
}

declare module 'gitalk' {
  interface GitalkConfig {
    clientID?: string
    clientSecret?: string
    repo: string
    owner: string
    admin: string[]
    id: string
    title: string
    body: string
    distractionFreeMode?: boolean
    language?: string
    proxy?: string
    flipMoveOptions?: any
    enableHotKey?: boolean
  }
  class Gitalk {
    constructor(config: GitalkConfig)
    render(container: string | HTMLElement): void
  }
  export default Gitalk
}
