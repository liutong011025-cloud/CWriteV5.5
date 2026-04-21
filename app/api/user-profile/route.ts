import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const TREES_BACKUP_STAGE = "forest_trees_sync"

function isMissingTableError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : ""
  return (
    code === "P2021" ||
    /user_profiles.*does not exist|does not exist.*user_profiles/i.test(msg) ||
    /relation.*user_profiles|table.*user_profiles/i.test(msg)
  )
}

function isMissingColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : ""
  return (
    code === "P2022" ||
    /column .*user_profiles\..* does not exist/i.test(msg) ||
    /user_profiles\..*does not exist/i.test(msg)
  )
}

function isProfileSchemaError(e: unknown): boolean {
  return isMissingTableError(e) || isMissingColumnError(e)
}

function isDatabaseConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : ""
  return (
    code === "P1001" ||
    /Can't reach database|database connection|connection refused|placeholder/i.test(msg)
  )
}

function normalizeTreesPayload(raw: unknown): { id: number; stage: number }[] | null {
  if (!Array.isArray(raw)) return null
  return raw
    .map((item, idx) => {
      const id = Number((item as { id?: unknown })?.id) || idx + 1
      const stageRaw = Number((item as { stage?: unknown })?.stage) || 2
      const stage = stageRaw >= 4 ? 4 : stageRaw >= 3 ? 3 : 2
      return { id, stage }
    })
    .filter((tree) => Number.isFinite(tree.id) && tree.id >= 1 && tree.id <= 12)
}

async function readTreesBackupByUserId(userId: string): Promise<{ id: number; stage: number }[] | null> {
  try {
    const latest = await prisma.interaction.findFirst({
      where: { userId, stage: TREES_BACKUP_STAGE },
      orderBy: { timestamp: "desc" },
      select: { output: true },
    })
    const output = latest?.output as { trees?: unknown } | null | undefined
    return normalizeTreesPayload(output?.trees)
  } catch {
    return null
  }
}

async function writeTreesBackupByUserId(userId: string, trees: unknown): Promise<void> {
  const normalizedTrees = normalizeTreesPayload(trees)
  if (!normalizedTrees) return
  try {
    await prisma.interaction.create({
      data: {
        userId,
        stage: TREES_BACKUP_STAGE,
        output: {
          trees: normalizedTrees,
          source: "user-profile-fallback",
          at: new Date().toISOString(),
        },
      },
    })
  } catch {
    // ignore backup failure
  }
}

