import { evaluateStoryWriting, type CagentRubricResult } from "@/lib/cagent-writing-rubric"
import { buildRevisionTagsPromptRules, tipsToRevisionTags, type StoryRevisionTag } from "@/lib/story-revision-tags"

export type PlotState = { setting?: string; conflict?: string; goal?: string }

export type SectionEvaluation = {
  pass: boolean
  rubric: CagentRubricResult
  reasons: string[]
  tips: string[]
  revisionTags: StoryRevisionTag[]
}

const STOPWORDS = new Set([
  "a", "an", "the", "is", "am", "are", "was", "were", "in", "on", "at", "to", "of", "and", "or", "but",
])

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

function normalizeCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function isNearDuplicate(text: string, previousTexts: string[]): boolean {
  const current = normalizeCompare(text)
  if (current.length < 30) return false
  for (const prev of previousTexts) {
    const p = normalizeCompare(prev)
    if (!p || p.length < 30) continue
    if (current === p) return true
    const short = current.length <= p.length ? current : p
    const long = current.length > p.length ? current : p
    if (long.includes(short) && short.length / long.length >= 0.82) return true
  }
  return false
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text))
}

function scoreSectionBeat(text: string, sectionName: string): { score: number; reasons: string[] } {
  const t = text.toLowerCase()
  const s = sectionName.toLowerCase()
  const reasons: string[] = []

  if (s.includes("setup") || s.includes("exposition") || s.includes("begin")) {
    let score = 0
    if (includesAny(t, [/\bone day\b/, /\bonce upon\b/, /\bevery (day|morning)\b/, /\bin a\b/, /\bat the\b/, /\bvillage\b/, /\bforest\b/, /\bschool\b/])) {
      score += 45
    } else {
      reasons.push("this part should show where and when the story begins")
    }
    if (includesAny(t, [/\bstorm\b/, /\bthunder\b/, /\broar\b/, /\bscream\b/, /\bdisappear\b/, /\bfog\b/, /\bcrisis\b/])) {
      score -= 25
      reasons.push("Setup should come before the big trouble — save the storm for the next part")
    }
    return { score: Math.max(0, score), reasons }
  }

  if (s.includes("confront") || s.includes("rising") || s.includes("crisis")) {
    let score = 0
    if (includesAny(t, [/\bstorm\b/, /\brain\b/, /\bthunder\b/, /\bdanger\b/, /\btrouble\b/, /\bproblem\b/, /\bafraid\b/, /\bscared\b/, /\blost\b/, /\bfog\b/, /\bdark\b/, /\bhowever\b/, /\bbut suddenly\b/, /\bsuddenly\b/])) {
      score += 50
    } else {
      reasons.push("this part needs the problem or danger to start (storm, trouble, fear, etc.)")
    }
    if (includesAny(t, [/\bevery day\b/, /\balways feel happy\b/, /\bfull of color and laugh\b/, /\bplay with\b]) &&
      !includesAny(t, [/\bstorm\b/, /\brain\b/, /\bthunder\b/, /\btrouble\b/, /\bdanger\b/, /\bproblem\b/])) {
      score -= 40
      reasons.push("this sounds like the happy beginning — write what goes wrong when trouble begins")
    }
    return { score: Math.max(0, score), reasons }
  }

  if (s.includes("climax")) {
    let score = 0
    if (includesAny(t, [/\bfinal\b/, /\bface\b/, /\bfight\b/, /\bbrave\b/, /\btry\b/, /\bmost\b/, /\bworst\b/, /\bpeak\b/])) score += 40
    if (includesAny(t, [/\bstorm\b/, /\brain\b/, /\bdanger\b/, /\btrouble\b/])) score += 20
    if (score < 30) reasons.push("show the biggest moment of danger or the hardest choice here")
    return { score, reasons }
  }

  if (s.includes("resol") || s.includes("falling")) {
    let score = 0
    if (includesAny(t, [/\bfinally\b/, /\bsolved\b/, /\bsaved\b/, /\blearned\b/, /\bended\b/, /\bhappily\b/, /\bpeace\b/, /\bsafe\b/, /\bhome\b/])) {
      score += 45
    } else {
      reasons.push("show how the problem gets solved or calms down in this part")
    }
    return { score, reasons }
  }

  return { score: 25, reasons }
}

