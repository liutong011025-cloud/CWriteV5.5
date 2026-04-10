import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 返回当前用户“最新一条” interaction（轻量），用于 Continue past journey 恢复进度。
 * 只取 1 条，避免拉全量 interactions。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    if (!userId) return NextResponse.json({ error: "user_id is required" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { username: userId }, select: { id: true, username: true } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const interaction = await prisma.interaction.findFirst({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        stage: true,
        timestamp: true,
        input: true,
        output: true,
      },
    })
    if (!interaction) return NextResponse.json({ interaction: null })

    // 同步查关联作品（若存在）
    const [story, review, letter, drama, poetry] = await Promise.all([
      prisma.story.findUnique({ where: { interactionId: interaction.id }, select: { content: true, character: true, plot: true, structure: true } }).catch(() => null),
      prisma.review.findUnique({ where: { interactionId: interaction.id }, select: { content: true, reviewType: true, bookTitle: true, bookCoverUrl: true, bookSummary: true, structure: true } }).catch(() => null),
      prisma.letter.findUnique({ where: { interactionId: interaction.id }, select: { content: true, recipient: true, occasion: true, guidance: true, readerImageUrl: true, sections: true } }).catch(() => null),
      prisma.drama.findUnique({ where: { interactionId: interaction.id }, select: { content: true, title: true, summary: true } }).catch(() => null),
      prisma.poetry.findUnique({ where: { interactionId: interaction.id }, select: { content: true, form: true, topic: true, lines: true } }).catch(() => null),
    ])

    return NextResponse.json({
      interaction: {
        user_id: user.username,
        timestamp: interaction.timestamp.getTime(),
        stage: interaction.stage,
        input: interaction.input || {},
        output: interaction.output || {},
        story: story?.content,
        character: story?.character,
        plot: story?.plot,
        structure: story?.structure,
        review: review?.content,
        reviewType: review?.reviewType,
        bookTitle: review?.bookTitle,
        bookCoverUrl: review?.bookCoverUrl,
        bookSummary: review?.bookSummary,
        letter: letter?.content,
        recipient: letter?.recipient,
        occasion: letter?.occasion,
        guidance: letter?.guidance,
        readerImageUrl: letter?.readerImageUrl,
        sections: letter?.sections,
        drama: drama?.content,
        dramaTitle: drama?.title,
        dramaSummary: drama?.summary,
        poetry: poetry?.content,
        poetryForm: poetry?.form,
        poetryTopic: poetry?.topic,
        poetryLines: poetry?.lines,
      },
    })
  } catch (error) {
    console.error("latest-progress error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

