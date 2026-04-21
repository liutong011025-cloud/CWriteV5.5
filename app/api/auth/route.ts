import { NextRequest, NextResponse } from "next/server"
import { prisma, isDatabaseUrlConfigured } from "@/lib/prisma"

// 登錄邏輯：
// - 特殊帳號：copywriting / yinyin2948 → 文案編輯模式（不依賴資料庫）
// - 其他帳號：走資料庫 users 表，沿用原來的錯誤處理與提示

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: "login" | "register"
      username?: string
      password?: string
      email?: string
      name?: string
    }
    const { action = "login", username, password, email, name } = body

    if (action === "register") {
      const trimmedName = name?.trim() || ""
      const trimmedEmail = email?.trim().toLowerCase() || ""
      const trimmedPassword = password?.trim() || ""
      const reservedNames = new Set(["copywriting", "student"])

      if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        return NextResponse.json(
          { success: false, error: "Name, email, and password are required" },
          { status: 400 },
        )
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid email address" },
          { status: 400 },
        )
      }

      if (trimmedPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long" },
          { status: 400 },
        )
      }

      if (reservedNames.has(trimmedName.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: "This name is reserved. Please choose another one." },
          { status: 400 },
        )
      }

      if (!isDatabaseUrlConfigured()) {
        return NextResponse.json(
          {
            success: false,
            error: "Database not configured",
            hint: "Database URL is missing. Set DATABASE_URL or POSTGRES_URL in Vercel / .env.",
          },
          { status: 500 },
        )
      }

      const existingUser = await prisma.user.findUnique({
        where: { username: trimmedName },
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "This name is already registered" },
          { status: 409 },
        )
      }

      const createdUser = await prisma.user.create({
        data: {
          username: trimmedName,
          password: trimmedPassword,
          role: "student",
          noAi: false,
        },
      })

      return NextResponse.json(
        {
          success: true,
          user: {
            username: createdUser.username,
            role: createdUser.role as "teacher" | "student",
            noAi: createdUser.noAi || false,
            isCopywriter: false,
          },
        },
        { status: 201 },
      )
    }

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

    // 2) 老師帳號兜底：Nicole / yinyin2948（不查資料庫，避免 DB 連線故障時無法進入）
    if (username === "Nicole" && password === "yinyin2948") {
      return NextResponse.json(
        {
          success: true,
          user: {
            username: "Nicole",
            role: "teacher" as const,
            noAi: false,
            isCopywriter: false,
          },
        },
        { status: 200 },
      )
    }

    // 3) 臨時測試帳號：student / test123（AI mode，不查資料庫）
    if (username === "student" && password === "test123") {
      return NextResponse.json(
        {
          success: true,
          user: {
            username: "student",
            role: "student" as const,
            noAi: false,
            isCopywriter: false,
          },
        },
        { status: 200 },
      )
    }

    // 4) 其他帳號：需要資料庫
    if (!isDatabaseUrlConfigured()) {
      console.error("Database URL is not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          hint: "Database URL is missing. Set DATABASE_URL or POSTGRES_URL in Vercel / .env.",
        },
        { status: 500 },
      )
    }

    // 3) 從資料庫查詢
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

    const hasDatabaseUrl = isDatabaseUrlConfigured()

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

