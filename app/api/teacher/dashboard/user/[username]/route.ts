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

interface MessageItem {
  role: "user" | "assistant" | "system"
  content: string
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
        title: deriveTitle(item.content, "Story"),
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
        title: item.recipient ? `Letter to ${item.recipient}: ${deriveTitle(item.content, "Letter")}` : deriveTitle(item.content, "Letter"),
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
        input: true,
        output: true,
      },
      take: 200,
    })

    const apiLogs = interactions.map((item) => ({
      id: item.id,
      stage: item.stage,
      timestamp: item.timestamp.toISOString(),
      tokenEstimate: estimateTokens(item.apiCalls, item.input, item.output),
      apiCalls: normalizeApiCalls(item.apiCalls),
      messages: extractMessages(item.input, item.output),
    }))

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

function normalizeApiCalls(raw: unknown): Array<{ endpoint?: string }> {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== "object") return {}
    const endpoint = "endpoint" in item && typeof item.endpoint === "string" ? item.endpoint : undefined
    return { endpoint }
  })
}

function extractMessages(input: unknown, output: unknown): MessageItem[] {
  const messages: MessageItem[] = []
  const inputMessages = getArrayPath(input, ["messages"])
  if (Array.isArray(inputMessages)) {
    inputMessages.forEach((item) => {
      if (!item || typeof item !== "object") return
      const role = typeof item.role === "string" ? item.role : "user"
      const content = typeof item.content === "string" ? item.content : ""
      if (!content.trim()) return
      messages.push({
        role: role === "assistant" || role === "system" ? role : "user",
        content,
      })
    })
  }

  const outputText = extractOutputText(output)
  if (outputText && !messages.some((item) => item.content === outputText)) {
    messages.push({ role: "assistant", content: outputText })
  }

  return messages.slice(0, 24)
}

function getArrayPath(value: unknown, path: string[]): unknown {
  let current = value
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function extractOutputText(output: unknown): string {
  if (!output || typeof output !== "object") return ""
  const record = output as Record<string, unknown>
  const candidates = ["response", "answer", "result", "content", "story", "review", "letter", "drama", "poetry"]
  for (const key of candidates) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

function estimateTokens(apiCalls: unknown, input: unknown, output: unknown): number {
  const chunks = [apiCalls, input, output]
  const chars = chunks.reduce((sum, item) => {
    try {
      return sum + JSON.stringify(item ?? "").length
    } catch {
      return sum
    }
  }, 0)
  return Math.max(0, Math.round(chars / 4))
}

function deriveTitle(content: string | null | undefined, fallback: string): string {
  const normalized = (content ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!normalized) return fallback
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized
}
