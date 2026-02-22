import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const authorUsername = request.nextUrl.searchParams.get("user_id")
    if (!authorUsername) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 })
    }
    const author = await prisma.user.findUnique({
      where: { username: authorUsername },
    })
    if (!author) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const reviews = await prisma.workReview.findMany({
      where: { authorId: author.id },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: { select: { username: true, role: true } },
      },
    })
    const list = reviews.map((r) => ({
      id: r.id,
      workType: r.workType,
      workInteractionId: r.workInteractionId,
      workTitle: r.workTitle,
      workContent: r.workContent,
      reviewerUsername: r.reviewer.username,
      reviewerRole: r.reviewerRole,
      content: r.content,
      readAt: r.readAt?.getTime() ?? null,
      createdAt: r.createdAt.getTime(),
    }))
    const unreadCount = reviews.filter((r) => !r.readAt).length
    return NextResponse.json({ reviews: list, unreadCount })
  } catch (e) {
    console.error("[reviews] GET", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      work_type,
      work_interaction_id,
      author_username,
      reviewer_username,
      reviewer_role,
      content,
      work_title,
      work_content,
    } = body
    if (
      !work_type ||
      !author_username ||
      !reviewer_username ||
      !reviewer_role ||
      !content
    ) {
      return NextResponse.json(
        { error: "work_type, author_username, reviewer_username, reviewer_role, content required" },
        { status: 400 }
      )
    }
    const author = await prisma.user.findUnique({
      where: { username: author_username },
    })
    const reviewer = await prisma.user.findUnique({
      where: { username: reviewer_username },
    })
    if (!author || !reviewer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const review = await prisma.workReview.create({
      data: {
        workType: work_type,
        workInteractionId: work_interaction_id ?? null,
        authorId: author.id,
        reviewerId: reviewer.id,
        reviewerRole: reviewer_role,
        content: String(content),
        workTitle: work_title ?? null,
        workContent: work_content ?? null,
      },
    })
    return NextResponse.json({
      id: review.id,
      createdAt: review.createdAt.getTime(),
    })
  } catch (e) {
    console.error("[reviews] POST", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
