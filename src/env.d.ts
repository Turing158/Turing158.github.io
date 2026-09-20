/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 浏览量 API 基址，未配置时使用默认后端地址（见 src/api/viewCount.ts） */
  readonly VITE_API_BASE?: string
  /** Cline 模型 API 基址，未配置时使用默认 Worker 地址（见 src/config.ts） */
  readonly VITE_CLINE_API_BASE?: string
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
