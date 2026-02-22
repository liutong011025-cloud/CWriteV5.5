import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    })
  } catch (e) {
    console.error("[user-profile] GET", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
    const updates = {
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : undefined,
      avatarEmoji: body.avatarEmoji !== undefined ? body.avatarEmoji : undefined,
      birthday: body.birthday !== undefined ? body.birthday : undefined,
      email: body.email !== undefined ? body.email : undefined,
      grade: body.grade !== undefined ? body.grade : undefined,
      gender: body.gender !== undefined ? body.gender : undefined,
    }
    const profile = user.profile
      ? await prisma.userProfile.update({
          where: { userId: user.id },
          data: Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined)
          ),
        })
      : await prisma.userProfile.create({
          data: {
            userId: user.id,
            ...Object.fromEntries(
              Object.entries(updates).filter(([, v]) => v !== undefined)
            ),
          },
        })
    return NextResponse.json({
      avatarUrl: profile.avatarUrl,
      avatarEmoji: profile.avatarEmoji,
      birthday: profile.birthday,
      email: profile.email,
      grade: profile.grade,
      gender: profile.gender,
    })
  } catch (e) {
    console.error("[user-profile] POST", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
