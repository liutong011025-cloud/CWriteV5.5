import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDatabaseConnectionError, isMissingDatabaseTableError } from "@/lib/prisma-errors"

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

interface NormalizedApiCall {
  endpoint?: string
  request?: unknown
  response?: unknown
}

interface ApiLogRecord {
  id: string
  stage: string
  stageLabel: string
  articleType: WritingType
  title: string
  timestamp: string
  tokenEstimate: number
  apiCalls: Array<{ endpoint?: string }>
  messages: MessageItem[]
}

interface StoryItem {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  interactionId: string | null
}

interface ReviewItem extends StoryItem {
  bookTitle: string | null
}

interface LetterItem extends StoryItem {
  recipient: string | null
}

interface DramaItem extends StoryItem {
  title: string | null
}

interface PoetryItem extends StoryItem {
  topic: string | null
}

interface InteractionItem {
  id: string
  stage: string
  timestamp: Date
  apiCalls: unknown
  input: unknown
  output: unknown
}

export async function GET(_request: NextRequest, { params }: Params) {
  let requestedUsername = ""
  try {
    const { username } = await params
    requestedUsername = username
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
        interactions: {
          orderBy: { timestamp: "desc" },
          take: 200,
          select: {
            id: true,
            stage: true,
            timestamp: true,
            apiCalls: true,
            input: true,
            output: true,
          },
        },
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

    const writingMap = new Map<string, WritingRecord>()

    const storedWritings: WritingRecord[] = [
      ...user.stories.map((item: StoryItem) => ({
        id: item.id,
        type: "story" as const,
        title: deriveTitle(item.content, "Story"),
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.reviews.map((item: ReviewItem) => ({
        id: item.id,
        type: "review" as const,
        title: item.bookTitle ? `Book Review - ${item.bookTitle}` : "Book Review",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.letters.map((item: LetterItem) => ({
        id: item.id,
        type: "letter" as const,
        title: item.recipient ? `Letter to ${item.recipient}: ${deriveTitle(item.content, "Letter")}` : deriveTitle(item.content, "Letter"),
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.dramas.map((item: DramaItem) => ({
        id: item.id,
        type: "drama" as const,
        title: item.title ? `Drama - ${item.title}` : "Drama",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
      ...user.poetries.map((item: PoetryItem) => ({
        id: item.id,
        type: "poetry" as const,
        title: item.topic ? `Poetry - ${item.topic}` : "Poetry",
        content: item.content ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        interactionId: item.interactionId ?? null,
      })),
    ]

    storedWritings.forEach((item) => {
      writingMap.set(getWritingKey(item), item)
    })

    let recoveredWritingsCount = 0
    user.interactions.forEach((interaction: InteractionItem) => {
      const recovered = extractWritingFromInteraction(interaction)
      if (!recovered) return
      const key = getWritingKey(recovered)
      if (writingMap.has(key)) return
      writingMap.set(key, recovered)
      recoveredWritingsCount += 1
    })

    const writings = Array.from(writingMap.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const revisionEligible = writings.filter(
      (w): w is WritingRecord & { type: "story" | "review" | "letter" } =>
        w.type === "story" || w.type === "review" || w.type === "letter",
    )
    let revisionRows: Awaited<ReturnType<typeof prisma.writingEditRevision.findMany>> = []
    if (revisionEligible.length > 0) {
      try {
        revisionRows = await prisma.writingEditRevision.findMany({
          where: {
            OR: revisionEligible.map((w) => ({ workType: w.type, workId: w.id })),
          },
          orderBy: [{ workId: "asc" }, { version: "asc" }],
        })
      } catch (revisionError) {
        if (!isMissingDatabaseTableError(revisionError)) throw revisionError
        console.warn(
          "[teacher dashboard user] writing_edit_revisions table missing; returning empty editRevisions. Run prisma db push or prisma/run-this-sql.sql section.",
        )
        revisionRows = []
      }
    }

    const revisionsByKey = new Map<string, Array<{ version: number; content: string; createdAt: string }>>()
    for (const row of revisionRows) {
      const key = `${row.workType}:${row.workId}`
      const list = revisionsByKey.get(key) ?? []
      list.push({
        version: row.version,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })
      revisionsByKey.set(key, list)
    }

    const apiLogs = user.interactions
      .map((item: InteractionItem) => {
        const articleType = classifyInteractionType(item.stage, item.input, item.output, item.apiCalls)
        if (!articleType) return null

        const apiCalls = normalizeApiCalls(item.apiCalls)
        const messages = extractMessages(item.input, item.output, item.apiCalls)
        if (apiCalls.length === 0 && messages.length === 0) return null

        return {
          id: item.id,
          stage: item.stage,
          stageLabel: getStageLabel(item.stage),
          articleType,
          title: getStageLabel(item.stage),
          timestamp: item.timestamp.toISOString(),
          tokenEstimate: estimateTokens(item.apiCalls, item.input, item.output),
          apiCalls,
          messages,
        }
      })
      .filter((item: ApiLogRecord | null): item is ApiLogRecord => item !== null)

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
        latestActiveAt: user.interactions[0]?.timestamp?.toISOString() ?? null,
      },
      writings: writings.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        editRevisions: revisionsByKey.get(`${item.type}:${item.id}`) ?? [],
      })),
      apiLogs,
      diagnostics: {
        storedWorks:
          user._count.stories +
          user._count.reviews +
          user._count.letters +
          user._count.dramas +
          user._count.poetries,
        recoveredWritings: recoveredWritingsCount,
        interactionCount: user.interactions.length,
      },
    })
  } catch (error) {
    console.error("[teacher dashboard user] GET failed:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        user: {
          id: "",
          username: requestedUsername,
          role: "student",
          avatarUrl: null,
          avatarEmoji: null,
          grade: null,
          totalWorks: 0,
          latestActiveAt: null,
        },
        writings: [],
        apiLogs: [],
        diagnostics: {
          storedWorks: 0,
          recoveredWritings: 0,
          interactionCount: 0,
        },
        degraded: true,
      })
    }
    return NextResponse.json({ error: "Failed to load user dashboard data" }, { status: 500 })
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function getWritingKey(item: WritingRecord): string {
  return item.interactionId ? `${item.type}:interaction:${item.interactionId}` : `${item.type}:record:${item.id}`
}

function normalizeApiCalls(raw: unknown): Array<{ endpoint?: string }> {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== "object") return {}
    const endpoint = "endpoint" in item && typeof item.endpoint === "string" ? item.endpoint : undefined
    return { endpoint }
  })
}

function parseApiCalls(raw: unknown): NormalizedApiCall[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== "object") return {}
    const record = item as Record<string, unknown>
    return {
      endpoint: typeof record.endpoint === "string" ? record.endpoint : undefined,
      request: record.request,
      response: record.response,
    }
  })
}

