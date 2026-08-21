import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { evaluateStorySection } from "@/lib/story-section-evaluation"
import {
  buildSectionGraderSystemPrompt,
  combineSectionPassDecision,
  alignAiGradeWithDraft,
  parseAiSectionGrade,
} from "@/lib/story-section-grader"
import {
  buildDraftSpecificRevisionTags,
  buildFallbackRevisionTags,
  buildRevisionTagsPromptRules,
  isGenericRevisionTag,
  mergeRevisionTags,
  parseRevisionTags,
  revisionTagBoundsForSituation,
  tipsToRevisionTags,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"
import { parseStoryMetaPayload, stripStoryMetaBlock } from "@/lib/story-meta"
import {
  buildExplorePromptRules,
  buildFallbackPlotAnswer,
  buildPlotPhasePromptRules,
  canCompletePlot,
  detectThemeFromMessages,
  finalizePlotFromConversation,
  isPlotComplete,
  resolvePlotAskStep,
  stripOptionsFromAnswer,
  type PlotConversationProgress,
  type PlotState,
} from "@/lib/story-plot-coach"
import {
  buildStoryAiLanguageRules,
  getSectionLabel,
  getStoryCopy,
  isZh,
  ensureEnglishSuggestionChips,
  matchStructureType,
  PASS_GUIDED_WRITING,
  PASS_LAST_SECTION,
  PASS_NEXT_SECTION,
  stripPassSignalsFromAnswer,
  type StoryUiLang,
} from "@/lib/story-i18n"

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
  language?: "en" | "zh"
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
  const history = Array.isArray(req.conversation_history) ? req.conversation_history : []
  const blocks = Array.isArray(req.story_blocks) ? req.story_blocks : []
  const userTurns = history.filter((m) => m.role === "user").length
  const totalWords = blocks.reduce((sum, b) => {
    const text = b?.text || ""
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

function langOf(req: CollabRequest): StoryUiLang {
  return req.language === "zh" ? "zh" : "en"
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
    const traits = Array.isArray(c.traits) ? c.traits.join(", ") : "friendly"
    parts.push(
      `\nThe student's character: ${c.name || "the hero"}, age ${c.age ?? "?"}. ` +
      `Traits: ${traits}. ` +
      `Description: ${c.description || "a creative character"}.` +
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
  const history = Array.isArray(req.conversation_history) ? req.conversation_history : []
  const userTurns = history.filter((m) => m.role === "user").length
  const studentMessages = history.filter((m) => m.role === "user").map((m) => m.content)

  if (phase === "explore") {
    parts.push(buildExplorePromptRules(charName, lastStudentMessage))
  }
  if (phase === "plot" || (phase === "explore" && userTurns >= 1)) {
    // Prompt must ask the NEXT step (same step used for suggestion buttons after finalize).
    const plotProgress = { ...(req.plot_progress || {}) }
    const theme = detectThemeFromMessages(studentMessages)
    if (theme && !plotProgress.theme) plotProgress.theme = theme
    const { askStep, plot: previewPlot, progress: previewProgress } = resolvePlotAskStep(
      req.plot_state || {},
      plotProgress,
      lastStudentMessage,
      userTurns,
      charName,
    )
    parts.push(
      buildPlotPhasePromptRules(
        previewPlot,
        charName,
        lastStudentMessage,
        userTurns,
        askStep,
        previewProgress,
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
    "\nThe suggestions array must contain 2-4 short English clickable options (2-6 words each) that answer YOUR question. " +
    "Even if your chat reply is Chinese, suggestions MUST stay English. " +
    "FORBIDDEN suggestions: Tell me more, What happens next?, Help me, or any Chinese chip labels. Always include suggestions."
  )

  parts.push(buildStoryAiLanguageRules(langOf(req)))
  if (isZh(langOf(req))) {
    parts.push(
      "\nIf you put a starter sentence in story_snippet, it MUST be English so the student can copy it into the Writing Pad."
    )
  }

  return parts.join("")
}

function parseResponse(raw: string): { answer: string; meta: Partial<CollabResponse> } {
  const { answer: withoutMeta, metaText } = stripStoryMetaBlock(raw)
  const parsedMeta = parseStoryMetaPayload(metaText)
  if (parsedMeta) {
    return { answer: withoutMeta, meta: parsedMeta as Partial<CollabResponse> }
  }

  // Layer 2: inline markers (META fence already removed even if JSON was invalid)
  const answer = withoutMeta
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

  const aiGrade = alignAiGradeWithDraft(
    sectionText,
    parseAiSectionGrade(meta as Record<string, unknown>, answer),
    { characterName: req.character?.name },
  )
  const passed = combineSectionPassDecision(
    evaluation.mechanicalPass,
    evaluation.structureOk,
    aiGrade,
  )

  const issueCountForTags = passed
    ? 0
    : Math.max(1, evaluation.issueCount + (aiGrade.pass === false ? 1 : 0))
  const { min, max } = revisionTagBoundsForSituation(
    req.level,
    issueCountForTags,
  )

  if (passed) {
    const copy = getStoryCopy(langOf(req))
    const passLine = isLastSection ? PASS_LAST_SECTION : PASS_NEXT_SECTION
    const sectionName = getSectionLabel(section.section, langOf(req))
    return {
      answer: `${copy.niceWorkOn(sectionName)}${passLine}`,
      revision_tags: [],
      section_passed: true,
    }
  }

  const draftTags = buildDraftSpecificRevisionTags(
    sectionText,
    evaluation.tips,
    evaluation.reasons,
    {
      sectionName: section.section,
      characterName: req.character?.name,
      level: req.level,
      maxTags: max,
    },
  )

  const aiTags = aiGrade.revision_tags.filter((t) => !isGenericRevisionTag(t))
  let revision_tags = mergeRevisionTags(aiTags, draftTags, max)

  if (revision_tags.length < min) {
    revision_tags = mergeRevisionTags(
      revision_tags,
      tipsToRevisionTags(
        evaluation.tips.length > 0 ? evaluation.tips : evaluation.reasons,
        req.level,
        {
          sectionName: section.section,
          characterName: req.character?.name,
          maxTags: max,
          draftText: sectionText,
        },
      ),
      max,
    )
  }

  if (revision_tags.length < min) {
    revision_tags = buildFallbackRevisionTags(
      section.section,
      req.level,
      Math.max(min, 1),
      sectionText,
      req.character?.name,
    )
  }
  revision_tags = revision_tags.slice(0, max)

  return {
    answer: getStoryCopy(langOf(req)).revisePadAgain,
    revision_tags,
    section_passed: false,
  }
}

function buildDeterministicPlotResponse(
  req: CollabRequest,
  queryText: string,
): CollabResponse {
  const charName = req.character?.name || "the hero"
  const studentMessages = (req.conversation_history || [])
    .filter((m) => m.role === "user")
    .map((m) => m.content)
  const userTurns = studentMessages.length || 1
  const plotProgressIn = { ...(req.plot_progress || {}) }
  const theme = detectThemeFromMessages(studentMessages)
  if (theme && !plotProgressIn.theme) plotProgressIn.theme = theme

  const plotFinal = finalizePlotFromConversation(
    req.plot_state,
    plotProgressIn,
    null,
    queryText,
    studentMessages.length ? studentMessages : [queryText],
    charName,
  )

  const answer = buildFallbackPlotAnswer(
    plotFinal.microStep,
    charName,
    queryText,
    plotFinal.plot,
    plotFinal.plot_progress,
  )

  return {
    answer,
    phase: plotFinal.plot_complete ? "structure" : plotFinal.phase,
    suggestions: ensureEnglishSuggestionChips(plotFinal.suggestions),
    story_snippet: null,
    plot_update: plotFinal.plot_update,
    plot_state: plotFinal.plot,
    plot_progress: plotFinal.plot_progress,
    plot_complete: plotFinal.plot_complete,
    structure_suggestion: null,
  }
}

export async function POST(request: NextRequest) {
  let req: CollabRequest | null = null
  let queryText = ""

  try {
    req = (await request.json()) as CollabRequest
    queryText = typeof req.message === "string" ? req.message.trim() : ""
    if (!queryText) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    // Normalize fragile fields so missing client payloads never crash the route.
    req.conversation_history = Array.isArray(req.conversation_history) ? req.conversation_history : []
    req.story_blocks = Array.isArray(req.story_blocks) ? req.story_blocks : []
    if (req.character && !Array.isArray(req.character.traits)) {
      req.character.traits = []
    }

    const phase = determinePhase(req)

    const inWritingSection =
      !!req.structure_type &&
      typeof req.current_writing_section_index === "number" &&
      req.current_writing_section_index >= 0 &&
      req.current_writing_section_index < (req.story_blocks?.length ?? 0)

    const draftSubmission = inWritingSection && isSectionDraftSubmission(req, queryText)

    // Plot/explore can continue with deterministic coach if DeepSeek is down.
    const canUsePlotFallback = !req.structure_type && !draftSubmission
    if (!isConfigured() && !canUsePlotFallback) {
      return NextResponse.json(
        { error: "DeepSeek API not configured", message: "DeepSeek API not configured" },
        { status: 500 },
      )
    }

    let parsedAnswer = ""
    let meta: Partial<CollabResponse> = {}
    let rawAnswer = ""
    let usedPlotFallback = false

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
    } else if (isConfigured()) {
      try {
        const phaseForPrompt = determinePhase(req)
        const systemPrompt = buildSystemPrompt(req, phaseForPrompt, queryText)
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ]
        const history = req.conversation_history || []
        // History already includes the current user turn — do not append it twice.
        const recentHistory = history.slice(-20)
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content })
          }
        }
        const lastHist = recentHistory[recentHistory.length - 1]
        if (!(lastHist?.role === "user" && lastHist.content === queryText)) {
          messages.push({ role: "user", content: queryText })
        }
        rawAnswer = await chat({ messages, timeout: 60_000 })
        const parsed = parseResponse(rawAnswer)
        parsedAnswer = parsed.answer
        meta = parsed.meta
      } catch (llmError) {
        if (!canUsePlotFallback) throw llmError
        console.error("[story-collab] LLM failed; using plot fallback:", llmError)
        usedPlotFallback = true
      }
    } else {
      usedPlotFallback = true
    }

    if (usedPlotFallback) {
      const response = buildDeterministicPlotResponse(req, queryText)
      try {
        await logApiCall(
          req.user_id,
          "story-collab",
          "/api/story-collab",
          { message: queryText, current_phase: phase, fallback: true },
          { answer: response.answer },
        )
      } catch {
        /* ignore logging failures */
      }
      return NextResponse.json(response)
    }

    const finalized = draftSubmission
      ? finalizeWritingSectionFeedback(req, parsedAnswer || rawAnswer, meta)
      : { answer: parsedAnswer || rawAnswer, revision_tags: [] as StoryRevisionTag[], section_passed: false }

    let answer = finalized.answer

    const studentMessages = (req.conversation_history || [])
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
        if (!/structure|choose|pick|结构|选/.test(answer)) {
          answer =
            `${answer}\n\n${getStoryCopy(langOf(req)).plotReadyPick}`.trim()
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
      ? plotFinal?.suggestions || ["Sunny village", "School yard", "By the sea"]
      : draftSubmission && !finalized.section_passed
        ? []
        : draftSubmission && finalized.section_passed
          ? []
          : ["Adventure", "Magic", "Mystery"]

    const responseSuggestions =
      draftSubmission && finalized.revision_tags.length > 0
        ? []
        : ensureEnglishSuggestionChips(suggestions?.length ? suggestions : defaultSuggestions)

    const pickedStructure = meta.structure_suggestion
      ? matchStructureType(meta.structure_suggestion)
      : null

    const response: CollabResponse = {
      answer: answer || rawAnswer,
      phase: finalPhase,
      suggestions: responseSuggestions,
      story_snippet: meta.story_snippet || null,
      plot_update,
      plot_state,
      plot_progress,
      plot_complete,
      structure_suggestion: pickedStructure || meta.structure_suggestion || null,
      revision_tags: finalized.section_passed ? undefined : finalized.revision_tags,
      section_passed: finalized.section_passed || undefined,
    }

    try {
      await logApiCall(
        req.user_id,
        "story-collab",
        "/api/story-collab",
        { message: queryText, current_phase: phase, fallback: usedPlotFallback },
        { answer: response.answer },
      )
    } catch {
      /* ignore logging failures */
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error in story-collab API:", error)

    // Last resort: keep plot chat alive instead of returning a hard 500.
    if (req && !req.structure_type && queryText) {
      try {
        const fallback = buildDeterministicPlotResponse(req, queryText)
        return NextResponse.json(fallback)
      } catch (fallbackError) {
        console.error("[story-collab] fallback also failed:", fallbackError)
      }
    }

    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json(
        { error: "timeout", message: "Request timed out. Please try again." },
        { status: 504 },
      )
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
