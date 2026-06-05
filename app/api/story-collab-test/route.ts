import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import { buildStoryTestSystemPrompt } from "@/lib/story-test-prompts"
import {
  finalizePlotFromConversation,
  canCompletePlot,
  stripOptionsFromAnswer,
  isPlotComplete,
  type PlotConversationProgress,
  type PlotState,
} from "@/lib/story-plot-coach"
import { parseRevisionTags, type StoryRevisionTag } from "@/lib/story-revision-tags"

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"

interface CollabRequest {
  message: string
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>
  character: { name: string; age: number; traits: string[]; description: string; species?: string }
  plot_state: { setting?: string; conflict?: string; goal?: string }
  plot_progress?: PlotConversationProgress
  structure_type: "freytag" | "threeAct" | "fichtean" | null
  story_blocks: Array<{ section: string; text: string }>
  current_writing_section_index?: number | null
  current_phase: CollabPhase
  level: number
  action?: "help_me" | "chat" | "submit_section"
}

interface CollabResponse {
  answer: string
  phase: CollabPhase
  suggestions: string[]
  story_snippet: string | null
  plot_update: { setting?: string; conflict?: string; goal?: string } | null
  structure_suggestion: string | null
  revision_tags?: StoryRevisionTag[]
  section_passed?: boolean
  plot_state?: PlotState
  plot_progress?: PlotConversationProgress
  plot_complete?: boolean
}

function countWords(text: string): number {
  if (!text?.trim()) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishText = text.replace(/[\u4e00-\u9fff]/g, " ").trim()
  const englishWords = englishText ? englishText.split(/\s+/).filter(Boolean).length : 0
  return chineseChars + englishWords
}

function isSectionDraftSubmission(req: CollabRequest, queryText: string): boolean {
  if (req.action === "help_me") return false
  if (req.action === "submit_section") return !!req.structure_type
  if (!req.structure_type) return false
  const idx = req.current_writing_section_index
  if (typeof idx !== "number" || idx < 0 || idx >= (req.story_blocks?.length ?? 0)) return false
  const minWords = req.level <= 2 ? 5 : 8
  const sectionText = (req.story_blocks[idx]?.text || "").trim()
  const draftText = sectionText || queryText.trim()
  return countWords(draftText) >= minWords
}

function determinePhase(req: CollabRequest): CollabPhase {
  const plot = req.plot_state
  const hasPlot = isPlotComplete(plot)
  const hasStructure = !!req.structure_type
  const userTurns = req.conversation_history.filter((m) => m.role === "user").length
  const totalWords = req.story_blocks.reduce((sum, b) => {
    const text = b.text || ""
    const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const en = text.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length
    return sum + cn + en
  }, 0)

  if (!hasPlot && userTurns <= 1 && !plot?.setting?.trim()) return "explore"
  if (!hasPlot) return "plot"
  if (!hasStructure) return "structure"
  if (totalWords < 100) return "writing"
  return "polish"
}

function parseResponse(raw: string): {
  answer: string
  meta: Partial<CollabResponse & { section_pass?: boolean }>
} {
  const metaMatch = raw.match(/---META---\s*([\s\S]*?)\s*---END---/)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]) as Partial<CollabResponse & { section_pass?: boolean }>
      const answer = raw.slice(0, raw.indexOf("---META---")).trim()
      return { answer, meta }
    } catch {
      // fall through
    }
  }

  return { answer: raw.trim(), meta: {} }
}

function detectSectionPassed(
  answer: string,
  meta: Partial<CollabResponse & { section_pass?: boolean }>,
  revisionTags: StoryRevisionTag[],
): boolean {
  if (typeof meta.section_pass === "boolean") return meta.section_pass
  if (revisionTags.length > 0) return false
  return (
    /\byou can move to the next section\b/i.test(answer) ||
    /\byou can move on to the next part of your writing!/i.test(answer) ||
    /\bgreat job\b/i.test(answer)
  )
}