function extractMessages(input: unknown, output: unknown, apiCallsRaw: unknown): MessageItem[] {
  const messages: MessageItem[] = []
  const pushMessage = (role: MessageItem["role"], content: unknown) => {
    const text = typeof content === "string" ? content.trim() : ""
    if (!text) return
    const previous = messages[messages.length - 1]
    if (previous && previous.role === role && previous.content === text) return
    messages.push({ role, content: text })
  }

  const inputMessages = getArrayPath(input, ["messages"])
  if (Array.isArray(inputMessages)) {
    inputMessages.forEach((item) => {
      if (!item || typeof item !== "object") return
      const role = typeof item.role === "string" ? item.role : "user"
      const content = typeof item.content === "string" ? item.content : ""
      pushMessage(role === "assistant" || role === "system" ? role : "user", content)
    })
  }

  const inputRecord = asRecord(input)
  pushRecordMessages(pushMessage, inputRecord, "user")

  parseApiCalls(apiCallsRaw).forEach((apiCall) => {
    const request = asRecord(apiCall.request)
    const history = request.history
    if (Array.isArray(history)) {
      history.forEach((item) => {
        if (!item || typeof item !== "object") return
        const role = typeof item.role === "string" ? item.role : "user"
        pushMessage(role === "assistant" || role === "system" ? role : "user", (item as Record<string, unknown>).content)
      })
    }

    const conversationHistory = request.conversation_history
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach((item) => {
        if (!item || typeof item !== "object") return
        const role = typeof item.role === "string" ? item.role : "user"
        pushMessage(role === "assistant" || role === "system" ? role : "user", (item as Record<string, unknown>).content)
      })
    }

    pushRecordMessages(pushMessage, request, "user")

    pushRecordMessages(pushMessage, asRecord(apiCall.response), "assistant")
  })

  pushRecordMessages(pushMessage, asRecord(output), "assistant")

  return messages.slice(0, 24)
}

