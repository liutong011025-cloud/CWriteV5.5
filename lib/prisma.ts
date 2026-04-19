// Prisma 客户端单例
// 防止在开发环境中创建多个 Prisma Client 实例

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * 与 Vercel / Prisma 常见命名对齐：仅配 POSTGRES_URL 或 PRISMA_DATABASE_URL 时也应能连库。
 * schema.prisma 仍使用 env("DATABASE_URL")，运行时由此处注入实际 URL。
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.PRISMA_DATABASE_URL,
    process.env.NEXT_PUBLIC_DATABASE_URL,
  ]
  for (const raw of candidates) {
    const s = typeof raw === 'string' ? raw.trim() : ''
    if (s) return s
  }
  return undefined
}

export function isDatabaseUrlConfigured(): boolean {
  return !!resolveDatabaseUrl()
}

// 优先使用环境变量，如果环境变量不存在则使用 .env 文件
// 构建时如果 DATABASE_URL 不存在，使用占位符（仅用于生成 Prisma Client）
const databaseUrl = resolveDatabaseUrl()

// 在生产环境中，如果没有 DATABASE_URL，使用占位符但会在实际使用时失败
// 这样可以避免构建时错误，但在运行时会有明确的错误信息
const finalDatabaseUrl = databaseUrl || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

// 创建 Prisma Client 实例
// 注意：如果 DATABASE_URL 未配置，Prisma 会在首次查询时抛出错误
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: finalDatabaseUrl,
      },
    },
  })

// 在生产环境中也使用全局单例，避免创建多个实例
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}



