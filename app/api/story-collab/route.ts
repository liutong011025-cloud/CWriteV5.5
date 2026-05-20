import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { evaluateStoryWriting } from "@/lib/cagent-writing-rubric"
import {
  buildRevisionTagsPromptRules,
  parseRevisionTags,
  revisionTagBoundsForLevel,
  tipsToRevisionTags,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"

interface CollabRequest {
  message: string
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>
  character: { name: string; age: number; traits: string[]; description: string; species?: string }
  plot_state: { setting?: string; conflict?: string; goal?: string }
  structure_type: "freytag" | "threeAct" | "fichtean" | null
  story_blocks: Array<{ section: string; text: string }>
  /** 0-based index of the structural section the student is writing now (Writing Pad = this part only). */
  current_writing_section_index?: number | null
  current_phase: CollabPhase
  user_id: string
  level: number
  action?: "help_me" | "chat"
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
  if (!req.structure_type) return false
  const idx = req.current_writing_section_index
  if (typeof idx !== "number" || idx < 0 || idx >= (req.story_blocks?.length ?? 0)) return false
  const minWords = req.level <= 2 ? 5 : 8
  const sectionText = (req.story_blocks[idx]?.text || "").trim()
  const draftText = sectionText || queryText.trim()
  return countWords(draftText) >= minWords
}

function determinePhase(req: CollabRequest): CollabPhase {
  const msgCount = req.conversation_history.length
  const plot = req.plot_state
  const hasPlot = !!(plot?.setting && plot?.conflict && plot?.goal)
  const hasStructure = !!req.structure_type
  const totalWords = req.story_blocks.reduce((sum, b) => {
    const text = b.text || ""
    const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const en = text.replace(/[\u4e00-\u9fff]/g, " ").trim().split(/\s+/).filter(Boolean).length
    return sum + cn + en
  }, 0)

  if (msgCount < 2 && !hasPlot) return "explore"
  if (!hasPlot) return "plot"
  if (!hasStructure) return "structure"
  if (totalWords < 100) return "writing"
  return "polish"
}

function buildSystemPrompt(req: CollabRequest, phase: CollabPhase): string {
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

  // Phase-specific instructions
  const phaseInstructions: Record<CollabPhase, string> = {
    explore:
      "Ask fun, open-ended questions about what kind of story the student wants. " +
      "Suggest themes like adventure, magic, mystery, funny situations. " +
      "Keep it light and exciting. After 2-3 exchanges, start guiding toward plot elements.",
    plot:
      "Guide the student to define: 1) Setting (where/when), 2) Conflict (the problem), " +
      "3) Goal (what the hero wants). Ask about one element at a time. " +
      "When you detect a clear answer, include it in your META block as plot_update.",
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
    "\nThe suggestions array must contain 2-4 short clickable options (1-4 words each) relevant to your question. Always include suggestions."
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
  const rubric = evaluateStoryWriting(
    sectionText,
    section.section,
    req.level,
    req.character,
    req.plot_state,
  )

  let revision_tags = parseRevisionTags((meta as { revision_tags?: unknown }).revision_tags)
  const { min, max } = revisionTagBoundsForLevel(req.level)

  if (rubric.pass) {
    const cleaned = appendPassSentence(stripPassSignalsFromAnswer(answer), isLastSection)
    return {
      answer: cleaned,
      revision_tags: [],
      section_passed: true,
    }
  }

  let cleanedAnswer = stripPassSignalsFromAnswer(answer)
  if (!cleanedAnswer) {
    cleanedAnswer = "Nice try! Tap each tag, revise your Writing Pad, then tap Finish! again."
  }

  if (revision_tags.length < min) {
    const fromTips = tipsToRevisionTags(rubric.tips, req.level)
    revision_tags = fromTips.length > 0 ? fromTips : revision_tags
  }
  revision_tags = revision_tags.slice(0, max)

  if (revision_tags.length === 0) {
    revision_tags = tipsToRevisionTags(
      [`Revise the ${section.section} part with clearer sentences`, "Add one more detail that fits this part"],
      req.level,
    )
  }

  return {
    answer: cleanedAnswer,
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
    const systemPrompt = buildSystemPrompt(req, phase)

    // Build messages: system + last 20 history + current
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

    const rawAnswer = await chat({ messages, timeout: 60_000 })
    const { answer: parsedAnswer, meta } = parseResponse(rawAnswer)

    const inWritingSection =
      !!req.structure_type &&
      typeof req.current_writing_section_index === "number" &&
      req.current_writing_section_index >= 0 &&
      req.current_writing_section_index < (req.story_blocks?.length ?? 0)

    const draftSubmission = inWritingSection && isSectionDraftSubmission(req, queryText)

    const finalized = draftSubmission
      ? finalizeWritingSectionFeedback(req, parsedAnswer || rawAnswer, meta)
      : { answer: parsedAnswer || rawAnswer, revision_tags: [] as StoryRevisionTag[], section_passed: false }

    const answer = finalized.answer

    const hasPlot = !!(req.plot_state?.setting && req.plot_state?.conflict && req.plot_state?.goal)
    const hasStructure = !!req.structure_type
    // 模型 META 里的 phase 常会写成 plot/explore，覆盖后用户要多聊几轮才出现结构卡片
    let finalPhase = (meta.phase as CollabPhase) || phase
    if (hasPlot && !hasStructure) {
      finalPhase = "structure"
    }

    const defaultSuggestions =
      draftSubmission && !finalized.section_passed
        ? ["Revise and Finish! again", "Help me", "Add one more detail"]
        : draftSubmission && finalized.section_passed
          ? ["Next section!", "Help me"]
          : ["Tell me more", "What happens next?", "Help me"]

    const response: CollabResponse = {
      answer: answer || rawAnswer,
      phase: finalPhase,
      suggestions: meta.suggestions?.length ? meta.suggestions : defaultSuggestions,
      story_snippet: meta.story_snippet || null,
      plot_update: meta.plot_update || null,
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
