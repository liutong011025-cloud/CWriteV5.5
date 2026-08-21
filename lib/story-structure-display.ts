import { getStructureLabel, type StoryUiLang } from "@/lib/story-i18n"

/** 与 StoryCollab STRUCTURES 的 type 字段对应，供完成页等展示用 */
export const STORY_STRUCTURE_LABELS: Record<string, string> = {
  freytag: "Freytag's Pyramid",
  threeAct: "Three Act Structure",
  fichtean: "Fichtean Curve",
}

export function getStoryStructureLabel(
  type: string | undefined | null,
  language: StoryUiLang = "en",
): string {
  if (!type) return "—"
  const english = STORY_STRUCTURE_LABELS[type] ?? type
  return getStructureLabel(type, language, english)
}