export async function POST(request: NextRequest) {
  try {
    const req = (await request.json()) as CollabRequest

    const queryText = typeof req.message === "string" ? req.message.trim() : ""
    if (!queryText) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const phase = determinePhase(req)
    const idx =
      typeof req.current_writing_section_index === "number" &&
      req.current_writing_section_index >= 0 &&
      req.current_writing_section_index < (req.story_blocks?.length ?? 0)
        ? req.current_writing_section_index
        : null

    const draftSubmission = isSectionDraftSubmission(req, queryText)
    const isLastSection =
      idx !== null && req.story_blocks.length > 0 && idx >= req.story_blocks.length - 1

    const promptCtx = {
      character: req.character,
      plot: req.plot_state || {},
      structureType: req.structure_type,
      storyBlocks: req.story_blocks || [],
      currentSectionIndex: idx,
      level: req.level,
    }

    const systemPrompt = buildStoryTestSystemPrompt(
      promptCtx,
      draftSubmission ? "writing" : phase,
      { draftSubmission, isLastSection: isLastSection ?? undefined },
    )

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ]

    const history = req.conversation_history || []
    for (const msg of history.slice(-20)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    let userContent = queryText
    if (draftSubmission && idx !== null) {
      const section = req.story_blocks[idx]
      const sectionText = (section.text || "").trim() || queryText
      userContent = `I submitted my draft for "${section.section}":\n\n${sectionText}`
    }
    if (req.action === "help_me") {
      userContent += "\n\n[Student clicked Help Me — offer a starter idea in story_snippet, do not write the scene for them.]"
    }

    messages.push({ role: "user", content: userContent })

    const rawAnswer = await chat({
      messages,
      timeout: draftSubmission ? 45_000 : 60_000,
      temperature: draftSubmission ? 0.3 : 0.7,
      maxTokens: draftSubmission ? 900 : 1200,
    })

    const { answer: parsedAnswer, meta } = parseResponse(rawAnswer)
    let answer = parsedAnswer || rawAnswer

    const revision_tags = parseRevisionTags(meta.revision_tags)
    const section_passed = draftSubmission
      ? detectSectionPassed(answer, meta, revision_tags)
      : false

    const studentMessages = history.filter((m) => m.role === "user").map((m) => m.content)
    const charName = req.character?.name || "the hero"
    const plotFinal = !req.structure_type
      ? finalizePlotFromConversation(
          req.plot_state,
          req.plot_progress,
          meta.plot_update || null,
          queryText,
          studentMessages,
          charName,
          meta.suggestions,
        )
      : null

    let plot_update = meta.plot_update || null
    let plot_state: PlotState | undefined
    let plot_progress: PlotConversationProgress | undefined
    let plot_complete: boolean | undefined
    let finalPhase: CollabPhase = draftSubmission ? "writing" : (meta.phase as CollabPhase) || phase
    let suggestions = meta.suggestions

    if (plotFinal) {
      plot_state = plotFinal.plot
      plot_progress = plotFinal.plot_progress
      plot_complete = plotFinal.plot_complete
      if (plotFinal.plot_update) plot_update = plotFinal.plot_update
      if (!draftSubmission && plotFinal.suggestions?.length) {
        answer = stripOptionsFromAnswer(answer, plotFinal.suggestions)
      }
      if (plotFinal.plot_complete && !req.structure_type) {
        finalPhase = "structure"
      } else if (!plotFinal.plot_complete) {
        finalPhase = plotFinal.phase
      }
      suggestions = plotFinal.suggestions
    }

    const mergedPlot = plot_state || req.plot_state
    const plotUserTurns = studentMessages.length
    if (canCompletePlot(mergedPlot, plotUserTurns) && !req.structure_type) {
      finalPhase = "structure"
      plot_complete = true
    }

    const inPlotPhase = !req.structure_type && !canCompletePlot(mergedPlot, plotUserTurns)
    const defaultSuggestions = inPlotPhase
      ? plotFinal?.suggestions || ["At school", "In a forest", "On a beach"]
      : draftSubmission
        ? []
        : ["Adventure", "Magic", "Mystery"]

    const response: CollabResponse = {
      answer,
      phase: finalPhase,
      suggestions:
        draftSubmission && revision_tags.length > 0
          ? []
          : suggestions?.length
            ? suggestions
            : defaultSuggestions,
      story_snippet: meta.story_snippet || null,
      plot_update,
      plot_state,
      plot_progress,
      plot_complete,
      structure_suggestion: meta.structure_suggestion || null,
      revision_tags: draftSubmission && !section_passed ? revision_tags : undefined,
      section_passed: section_passed || undefined,
    }

    // 测试路由：不调用 logApiCall，不写入数据库
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in story-collab-test API:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json(
        { error: "timeout", message: "Request timed out. Please try again." },
        { status: 504 },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
