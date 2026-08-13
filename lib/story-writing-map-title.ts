/**
 * Writing Map flag titles — keep in sync wherever map flags are created (see app/page.tsx).
 * Pattern: "{subject}'s Story" / "{subject}'s Drama" / etc.
 */

export type WritingMapTitleKind = "story" | "review" | "letter" | "drama" | "poetry"

const KIND_LABEL: Record<WritingMapTitleKind, string> = {
  story: "Story",
  review: "Review",
  letter: "Letter",
  drama: "Drama",
  poetry: "Poetry",
}

export function getStoryWritingMapTitle(character: unknown): string {
  if (!character || typeof character !== "object") return buildWritingMapTitle("story")
  const name = (character as { name?: unknown }).name
  const trimmed = typeof name === "string" ? name.trim() : ""
  return buildWritingMapTitle("story", trimmed)
}

export function buildWritingMapTitle(kind: WritingMapTitleKind, subject?: string | null): string {
  const trimmed = (subject || "").trim()
  const label = KIND_LABEL[kind]
  if (!trimmed) return `My ${label}`
  return `${trimmed}'s ${label}`
}

/** Append " 2", " 3", ... so a new flag never reuses an existing map title. */
export function uniqueWritingMapTitle(
  base: string,
  existingTitles: Array<string | null | undefined>,
): string {
  const taken = new Set(
    existingTitles
      .map((title) => (title || "").trim().toLowerCase())
      .filter(Boolean),
  )
  const normalized = (base || "").trim() || "My Writing"
  if (!taken.has(normalized.toLowerCase())) return normalized
  let n = 2
  while (taken.has(`${normalized} ${n}`.toLowerCase())) n += 1
  return `${normalized} ${n}`
}
