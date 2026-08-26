/**
 * 工具元数据
 *
 * 工具列表的单一事实来源：ToolsView 渲染卡片、搜索功能索引工具都从这里取。
 * 工具名 / 描述 / 标签走 i18n（`tools.<key>Name|Desc|Tags`），故这里只存
 * i18n key、异步组件名、emoji 图标。
 *
 * 新增工具时：在此追加一项，并在 zh-CN.json / en-US.json 的 `tools` 下补齐
 * `<key>Name` / `<key>Desc` / `<key>Tags` 三条文案。
 */

export interface ToolMeta {
  /** i18n key 前缀，对应 `tools.<key>Name` 等 */
  key: string
  /** 异步组件名（与 ToolsView 的 componentMap 键一致） */
  component: string
  /** emoji 图标 */
  icon: string
}

export const toolKeys: readonly ToolMeta[] = [
  { key: 'jsonFormatter', component: 'JsonFormatter', icon: '📋' },
  { key: 'base64', component: 'Base64Tool', icon: '🔐' },
  { key: 'regex', component: 'RegexTool', icon: '🔍' },
  { key: 'color', component: 'ColorConverter', icon: '🎨' },
  { key: 'timestamp', component: 'TimestampConverter', icon: '⏰' },
  { key: 'textCounter', component: 'TextCounter', icon: '📊' },
  { key: 'randomGenerator', component: 'RandomGenerator', icon: '🎲' },
  { key: 'randomString', component: 'RandomStringGenerator', icon: '🔤' },
  { key: 'holidayQuery', component: 'HolidayQueryTool', icon: '🎉' },
  { key: 'md5', component: 'Md5Tool', icon: '🔑' },
  { key: 'sha', component: 'ShaTool', icon: '🔒' },
  { key: 'diff', component: 'DiffCheckerTool', icon: '📑' },
  { key: 'codeRunner', component: 'CodeRunnerTool', icon: '▶' },
  { key: 'apiTest', component: 'ApiTestTool', icon: '🌐' },
  { key: 'sqlFormatter', component: 'SqlFormatterTool', icon: '🗃️' },
  { key: 'cronEditor', component: 'CronEditorTool', icon: '⏱️' },
  { key: 'tokenUsageChart', component: 'TokenUsageChartTool', icon: '📈' },
  { key: 'passwordStrength', component: 'PasswordStrengthTool', icon: '🔒' },
  { key: 'loremIpsum', component: 'LoremIpsumTool', icon: '📝' },
  { key: 'clineModels', component: 'ClineModelsTool', icon: '🤖' },
  { key: 'githubInfo', component: 'GithubInfoTool', icon: '🐙' },
] as const
