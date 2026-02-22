import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id: username, review_ids: reviewIds } = body
    if (!username) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { username },
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const ids = Array.isArray(reviewIds) ? reviewIds : [reviewIds].filter(Boolean)
    if (ids.length) {
      await prisma.workReview.updateMany({
        where: { id: { in: ids }, authorId: user.id },
        data: { readAt: new Date() },
      })
    } else {
      await prisma.workReview.updateMany({
        where: { authorId: user.id },
        data: { readAt: new Date() },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[reviews mark-read] PATCH", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
