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
  context?: { sectionName?: string; characterName?: string },
): StoryRevisionTag[] {
  const { max } = revisionTagBoundsForLevel(level)
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
    } else if (lower.includes("plot") || lower.includes("connect")) {
      label = "Link to your plot"
      rationale = `Mention the place, problem, or goal from your plan so this part fits the story you chose.`
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

export function buildRevisionTagsPromptRules(level: number, sectionName: string): string {
  const { min, max } = revisionTagBoundsForLevel(level)
  return (
    `\n[SECTION REVISION TAGS — level ${level}]\n` +
    `When the student submits a draft for "${sectionName}" (e.g. Finish! / submit this part):\n` +
    `- Main reply: at most ONE short encouraging sentence (no long revision paragraphs).\n` +
    `- Put ${min}-${max} revision suggestions in META as revision_tags (array). Each item:\n` +
    `  {"label":"3-6 words on the chip (short command)","rationale":"1-2 kid-friendly sentences explaining WHY — must NOT repeat the label text","color":"amber|sky|rose|violet|emerald"}\n` +
    `- One tag = one concrete improvement. label and rationale must be clearly different.\n` +
    `- Level 1-2: gentle, simple tags. Level 4-5: more specific craft (verbs, connectors, plot tie-in).\n` +
    `- If the section PASSES (good enough for this beat): revision_tags must be [] or omit; use the pass sentence rules above instead.\n` +
    `- If NOT passed: do NOT use the pass sentence; revision_tags must have at least ${min} items.\n`
  )
}
