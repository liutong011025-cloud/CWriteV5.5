"use client"

import { useMemo } from "react"
import useSWR, { mutate as swrMutate } from "swr"
import { EXAMPLE_ARTICLES, type Article, type ArticleType } from "@/lib/gallery-articles"

export type { Article, ArticleType }

/** 全站最近作品（轻量）；个人旧作靠「我的」请求合并，避免只显示全站 Top N 时把自己漏掉 */
export const LIBRARY_GLOBAL_KEY = "/api/library-articles?limit=300"

export function libraryArticlesMineKey(username: string): string {
  return `/api/library-articles?user_id=${encodeURIComponent(username)}&limit=10000`
}

async function libraryArticlesFetcher(url: string): Promise<Article[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch")
  const data = await response.json()
  return Array.isArray(data.articles) ? data.articles : []
}

function mergeArticleLists(globalList: Article[] | undefined, mineList: Article[] | undefined): Article[] {
  const map = new Map<string, Article>()
  for (const a of globalList ?? []) map.set(a.id, a)
  for (const a of mineList ?? []) map.set(a.id, a)
  return [...map.values()]
}

/**
 * 登录成功后后台调用：预填 SWR 缓存（全站 + 当前用户自己的列表）。
 */
export function preloadGalleryData(username?: string | null) {
  void swrMutate(LIBRARY_GLOBAL_KEY, libraryArticlesFetcher(LIBRARY_GLOBAL_KEY), {
    revalidate: false,
  }).catch(() => {})
  if (username?.trim()) {
    const mine = libraryArticlesMineKey(username.trim())
    void swrMutate(mine, libraryArticlesFetcher(mine), { revalidate: false }).catch(() => {})
  }
}

export interface UseGalleryDataOptions {
  /** 登录用户名：会额外拉取该用户全部图书馆作品并与全站 Feed 合并 */
  currentUsername?: string | null
}

export function useGalleryData(options: UseGalleryDataOptions = {}) {
  const mineKey = options.currentUsername?.trim()
    ? libraryArticlesMineKey(options.currentUsername.trim())
    : null

  const { data: globalArticles, error: errorGlobal, isLoading: loadingGlobal, mutate: mutateGlobal } =
    useSWR(LIBRARY_GLOBAL_KEY, libraryArticlesFetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    })

  const { data: mineArticles, error: errorMine, isLoading: loadingMine, mutate: mutateMine } = useSWR(
    mineKey,
    libraryArticlesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  )

  const articles = useMemo(() => {
    const merged = mergeArticleLists(globalArticles, mineArticles)
    // 只有在“还没拿到远端数据/请求失败”时才展示示例作品，避免数据库为空时误以为没连库
    const hasRemote =
      Array.isArray(globalArticles) || (mineKey ? Array.isArray(mineArticles) : false)
    const hasError = !!(errorGlobal ?? errorMine)
    if (!hasRemote || hasError) {
      return EXAMPLE_ARTICLES
    }
    return merged.sort((a, b) => b.timestamp - a.timestamp)
  }, [globalArticles, mineArticles, mineKey, errorGlobal, errorMine])

  const groupedArticles = useMemo(
    () =>
      articles.reduce(
        (acc: Record<ArticleType, Article[]>, article: Article) => {
          if (!acc[article.type]) acc[article.type] = []
          acc[article.type].push(article)
          return acc
        },
        {} as Record<ArticleType, Article[]>
      ),
    [articles]
  )

  const isLoading =
    (globalArticles === undefined && !errorGlobal) ||
    (!!mineKey && mineArticles === undefined && !errorMine)

  const refresh = () => {
    void mutateGlobal()
    if (mineKey) void mutateMine()
  }

  return {
    articles,
    groupedArticles,
    isLoading,
    error: errorGlobal ?? errorMine,
    refresh,
  }
}
