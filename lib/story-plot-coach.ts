export type PlotState = { setting?: string; conflict?: string; goal?: string }
export type PlotFocus = "setting" | "conflict" | "goal" | "done"

const GENERIC_SUGGESTIONS = new Set([
  "tell me more",
  "what happens next?",
  "help me",
  "try again",
  "next section!",
  "revise and finish! again",
  "add one more detail",
])

const THEME_ONLY = new Set([
  "adventure",
  "magic",
  "mystery",
  "funny",
  "action",
  "scary",
  "friendship",
  "animals",
  "space",
  "school",
])

const SETTING_WORDS = new Set([
  "school",
  "park",
  "forest",
  "beach",
  "city",
  "village",
  "castle",
  "home",
  "library",
  "mountain",
  "farm",
  "island",
  "cave",
  "ocean",
  "space",
  "spaceship",
  "night",
  "morning",
])

const CONFLICT_CUES =
  /\b(lost|stole|stolen|trapped|stuck|danger|problem|broken|missing|scared|afraid|fight|argue|bully|storm|fire|monster|dragon|thief|noise|dark|sick|can't|cannot|won't|fail)\b/i

const GOAL_CUES =
  /\b(want|wants|need|needs|hope|hopes|try|tries|find|save|help|protect|escape|win|discover|fix|learn|befriend|return|get back|solve)\b/i

const SETTING_CUES = /\b(in|at|on|inside|near|during|one day|morning|night|forest|school|home|park|beach|city|village|castle)\b/i

export function isPlotComplete(plot: PlotState | null | undefined): boolean {
  const s = plot?.setting?.trim()
  const c = plot?.conflict?.trim()
  const g = plot?.goal?.trim()
  return !!(s && c && g && s.length >= 3 && c.length >= 3 && g.length >= 3)
}

export function getPlotFocus(plot: PlotState | null | undefined): PlotFocus {
  if (!plot?.setting?.trim()) return "setting"
  if (!plot?.conflict?.trim()) return "conflict"
  if (!plot?.goal?.trim()) return "goal"
  return "done"
}

export function mergePlotState(
  base: PlotState | null | undefined,
  update: PlotState | null | undefined,
): PlotState {
  const next: PlotState = { ...base }
  if (update?.setting?.trim()) next.setting = update.setting.trim()
  if (update?.conflict?.trim()) next.conflict = update.conflict.trim()
  if (update?.goal?.trim()) next.goal = update.goal.trim()
  return next
}

function normalizePlotField(value: string): string {
  const t = value.trim()
  if (!t || /^unknown$/i.test(t)) return ""
  return t.length > 180 ? `${t.slice(0, 177)}…` : t
}

