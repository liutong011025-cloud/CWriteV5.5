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

/** Minimum words per structural section (Setup, Confrontation, etc.). */
export const MIN_SECTION_WORD_COUNT = 15

/** Default bounds when issue count is unknown (legacy callers). */
export function revisionTagBoundsForLevel(level: number): { min: number; max: number } {
  return revisionTagBoundsForSituation(level, 2)
}

/** Tag count scales with how many separate problems the draft has. */
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

export function parseRevisionTags(raw: unknown): StoryRevisionTag[] {
  if (!Array.isArray(raw)) return []
  const tags: StoryRevisionTag[] = []
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== "object") continue
    const label = String((item as { label?: string }).label || "").trim()
    let rationale = String((item as { rationale?: string }).rationale || "").trim()
    if (!label) continue
    if (!rationale || rationale.toLowerCase() === label.toLowerCase()) {
      rationale = `This change will make your writing clearer and stronger for readers.`
    }
    tags.push({
      label: label.slice(0, 40),
      rationale: rationale.slice(0, 220),
      color: normalizeRevisionTagColor((item as { color?: string }).color, i),
    })
  }
  return tags
}

/** Short label on the chip; rationale explains why (must differ from label). */
export function tipsToRevisionTags(
  tips: string[],
  level: number,
  context?: { sectionName?: string; characterName?: string; maxTags?: number },
): StoryRevisionTag[] {
  const max = context?.maxTags ?? revisionTagBoundsForLevel(level).max
  const section = context?.sectionName || "this part"
  const hero = context?.characterName || "your hero"

  return tips.slice(0, max).map((tip, i) => {
    const trimmed = tip.trim()
    const lower = trimmed.toLowerCase()

    let label = "Revise this part"
    let rationale = trimmed

    if (lower.includes("hero") || lower.includes("name")) {
      label = `Name ${hero}`
      rationale = `${section} should show what ${hero} does or feels — use their name so readers know who the story follows.`
    } else if (lower.includes("duplicate") || lower.includes("copy") || lower.includes("same")) {
      label = "Write something new"
      rationale = `This part needs fresh sentences for "${section}" — do not paste the same paragraph from an earlier section.`
    } else if (lower.includes("storm") || lower.includes("trouble") || lower.includes("danger")) {
      label = "Add the problem"
      rationale = `"${section}" should show trouble starting — what goes wrong, scares someone, or blocks the way?`
    } else if (lower.includes("setup") || lower.includes("section")) {
      label = `Fix ${section}`
      rationale = `Readers should feel this is truly the "${section}" beat — add action and detail that match this step only.`
    } else if (lower.includes("plot") || lower.includes("connect") || lower.includes("same story")) {
      label = "Same story"
      rationale = `Keep this part in the same story as your plot plan — you do not need every detail, but it should still feel connected.`
    } else if (lower.includes("complete") || lower.includes("finish") || lower.includes("cut-off") || lower.includes("cut off")) {
      label = "Finish the sentence"
      rationale = `Your last sentence stops early — finish the thought, then end with . ! or ?`
    } else if (lower.includes("word") || lower.includes("short") || lower.includes("more words") || lower.includes("two complete")) {
      label = "Add more words"
      rationale = `Write at least ${MIN_SECTION_WORD_COUNT} words and two complete sentences so readers can follow what happens.`
    } else {
      const short = trimmed.split(/[.;]/)[0]?.trim() || trimmed
      label = short.length <= 28 ? short.replace(/\.$/, "") : short.slice(0, 28).trim()
      rationale =
        trimmed.length > label.length + 10
          ? trimmed
          : `${label} will help this "${section}" paragraph feel clearer and stronger for readers.`
    }

    return {
      label: label.slice(0, 40),
      rationale: rationale.slice(0, 220),
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
    `When the student submits a draft for "${sectionName}" (e.g. Finish! / submit this part):\n` +
    `- Minimum length: ${MIN_SECTION_WORD_COUNT} words in this section.\n` +
    `- Must feel like the SAME story as the plot plan; do NOT require setting + conflict + goal all in one section.\n` +
    `- Main reply: at most ONE short encouraging sentence (no long revision paragraphs).\n` +
    `- Put ${min}-${max} revision suggestions in META as revision_tags (array) — fewer issues → fewer tags.\n` +
    `  {"label":"3-6 words on the chip (short command)","rationale":"1-2 kid-friendly sentences explaining WHY — must NOT repeat the label text","color":"amber|sky|rose|violet|emerald"}\n` +
    `- One tag = one concrete improvement. label and rationale must be clearly different.\n` +
    `- Level 1-2: gentle, simple tags. Level 4-5: more specific craft (verbs, connectors, plot tie-in).\n` +
    `- If the section PASSES (good enough for this beat): revision_tags must be [] or omit; use the pass sentence rules above instead.\n` +
    `- If NOT passed: do NOT use the pass sentence; revision_tags must have at least ${min} items.\n`
  )
}
