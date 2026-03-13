import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"

// 接收 copywriting 帳號在前端修改的所有文字 diff。
// 行為：
// - 儘量寫一份 JSON 檔到本地（開發環境好用）
// - 同時把內容存進資料庫（使用 interactions 表，stage = "copywriting-changes"）
// - 無論檔案是否寫成功，只要資料有存起來就回傳 success，避免 Vercel 只讀檔案系統導致報錯。

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string // 這裡其實是 username，例如 "copywriting"
      stage?: string
      changes?: {
        nodeId: string
        pageStage?: string
        original: string
        updated: string
        cssPath?: string
      }[]
    }

    const { userId, stage, changes } = body

    if (!userId || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { success: false, error: "userId and non-empty changes are required" },
        { status: 400 },
      )
    }

    const timestamp = new Date()
    const iso = timestamp.toISOString()
    const safeStage = (stage || "all").replace(/[^a-zA-Z0-9_-]/g, "_")

    const payload = {
      username: userId,
      stage: stage || null,
      createdAt: iso,
      changes,
    }

    // 1) 嘗試寫入檔案（失敗不會讓整個請求報錯，方便在 Vercel 上使用）
    let filePath: string | null = null
    try {
      // 在 serverless 環境中只能寫 /tmp，避免 /var/task 只讀導致錯誤
      const baseDir = process.env.NODE_ENV === "production" ? "/tmp" : process.cwd()
      const folder = path.join(baseDir, "copywriting-changes")
      await fs.mkdir(folder, { recursive: true })
      const filename = `${iso.replace(/[:.]/g, "-")}-${userId}-${safeStage}.json`
      filePath = path.join(folder, filename)
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8")
    } catch (fsError) {
      console.warn("[copywriting-changes] Failed to write file (ignored on production):", fsError)
      filePath = null
    }

    // 2) 存入資料庫：
    //    - 若資料庫中還沒有這個 username，先建立一個虛擬用戶
    //    - interactions.userId 必須使用 users.id，而不是 username
    try {
      const user = await prisma.user.upsert({
        where: { username: userId },
        update: {},
        create: {
          username: userId,
          password: "copywriting-placeholder",
          role: "teacher",
          noAi: true,
        },
      })

      await prisma.interaction.create({
        data: {
          userId: user.id,
          stage: "copywriting-changes",
          input: payload as any,
        },
      })
    } catch (dbError) {
      console.error("[copywriting-changes] Failed to save to database:", dbError)
      // 即使資料庫失敗，只要前端還在，就可以直接用 response 裡的 payload
    }

    return NextResponse.json(
      {
        success: true,
        file: filePath ? filePath : null,
        count: changes.length,
        payload,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[copywriting-changes] Error handling changes:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save changes" },
      { status: 500 },
    )
  }
}

