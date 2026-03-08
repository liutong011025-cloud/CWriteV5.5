import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isMissingTableError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : ""
  return (
    code === "P2021" ||
    /user_profiles.*does not exist|does not exist.*user_profiles/i.test(msg) ||
    /relation.*user_profiles|table.*user_profiles/i.test(msg)
  )
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("user_id")
    if (!userId) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { username: userId },
      include: { profile: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const profile = user.profile
    return NextResponse.json({
      avatarUrl: profile?.avatarUrl ?? null,
      avatarEmoji: profile?.avatarEmoji ?? null,
      birthday: profile?.birthday ?? null,
      email: profile?.email ?? null,
      grade: profile?.grade ?? null,
      gender: profile?.gender ?? null,
      // 小树森林：最多 12 棵树，每棵 { id: number, stage: 1-6 }
      trees: profile?.trees ?? null,
      // 上一次写作三指标：{ vocabRichness, descriptiveAccuracy, logicalCoherence }
      lastMetrics: profile?.lastMetrics ?? null,
    })
  } catch (e) {
    console.error("[user-profile] GET", e)
    if (isMissingTableError(e)) {
      return NextResponse.json({
        avatarUrl: null,
        avatarEmoji: null,
        birthday: null,
        email: null,
        grade: null,
        gender: null,
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
    const user = await prisma.user.findUnique({
      where: { username: userId },
      include: { profile: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const updates: Record<string, any> = {
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      avatarEmoji: body.avatarEmoji !== undefined ? body.avatarEmoji : undefined,
      birthday: body.birthday !== undefined ? body.birthday : undefined,
      email: body.email !== undefined ? body.email : undefined,
      grade: body.grade !== undefined ? body.grade : undefined,
      gender: body.gender !== undefined ? body.gender : undefined,
      // trees: Array<{ id: number; stage: number }>
      trees: body.trees !== undefined ? body.trees : undefined,
      // lastMetrics: { vocabRichness: number; descriptiveAccuracy: number; logicalCoherence: number }
      lastMetrics: body.lastMetrics !== undefined ? body.lastMetrics : undefined,
    }
    const data = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Record<string, any>

    let profile = user.profile
    if (user.profile) {
      if (Object.keys(data).length > 0) {
        profile = await prisma.userProfile.update({
          where: { userId: user.id },
          data,
        })
      }
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          ...data,
        },
      })
    }
    return NextResponse.json({
      avatarUrl: profile.avatarUrl,
      avatarEmoji: profile.avatarEmoji,
      birthday: profile.birthday,
      email: profile.email,
      grade: profile.grade,
      gender: profile.gender,
      trees: profile.trees ?? null,
      lastMetrics: profile.lastMetrics ?? null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error("[user-profile] POST", e)
    if (isMissingTableError(e)) {
      // Graceful fallback: keep student flow working even if profile tables are not ready yet.
      return NextResponse.json({
        avatarUrl: body?.avatarUrl ?? null,
        avatarEmoji: body?.avatarEmoji ?? null,
        birthday: body?.birthday ?? null,
        email: body?.email ?? null,
        grade: body?.grade ?? null,
        gender: body?.gender ?? null,
        trees: body?.trees ?? null,
        lastMetrics: body?.lastMetrics ?? null,
        degraded: true,
      })
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "Internal error" },
      { status: 500 }
    )
  }
}
