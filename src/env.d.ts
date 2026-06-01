/// <reference types="vite/client" />

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
    clientID: string
    clientSecret: string
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
