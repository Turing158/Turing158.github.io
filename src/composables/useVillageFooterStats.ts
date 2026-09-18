import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFooterStats } from '@/composables/useFooterStats'

export type VillageFooterWood = 'oak' | 'spruce' | 'birch' | 'jungle'
export type VillageFooterMount = 'standing' | 'wall' | 'hanging' | 'side' | 'center'

export interface VillageFooterStat {
  value: string
  label: string
  wood?: VillageFooterWood
  mount?: VillageFooterMount
  aria?: string
}

// 大数缩写为 1.2K / 3.4M / 5.6B，保持告示牌内数字不换行
function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

/**
 * 把 useFooterStats 的真实数据装配成 VillageFooter 的 stats 数组。
 * 木种与悬挂方式按村落布局固定：
 * 落地 → 贴墙 → 底面双链 → 侧面支架 → 中心斜链 → 落地 → 贴墙
 */
export function useVillageFooterStats() {
  const { t } = useI18n()
  const {
    runningDays,
    articleCount,
    totalWords,
    totalViews,
    coffeeCups,
    playgroundLaps,
    bookHeight,
  } = useFooterStats()

  const stats = computed<VillageFooterStat[]>(() => [
    { value: String(runningDays.value), label: t('footerStats.runningDays'), wood: 'oak', mount: 'standing' },
    { value: String(articleCount.value), label: t('footerStats.articles'), wood: 'spruce', mount: 'wall' },
    { value: formatLargeNumber(totalWords.value), label: t('footerStats.words'), wood: 'birch', mount: 'hanging' },
    { value: formatLargeNumber(totalViews.value), label: t('footerStats.views'), wood: 'jungle', mount: 'side' },
    { value: String(coffeeCups.value), label: t('footerStats.coffee'), wood: 'oak', mount: 'center' },
    { value: bookHeight.value, label: t('footerStats.bookHeight'), wood: 'spruce', mount: 'standing' },
    { value: playgroundLaps.value, label: t('footerStats.laps'), wood: 'birch', mount: 'wall' },
  ])

  const copyright = computed(() => t('footerStats.copyright', { year: new Date().getFullYear() }))

  return { stats, copyright }
}
