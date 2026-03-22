import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const MAP_STATE_STAGE = "map_state_sync"

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get("user_id")
    if (!username) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const latest = await prisma.interaction.findFirst({
      where: { userId: user.id, stage: MAP_STATE_STAGE },
      orderBy: { timestamp: "desc" },
      select: { output: true },
    })

    const output = (latest?.output || null) as Record<string, unknown> | null
    return NextResponse.json({ state: output })
  } catch (error) {
    console.error("[user-map-state] GET", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      user_id?: string
      state?: Record<string, unknown>
    }
    const username = body.user_id
    if (!username) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.interaction.create({
      data: {
        userId: user.id,
        stage: MAP_STATE_STAGE,
        output: {
          ...(body.state || {}),
          updatedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[user-map-state] POST", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
