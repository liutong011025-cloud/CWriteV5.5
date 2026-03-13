import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 讀取資料庫裡的 copywriting 修改記錄，給前端 review 頁面用。
// GET /api/copywriting-changes/list?userId=copywriting&limit=50

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdOrUsername = searchParams.get("userId") || undefined
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Number(limitParam) || 50, 200)

    const where: any = {
      stage: "copywriting-changes",
    }

    if (userIdOrUsername) {
      // 嘗試既匹配 userId，也匹配 username
      where.OR = [
        { userId: userIdOrUsername },
        { user: { username: userIdOrUsername } },
      ]
    }

    const items = await prisma.interaction.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: true,
      },
    })

    const result = items.map((it) => {
      const input = it.input as any
      return {
        id: it.id,
        userId: it.userId,
        username: it.user?.username ?? null,
        timestamp: it.timestamp,
        stage: input?.stage ?? null,
        changesCount: Array.isArray(input?.changes) ? input.changes.length : null,
        payload: input ?? null,
      }
    })

    return NextResponse.json({ success: true, items: result }, { status: 200 })
  } catch (error) {
    console.error("[copywriting-changes/list] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to load changes" }, { status: 500 })
  }
}

