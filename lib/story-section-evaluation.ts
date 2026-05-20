import { evaluateStoryWriting, type CagentRubricResult } from "@/lib/cagent-writing-rubric"
import {
  MIN_SECTION_WORD_COUNT,
  revisionTagBoundsForSituation,
  tipsToRevisionTags,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"

export type PlotState = { setting?: string; conflict?: string; goal?: string }

export type SectionEvaluation = {
  /** Server rules: length, complete sentences, duplicate, plot link, safety */
  mechanicalPass: boolean
  /** Narrative beat fits this structural section */
  structureOk: boolean
  rubric: CagentRubricResult
  reasons: string[]
  tips: string[]
  revisionTags: StoryRevisionTag[]
  issueCount: number
  tagBounds: { min: number; max: number }
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
  if (current.length < 40) return false
  for (const prev of previousTexts) {
    const p = normalizeCompare(prev)
    if (!p || p.length < 40) continue
    if (current === p) return true
    const short = current.length <= p.length ? current : p
    const long = current.length > p.length ? current : p
    // Only block near-copy (not loosely similar paragraphs)
    if (long.includes(short) && short.length / long.length >= 0.92) return true
  }
  return false
}

function wordCount(text: string): number {
  return (text.match(/[\u4e00-\u9fff]|[a-zA-Z']+/g) || []).length
}

function finishedSentenceCount(text: string): number {
  const parts = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.filter((s) => /[.!?]$/.test(s)).length
}

/** Cut-off drafts like "...speak in a low," must not pass. */
export function isIncompleteDraft(text: string): boolean {
  const t = text.trim()
  if (!t) return true

  if (/[,;:]\s*$/.test(t)) return true
  if (/\b(in|on|at|to|the|a|an|and|but|with|of|for|when|as)\s*$/i.test(t)) return true
  if (/\b(low|high|big|small|very|so|then|suddenly)\s*,?\s*$/i.test(t)) return true

  const sentences = t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (sentences.length === 0) return true

  const last = sentences[sentences.length - 1]
  if (!/[.!?]$/.test(last)) return true

  if (finishedSentenceCount(t) < 2 && wordCount(t) < MIN_SECTION_WORD_COUNT + 5) {
    return true
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
    let score = 18
    if (includesAny(t, [/\bone day\b/, /\bonce upon\b/, /\bevery (day|morning)\b/, /\bin a\b/, /\bat the\b/, /\bvillage\b/, /\bforest\b/, /\bschool\b/, /\bthere\b/, /\blived\b/, /\bwas\b/])) {
      score += 35
    } else if (t.length >= 20) {
      score += 22
    } else {
      reasons.push("add a little more about where or when the story starts")
    }
    if (includesAny(t, [/\bstorm\b/, /\bthunder\b/, /\broar\b/, /\bscream\b/, /\bdisappear\b/, /\bfog\b/, /\bcrisis\b/])) {
      score -= 12
      reasons.push("you can save the big storm for the next part")
    }
    return { score: Math.max(0, score), reasons }
  }

  if (s.includes("confront") || s.includes("rising") || s.includes("crisis")) {
    let score = 20
    if (
      includesAny(t, [
        /\bstorm\b/, /\brain\b/, /\bthunder\b/, /\bdanger\b/, /\btrouble\b/, /\bproblem\b/,
        /\bafraid\b/, /\bscared\b/, /\blost\b/, /\bmissing\b/, /\bfog\b/, /\bdark\b/, /\bhowever\b/,
        /\bbut suddenly\b/, /\bsuddenly\b/, /\bbird\b/, /\bsteal\b/, /\bstole\b/, /\bsnack\b/,
        /\bfunny\b/, /\bsilly\b/, /\boops\b/, /\blaugh\b/, /\boh no\b/, /\bworried\b/,
        /\bstrange\b/, /\bvoice\b/, /\bhear\b/, /\bheard\b/, /\btalking\b/, /\bcave\b/, /\bdoorway\b/,
        /\bclue\b/, /\bclues\b/, /\bfootprint\b/, /\bfollow\b/, /\bfind\b/, /\bfound\b/, /\bsearch\b/,
        /\blook\b/, /\blooked\b/, /\bcheck\b/, /\bchecked\b/, /\bsee\b/, /\bsaw\b/, /\bhidden\b/,
        /\bgoal\b/, /\bobject\b/, /\bbear\b/, /\bhair\b/, /\bhairs\b/, /\bdusty\b/, /\bstone\b/,
      ])
    ) {
      score += 40
    } else if (includesAny(t, [/\bbut\b/, /\bhowever\b/, /\bthen\b/, /\bwhen\b/, /\balso\b/]) && t.length >= 25) {
      score += 28
    } else if (t.length >= 40) {
      score += 22
    } else {
      reasons.push("add a little more action or detail for this part of the story")
    }
    if (
      includesAny(t, [/\bevery day\b/, /\balways feel happy\b/, /\bfull of color and laugh\b/]) &&
      !includesAny(t, [/\bstorm\b/, /\brain\b/, /\bthunder\b/, /\btrouble\b/, /\bdanger\b/, /\bproblem\b/, /\bbut\b/, /\bhowever\b/, /\bbird\b/, /\bsteal\b/])
    ) {
      score -= 25
      reasons.push("this still sounds like the happy opening — add what starts to go wrong")
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

  return { score: 32, reasons: [] }
}

/** True when the draft is clearly real story prose (not empty / gibberish). */
export function draftHasSubstantiveStoryContent(
  text: string,
  characterName?: string,
): boolean {
  const trimmed = text.trim()
  if (wordCount(trimmed) < MIN_SECTION_WORD_COUNT) return false
  if (finishedSentenceCount(trimmed) < 2) return false

  const t = trimmed.toLowerCase()
  const hero = (characterName || "").trim().toLowerCase()
  if (hero.length >= 2 && t.includes(hero)) return true

  return includesAny(t, [
    /\bfind\b/, /\bfound\b/, /\blook\b/, /\blooked\b/, /\bsee\b/, /\bsaw\b/, /\bcheck\b/, /\bchecked\b/,
    /\bfollow\b/, /\bclue\b/, /\bclues\b/, /\bfootprint\b/, /\bmissing\b/, /\blost\b/, /\bgoal\b/,
    /\bwent\b/, /\bwalk\b/, /\brun\b/, /\bcave\b/, /\bforest\b/, /\bhome\b/, /\bschool\b/,
    /\bbut\b/, /\bhowever\b/, /\bthen\b/, /\bwhen\b/, /\bsuddenly\b/, /\btry\b/, /\bwant\b/,
    /\bher\b/, /\bhis\b/, /\bthey\b/, /\bshe\b/, /\bhe\b/,
  ])
}

/** Same story as plot plan — any plot anchor counts; do not require setting+conflict+goal in one section. */
function plotStoryCoherence(
  text: string,
  plot: PlotState,
  characterName: string,
): { ok: boolean; reason?: string } {
  const plotFields = [plot?.setting, plot?.conflict, plot?.goal].filter(Boolean) as string[]
  if (plotFields.length === 0) return { ok: true }

  const textLower = text.toLowerCase()
  const anchors = [
    ...new Set(
      plotFields.flatMap((field) => tokenize(field)).filter((w) => w.length >= 3),
    ),
  ]

  if (characterName.length >= 2 && textLower.includes(characterName.toLowerCase())) {
    return { ok: true }
  }

  if (anchors.some((word) => textLower.includes(word))) {
    return { ok: true }
  }

  for (const field of plotFields) {
    const phrase = field.trim().toLowerCase()
    if (phrase.length >= 6 && textLower.includes(phrase.slice(0, Math.min(phrase.length, 24)))) {
      return { ok: true }
    }
  }

  if (draftHasSubstantiveStoryContent(text, characterName)) {
    return { ok: true }
  }

  if (wordCount(text) >= MIN_SECTION_WORD_COUNT) {
    return {
      ok: false,
      reason: "keep this part in the same story as your plot plan — one link to place, trouble, or wish is enough",
    }
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
  const heroMissing =
    characterName.length >= 2 && !trimmed.toLowerCase().includes(characterName.toLowerCase())
  if (heroMissing) {
    tips.push(`you could name ${characterName} once in this part`)
  }

  const duplicate = isNearDuplicate(trimmed, previousSectionTexts)
  if (duplicate) {
    reasons.push("write something new for this section — do not copy the same paragraph from before")
    tips.unshift(`write fresh sentences for "${sectionName}" only`)
  }

  const beat = scoreSectionBeat(trimmed, sectionName)
  const structureOk =
    beat.score >= 28 ||
    (draftHasSubstantiveStoryContent(trimmed, characterName) && beat.score >= 20)
  if (!structureOk && beat.reasons.length > 0) {
    reasons.push(...beat.reasons)
  }

  const plotCoherence = plotStoryCoherence(trimmed, plot || {}, characterName)
  if (!plotCoherence.ok && plotCoherence.reason) {
    reasons.push(plotCoherence.reason)
  }

  const wc = wordCount(trimmed)
  const tooShort = wc < MIN_SECTION_WORD_COUNT
  if (tooShort) {
    reasons.push(`write at least ${MIN_SECTION_WORD_COUNT} words for ${sectionName}`)
  }

  const incomplete = isIncompleteDraft(trimmed)
  if (incomplete) {
    reasons.push("finish your last sentence — end with . ! or ? before submitting")
    tips.unshift("complete the cut-off sentence at the end")
  }

  const finishedSentences = finishedSentenceCount(trimmed)
  if (!tooShort && finishedSentences < 2) {
    reasons.push("write at least two complete sentences in this section")
  }

  let issueCount = 0
  if (tooShort) issueCount++
  if (incomplete) issueCount++
  if (finishedSentences < 2) issueCount++
  if (duplicate) issueCount++
  if (!plotCoherence.ok) issueCount++
  if (!structureOk) issueCount++
  if (!rubric.pass && rubric.reasons.length > 0) issueCount++
  if (heroMissing) issueCount++

  const mechanicalPass =
    !tooShort &&
    !incomplete &&
    finishedSentences >= 2 &&
    !duplicate &&
    plotCoherence.ok &&
    rubric.safety === 100 &&
    rubric.gibberishRatio < 0.45

  const tagBounds = revisionTagBoundsForSituation(
    level,
    mechanicalPass && structureOk ? 0 : Math.max(1, issueCount),
  )

  const uniqueReasons = [...new Set(reasons)].slice(0, 4)
  const uniqueTips = [...new Set(tips)].slice(0, 4)
  const tagSource =
    uniqueTips.length > 0
      ? uniqueTips
      : uniqueReasons.length > 0
        ? uniqueReasons
        : ["Revise this part so it fits the story beat"]
  const revisionTags =
    tagBounds.max > 0
      ? tipsToRevisionTags(tagSource, level, {
          sectionName,
          characterName: character?.name || "your hero",
          maxTags: tagBounds.max,
          draftText: trimmed,
        })
      : []

  return {
    mechanicalPass,
    structureOk,
    rubric,
    reasons: uniqueReasons,
    tips: uniqueTips,
    revisionTags,
    issueCount,
    tagBounds,
  }
}