function pushRecordMessages(
  pushMessage: (role: MessageItem["role"], content: unknown) => void,
  record: Record<string, unknown>,
  role: MessageItem["role"]
) {
  const textCandidates = [
    record.message,
    record.answer,
    record.result,
    record.response,
    record.content,
    record.text,
    record.evaluation,
    record.guidance,
    record.summary,
    record.story,
    record.review,
    record.letter,
    record.drama,
    record.poetry,
  ]
  textCandidates.forEach((value) => pushMessage(role, value))

  if (typeof record.bookTitle === "string") pushMessage(role, `Book title: ${record.bookTitle}`)
  if (typeof record.currentSection === "string") pushMessage(role, `Section: ${record.currentSection}`)
  if (typeof record.current_section === "string") pushMessage(role, `Section: ${record.current_section}`)
  if (typeof record.recipient === "string" || typeof record.occasion === "string") {
    const lines = [
      typeof record.recipient === "string" ? `Recipient: ${record.recipient}` : "",
      typeof record.occasion === "string" ? `Occasion: ${record.occasion}` : "",
    ].filter(Boolean)
    pushMessage(role, lines.join("\n"))
  }
  if (typeof record.prompt === "string") pushMessage(role, `Prompt: ${record.prompt}`)
  if (typeof record.imageUrl === "string") pushMessage(role, `Generated image: ${record.imageUrl}`)
  if (typeof record.videoUrl === "string") pushMessage(role, `Generated video: ${record.videoUrl}`)
  if (typeof record.errorCount === "number") pushMessage(role, `Grammar issues found: ${record.errorCount}`)

  if (Array.isArray(record.suggestions) && record.suggestions.length > 0) {
    pushMessage(role, `Suggestions: ${record.suggestions.map((item) => String(item)).join(" | ")}`)
  }
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
  const chars = chunks.reduce<number>((sum, item) => {
    try {
      return sum + JSON.stringify(item ?? "").length
    } catch {
      return sum
    }
  }, 0)
  return Math.max(0, Math.round(chars / 4))
}

function classifyInteractionType(
  stage: string,
  input: unknown,
  output: unknown,
  apiCallsRaw: unknown
): WritingType | null {
  const normalizedStage = stage.trim().toLowerCase()
  if (
    [
      "character",
      "plot",
      "structure",
      "writing",
      "review",
      "storyedit",
      "story-collab",
      "storyvideo",
    ].includes(normalizedStage)
  ) {
    return "story"
  }
  if (normalizedStage.startsWith("book")) return "review"
  if (normalizedStage.startsWith("letter") || normalizedStage === "sendletteremail") return "letter"
  if (normalizedStage.startsWith("drama")) return "drama"
  if (normalizedStage.startsWith("poetry")) return "poetry"
  if (normalizedStage === "grammarreview") {
    const inputRecord = asRecord(input)
    const contentType = asString(inputRecord.type).toLowerCase()
    if (contentType === "review") return "review"
    if (contentType === "letter") return "letter"
  }

  const outputRecord = asRecord(output)
  if (asString(outputRecord.story).trim()) return "story"
  if (asString(outputRecord.review).trim()) return "review"
  if (asString(outputRecord.letter).trim()) return "letter"
  if (asString(outputRecord.drama).trim()) return "drama"
  if (asString(outputRecord.poetry).trim()) return "poetry"

  const inputRecord = asRecord(input)
  if (typeof inputRecord.bookTitle === "string") return "review"
  if (typeof inputRecord.recipient === "string") return "letter"

  const apiCalls = parseApiCalls(apiCallsRaw)
  for (const apiCall of apiCalls) {
    const endpointType = classifyEndpointType(apiCall.endpoint)
    if (endpointType) return endpointType
  }

  return null
}

