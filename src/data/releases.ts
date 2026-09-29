/**
 * 发行版追踪仓库列表
 *
 * 纯数据模块（不依赖 vue / axios），因此可以被 Node 侧的构建插件直接 import ——
 * prerender-plugin 用它为每个仓库生成 `/release/<repo>` 的真实页面与 sitemap 条目。
 * 运行时由 `src/composables/useReleases.ts` 使用。
 */
export const RELEASE_REPOS = [
  'StarFall-Minecraft-Launcher',
  'SFMC',
  'StarFall-Vue',
  'StarFall-SpringBoot',
  'MemeMomo',
  'CodeCraft',
] as const

export type ReleaseRepo = (typeof RELEASE_REPOS)[number]