async function getUserProfileColumns(): Promise<Set<string> | null> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'user_profiles'`
    )
    return new Set(rows.map((r: { column_name: string }) => r.column_name))
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("user_id")
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { username: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const profileRows = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT * FROM user_profiles WHERE "userId" = $1 LIMIT 1`,
      user.id
    )
    const profile = profileRows[0] ?? null
    const treesFromProfile = normalizeTreesPayload(profile?.trees)
    const treesFromBackup = !treesFromProfile ? await readTreesBackupByUserId(user.id) : null
    return NextResponse.json({
      avatarUrl: profile?.avatarUrl ?? null,
      avatarEmoji: profile?.avatarEmoji ?? null,
      birthday: profile?.birthday ?? null,
      email: profile?.email ?? null,
      grade: profile?.grade ?? null,
      gender: profile?.gender ?? null,
      // 小树森林：最多 12 棵树，每棵 { id: number, stage: 1-6 }
      trees: treesFromProfile ?? treesFromBackup ?? null,
      // 上一次写作三指标：{ vocabRichness, descriptiveAccuracy, logicalCoherence }
      lastMetrics: profile?.lastMetrics ?? null,
    })
  } catch (e) {
    console.error("[user-profile] GET", e)
    if (isDatabaseConnectionError(e)) {
      // 降級返回，避免首頁/登入前請求被 500 擋住
      return NextResponse.json({
        avatarUrl: null,
        avatarEmoji: null,
        birthday: null,
        email: null,
        grade: null,
        gender: null,
        trees: null,
        lastMetrics: null,
        degraded: true,
      })
    }
    if (isProfileSchemaError(e)) {
      const userId = request.nextUrl.searchParams.get("user_id")
      let treesFromBackup: { id: number; stage: number }[] | null = null
      if (userId) {
        try {
          const user = await prisma.user.findUnique({ where: { username: userId } })
          if (user) {
            treesFromBackup = await readTreesBackupByUserId(user.id)
          }
        } catch {
          // ignore
        }
      }
      return NextResponse.json({
        avatarUrl: null,
        avatarEmoji: null,
        birthday: null,
        email: null,
        grade: null,
        gender: null,
        trees: treesFromBackup,
        degraded: true,
      })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, any> = {}
  try {
    body = await request.json()
    const userId = body.user_id ?? body.userId
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { username: userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const profileColumns = await getUserProfileColumns()
    const supportsTrees = !!profileColumns?.has("trees")
    const supportsLastMetrics = !!profileColumns?.has("lastMetrics")

    const updates: Record<string, any> = {
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      avatarEmoji: body.avatarEmoji !== undefined ? body.avatarEmoji : undefined,
      birthday: body.birthday !== undefined ? body.birthday : undefined,
      email: body.email !== undefined ? body.email : undefined,
      grade: body.grade !== undefined ? body.grade : undefined,
      gender: body.gender !== undefined ? body.gender : undefined,
      // trees: Array<{ id: number; stage: number }>
      trees: supportsTrees && body.trees !== undefined ? body.trees : undefined,
      // lastMetrics: { vocabRichness: number; descriptiveAccuracy: number; logicalCoherence: number }
      lastMetrics: supportsLastMetrics && body.lastMetrics !== undefined ? body.lastMetrics : undefined,
    }
    const data = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Record<string, any>

    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { userId: true },
    })

    if (existingProfile) {
      if (Object.keys(data).length > 0) {
        await prisma.userProfile.update({
          where: { userId: user.id },
          data,
          select: { userId: true },
        })
      }
    } else {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          ...data,
        },
        select: { userId: true },
      })
    }

    const profileRows = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT * FROM user_profiles WHERE "userId" = $1 LIMIT 1`,
      user.id
    )
    const profile = profileRows[0] ?? {}
    const normalizedTrees = normalizeTreesPayload(profile.trees ?? body.trees)
    await writeTreesBackupByUserId(user.id, normalizedTrees)
    return NextResponse.json({
      avatarUrl: profile.avatarUrl ?? null,
      avatarEmoji: profile.avatarEmoji ?? null,
      birthday: profile.birthday ?? null,
      email: profile.email ?? null,
      grade: profile.grade ?? null,
      gender: profile.gender ?? null,
      trees: supportsTrees ? (normalizedTrees ?? null) : normalizedTrees,
      lastMetrics: supportsLastMetrics ? (profile.lastMetrics ?? null) : null,
      degraded: !supportsTrees || !supportsLastMetrics,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[user-profile] POST", e)
    if (isProfileSchemaError(e)) {
      const userId = body.user_id ?? body.userId
      if (userId && body?.trees !== undefined) {
        try {
          const user = await prisma.user.findUnique({ where: { username: userId } })
          if (user) {
            await writeTreesBackupByUserId(user.id, body.trees)
          }
        } catch {
          // ignore
        }
      }
      // Graceful fallback: keep student flow working even if profile tables are not ready yet.
      return NextResponse.json({
        avatarUrl: body?.avatarUrl ?? null,
        avatarEmoji: body?.avatarEmoji ?? null,
        birthday: body?.birthday ?? null,
        email: body?.email ?? null,
        grade: body?.grade ?? null,
        gender: body?.gender ?? null,
        trees: normalizeTreesPayload(body?.trees),
        lastMetrics: null,
        degraded: true,
      })
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Internal error" },
      { status: 500 }
    )
  }
}