function classifyEndpointType(endpoint: string | undefined): WritingType | null {
  const normalized = (endpoint ?? "").toLowerCase()
  if (!normalized) return null
  if (
    normalized.includes("book") ||
    normalized.includes("review")
  ) return "review"
  if (
    normalized.includes("letter") ||
    normalized.includes("email")
  ) return "letter"
  if (
    normalized.includes("drama")
  ) return "drama"
  if (
    normalized.includes("poetry")
  ) return "poetry"
  if (
    normalized.includes("story") ||
    normalized.includes("plot") ||
    normalized.includes("chat") ||
    normalized.includes("image") ||
    normalized.includes("video")
  ) return "story"
  return null
}

function extractWritingFromInteraction(item: InteractionItem): WritingRecord | null {
  const output = asRecord(item.output)
  const outputData = asRecord(output.data)

  const story = asString(output.story || outputData.story)
  if (story.trim()) {
    return {
      id: item.id,
      type: "story",
      title: deriveTitle(story, "Story"),
      content: story,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      interactionId: item.id,
    }
  }

  const review = asString(output.review || outputData.review)
  if (review.trim()) {
    const bookTitle = asString(output.bookTitle || outputData.bookTitle)
    return {
      id: item.id,
      type: "review",
      title: bookTitle ? `Book Review - ${bookTitle}` : "Book Review",
      content: review,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      interactionId: item.id,
    }
  }

  const letter = asString(output.letter || outputData.letter)
  if (letter.trim()) {
    const recipient = asString(output.recipient || outputData.recipient)
    return {
      id: item.id,
      type: "letter",
      title: recipient ? `Letter to ${recipient}` : "Letter",
      content: letter,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      interactionId: item.id,
    }
  }

  const drama = asString(output.drama || outputData.drama)
  if (drama.trim()) {
    const title = asString(output.dramaTitle || outputData.dramaTitle)
    return {
      id: item.id,
      type: "drama",
      title: title ? `Drama - ${title}` : "Drama",
      content: drama,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      interactionId: item.id,
    }
  }

  const poetry = asString(output.poetry || outputData.poetry)
  if (poetry.trim()) {
    const topic = asString(output.poetryTopic || outputData.poetryTopic)
    return {
      id: item.id,
      type: "poetry",
      title: topic ? `Poetry - ${topic}` : "Poetry",
      content: poetry,
      createdAt: item.timestamp,
      updatedAt: item.timestamp,
      interactionId: item.id,
    }
  }

  return null
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    character: "Character Creation",
    plot: "Plot Brainstorm",
    structure: "Story Structure",
    writing: "Guided Writing",
    review: "Story Review",
    storyEdit: "Story Edit",
    "story-collab": "Story Collaboration",
    storyVideo: "Story Video",
    bookSelection: "Book Selection",
    bookReviewTypeSelection: "Review Type Selection",
    bookReviewLoading: "Book Review Loading",
    bookReviewWriting: "Book Review Writing",
    bookReviewComplete: "Book Review Complete",
    grammarReview: "Grammar Review",
    letterGame: "Letter Game",
    letterAdventure: "Letter Adventure",
    letterPuzzle: "Letter Puzzle",
    letterSetup: "Letter Setup",
    letterGuide: "Letter Guide",
    letterEdit: "Letter Edit",
    letterComplete: "Letter Complete",
    sendLetterEmail: "Send Letter Email",
    dramaWriting: "Drama Writing",
    dramaBook: "Drama Book",
    dramaBackground: "Drama Background Image",
    dramaCharacter: "Drama Character Image",
    dramaComplete: "Drama Complete",
    poetryWriting: "Poetry Writing",
    poetryForm: "Poetry Form",
    poetryTopic: "Poetry Topic",
    poetryEditor: "Poetry Editor",
    poetryReview: "Poetry Review",
  }

  if (labels[stage]) return labels[stage]

  return stage
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
