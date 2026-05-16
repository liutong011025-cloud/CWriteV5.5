/**
 * Story flag title on Writing Map — keep in sync wherever map flags are created (see app/page.tsx).
 */
export function getStoryWritingMapTitle(character: unknown): string {
  if (!character || typeof character !== "object") return "My Story"
  const name = (character as { name?: unknown }).name
  const trimmed = typeof name === "string" ? name.trim() : ""
  return trimmed ? `${trimmed}'s Story` : "My Story"
}
