import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { evaluateStorySection } from "@/lib/story-section-evaluation"
import {
  buildSectionGraderSystemPrompt,
  combineSectionPassDecision,
  parseAiSectionGrade,
} from "@/lib/story-section-grader"
import {
  buildRevisionTagsPromptRules,
  parseRevisionTags,
  tipsToRevisionTags,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"
import {
  buildExplorePromptRules,
  buildPlotPhasePromptRules,
  canCompletePlot,
  finalizePlotFromConversation,
  getPlotMicroStep,
  isPlotComplete,
  stripOptionsFromAnswer,
  type PlotConversationProgress,
  type PlotState,
} from "@/lib/story-plot-coach"

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"

interface CollabRequest {
  message: string
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>
  character: { name: string; age: number; traits: string[]; description: string; species?: string }
  plot_state: { setting?: string; conflict?: string; goal?: string }
  plot_progress?: PlotConversationProgress
  structure_type: "freytag" | "threeAct" | "fichtean" | null
  story_blocks: Array<{ section: string; text: string }>
  /** 0-based index of the structural section the student is writing now (Writing Pad = this part only). */
  current_writing_section_index?: number | null
  current_phase: CollabPhase
  user_id: string
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
  /** Merged plot after this turn (client should sync from this). */
  plot_state?: PlotState
  plot_progress?: PlotConversationProgress
  plot_complete?: boolean
}

const PASS_NEXT_SECTION = "You can move to the next section."
const PASS_LAST_SECTION = "Great job!"
const PASS_GUIDED_WRITING = "You can move on to the next part of your writing!"

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

function buildSystemPrompt(req: CollabRequest, phase: CollabPhase, lastStudentMessage: string): string {
  const parts: string[] = []

  parts.push(
    "You are a friendly, encouraging creative writing buddy for elementary school children. " +
    "You help them write stories through natural conversation. " +
    "NEVER be a strict teacher or examiner. Be warm, playful, and supportive."
  )

  // Character context
  const c = req.character
  if (c) {
    parts.push(
      `\nThe student's character: ${c.name}, age ${c.age}. ` +
      `Traits: ${c.traits.join(", ")}. ` +
      `Description: ${c.description}.` +
      (c.species ? ` Species: ${c.species}.` : "")
    )
  }

  // Plot context
  const p = req.plot_state
  if (p?.setting || p?.conflict || p?.goal) {
    const plotParts: string[] = []
    if (p.setting) plotParts.push(`Setting: ${p.setting}`)
    if (p.conflict) plotParts.push(`Conflict: ${p.conflict}`)
    if (p.goal) plotParts.push(`Goal: ${p.goal}`)
    parts.push(`\nCurrent plot: ${plotParts.join(". ")}.`)
  }

  // Structure context
  if (req.structure_type) {
    const names: Record<string, string> = {
      freytag: "Freytag's Pyramid (Exposition, Rising Action, Climax, Falling Action, Resolution)",
      threeAct: "Three Act Structure (Setup, Confrontation, Resolution)",
      fichtean: "Fichtean Curve (First Crisis, Second Crisis, Third Crisis, Climax, Resolution)",
    }
    parts.push(`\nChosen structure: ${names[req.structure_type] || req.structure_type}.`)
  }

  // Story sections: show full outline + where the student is (avoid "write the whole story in one box")
  if (req.story_blocks?.length) {
    const idx =
      typeof req.current_writing_section_index === "number" &&
      req.current_writing_section_index >= 0 &&
      req.current_writing_section_index < req.story_blocks.length
        ? req.current_writing_section_index
        : null
    const lines = req.story_blocks.map((b, i) => {
      const here =
        idx !== null && i === idx ? "  ← STUDENT IS WRITING THIS PART NOW (coach & judge only this beat)" : ""
      const preview = b.text.trim()
        ? `"${b.text.length > 200 ? `${b.text.slice(0, 200)}…` : b.text}"`
        : "(not written yet)"
      return `- ${i + 1}. ${b.section}: ${preview}${here}`
    })
    parts.push(`\nStory by structure (one section at a time — later parts are filled in separate steps):\n${lines.join("\n")}`)
  }

  const idx =
    typeof req.current_writing_section_index === "number" &&
    req.current_writing_section_index >= 0 &&
    req.current_writing_section_index < (req.story_blocks?.length ?? 0)
      ? req.current_writing_section_index
      : null
  if (req.structure_type && idx !== null && req.story_blocks[idx]) {
    const cur = req.story_blocks[idx]
    const later = req.story_blocks.slice(idx + 1)
    const laterNames = later.map((b) => b.section)
    const isLastSection = later.length === 0
    parts.push(
      `\n[CRITICAL — section-only writing]\n` +
        `The student is working ONLY on "${cur.section}" (part ${idx + 1} of ${req.story_blocks.length}). ` +
        `They must NOT be asked to write the entire story in one go or to cover every outline part in this single turn. ` +
        (isLastSection
          ? `This is the **last** structural part — still focus feedback on "${cur.section}" only, not on demanding a "complete" full manuscript in one message.\n`
          : `Later parts (${laterNames.map((n) => `"${n}"`).join(", ")}) are written in **later steps** — do not require those to be done now.\n`) +
        `Feedback and encouragement must focus on "${cur.section}" only.\n` +
        (isLastSection
          ? `Do NOT use "You can move to the next section." (there is no next section).\n` +
            `When "${cur.section}" is good enough **for this final beat alone** (not the entire story in one box), end your reply with this exact sentence on its own line at the very end (before META): ` +
            `${PASS_LAST_SECTION}\n` +
            `If "${cur.section}" still needs work, do NOT write "${PASS_LAST_SECTION}"; use revision_tags instead (see below).\n`
          : `When "${cur.section}" is good enough **for this structural beat alone** (not the whole story), end your reply with this exact sentence on its own line at the very end (before META): ` +
            `${PASS_NEXT_SECTION}\n` +
            `You may also use: "${PASS_GUIDED_WRITING}"\n` +
            `If "${cur.section}" still needs improvement, do NOT use those pass sentences; use revision_tags instead (see below).\n`) +
        buildRevisionTagsPromptRules(req.level, cur.section)
    )
  }

  const charName = req.character?.name || "the hero"
  const userTurns = req.conversation_history.filter((m) => m.role === "user").length

  if (phase === "explore") {
    parts.push(buildExplorePromptRules(charName, lastStudentMessage))
  }
  if (phase === "plot" || (phase === "explore" && userTurns >= 1)) {
    const plotProgress = req.plot_progress || {}
    const microStep = getPlotMicroStep(req.plot_state || {}, userTurns, plotProgress)
    parts.push(
      buildPlotPhasePromptRules(
        req.plot_state || {},
        charName,
        lastStudentMessage,
        userTurns,
        microStep,
        plotProgress,
      ),
    )
  }

  // Phase-specific instructions
  const phaseInstructions: Record<CollabPhase, string> = {
    explore:
      "Have a short chat about story mood/theme, then naturally ask where it could happen. " +
      "Never use vague suggestion buttons.",
    plot:
      "Guide setting, problem, and goal through connected questions — each reply builds on the student's last words. " +
      "Save at most one plot field per turn in plot_update. " +
      "suggestions must fit your exact question, not generic chat buttons.",
    structure:
      "The student has a complete plot! Now suggest a story structure. Briefly explain the 3 options: " +
      "Freytag's Pyramid (5 parts: exposition, rising action, climax, falling action, resolution), " +
      "Three Act Structure (setup, confrontation, resolution), " +
      "Fichtean Curve (crisis, crisis, crisis, climax, resolution). " +
      "Ask which sounds most fun. Set structure_suggestion in META when they choose.",
    writing:
      "Help the student write **one structural section at a time** (see [CRITICAL — section-only writing] if present). " +
      "After they submit a draft, give feedback as colored revision_tags (not long chat paragraphs). " +
      "When you suggest sample text, put it in story_snippet in META. " +
      "Be enthusiastic. Never imply they should complete every part of the structure in a single Writing Pad turn.",
    polish:
      "The story is taking shape! Help polish: suggest stronger words, " +
      "smoother transitions, or a better ending. Celebrate their progress!",
  }
  parts.push(`\n[Current phase: ${phase}]\n${phaseInstructions[phase]}`)

  // Level suffix
  parts.push(getLevelPromptSuffix(req.level, "story"))

  // Help Me action
  if (req.action === "help_me") {
    parts.push(
      "\nThe student clicked 'Help Me'. Generate a creative starter sentence or idea they can use. " +
      "Put it in story_snippet."
    )
  }

  // Output format
  parts.push(
    "\n\nIMPORTANT: After your conversational response, you MUST append a META block in this exact format:" +
    '\n---META---\n{"phase":"...","suggestions":[...],"story_snippet":"..."|null,"plot_update":{...}|null,"structure_suggestion":"..."|null,"revision_tags":[{"label":"...","rationale":"...","color":"amber"}]}\n---END---' +
    "\nThe suggestions array must contain 2-4 short clickable options (2-6 words each) that answer YOUR question. " +
    "FORBIDDEN suggestions: Tell me more, What happens next?, Help me. Always include suggestions."
  )

  return parts.join("")
}

function parseResponse(raw: string): { answer: string; meta: Partial<CollabResponse> } {
  // Layer 1: ---META---{JSON}---END---
  const metaMatch = raw.match(/---META---\s*([\s\S]*?)\s*---END---/)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]) as Partial<CollabResponse>
      const answer = raw.slice(0, raw.indexOf("---META---")).trim()
      return { answer, meta }
    } catch {
      // fall through to layer 2
    }
  }

  // Layer 2: inline markers
  const answer = raw
    .replace(/\[PLOT_UPDATE:[^\]]*\]/g, "")
    .replace(/\[SUGGESTIONS:[^\]]*\]/g, "")
    .replace(/\[SNIPPET:[^\]]*\]/g, "")
    .replace(/\[PHASE:[^\]]*\]/g, "")
    .replace(/\[STRUCTURE:[^\]]*\]/g, "")
    .trim()

  const meta: Partial<CollabResponse> = {}

  const sugMatch = raw.match(/\[SUGGESTIONS:\s*(.*?)\]/)
  if (sugMatch) {
    meta.suggestions = sugMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
  }

  const plotMatch = raw.match(/\[PLOT_UPDATE:\s*(.*?)\]/)
  if (plotMatch) {
    try { meta.plot_update = JSON.parse(plotMatch[1]) } catch { /* ignore */ }
  }

  const snippetMatch = raw.match(/\[SNIPPET:\s*(.*?)\]/)
  if (snippetMatch) meta.story_snippet = snippetMatch[1]

  const phaseMatch = raw.match(/\[PHASE:\s*(.*?)\]/)
  if (phaseMatch) meta.phase = phaseMatch[1] as CollabPhase

  const structMatch = raw.match(/\[STRUCTURE:\s*(.*?)\]/)
  if (structMatch) meta.structure_suggestion = structMatch[1]

  return { answer, meta }
}

