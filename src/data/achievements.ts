/**
 * 成就/徽章系统 — 数据定义
 *
 * 每个成就包含中文名和英文名，按类别分类：
 * 探索 (exploration)、特殊 (special)、秘密 (secret)
 *
 * 显示规则：根据当前语言环境只显示对应语言，不同时显示。
 */
export type AchievementCategory = 'exploration' | 'special' | 'secret'

export interface Achievement {
  /** 唯一标识（用作 localStorage key 后缀） */
  id: string
  /** 中文名 */
  name: string
  /** 英文名 */
  nameEn: string
  /** 中文描述 */
  description: string
  /** 英文描述 */
  descriptionEn: string
  /** Emoji 图标 */
  icon: string
  /** 分类 */
  category: AchievementCategory
  /** 解锁条件 i18n key */
  conditionKey: string
}

export const ACHIEVEMENTS: Achievement[] = [
  // ===== 探索 (Exploration) =====
  {
    id: 'first-steps',
    name: '欢迎光临',
    nameEn: 'Wel~come!',
    icon: '👣',
    description: '首次访问博客',
    descriptionEn: 'First visit to this site',
    category: 'exploration',
    conditionKey: 'achievements.conditions.firstSteps',
  },
  {
    id: 'bookworm',
    name: '感谢检阅！',
    nameEn: 'Thanks for reviewing!',
    icon: '📖',
    description: '访问5篇不同文章',
    descriptionEn: 'Visit 5 different articles',
    category: 'exploration',
    conditionKey: 'achievements.conditions.bookworm',
  },
  {
    id: 'tool-master',
    name: '按住[W]进行思索',
    nameEn: 'Hold [W] to think~',
    icon: '🛠️',
    description: '使用过全部 17 个工具',
    descriptionEn: 'Use all 17 tools',
    category: 'exploration',
    conditionKey: 'achievements.conditions.toolMaster',
  },
  {
    id: 'project-explorer',
    name: '三顾茅庐',
    nameEn: "go out of one's way to recruit talent",
    icon: '🚀',
    description: '访问3個不同项目提交页',
    descriptionEn: 'Visit 3 different project commit pages',
    category: 'exploration',
    conditionKey: 'achievements.conditions.projectExplorer',
  },
  {
    id: 'release-two-visit',
    name: '二刷',
    nameEn: 'Second visit',
    icon: '🏷️',
    description: '查看2個發行頁',
    descriptionEn: 'View 2 release pages',
    category: 'exploration',
    conditionKey: 'achievements.conditions.releaseTwoVisit',
  },
  {
    id: 'install-pwa',
    name: '解锁桌面Blog',
    nameEn: 'Unlock Desktop Blog',
    icon: '💼',
    description: '成功安装pwa',
    descriptionEn: 'Successfully install PWA',
    category: 'exploration',
    conditionKey: 'achievements.conditions.installPwa',
  },
  {
    id: 'find-sperate-option',
    name: '隐藏设置捏',
    nameEn: 'Hide Settings!',
    icon: '✨',
    description: '成功打开分隔符的设置',
    descriptionEn: 'Open the separator settings',
    category: 'exploration',
    conditionKey: 'achievements.conditions.findSperateOption',
  },

  // ===== 特殊 (Special) =====
  {
    id: 'egg-hunter',
    name: '盲僧，你发现了华点',
    nameEn: 'Watson, you spotted the blind spot!',
    icon: '🥚',
    description: '触发 Konami Code（↑↑↓↓←→←→BA）',
    descriptionEn: 'Trigger the Konami Code (↑↑↓↓←→←→BA)',
    category: 'special',
    conditionKey: 'achievements.conditions.eggHunter',
  },
  {
    id: 'night-owl',
    name: '美国作息',
    nameEn: 'Chinese daily schedule',
    icon: '🦉',
    description: '在午夜后访问（0:00–5:59）',
    descriptionEn: 'Visit after midnight (0:00–5:59)',
    category: 'special',
    conditionKey: 'achievements.conditions.nightOwl',
  },
  {
    id: 'early-bird',
    name: '早尚好',
    nameEn: 'Good morrow',
    icon: '🐦',
    description: '在清晨 6 点之间访问（6:00–6:59）',
    descriptionEn: 'Visit between 6 AM (6:00–6:59)',
    category: 'special',
    conditionKey: 'achievements.conditions.earlyBird',
  },
  {
    id: 'dark-knight',
    name: '当心眼睛',
    nameEn: 'Flashbang!',
    icon: '🌙',
    description: '切换到暗色主题',
    descriptionEn: 'Switch to dark theme',
    category: 'special',
    conditionKey: 'achievements.conditions.darkKnight',
  },
  {
    id: 'theme-hopper',
    name: '没你喜欢的色嘛',
    nameEn: 'Not your color',
    icon: '🎨',
    description: '切换过所有主题（forest / ocean / sunset / dark）',
    descriptionEn: 'Switch through all themes (forest / ocean / sunset / dark)',
    category: 'special',
    conditionKey: 'achievements.conditions.themeHopper',
  },
  {
    id: 'speed-demon',
    name: '到处乱摸',
    nameEn: 'Touch everything randomly',
    icon: '⚡',
    description: '点击 10 次头像触发彩蛋',
    descriptionEn: 'Click the avatar 10 times to trigger the easter egg',
    category: 'special',
    conditionKey: 'achievements.conditions.speedDemon',
  },

  // ===== 秘密 (Secret) =====
  {
    id: 'achievement-collector',
    name: '成功给你看光了',
    nameEn: 'Achievement Collector',
    icon: '🏆',
    description: '解锁所有其他成就后自动解锁',
    descriptionEn: 'Automatically unlock after unlocking all other achievements',
    category: 'secret',
    conditionKey: 'achievements.conditions.achievementCollector',
  },
]