function plotConnectionScore(text: string, sectionName: string, plot: PlotState): { ok: boolean; reason?: string } {
  const tokens = tokenize(text)
  const textLower = text.toLowerCase()
  const s = sectionName.toLowerCase()

  const settingTokens = tokenize(String(plot?.setting || ""))
  const conflictTokens = tokenize(String(plot?.conflict || ""))
  const goalTokens = tokenize(String(plot?.goal || ""))

  const hasSetting = settingTokens.some((w) => textLower.includes(w))
  const hasConflict = conflictTokens.some((w) => textLower.includes(w))
  const hasGoal = goalTokens.some((w) => textLower.includes(w))

  if (s.includes("setup") || s.includes("exposition")) {
    if (settingTokens.length > 0 && !hasSetting && tokens.length >= 8) {
      return { ok: false, reason: "mention the place from your plot plan in this opening" }
    }
    return { ok: true }
  }
  if (s.includes("confront") || s.includes("rising") || s.includes("crisis")) {
    if (conflictTokens.length > 0 && !hasConflict && !includesAny(textLower, [/\bstorm\b/, /\brain\b/, /\btrouble\b/, /\bdanger\b/, /\bproblem\b/])) {
      return { ok: false, reason: "connect this part to the problem you planned in your plot" }
    }
    return { ok: true }
  }
  if (s.includes("resol") || s.includes("falling") || s.includes("climax")) {
    if (goalTokens.length > 0 && !hasGoal && !hasConflict) {
      return { ok: false, reason: "show how your hero works toward the goal you planned" }
    }
    return { ok: true }
  }
  return { ok: true }
}

export function evaluateStorySection(
  text: string,
  sectionName: string,
  level: number,
  character: { name?: string } | null | undefined,
  plot: PlotState | null | undefined,
  previousSectionTexts: string[] = [],
): SectionEvaluation {
  const trimmed = text.trim()
  const rubric = evaluateStoryWriting(trimmed, sectionName, level, character, plot)
  const reasons: string[] = [...rubric.reasons]
  const tips: string[] = [...rubric.tips]

  const characterName = String(character?.name || "").trim()
  if (characterName.length >= 2 && !trimmed.toLowerCase().includes(characterName.toLowerCase())) {
    reasons.push(`use your hero ${characterName} in this part (not only other names)`)
    tips.unshift(`name ${characterName} and what they do in this beat`)
  }

  if (isNearDuplicate(trimmed, previousSectionTexts)) {
    reasons.push("write something new for this section — do not copy the same paragraph from before")
    tips.unshift(`write fresh sentences for "${sectionName}" only`)
  }

  const beat = scoreSectionBeat(trimmed, sectionName)
  if (beat.score < 35) {
    reasons.push(...beat.reasons)
  }

  const plotLink = plotConnectionScore(trimmed, sectionName, plot || {})
  if (!plotLink.ok && plotLink.reason) {
    reasons.push(plotLink.reason)
  }

  const pass =
    rubric.pass &&
    beat.score >= 35 &&
    plotLink.ok &&
    !isNearDuplicate(trimmed, previousSectionTexts) &&
    (characterName.length < 2 || trimmed.toLowerCase().includes(characterName.toLowerCase()))

  const uniqueReasons = [...new Set(reasons)].slice(0, 4)
  const uniqueTips = [...new Set(tips)].slice(0, 4)
  const revisionTags = pass ? [] : tipsToRevisionTags(uniqueTips.length > 0 ? uniqueTips : uniqueReasons, level)

  return {
    pass,
    rubric,
    reasons: uniqueReasons,
    tips: uniqueTips,
    revisionTags,
  }
}

export function buildSectionSubmitSystemPrompt(
  sectionName: string,
  level: number,
  characterName: string,
  plot: PlotState,
): string {
  return (
    "You grade ONE section of a child's story. Reply with at most ONE short sentence (under 15 words), then META only.\n" +
    `Section: ${sectionName}. Level: ${level}. Hero: ${characterName}.\n` +
    `Plot plan — setting: ${plot.setting || "?"}, problem: ${plot.conflict || "?"}, goal: ${plot.goal || "?"}.\n` +
    "If the draft does NOT fit this section beat, output revision_tags (2-4 items) and NO pass sentence.\n" +
    "If it fits this section, hero, and plot, output empty revision_tags and end with pass sentence in the reply.\n" +
    "FORBIDDEN: long feedback, listing bullet options in prose, repeating the student's whole draft.\n" +
    buildRevisionTagsPromptRules(level, sectionName)
  )
}