function isGenericUserReply(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return true
  if (GENERIC_SUGGESTIONS.has(t)) return true
  if (THEME_ONLY.has(t)) return true
  if (/^(yes|no|ok|okay|sure|maybe|idk|i don't know)$/i.test(t)) return true
  return false
}

/** Assign the latest student message to the field we are currently asking about. */
export function assignUserMessageToFocus(
  plot: PlotState,
  userMessage: string,
  focus: PlotFocus,
): PlotState {
  const text = userMessage.trim()
  if (isGenericUserReply(text) || text.length < 4) return plot
  if (focus === "setting" && !plot.setting?.trim()) {
    return { ...plot, setting: normalizePlotField(text) }
  }
  if (focus === "conflict" && !plot.conflict?.trim()) {
    return { ...plot, conflict: normalizePlotField(text) }
  }
  if (focus === "goal" && !plot.goal?.trim()) {
    return { ...plot, goal: normalizePlotField(text) }
  }
  return plot
}

/** Lightweight scan of all student messages (from dify-plot-summary vocabulary). */
export function extractPlotFromStudentMessages(studentMessages: string[]): PlotState {
  const normalizedMessages = studentMessages
    .map((m) => m.toLowerCase().replace(/[^a-z\s]/g, " ").trim())
    .map((m) => m.split(/\s+/).filter(Boolean))
    .filter((words) => words.length > 0)

  let setting = ""
  let conflict = ""
  let goal = ""

  for (const words of normalizedMessages) {
    const line = words.join(" ")
    if (!setting && (SETTING_CUES.test(line) || words.some((w) => SETTING_WORDS.has(w)))) {
      const raw = studentMessages.find((m) => m.toLowerCase().includes(words[0])) || line
      if (raw.length >= 4 && !isGenericUserReply(raw)) setting = normalizePlotField(raw)
    }
    if (!conflict && CONFLICT_CUES.test(line)) {
      const raw = studentMessages.find((m) => CONFLICT_CUES.test(m)) || line
      if (raw.length >= 4) conflict = normalizePlotField(raw)
    }
    if (!goal && GOAL_CUES.test(line)) {
      const raw = studentMessages.find((m) => GOAL_CUES.test(m)) || line
      if (raw.length >= 4) goal = normalizePlotField(raw)
    }
  }

  if (!setting && studentMessages[0] && studentMessages[0].trim().split(/\s+/).length >= 3) {
    setting = normalizePlotField(studentMessages[0])
  }
  if (!conflict && studentMessages.length >= 2) {
    const candidate = studentMessages.find((m) => CONFLICT_CUES.test(m) && m.trim().split(/\s+/).length >= 3)
    if (candidate) conflict = normalizePlotField(candidate)
  }
  if (!goal && studentMessages.length >= 2) {
    const candidate = [...studentMessages].reverse().find((m) => GOAL_CUES.test(m) && m.trim().split(/\s+/).length >= 3)
    if (candidate) goal = normalizePlotField(candidate)
  }

  return {
    setting: setting || undefined,
    conflict: conflict || undefined,
    goal: goal || undefined,
  }
}

export function buildPlotStatusLine(plot: PlotState): string {
  const mark = (v?: string) => (v?.trim() ? "✓" : "—")
  return `Setting ${mark(plot.setting)} | Problem ${mark(plot.conflict)} | Goal ${mark(plot.goal)}`
}

export function buildPlotPhasePromptRules(
  plot: PlotState,
  characterName: string,
  userTurnCount: number,
): string {
  const focus = getPlotFocus(plot)
  if (focus === "done") {
    return (
      `\n[PLOT COMPLETE]\nAll three elements are set. Congratulate briefly and tell the student to choose a story structure (cards will appear).\n` +
      `Do NOT ask more plot questions. suggestions: ["Pick Three Act", "Pick Freytag", "Pick Fichtean"]\n`
    )
  }

  const focusLabels: Record<Exclude<PlotFocus, "done">, string> = {
    setting: "Setting (where and when does the story happen?)",
    conflict: "Conflict (what problem or trouble happens?)",
    goal: `Goal (what does ${characterName} want to do about the problem?)`,
  }

  return (
    `\n[PLOT THREE ELEMENTS — REQUIRED]\n` +
    `Status: ${buildPlotStatusLine(plot)}\n` +
    `Ask ONE clear question about ONLY: ${focusLabels[focus]}.\n` +
    `Do NOT ask about elements already marked ✓.\n` +
    `Do NOT use generic suggestion buttons like "Tell me more", "What happens next?", or "Help me".\n` +
    `suggestions MUST be 3-4 short answers (2-6 words each) that directly answer YOUR question.\n` +
    `When the student's message gives a usable answer, you MUST set plot_update in META, e.g. {"plot_update":{"${focus}":"their words summarized in one short English phrase"}}.\n` +
    `Keep plot_update values short (under 20 words) but specific.\n` +
    `Student turn count: ${userTurnCount}. If they already answered in earlier messages, infer from context and fill plot_update — do not make them repeat.\n` +
    `After confirming one element, immediately ask for the next missing one in the same reply if another is still missing.\n`
  )
}

export function buildPlotSuggestions(
  focus: PlotFocus,
  characterName: string,
  plot: PlotState,
  themeHint?: string,
): string[] {
  const name = characterName || "the hero"
  const theme = themeHint?.trim().toLowerCase()

  if (focus === "setting") {
    const base = [
      "At school after class",
      "In a sunny forest",
      "On a rainy city street",
      "Inside a cozy treehouse",
    ]
    if (theme === "magic") return ["In a magic forest", "At a wizard school", "On a floating island", "Inside a crystal cave"]
    if (theme === "mystery") return ["In an old library", "On a foggy pier", "At a quiet museum", "In a hidden attic"]
    if (theme === "funny") return ["At a silly pet shop", "On a bouncy farm", "In a messy kitchen", "At a goofy carnival"]
    return base
  }

  if (focus === "conflict") {
    const where = plot.setting ? ` near ${plot.setting.slice(0, 30)}` : ""
    return [
      `${name} loses something important`,
      `A loud storm scares everyone${where}`,
      `A tricky riddle blocks the way`,
      `Friends disagree about a plan`,
    ]
  }

  if (focus === "goal") {
    return [
      `${name} wants to fix the problem`,
      `${name} wants to help a friend`,
      `${name} wants to find what was lost`,
      `${name} wants to be brave and try`,
    ]
  }

  return ["Pick Three Act", "Pick Freytag", "Pick Fichtean"]
}

export function filterPlotSuggestions(suggestions: string[] | undefined, focus: PlotFocus): string[] {
  const filtered = (suggestions || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 48)
    .filter((s) => !GENERIC_SUGGESTIONS.has(s.toLowerCase()))

  if (filtered.length >= 2) return filtered.slice(0, 4)

  return buildPlotSuggestions(focus, "the hero", {})
}

export function detectThemeFromMessages(studentMessages: string[]): string | undefined {
  for (const msg of studentMessages) {
    const w = msg.trim().toLowerCase()
    if (THEME_ONLY.has(w)) return w
  }
  return undefined
}

export function buildExplorePromptRules(characterName: string): string {
  return (
    `\n[EXPLORE — story theme]\n` +
    `Ask what kind of story they want with ${characterName}.\n` +
    `suggestions MUST be story themes only: ["Adventure", "Magic", "Mystery", "Funny"] — NOT "Tell me more" or "Help me".\n` +
    `After they pick a theme, ask where the story happens (first plot question).\n`
  )
}

export function diffPlotUpdate(
  before: PlotState | null | undefined,
  after: PlotState,
): PlotState | null {
  const update: PlotState = {}
  if (after.setting?.trim() && after.setting !== before?.setting?.trim()) update.setting = after.setting
  if (after.conflict?.trim() && after.conflict !== before?.conflict?.trim()) update.conflict = after.conflict
  if (after.goal?.trim() && after.goal !== before?.goal?.trim()) update.goal = after.goal
  return Object.keys(update).length > 0 ? update : null
}

export function finalizePlotFromConversation(
  basePlot: PlotState | null | undefined,
  metaUpdate: PlotState | null | undefined,
  queryText: string,
  studentMessages: string[],
  characterName: string,
  metaSuggestions?: string[],
): {
  plot: PlotState
  plot_update: PlotState | null
  plot_complete: boolean
  focus: PlotFocus
  suggestions: string[]
  phase: "explore" | "plot" | "structure"
} {
  const focusBefore = getPlotFocus(basePlot)
  let plot = mergePlotState(basePlot, metaUpdate)
  plot = assignUserMessageToFocus(plot, queryText, focusBefore)
  plot = mergePlotState(plot, extractPlotFromStudentMessages(studentMessages))

  const theme = detectThemeFromMessages(studentMessages)
  const userCount = studentMessages.length
  const plot_complete = isPlotComplete(plot)
  const focus = getPlotFocus(plot)

  let phase: "explore" | "plot" | "structure" = "plot"
  if (plot_complete) phase = "structure"
  else if (userCount <= 1 && !plot.setting?.trim()) phase = "explore"

  const activeFocus = focus === "done" ? "goal" : focus
  let suggestions = plot_complete
    ? buildPlotSuggestions("done", characterName, plot)
    : filterPlotSuggestions(metaSuggestions, activeFocus)

  if (!plot_complete && suggestions.length < 2) {
    const built = buildPlotSuggestions(activeFocus, characterName, plot, theme)
    return {
      plot,
      plot_update: diffPlotUpdate(basePlot, plot),
      plot_complete,
      focus,
      suggestions: built,
      phase,
    }
  }

  return {
    plot,
    plot_update: diffPlotUpdate(basePlot, plot),
    plot_complete,
    focus,
    suggestions,
    phase,
  }
}
