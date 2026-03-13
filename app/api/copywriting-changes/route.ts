import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// 接收 copywriting 帳號在前端修改的所有文字 diff，
// 以 JSON 文件形式寫入專案根目錄下的 copywriting-changes 資料夾。

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string
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
        { error: "userId and non-empty changes are required" },
        { status: 400 },
      )
    }

    const baseDir = process.cwd()
    const folder = path.join(baseDir, "copywriting-changes")
    await fs.mkdir(folder, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const safeStage = (stage || "all").replace(/[^a-zA-Z0-9_-]/g, "_")
    const filename = `${timestamp}-${userId}-${safeStage}.json`
    const filePath = path.join(folder, filename)

    const payload = {
      userId,
      stage: stage || null,
      createdAt: new Date().toISOString(),
      changes,
    }

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8")

    return NextResponse.json(
      {
        success: true,
        file: `copywriting-changes/${filename}`,
        count: changes.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[copywriting-changes] Error writing changes:", error)
    return NextResponse.json(
      { error: "Failed to save changes" },
      { status: 500 },
    )
  }
}

