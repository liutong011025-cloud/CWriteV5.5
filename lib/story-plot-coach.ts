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

/** Only accept META plot_update for the one field being discussed this turn. */
export function applyMetaUpdateForFocus(
  plot: PlotState,
  metaUpdate: PlotState | null | undefined,
  focus: PlotFocus,
): PlotState {
  if (!metaUpdate || focus === "done") return plot
  const next = { ...plot }
  if (focus === "setting" && metaUpdate.setting?.trim()) {
    next.setting = normalizePlotField(metaUpdate.setting)
  }
  if (focus === "conflict" && metaUpdate.conflict?.trim()) {
    next.conflict = normalizePlotField(metaUpdate.conflict)
  }
  if (focus === "goal" && metaUpdate.goal?.trim()) {
    next.goal = normalizePlotField(metaUpdate.goal)
  }
  return next
}

function buildPlotMemoryForAi(plot: PlotState): string {
  const lines: string[] = []
  if (plot.setting?.trim()) lines.push(`Where/when (saved): ${plot.setting}`)
  if (plot.conflict?.trim()) lines.push(`Problem (saved): ${plot.conflict}`)
  if (plot.goal?.trim()) lines.push(`Goal (saved): ${plot.goal}`)
  return lines.length > 0 ? lines.join("\n") : "Nothing saved yet — build from the conversation step by step."
}

export function buildPlotPhasePromptRules(
  plot: PlotState,
  characterName: string,
  lastStudentMessage: string,
): string {
  const focus = getPlotFocus(plot)
  if (focus === "done") {
    return (
      `\n[PLOT — ready for structure]\n` +
      `Warmly wrap up the story idea in one sentence using their setting, problem, and goal.\n` +
      `Invite them to pick a story structure (cards will appear). Do NOT ask new plot questions.\n` +
      `suggestions: ["Pick Three Act", "Pick Freytag", "Pick Fichtean"]\n`
    )
  }

  const focusGuide: Record<Exclude<PlotFocus, "done">, string> = {
    setting:
      "where and when the story takes place (be specific — not just a theme word like Adventure or Magic)",
    conflict: "what problem or trouble appears in that place",
    goal: `what ${characterName} wants to do about that problem`,
  }

  const saved = buildPlotMemoryForAi(plot)
  const last = lastStudentMessage.trim() || "(waiting for student)"

  return (
    `\n[PLOT — one step at a time, conversational]\n` +
    `What you already saved:\n${saved}\n` +
    `Student's latest message: "${last}"\n` +
    `Your job THIS turn:\n` +
    `1) Echo one concrete detail from their latest message (quote a phrase) so they feel heard.\n` +
    `2) If their latest message answers the piece you were asking about, save ONLY that piece in plot_update (one field max): {"plot_update":{"${focus}":"short summary"}}\n` +
    `3) Ask ONE warm follow-up question about: ${focusGuide[focus]} — it MUST connect to what they just said (use their place, problem, or theme words).\n` +
    `4) Do NOT ask about parts already saved above unless you need a tiny clarification.\n` +
    `5) Do NOT dump Setting/Problem/Goal labels on the student. Do NOT rush — extra clarifying turns are fine.\n` +
    `6) Do NOT save theme-only replies (Adventure, Magic, etc.) as the setting.\n` +
    `7) suggestions: 3-4 short answers (2-8 words) that fit YOUR follow-up question and their last message — never "Tell me more", "What happens next?", or "Help me".\n`
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
    const place = plot.setting?.trim()
    if (place) {
      return [
        `Something goes wrong in ${place.slice(0, 24)}`,
        `A stranger causes trouble there`,
        `The weather turns dangerous`,
        `An old secret causes trouble`,
      ]
    }
    return [
      `${name} loses something important`,
      `A loud storm scares everyone`,
      `A tricky riddle blocks the way`,
      `Friends disagree about a plan`,
    ]
  }

  if (focus === "goal") {
    const problem = plot.conflict?.trim()
    if (problem) {
      return [
        `${name} tries to solve it`,
        `${name} asks a friend for help`,
        `${name} looks for a clue`,
        `${name} stays brave and keeps going`,
      ]
    }
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

export function buildExplorePromptRules(characterName: string, lastStudentMessage: string): string {
  const last = lastStudentMessage.trim()
  if (last && !isGenericUserReply(last)) {
    const theme = last.toLowerCase()
    return (
      `\n[EXPLORE — follow their theme]\n` +
      `They said: "${last}". React to that theme with ${characterName} in mind.\n` +
      `Ask where this kind of story could happen — one friendly question, not a checklist.\n` +
      `suggestions: 3-4 places that match "${last}" (2-8 words each). No generic chat buttons.\n`
    )
  }
  return (
    `\n[EXPLORE — story theme]\n` +
    `Ask what kind of story they want with ${characterName}.\n` +
    `suggestions: ["Adventure", "Magic", "Mystery", "Funny"] — NOT "Tell me more" or "Help me".\n`
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
  let plot = mergePlotState(basePlot, {})
  plot = applyMetaUpdateForFocus(plot, metaUpdate, focusBefore)
  plot = assignUserMessageToFocus(plot, queryText, focusBefore)

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
