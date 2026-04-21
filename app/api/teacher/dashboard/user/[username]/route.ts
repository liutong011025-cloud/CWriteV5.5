import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ username: string }> }

type WritingType = "story" | "review" | "letter" | "drama" | "poetry"

interface WritingRecord {
  id: string
  type: WritingType
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  interactionId: string | null
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { username } = await params
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: {
          select: {
            avatarUrl: true,
            avatarEmoji: true,
            grade: true,
          },
        },
        stories: { orderBy: { updatedAt: "desc" } },
        reviews: { orderBy: { updatedAt: "desc" } },
        letters: { orderBy: { updatedAt: "desc" } },
        dramas: { orderBy: { updatedAt: "desc" } },
        poetries: { orderBy: { updatedAt: "desc" } },
        _count: {
          select: {
            stories: true,
            reviews: true,
            letters: true,
            dramas: true,
            poetries: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const writings: WritingRecord[] = [
      ...user.stories.map((item) => ({
        id: item.id,
        type: "story" as const,
        title: "Story",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.reviews.map((item) => ({
        id: item.id,
        type: "review" as const,
        title: item.bookTitle ? `Book Review - ${item.bookTitle}` : "Book Review",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.letters.map((item) => ({
        id: item.id,
        type: "letter" as const,
        title: item.recipient ? `Letter to ${item.recipient}` : "Letter",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.dramas.map((item) => ({
        id: item.id,
        type: "drama" as const,
        title: item.title ? `Drama - ${item.title}` : "Drama",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.poetries.map((item) => ({
        id: item.id,
        type: "poetry" as const,
        title: item.topic ? `Poetry - ${item.topic}` : "Poetry",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const interactions = await prisma.interaction.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        stage: true,
        timestamp: true,
        apiCalls: true,
      },
      take: 200,
    })

    const apiLogs = interactions
      .map((item) => ({
        id: item.id,
        stage: item.stage,
        timestamp: item.timestamp.toISOString(),
        apiCalls: Array.isArray(item.apiCalls) ? item.apiCalls : [],
      }))
      .filter((item) => item.apiCalls.length > 0)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl ?? null,
        avatarEmoji: user.profile?.avatarEmoji ?? null,
        grade: user.profile?.grade ?? null,
        totalWorks:
          user._count.stories +
          user._count.reviews +
          user._count.letters +
          user._count.dramas +
          user._count.poetries,
        latestActiveAt: interactions[0]?.timestamp?.toISOString() ?? null,
      },
      writings: writings.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      apiLogs,
    })
  } catch (error) {
    console.error("[teacher dashboard user] GET failed:", error)
    return NextResponse.json({ error: "Failed to load user dashboard data" }, { status: 500 })
  }
}
