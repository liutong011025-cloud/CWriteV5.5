import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"
import { getLevelPromptSuffix } from "@/lib/level-details"

type CollabPhase = "explore" | "plot" | "structure" | "writing" | "polish"

interface CollabRequest {
  message: string
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>
  character: { name: string; age: number; traits: string[]; description: string; species?: string }
  plot_state: { setting?: string; conflict?: string; goal?: string }
  structure_type: "freytag" | "threeAct" | "fichtean" | null
  story_blocks: Array<{ section: string; text: string }>
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

  // Story progress
  const filledBlocks = req.story_blocks.filter((b) => b.text.trim())
  if (filledBlocks.length > 0) {
    const progress = filledBlocks.map((b) => `${b.section}: "${b.text.slice(0, 80)}..."`).join("; ")
    parts.push(`\nStory progress: ${progress}`)
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
      "Now help the student write their story section by section. " +
      "Offer starter sentences, vocabulary suggestions, and ideas. " +
      "When you suggest actual story text, put it in story_snippet in META. " +
      "Be enthusiastic about what they write! " +
      "When the current section is clearly written well enough to continue, end your reply with this exact sentence on its own line at the very end (after your main message, before META): " +
      "You can move to the next section. " +
      "Do not use that sentence if the section still needs more work.",
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
    '\n---META---\n{"phase":"...","suggestions":[...],"story_snippet":"..."|null,"plot_update":{...}|null,"structure_suggestion":"..."|null}\n---END---' +
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
    const { answer, meta } = parseResponse(rawAnswer)

    const hasPlot = !!(req.plot_state?.setting && req.plot_state?.conflict && req.plot_state?.goal)
    const hasStructure = !!req.structure_type
    // 模型 META 里的 phase 常会写成 plot/explore，覆盖后用户要多聊几轮才出现结构卡片
    let finalPhase = (meta.phase as CollabPhase) || phase
    if (hasPlot && !hasStructure) {
      finalPhase = "structure"
    }

    const response: CollabResponse = {
      answer: answer || rawAnswer,
      phase: finalPhase,
      suggestions: meta.suggestions?.length ? meta.suggestions : ["Tell me more", "What happens next?", "Help me"],
      story_snippet: meta.story_snippet || null,
      plot_update: meta.plot_update || null,
      structure_suggestion: meta.structure_suggestion || null,
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
