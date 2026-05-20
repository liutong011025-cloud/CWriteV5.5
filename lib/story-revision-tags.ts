export type RevisionTagColor = "amber" | "sky" | "rose" | "violet" | "emerald"

export interface StoryRevisionTag {
  label: string
  rationale: string
  color: RevisionTagColor
}

export const REVISION_TAG_COLOR_STYLES: Record<
  RevisionTagColor,
  { bg: string; border: string; text: string; hoverBg: string }
> = {
  amber: {
    bg: "#fef3c7",
    border: "#d97706",
    text: "#78350f",
    hoverBg: "#fde68a",
  },
  sky: {
    bg: "#e0f2fe",
    border: "#0284c7",
    text: "#0c4a6e",
    hoverBg: "#bae6fd",
  },
  rose: {
    bg: "#ffe4e6",
    border: "#e11d48",
    text: "#881337",
    hoverBg: "#fecdd3",
  },
  violet: {
    bg: "#ede9fe",
    border: "#7c3aed",
    text: "#4c1d95",
    hoverBg: "#ddd6fe",
  },
  emerald: {
    bg: "#d1fae5",
    border: "#059669",
    text: "#064e3b",
    hoverBg: "#a7f3d0",
  },
}

const TAG_COLORS: RevisionTagColor[] = ["amber", "sky", "rose", "violet", "emerald"]
const MAX_LABEL_CHARS = 40
const MAX_RATIONALE_CHARS = 320

const GENERIC_RATIONALE_SNIPPETS = [
  "this change will make your writing clearer",
  "will help this",
  "paragraph feel clearer and stronger",
  "you do not need every detail",
  "trouble starting",
  "what goes wrong, scares someone",
]

const GENERIC_LABELS = new Set([
  "revise this part",
  "add the problem",
  "add a problem",
  "same story",
  "add more words",
  "finish the sentence",
  "finish your sentence",
  "write something new",
  "more action here",
  "name your hero",
])

/** Minimum words per structural section (Setup, Confrontation, etc.). */
export const MIN_SECTION_WORD_COUNT = 15

export function revisionTagBoundsForLevel(level: number): { min: number; max: number } {
  return revisionTagBoundsForSituation(level, 2)
}

export function revisionTagBoundsForSituation(
  level: number,
  issueCount: number,
): { min: number; max: number } {
  const lv = Math.min(5, Math.max(1, Math.floor(level) || 1))
  const issues = Math.max(0, Math.floor(issueCount))

  if (issues === 0) return { min: 0, max: 0 }
  if (issues === 1) {
    return lv <= 3 ? { min: 1, max: 1 } : { min: 1, max: 2 }
  }
  if (issues === 2) {
    return lv <= 2 ? { min: 1, max: 2 } : lv <= 4 ? { min: 2, max: 2 } : { min: 2, max: 3 }
  }
  return lv <= 2 ? { min: 2, max: 2 } : lv <= 4 ? { min: 2, max: 3 } : { min: 2, max: 4 }
}

export function normalizeRevisionTagColor(raw: unknown, index: number): RevisionTagColor {
  const value = String(raw || "").toLowerCase()
  if (TAG_COLORS.includes(value as RevisionTagColor)) return value as RevisionTagColor
  return TAG_COLORS[index % TAG_COLORS.length]
}

export function isGenericRevisionTag(tag: StoryRevisionTag): boolean {
  const label = tag.label.trim().toLowerCase()
  const rationale = tag.rationale.trim().toLowerCase()
  if (!label) return true
  if (GENERIC_LABELS.has(label)) return true
  if (rationale.length < 28) return true
  if (rationale === label) return true
  if (GENERIC_RATIONALE_SNIPPETS.some((s) => rationale.includes(s))) return true
  return false
}

function clipRationale(text: string): string {
  return text.trim().slice(0, MAX_RATIONALE_CHARS)
}

function clipLabel(text: string): string {
  const t = text.trim().replace(/\s+/g, " ")
  if (t.length <= MAX_LABEL_CHARS) return t
  return `${t.slice(0, MAX_LABEL_CHARS - 1)}…`
}

function labelFromPhrase(phrase: string): string {
  const cleaned = phrase
    .replace(/^you could\s+/i, "")
    .replace(/^try\s+/i, "")
    .trim()
  const words = cleaned.split(/\s+/).slice(0, 6).join(" ")
  return clipLabel(words.charAt(0).toUpperCase() + words.slice(1))
}

function findSentenceWith(text: string, needle: RegExp): string | null {
  const parts = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    if (needle.test(part)) return part.length > 120 ? `${part.slice(0, 117)}…` : part
  }
  const m = text.match(needle)
  if (!m || m.index === undefined) return null
  const start = Math.max(0, m.index - 40)
  const end = Math.min(text.length, m.index + m[0].length + 60)
  const snippet = text.slice(start, end).trim()
  return snippet.length > 120 ? `…${snippet.slice(0, 117)}…` : snippet
}

type DraftIssue = StoryRevisionTag

