/**
 * Fuse.js 搜索索引封装
 * 提供文章全文模糊搜索能力，支持相关度排序
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js'
import type { Article } from '@/types/article'

let fuse: Fuse<Article> | null = null

export function useSearchIndex() {
  /**
   * 构建搜索索引（只需调用一次，在数据加载完成后）
   */
  function build(articles: Article[]) {
    const options: IFuseOptions<Article> = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'tags', weight: 0.25 },
        { name: 'description', weight: 0.2 },
        { name: 'content', weight: 0.15 },
      ],
      threshold: 0.3,         // 模糊度：0=精确匹配，1=匹配任意字符
      includeScore: true,     // 返回相关度分数（越低越匹配）
      ignoreLocation: true,   // 不关心匹配位置
      minMatchCharLength: 1,  // 最少匹配字符数
    }
    fuse = new Fuse(articles, options)
  }

  /**
   * 执行搜索
   * @param query 搜索关键词
   * @returns Fuse.js 搜索结果（按相关度排序）
   */
  function search(query: string): FuseResult<Article>[] {
    if (!fuse || !query.trim()) return []
    return fuse.search(query.trim())
  }

  return { build, search }
}
