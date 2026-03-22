import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 登錄邏輯：
// - 特殊帳號：copywriting / yinyin2948 → 文案編輯模式（不依賴資料庫）
// - 其他帳號：走資料庫 users 表，沿用原來的錯誤處理與提示

export async function POST(request: NextRequest) {
  try {
    // 檢查資料庫連線配置（保持你原本的保護）
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          hint: "DATABASE_URL environment variable is missing. Please configure it in Vercel project settings.",
        },
        { status: 500 },
      )
    }

    const body = (await request.json()) as { username?: string; password?: string }
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 },
      )
    }

    // 1) 特殊文案帳號：copywriting / yinyin2948（不查資料庫）
    if (username === "copywriting" && password === "yinyin2948") {
      return NextResponse.json(
        {
          success: true,
          user: {
            username: "copywriting",
            role: "teacher" as const,
            noAi: true,
            isCopywriter: true,
          },
        },
        { status: 200 },
      )
    }

    // 2) 其他帳號：從資料庫查詢
    let user
    try {
      user = await prisma.user.findUnique({
        where: { username },
      })
    } catch (dbError) {
      const dbErrorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (
        dbErrorMessage.includes("Can't reach database") ||
        dbErrorMessage.includes("P1001") ||
        dbErrorMessage.includes("connection") ||
        dbErrorMessage.includes("placeholder")
      ) {
        console.error("Database connection failed:", dbErrorMessage)
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed",
            hint: "Please check if DATABASE_URL is correctly configured in Vercel project settings.",
          },
          { status: 500 },
        )
      }
      throw dbError
    }

    if (user && user.password === password) {
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role as "teacher" | "student",
          noAi: user.noAi || false,
          isCopywriter: false,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or password" },
      { status: 401 },
    )
  } catch (error) {
    console.error("Auth error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    const isDatabaseError =
      errorMessage.includes("Prisma") ||
      errorMessage.includes("database") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("Can't reach database")

    const hasDatabaseUrl = !!process.env.DATABASE_URL

    return NextResponse.json(
      {
        success: false,
        error: isDatabaseError ? "Database connection failed" : "Internal server error",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        hint: isDatabaseError
          ? hasDatabaseUrl
            ? "Database connection issue. Please check if the database server is running and accessible."
            : "DATABASE_URL environment variable is not configured. Please set it in your .env file."
          : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    )
  }
}