function detectDraftGrammarIssues(draft: string, hero?: string): DraftIssue[] {
  const issues: DraftIssue[] = []
  const heroName = (hero || "").trim()

  const presentAfterPast = draft.match(
    /\b(when|after|then)\b[^.!?]{0,80}\b(she|he|they|it)\s+(check|look|see|find|go|walk)\b/gi,
  )
  if (presentAfterPast?.[0]) {
    const snippet = findSentenceWith(draft, /\b(she|he|they)\s+(check|look|see|find)\b/i)
    issues.push({
      label: "Match verb tense",
      rationale: snippet
        ? `In “${snippet}”, the time words suggest past — try checked / looked / saw / found instead of the present form.`
        : "When you use when/after/then, verbs often shift to past (checked, looked) so the timeline feels clear.",
      color: "sky",
    })
  }

  const barePresent = draft.match(/\b(she|he|they)\s+(check|look|see|find|want|go)\b/gi)
  if (barePresent?.[0] && issues.length < 3) {
    const snippet = findSentenceWith(draft, /\b(she|he|they)\s+(check|look|see|find|want)\b/i)
    const word = barePresent[0].split(/\s+/)[1]?.toLowerCase() || "verb"
    const fixes: Record<string, string> = {
      check: "checked",
      look: "looked",
      see: "saw",
      find: "found",
      want: "wanted",
      go: "went",
    }
    issues.push({
      label: "Past tense verb",
      rationale: snippet
        ? `You wrote “${snippet}”. Try “${fixes[word] || word + "ed"}” if this already happened in the story.`
        : `Try past tense (${fixes[word] || "…ed"}) so readers feel the action happened in story time.`,
      color: "sky",
    })
  }

  if (heroName.length >= 2 && !new RegExp(`\\b${heroName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(draft)) {
    issues.push({
      label: `Name ${heroName}`,
      rationale: `Readers follow one hero — slip “${heroName}” into a sentence here (who looks, who finds, who feels).`,
      color: "violet",
    })
  }

  const commaEnd = /[,;:]\s*$/.test(draft.trim())
  if (commaEnd) {
    const tail = draft.trim().slice(-50)
    issues.push({
      label: "Finish the sentence",
      rationale: `Your section ends with “${tail}” — finish the thought, then end with . ! or ?`,
      color: "amber",
    })
  }

  const wc = (draft.match(/[\u4e00-\u9fff]|[a-zA-Z']+/g) || []).length
  if (wc < MIN_SECTION_WORD_COUNT) {
    issues.push({
      label: "Add more detail",
      rationale: `You have about ${wc} words here — add at least ${MIN_SECTION_WORD_COUNT} so we see one more action or feeling in this beat.`,
      color: "emerald",
    })
  }

  return issues
}

function tipToDraftTag(
  tip: string,
  context: { sectionName: string; characterName: string; draftText: string },
): StoryRevisionTag | null {
  const trimmed = tip.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  const { sectionName, characterName, draftText } = context

  if (lower.includes("duplicate") || lower.includes("copy the same")) {
    return {
      label: "Write something new",
      rationale: `For “${sectionName}”, write fresh sentences — do not paste an earlier section word-for-word.`,
      color: "rose",
    }
  }

  if (lower.includes("finish") && lower.includes("sentence")) {
    const tail = draftText.trim().slice(-60) || trimmed
    return {
      label: "Finish the sentence",
      rationale: `Your ending “${tail}” looks cut off — complete the idea, then use . ! or ?`,
      color: "amber",
    }
  }

  if (lower.includes("at least") && lower.includes("word")) {
    const wc = (draftText.match(/[\u4e00-\u9fff]|[a-zA-Z']+/g) || []).length
    return {
      label: "Add more detail",
      rationale: `This “${sectionName}” part has about ${wc} words — add one more sentence about what ${characterName} does, sees, or feels.`,
      color: "emerald",
    }
  }

  const snippet =
    findSentenceWith(draftText, /\b\w{4,}\b/) && draftText.length > 20
      ? findSentenceWith(draftText, /\b(she|he|they)\s+\w+/i) || draftText.split(/(?<=[.!?])\s+/)[0]
      : null

  const label = labelFromPhrase(trimmed.split(/[.!?]/)[0] || trimmed)
  let rationale = trimmed
  if (snippet && !trimmed.includes("“") && !trimmed.includes('"')) {
    rationale = `${trimmed} For example, in “${snippet}”, try one small rewrite so that moment feels clearer.`
  } else if (rationale.length < 50) {
    rationale = `${trimmed} This will make your “${sectionName}” moment easier for readers to picture.`
  }

  return {
    label,
    rationale: clipRationale(rationale),
    color: "amber",
  }
}

/** Build tags from the student's actual draft + feedback lines (not a fixed menu). */
export function buildDraftSpecificRevisionTags(
  draftText: string,
  tips: string[],
  reasons: string[],
  context: {
    sectionName: string
    characterName?: string
    level: number
    maxTags?: number
  },
): StoryRevisionTag[] {
  const max = context.maxTags ?? revisionTagBoundsForLevel(context.level).max
  const sectionName = context.sectionName || "this part"
  const characterName = context.characterName || "your hero"
  const draft = draftText.trim()
  const ctx = { sectionName, characterName, draftText: draft }

  const out: StoryRevisionTag[] = []
  const seenLabels = new Set<string>()

  const push = (tag: StoryRevisionTag | null | undefined) => {
    if (!tag || out.length >= max) return
    const key = tag.label.toLowerCase()
    if (seenLabels.has(key) || isGenericRevisionTag(tag)) return
    seenLabels.add(key)
    out.push({
      label: clipLabel(tag.label),
      rationale: clipRationale(tag.rationale),
      color: tag.color || TAG_COLORS[out.length % TAG_COLORS.length],
    })
  }

  for (const issue of detectDraftGrammarIssues(draft, characterName)) {
    push(issue)
  }

  const lines = [...tips, ...reasons].filter(Boolean)
  for (const line of lines) {
    push(tipToDraftTag(line, ctx))
    if (out.length >= max) break
  }

  if (out.length === 0 && draft.length > 0) {
    const first = draft.split(/(?<=[.!?])\s+/).find((s) => s.trim().length > 10)
    if (first) {
      push({
        label: "Sharpen one sentence",
        rationale: `Pick your line “${first.length > 100 ? `${first.slice(0, 97)}…` : first}” — add one vivid verb or feeling word so readers see the moment.`,
        color: "amber",
      })
    }
  }

  return out
}

export function mergeRevisionTags(
  primary: StoryRevisionTag[],
  secondary: StoryRevisionTag[],
  max: number,
): StoryRevisionTag[] {
  const out: StoryRevisionTag[] = []
  const seen = new Set<string>()

  for (const tag of [...primary, ...secondary]) {
    if (!tag?.label?.trim()) continue
    const normalized: StoryRevisionTag = {
      label: clipLabel(tag.label),
      rationale: clipRationale(tag.rationale || tag.label),
      color: tag.color || TAG_COLORS[out.length % TAG_COLORS.length],
    }
    if (isGenericRevisionTag(normalized)) continue
    const key = normalized.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
    if (out.length >= max) break
  }
  return out
}

export function buildFallbackRevisionTags(
  sectionName: string,
  level: number,
  maxTags = 2,
  draftText = "",
  characterName?: string,
): StoryRevisionTag[] {
  return buildDraftSpecificRevisionTags(
    draftText,
    [`Add one vivid moment for ${sectionName}`],
    [],
    { sectionName, characterName, level, maxTags },
  )
}

export function parseRevisionTags(raw: unknown): StoryRevisionTag[] {
  if (!Array.isArray(raw)) return []
  const tags: StoryRevisionTag[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== "object") continue
    const label = String((item as { label?: string }).label || "").trim()
    let rationale = String((item as { rationale?: string }).rationale || "").trim()
    if (!label) continue
    const tag: StoryRevisionTag = {
      label: clipLabel(label),
      rationale: clipRationale(rationale || label),
      color: normalizeRevisionTagColor((item as { color?: string }).color, i),
    }
    if (isGenericRevisionTag(tag)) continue
    tags.push(tag)
  }
  return tags
}

/** Prefer draft-aware tags; keeps full tip text in rationale when possible. */
export function tipsToRevisionTags(
  tips: string[],
  level: number,
  context?: {
    sectionName?: string
    characterName?: string
    maxTags?: number
    draftText?: string
  },
): StoryRevisionTag[] {
  const sectionName = context?.sectionName || "this part"
  const maxTags = context?.maxTags ?? revisionTagBoundsForLevel(level).max
  if (context?.draftText?.trim()) {
    return buildDraftSpecificRevisionTags(context.draftText, tips, [], {
      sectionName,
      characterName: context.characterName,
      level,
      maxTags,
    })
  }

  return tips.slice(0, maxTags).map((tip, i) => {
    const trimmed = tip.trim()
    return {
      label: labelFromPhrase(trimmed),
      rationale: clipRationale(
        trimmed.length > 40
          ? trimmed
          : `${trimmed} — a small fix here will make "${sectionName}" clearer for readers.`,
      ),
      color: TAG_COLORS[i % TAG_COLORS.length],
    }
  })
}

export function buildRevisionTagsPromptRules(
  level: number,
  sectionName: string,
  tagBounds?: { min: number; max: number },
): string {
  const { min, max } = tagBounds ?? revisionTagBoundsForLevel(level)
  return (
    `\n[SECTION REVISION TAGS — level ${level}]\n` +
    `When the student submits a draft for "${sectionName}" (Finish!):\n` +
    `- revision_tags: ${min}-${max} items. Each must be DIFFERENT (not the same label every time).\n` +
    `- label: 3–6 words, unique (e.g. "Past tense verb", "Name MoMo", "Clearer ending") — NOT "Revise this part" / "Add the problem" / "Same story".\n` +
    `- rationale: 2–3 sentences (40–280 chars). MUST quote their exact words in “…” from the draft, then say what to change and why.\n` +
    `- Example rationale: You wrote “She check the stone” — try “She checked” so the action feels finished.\n` +
    `- If the section PASSES: revision_tags = [].\n`
  )
}
