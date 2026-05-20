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

export function revisionTagBoundsForLevel(level: number): { min: number; max: number } {
  const lv = Math.min(5, Math.max(1, Math.floor(level) || 1))
  if (lv <= 2) return { min: 2, max: 2 }
  if (lv === 3) return { min: 2, max: 3 }
  return { min: 3, max: 4 }
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
    const rationale = String((item as { rationale?: string }).rationale || "").trim()
    if (!label) continue
    tags.push({
      label: label.slice(0, 64),
      rationale: rationale || label,
      color: normalizeRevisionTagColor((item as { color?: string }).color, i),
    })
  }
  return tags
}

/** Turn rubric tips into short tag labels when the model omits structured tags. */
export function tipsToRevisionTags(tips: string[], level: number): StoryRevisionTag[] {
  const { max } = revisionTagBoundsForLevel(level)
  return tips.slice(0, max).map((tip, i) => {
    const trimmed = tip.trim()
    const label =
      trimmed.length <= 48
        ? trimmed.replace(/\.$/, "")
        : trimmed.split(/[.;]/)[0]?.trim().slice(0, 48) || trimmed.slice(0, 48)
    return {
      label: label || "Revise this part",
      rationale: trimmed,
      color: TAG_COLORS[i % TAG_COLORS.length],
    }
  })
}

export function buildRevisionTagsPromptRules(level: number, sectionName: string): string {
  const { min, max } = revisionTagBoundsForLevel(level)
  return (
    `\n[SECTION REVISION TAGS — level ${level}]\n` +
    `When the student submits a draft for "${sectionName}" (e.g. Finish! / submit this part):\n` +
    `- Main reply: at most ONE short encouraging sentence (no long revision paragraphs).\n` +
    `- Put ${min}-${max} revision suggestions in META as revision_tags (array). Each item:\n` +
    `  {"label":"3-8 words, imperative e.g. Add some sensory details","rationale":"1-2 kid-friendly sentences why","color":"amber|sky|rose|violet|emerald"}\n` +
    `- One tag = one concrete improvement. Labels must be different colors when possible.\n` +
    `- Level 1-2: gentle, simple tags. Level 4-5: more specific craft (verbs, connectors, plot tie-in).\n` +
    `- If the section PASSES (good enough for this beat): revision_tags must be [] or omit; use the pass sentence rules above instead.\n` +
    `- If NOT passed: do NOT use the pass sentence; revision_tags must have at least ${min} items.\n`
  )
}
