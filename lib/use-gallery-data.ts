"use client"

import useSWR, { mutate as swrMutate } from "swr"
import { EXAMPLE_ARTICLES, type Article, type ArticleType } from "@/lib/gallery-articles"

export type { Article, ArticleType }

/** 与图书馆 API 一致；登录后可预取，进入页面时 SWR 直接命中缓存 */
export const LIBRARY_ARTICLES_KEY = "/api/library-articles?limit=200"

async function libraryArticlesFetcher(url: string): Promise<Article[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch")
  const data = await response.json()
  return Array.isArray(data.articles) ? data.articles : []
}

/**
 * 登录成功后后台调用：预填 SWR 缓存，进入 Luminai Library 时不必再等首包。
 */
export function preloadGalleryData() {
  void swrMutate(LIBRARY_ARTICLES_KEY, libraryArticlesFetcher(LIBRARY_ARTICLES_KEY), {
    revalidate: false,
  }).catch(() => {})
}

export function useGalleryData() {
  const { data: remoteArticles, error, isLoading, mutate } = useSWR(
    LIBRARY_ARTICLES_KEY,
    libraryArticlesFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      refreshInterval: 60000,
    }
  )

  const articles = remoteArticles
    ? [...remoteArticles, ...EXAMPLE_ARTICLES].sort((a, b) => b.timestamp - a.timestamp)
    : EXAMPLE_ARTICLES

  const groupedArticles = articles.reduce(
    (acc, article) => {
      if (!acc[article.type]) acc[article.type] = []
      acc[article.type].push(article)
      return acc
    },
    {} as Record<ArticleType, Article[]>
  )

  return {
    articles,
    groupedArticles,
    isLoading,
    error,
    refresh: mutate,
  }
}
