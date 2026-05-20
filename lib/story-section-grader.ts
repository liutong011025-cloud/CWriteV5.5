import {
  buildRevisionTagsPromptRules,
  isGenericRevisionTag,
  MIN_SECTION_WORD_COUNT,
  parseRevisionTags,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"
import {
  draftHasSubstantiveStoryContent,
  isIncompleteDraft,
  type PlotState,
} from "@/lib/story-section-evaluation"

export type StructureType = "freytag" | "threeAct" | "fichtean" | null

export type SectionGradeChecks = {
  complete?: boolean
  word_count_ok?: boolean
  plot_coverage?: "none" | "partial" | "good"
  structure_beat?: "wrong" | "weak" | "good"
  coherence?: "fragmented" | "ok" | "good"
  lexical_ok?: boolean
}

export type AiSectionGrade = {
  pass: boolean | null
  revision_tags: StoryRevisionTag[]
  checks?: SectionGradeChecks
  raw_reason?: string
}

const PASS_NEXT = "You can move to the next section."
const PASS_LAST = "Great job!"

function structureLabel(type: StructureType): string {
  if (type === "freytag") return "Freytag's Pyramid (exposition → rising → climax → falling → resolution)"
  if (type === "threeAct") return "Three Act (Setup → Confrontation → Resolution)"
  if (type === "fichtean") return "Fichtean Curve (crises building to climax → resolution)"
  return "story structure"
}

export function buildSectionGraderSystemPrompt(params: {
  sectionName: string
  level: number
  characterName: string
  characterAge?: number
  plot: PlotState
  structureType: StructureType
  sectionIndex: number
  sectionCount: number
  previousSections?: string[]
}): string {
  const {
    sectionName,
    level,
    characterName,
    characterAge,
    plot,
    structureType,
    sectionIndex,
    sectionCount,
    previousSections = [],
  } = params

  const prevBlock =
    previousSections.length > 0
      ? `Earlier sections (continuity only — reject if this draft repeats them instead of this beat):\n${previousSections.map((t, i) => `[${i + 1}] ${t.slice(0, 400)}`).join("\n")}\n`
      : ""

  const passLine = sectionIndex >= sectionCount - 1 ? PASS_LAST : PASS_NEXT

  return (
    "You are a strict but kind grader for ONE section of a child's English story.\n" +
    `Hero: ${characterName}${characterAge ? `, age ${characterAge}` : ""}. Writing level ${level}.\n` +
    `Schema: ${structureLabel(structureType)}. Section ${sectionIndex + 1} of ${sectionCount}: "${sectionName}".\n` +
    `Plot plan (background only — do NOT require setting + problem + goal in this one section):\n` +
    `- Setting: ${plot.setting || "?"}\n` +
    `- Problem: ${plot.conflict || "?"}\n` +
    `- Goal: ${plot.goal || "?"}\n` +
    prevBlock +
    "\nGrade using ALL dimensions:\n" +
    "1) Same story — PASS if the draft clearly continues the hero's adventure (action, clues, feelings, place). NEVER fail just because setting/problem/goal words from the plan are missing in this paragraph. Real stories spread these across sections.\n" +
    `2) Lexical appropriateness — vocabulary suitable for about age ${characterAge || level + 6}; register fits children's fiction.\n` +
    "3) Coherence — sentences connect; not a near-copy of a previous section.\n" +
    `4) Structure beat — gentle fit for "${sectionName}" only; PASS if reasonable attempt. Do NOT demand a big new disaster every section. Mystery clues, searching, and small discoveries COUNT as good rising action.\n` +
    "5) Completeness — REJECT ONLY if the draft truly ends mid-sentence: trailing comma/semicolon, dangling word (and, the, in a low,), OR the final characters are not . ! ?. If the last sentence ends with . ! ? it is COMPLETE — do NOT fail for grammar (check→checks) or because the idea could continue.\n" +
    `6) Length — at least ${MIN_SECTION_WORD_COUNT} words AND at least 2 complete sentences.\n` +
    "- revision_tags when false: quote something specific from THEIR draft (e.g. a vague sentence, tense, repeating word). FORBIDDEN generic tags: \"Add the problem\", \"Add setting\", \"mention the goal\" unless the draft is totally off-topic.\n" +
    "\nReply format: ONE short sentence (max 15 words) to the student, then META only.\n" +
    "---META---\n" +
    '{"section_pass":false,"revision_tags":[{"label":"Stronger verbs","rationale":"You wrote \'She check\' — try \'She checked\' so readers feel the action clearly.","color":"sky"}],"checks":{"complete":true,"word_count_ok":true,"plot_coverage":"good","structure_beat":"good","coherence":"ok","lexical_ok":true}}\n' +
    "---END---\n" +
    "META rules:\n" +
    '- section_pass: true if complete, long enough, same story (plot_coverage not "none"), coherence not "fragmented", structure_beat not "wrong". structure_beat "weak" can still PASS.\n' +
    "- section_pass: false only for: incomplete sentence, under 15 words, totally wrong/unrelated story, duplicate prior section, or coherence fragmented.\n" +
    "- revision_tags: 0 when true; 1-3 when false with SPECIFIC craft fixes from their text. Never punish missing plan keywords.\n" +
    '- checks (required): complete, word_count_ok, plot_coverage ("none"|"partial"|"good"), structure_beat ("wrong"|"weak"|"good"), coherence ("fragmented"|"ok"|"good"), lexical_ok (boolean).\n' +
    `When section_pass is true, include "${passLine}" in your short reply.\n` +
    buildRevisionTagsPromptRules(level, sectionName)
  )
}

export function parseAiSectionGrade(
  meta: Record<string, unknown> | undefined,
  answer: string,
): AiSectionGrade {
  const revision_tags = parseRevisionTags(meta?.revision_tags)
  let pass: boolean | null = null

  if (typeof meta?.section_pass === "boolean") {
    pass = meta.section_pass
  }

  const checks = meta?.checks as SectionGradeChecks | undefined
  if (pass === null && checks && typeof checks === "object") {
    const complete = checks.complete !== false
    const wordsOk = checks.word_count_ok !== false
    const plotOk = checks.plot_coverage !== "none"
    const beatOk = checks.structure_beat !== "wrong"
    const coherenceOk = checks.coherence !== "fragmented"
    const lexicalOk = checks.lexical_ok !== false
    if (complete && wordsOk && plotOk && beatOk && coherenceOk && lexicalOk) pass = true
    if (!complete || !wordsOk || !plotOk || !beatOk || !coherenceOk) pass = false
  }

  const answerLower = answer.toLowerCase()
  if (pass === null && revision_tags.length > 0) pass = false
  if (
    pass === null &&
    (/\byou can move to the next section\b/i.test(answer) ||
      /\bgreat job\b/i.test(answer) ||
      /\byou can move on to the next part\b/i.test(answer))
  ) {
    pass = true
  }
  if (pass === null && /\bnot passed\b|revise your writing pad/i.test(answerLower)) {
    pass = false
  }

  return {
    pass,
    revision_tags,
    checks,
    raw_reason: typeof meta?.grade_note === "string" ? meta.grade_note : undefined,
  }
}

function isForcedPlotElementTag(tag: StoryRevisionTag): boolean {
  if (isGenericRevisionTag(tag)) return true
  const rationale = tag.rationale.toLowerCase()
  if (/add (the )?problem|trouble starting|what goes wrong|mention (the )?goal|include (the )?setting/.test(rationale)) {
    return true
  }
  return false
}

function isSentenceCompletionTag(tag: StoryRevisionTag): boolean {
  const label = tag.label.toLowerCase()
  const rationale = tag.rationale.toLowerCase()
  if (label.includes("finish") && label.includes("sentence")) return true
  if (rationale.includes("stops before") || rationale.includes("stops early")) return true
  if (rationale.includes("end with . !") || rationale.includes("end with . ! or ?")) return true
  if (rationale.includes("cut-off") || rationale.includes("cut off")) return true
  return false
}

function derivePassFromChecks(checks: SectionGradeChecks): boolean | null {
  const complete = checks.complete !== false
  const wordsOk = checks.word_count_ok !== false
  const plotOk = checks.plot_coverage !== "none"
  const beatOk = checks.structure_beat !== "wrong"
  const coherenceOk = checks.coherence !== "fragmented"
  const lexicalOk = checks.lexical_ok !== false
  if (complete && wordsOk && plotOk && beatOk && coherenceOk && lexicalOk) return true
  if (!complete || !wordsOk || !plotOk || !beatOk || !coherenceOk) return false
  return null
}

/** Server rules override bogus AI tags (incomplete sentence, forced plot checklist). */
export function alignAiGradeWithDraft(
  sectionText: string,
  aiGrade: AiSectionGrade,
  options?: { characterName?: string },
): AiSectionGrade {
  let filteredTags = aiGrade.revision_tags.filter(
    (t) => !isSentenceCompletionTag(t) && !isForcedPlotElementTag(t),
  )

  const checks: SectionGradeChecks = { ...(aiGrade.checks || {}) }
  if (!isIncompleteDraft(sectionText)) {
    checks.complete = true
  }

  const substantive = draftHasSubstantiveStoryContent(sectionText, options?.characterName)
  if (substantive) {
    if (checks.plot_coverage === "none") checks.plot_coverage = "good"
    if (checks.structure_beat === "wrong") checks.structure_beat = "weak"
  }

  let pass = aiGrade.pass
  if (!isIncompleteDraft(sectionText) && pass === false && aiGrade.checks?.complete === false) {
    pass = derivePassFromChecks(checks)
  }
  if (!isIncompleteDraft(sectionText) && pass === false && filteredTags.length === 0) {
    if (aiGrade.revision_tags.some((t) => isSentenceCompletionTag(t) || isForcedPlotElementTag(t))) {
      pass = derivePassFromChecks(checks)
    }
  }
  if (substantive && pass === false && filteredTags.length === 0) {
    pass = derivePassFromChecks(checks)
  }
  if (substantive && pass === false) {
    const derived = derivePassFromChecks(checks)
    if (derived === true) pass = true
  }

  if (isIncompleteDraft(sectionText)) {
    filteredTags = aiGrade.revision_tags.filter((t) => !isForcedPlotElementTag(t))
  }

  return {
    ...aiGrade,
    pass,
    revision_tags: filteredTags,
    checks,
  }
}

/** Final pass: hard mechanics + AI; structure beat is advisory only (not a gate). */
export function combineSectionPassDecision(
  mechanicalPass: boolean,
  _structureOk: boolean,
  aiGrade: AiSectionGrade,
): boolean {
  if (!mechanicalPass) return false
  if (aiGrade.pass === false) return false
  return true
}
