/**
 * Story collab / plot coach META blocks must never appear in the student chat.
 * Models often split `---META---` across lines (`---\nMETA---`), which the old
 * exact-token parser missed — then JSON.parse failure also skipped stripping.
 */

const META_BLOCK_RE = /-{2,}\s*META\s*-{2,}[\s\S]*?(?:-{2,}\s*END\s*-{2,}|$)/i

const TRAILING_META_JSON_RE =
  /\n*\s*\{[\s\S]*"phase"\s*:\s*"(?:plot|explore|structure|writing)"[\s\S]*\}\s*$/i

export function stripStoryMetaBlock(raw: string): { answer: string; metaText: string | null } {
  const text = (raw || "").replace(/\r\n/g, "\n")
  const match = text.match(META_BLOCK_RE)
  if (match && match.index !== undefined) {
    return {
      answer: text.slice(0, match.index).trim(),
      metaText: match[0],
    }
  }
  return { answer: text.trim(), metaText: null }
}

export function parseStoryMetaPayload(metaText: string | null): Record<string, unknown> | null {
  if (!metaText) return null
  const jsonMatch = metaText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Visible chat text only — META fences and leftover meta JSON removed. */
export function sanitizeStoryAssistantText(text: string): string {
  const { answer } = stripStoryMetaBlock(text)
  return answer.replace(TRAILING_META_JSON_RE, "").trim()
}
