/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 浏览量 API 基址，未配置时按开发/生产自动选择（见 src/api/viewCount.ts） */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
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
