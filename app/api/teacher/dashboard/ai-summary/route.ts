import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { chat } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string }
    const username = body.username?.trim()
    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        stories: { orderBy: { createdAt: "asc" } },
        reviews: { orderBy: { createdAt: "asc" } },
        letters: { orderBy: { createdAt: "asc" } },
        dramas: { orderBy: { createdAt: "asc" } },
        poetries: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const entries = [
      ...user.stories.map((item) => ({
        type: "Story",
        title: "Story",
        content: item.content ?? "",
        date: item.createdAt.toISOString(),
      })),
      ...user.reviews.map((item) => ({
        type: "Book Review",
        title: item.bookTitle ?? "Book Review",
        content: item.content ?? "",
        date: item.createdAt.toISOString(),
      })),
      ...user.letters.map((item) => ({
        type: "Letter",
        title: item.recipient ? `Letter to ${item.recipient}` : "Letter",
        content: item.content ?? "",
        date: item.createdAt.toISOString(),
      })),
      ...user.dramas.map((item) => ({
        type: "Drama",
        title: item.title ?? "Drama",
        content: item.content ?? "",
        date: item.createdAt.toISOString(),
      })),
      ...user.poetries.map((item) => ({
        type: "Poetry",
        title: item.topic ?? "Poetry",
        content: item.content ?? "",
        date: item.createdAt.toISOString(),
      })),
    ]
      .filter((item) => item.content.trim().length > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (entries.length === 0) {
      return NextResponse.json({
        summary:
          "This learner has not submitted enough writing content for a reliable academic summary yet.",
      })
    }

    const articlePayload = entries
      .map(
        (entry, index) =>
          `#${index + 1} | ${entry.type} | ${entry.title} | ${entry.date}\n${entry.content.slice(0, 1600)}`,
      )
      .join("\n\n")
      .slice(0, 18000)

    const summary = await chat({
      temperature: 0.25,
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are an academic writing analyst for K-12 English writing teachers. Return concise professional English only.",
        },
        {
          role: "user",
          content: `
Student: ${username}
Total writings: ${entries.length}

Analyze the student's full writing portfolio and provide:
1) writing preferences and favored genres/topics,
2) the biggest progress between the first and the latest writing,
3) 2-3 concrete strengths,
4) 2 specific growth priorities with practical classroom guidance.

Output in one polished paragraph (170-260 words), professional and evidence-based.

Writing corpus:
${articlePayload}
          `.trim(),
        },
      ],
    })

    return NextResponse.json({ summary })
  } catch (error) {
    console.error("[teacher dashboard ai-summary] POST failed:", error)
    return NextResponse.json({ error: "Failed to generate AI summary" }, { status: 500 })
  }
}