function stripPassSignalsFromAnswer(answer: string): string {
  return answer
    .replace(/\n*You can move on to the next part of your writing!\.?\s*$/i, "")
    .replace(/\n*You can move to the next section\.?\s*$/i, "")
    .replace(/\n*You may move to the next section\.?\s*$/i, "")
    .replace(/\n*Great job!?\.?\s*$/i, "")
    .replace(/\n*太棒了[！!。.]?\s*$/, "")
    .replace(/\n*做得好[！!。.]?\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function appendPassSentence(answer: string, isLastSection: boolean): string {
  const base = stripPassSignalsFromAnswer(answer)
  const passLine = isLastSection ? PASS_LAST_SECTION : PASS_NEXT_SECTION
  if (base.toLowerCase().includes(passLine.toLowerCase())) return base
  return base ? `${base}\n${passLine}` : passLine
}

function getPreviousSectionTexts(req: CollabRequest, currentIndex: number): string[] {
  return (req.story_blocks || [])
    .slice(0, currentIndex)
    .map((b) => b.text?.trim() || "")
    .filter(Boolean)
}

function finalizeWritingSectionFeedback(
  req: CollabRequest,
  answer: string,
  meta: Partial<CollabResponse>,
): { answer: string; revision_tags: StoryRevisionTag[]; section_passed: boolean } {
  const idx =
    typeof req.current_writing_section_index === "number" &&
    req.current_writing_section_index >= 0 &&
    req.current_writing_section_index < (req.story_blocks?.length ?? 0)
      ? req.current_writing_section_index
      : null

  if (!req.structure_type || idx === null || !req.story_blocks[idx]) {
    return { answer, revision_tags: [], section_passed: false }
  }

  const section = req.story_blocks[idx]
  const sectionText = (section.text || "").trim() || (req.message || "").trim()
  const isLastSection = idx >= req.story_blocks.length - 1
  const evaluation = evaluateStorySection(
    sectionText,
    section.section,
    req.level,
    req.character,
    req.plot_state,
    getPreviousSectionTexts(req, idx),
  )

  const { min, max } = evaluation.tagBounds

  const aiGrade = parseAiSectionGrade(meta as Record<string, unknown>, answer)
  const passed = combineSectionPassDecision(
    evaluation.mechanicalPass,
    evaluation.structureOk,
    aiGrade,
  )

  if (passed) {
    const passLine = isLastSection ? PASS_LAST_SECTION : PASS_NEXT_SECTION
    return {
      answer: `Nice work on ${section.section}! ${passLine}`,
      revision_tags: [],
      section_passed: true,
    }
  }

  let revision_tags = aiGrade.revision_tags.length > 0 ? aiGrade.revision_tags : []
  const weakAiTags =
    revision_tags.length > 0 &&
    revision_tags.every((t) => t.rationale.toLowerCase() === t.label.toLowerCase())
  if (revision_tags.length < min || weakAiTags) {
    revision_tags = evaluation.revisionTags
  }
  if (revision_tags.length < min) {
    revision_tags = tipsToRevisionTags(
      evaluation.tips.length > 0 ? evaluation.tips : evaluation.reasons,
      req.level,
      {
        sectionName: section.section,
        characterName: req.character?.name,
        maxTags: max,
      },
    )
  }
  revision_tags = revision_tags.slice(0, max)

  return {
    answer: "Revise your Writing Pad — tap each tag to see why, then tap Finish! again.",
    revision_tags,
    section_passed: false,
  }
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

    const inWritingSection =
      !!req.structure_type &&
      typeof req.current_writing_section_index === "number" &&
      req.current_writing_section_index >= 0 &&
      req.current_writing_section_index < (req.story_blocks?.length ?? 0)

    const draftSubmission = inWritingSection && isSectionDraftSubmission(req, queryText)

    let parsedAnswer = ""
    let meta: Partial<CollabResponse> = {}
    let rawAnswer = ""

    if (draftSubmission) {
      const idx = req.current_writing_section_index as number
      const section = req.story_blocks[idx]
      const sectionText = (section.text || "").trim() || queryText
      const charName = req.character?.name || "the hero"
      const prevTexts = getPreviousSectionTexts(req, idx)
      const systemPrompt = buildSectionGraderSystemPrompt({
        sectionName: section.section,
        level: req.level,
        characterName: charName,
        characterAge: req.character?.age,
        plot: req.plot_state || {},
        structureType: req.structure_type,
        sectionIndex: idx,
        sectionCount: req.story_blocks.length,
        previousSections: prevTexts,
      })
      const userPayload =
        `Grade this draft for "${section.section}" only.\n\nDraft:\n${sectionText}`

      rawAnswer = await chat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        timeout: 45_000,
        temperature: 0.2,
        maxTokens: 700,
      })
      const parsed = parseResponse(rawAnswer)
      parsedAnswer = parsed.answer
      meta = parsed.meta
    } else {
      const phase = determinePhase(req)
      const systemPrompt = buildSystemPrompt(req, phase, queryText)
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ]
      const history = req.conversation_history || []
      const recentHistory = history.slice(-20)
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
      messages.push({ role: "user", content: queryText })
      rawAnswer = await chat({ messages, timeout: 60_000 })
      const parsed = parseResponse(rawAnswer)
      parsedAnswer = parsed.answer
      meta = parsed.meta
    }

    const finalized = draftSubmission
      ? finalizeWritingSectionFeedback(req, parsedAnswer || rawAnswer, meta)
      : { answer: parsedAnswer || rawAnswer, revision_tags: [] as StoryRevisionTag[], section_passed: false }

    let answer = finalized.answer

    const studentMessages = req.conversation_history
      .filter((m) => m.role === "user")
      .map((m) => m.content)
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
        if (!/structure|choose|pick/i.test(answer)) {
          answer =
            `${answer}\n\nYour story idea sounds ready — pick a structure below when you like!`.trim()
        }
      } else if (!plotFinal.plot_complete) {
        finalPhase = plotFinal.phase
      }
      suggestions = plotFinal.suggestions
    }

    const hasStructure = !!req.structure_type
    const mergedPlot = plot_state || req.plot_state
    const plotUserTurns = studentMessages.length
    if (canCompletePlot(mergedPlot, plotUserTurns) && !hasStructure) {
      finalPhase = "structure"
      plot_complete = true
    }

    const inPlotPhase = !req.structure_type && !canCompletePlot(mergedPlot, plotUserTurns)

    const defaultSuggestions = inPlotPhase
      ? plotFinal?.suggestions || ["At school", "In a forest", "On a beach"]
      : draftSubmission && !finalized.section_passed
        ? []
        : draftSubmission && finalized.section_passed
          ? []
          : ["Adventure", "Magic", "Mystery"]

    const responseSuggestions =
      draftSubmission && finalized.revision_tags.length > 0
        ? []
        : suggestions?.length
          ? suggestions
          : defaultSuggestions

    const response: CollabResponse = {
      answer: answer || rawAnswer,
      phase: finalPhase,
      suggestions: responseSuggestions,
      story_snippet: meta.story_snippet || null,
      plot_update,
      plot_state,
      plot_progress,
      plot_complete,
      structure_suggestion: meta.structure_suggestion || null,
      revision_tags: finalized.revision_tags.length ? finalized.revision_tags : undefined,
      section_passed: finalized.section_passed || undefined,
    }

    await logApiCall(
      req.user_id,
      "story-collab",
      "/api/story-collab",
      { message: queryText, current_phase: phase },
      { answer: response.answer }
    )

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in story-collab API:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json(
        { error: "timeout", message: "Request timed out. Please try again." },
        { status: 504 }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
