export type PlotState = { setting?: string; conflict?: string; goal?: string }
export type PlotFocus = "setting" | "conflict" | "goal" | "done"

export type PlotMicroStep =
  | "theme"
  | "setting_place"
  | "setting_detail"
  | "conflict_hook"
  | "conflict_detail"
  | "goal_wish"
  | "goal_detail"
  | "ready"

export interface PlotConversationProgress {
  theme?: string
  settingBroad?: string
  conflictBroad?: string
}

/** 约 5–7 轮对话后再允许进入结构选择 */
export const MIN_USER_TURNS_FOR_PLOT_COMPLETE = 6

const GENERIC_SUGGESTIONS = new Set([
  "tell me more",
  "what happens next?",
  "help me",
  "try again",
  "next section!",
  "revise and finish! again",
  "add one more detail",
  "pick three act",
  "pick freytag",
  "pick fichtean",
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

const GENERIC_GOAL_PHRASES = [
  /^the hero wants to\b/i,
  /^wants to fix the problem$/i,
  /^wants to help a friend$/i,
  /^wants to find what was lost$/i,
  /^wants to be brave and try$/i,
]

export function isPlotComplete(plot: PlotState | null | undefined): boolean {
  const s = plot?.setting?.trim()
  const c = plot?.conflict?.trim()
  const g = plot?.goal?.trim()
  return !!(s && c && g && s.length >= 8 && c.length >= 8 && g.length >= 8)
}

export function canCompletePlot(plot: PlotState | null | undefined, userTurnCount: number): boolean {
  return isPlotComplete(plot) && userTurnCount >= MIN_USER_TURNS_FOR_PLOT_COMPLETE
}

export function getPlotFocus(plot: PlotState | null | undefined): PlotFocus {
  if (!plot?.setting?.trim()) return "setting"
  if (!plot?.conflict?.trim()) return "conflict"
  if (!plot?.goal?.trim()) return "goal"
  return "done"
}

export function getPlotMicroStep(
  plot: PlotState,
  userTurnCount: number,
  progress: PlotConversationProgress,
): PlotMicroStep {
  if (userTurnCount <= 0) return "theme"
  if (!plot.setting?.trim()) {
    return progress.settingBroad?.trim() ? "setting_detail" : "setting_place"
  }
  if (!plot.conflict?.trim()) {
    return progress.conflictBroad?.trim() ? "conflict_detail" : "conflict_hook"
  }
  if (!plot.goal?.trim()) return "goal_wish"
  if (!canCompletePlot(plot, userTurnCount)) return "goal_detail"
  return "ready"
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
  if (GENERIC_GOAL_PHRASES.some((re) => re.test(t))) return true
  return false
}

function combinePlace(broad: string | undefined, detail: string): string {
  const b = broad?.trim()
  const d = detail.trim()
  if (b && d) return normalizePlotField(`${b} — ${d}`)
  return normalizePlotField(d || b || "")
}

/** Student picked a trouble beat while we still expected a sub-location. */
function looksLikeConflictEvent(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\b(steal|stole|steals|trips?|talking|turns? into|missing|strange|weird|scary|frog|bird|banana|locked|shadow|sound|help|trap|storm|fight|trouble|problem|silly|funny|giggle)\b/.test(
      t,
    ) || /\bher friend\b/.test(t)
  )
}

function looksLikeGoalIntent(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t || /\b(?:was|were|got|gets?|getting|is|are|be|been)\s+(?:cut|hurt|hit|trapped|lost)\b/.test(t)) {
    return false
  }
  return (
    /\b(?:want|wants|hope|hopes|plan|plans|try|tries|decide|decides)\s+to\b/.test(t) ||
    /\b(?:rescue|save|help|find|fix|solve|protect|escape|return|stop|bring|get|reach|win|sing|comfort|warn|tell|ask|take|move)\w*\b/.test(
      t,
    )
  )
}

function buildSettingDetailSuggestions(broad: string | undefined): string[] {
  const b = (broad || "").toLowerCase()
  if (b.includes("school") || b.includes("yard") || b.includes("class")) {
    return ["Playground", "Cafeteria", "Under the slide", "Soccer field"]
  }
  if (b.includes("village") || b.includes("town")) {
    return ["Town square", "Bakery corner", "River bridge", "Market path"]
  }
  if (b.includes("sea") || b.includes("beach") || b.includes("shore")) {
    return ["Sandy shore", "Rocky pier", "Tide pools", "Boardwalk"]
  }
  if (b.includes("forest") || b.includes("woods")) {
    return ["Mossy path", "Sunny clearing", "Old stump", "Creek side"]
  }
  if (b.includes("mountain") || b.includes("path") || b.includes("hill")) {
    return ["Trail overlook", "Cabin porch", "Alpine meadow", "Cave mouth"]
  }
  if (b.includes("house") || b.includes("home") || b.includes("cave") || b.includes("attic")) {
    return ["Warm kitchen", "Quiet basement", "Windy rooftop", "Dusty attic"]
  }
  if (b.includes("magic") || b.includes("cloud") || b.includes("crystal")) {
    return ["Crystal hall", "Floating bridge", "Star balcony", "Glow garden"]
  }
  return ["Main area", "Hidden corner", "Busy path", "Quiet spot"]
}

function buildConflictHookSuggestions(theme: string | undefined, characterName: string): string[] {
  const name = characterName || "the hero"
  if (theme === "funny") {
    return ["Talking slide", "Bird steals snack", "Banana peel trip", "Friend becomes frog"]
  }
  if (theme === "mystery") {
    return ["Strange sound", "Missing object", "Weird shadow", "Locked door"]
  }
  if (theme === "magic") {
    return ["Glowing door", "Spell gone wrong", "Floating object", "Whispering book"]
  }
  return ["Strange sound", "Missing object", "Weird shadow", "Someone needs help"]
}

function buildConflictDetailSuggestions(
  setting: string | undefined,
  conflictBroad: string | undefined,
): string[] {
  const place = (setting || "").toLowerCase()
  const trouble = (conflictBroad || "").toLowerCase()
  if (place.includes("school") || place.includes("yard") || place.includes("class")) {
    if (trouble.includes("bird") || trouble.includes("snack") || trouble.includes("lunch")) {
      return ["Near lunch tables", "By the bench", "On the grass", "At the fence"]
    }
    return ["On the playground", "By the classroom", "Near the gate", "Under a tree"]
  }
  if (trouble.includes("bird") || trouble.includes("snack")) {
    return ["Near the table", "By the window", "On the path", "At the gate"]
  }
  return ["Right there", "Around the corner", "At the doorway", "In the open"]
}

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

export function applyProgressivePlotTurn(
  plot: PlotState,
  progress: PlotConversationProgress,
  microStep: PlotMicroStep,
  userMessage: string,
  metaUpdate: PlotState | null | undefined,
  characterName: string,
): { plot: PlotState; progress: PlotConversationProgress } {
  const text = userMessage.trim()
  let nextPlot = { ...plot }
  let nextProgress = { ...progress }

  if (!isGenericUserReply(text) && text.length >= 3) {
    if (microStep === "theme") {
      nextProgress.theme = normalizePlotField(text)
    } else if (microStep === "setting_place") {
      nextProgress.settingBroad = normalizePlotField(text)
    } else if (microStep === "setting_detail") {
      if (looksLikeConflictEvent(text) && nextProgress.settingBroad?.trim()) {
        nextPlot.setting = normalizePlotField(nextProgress.settingBroad)
        nextProgress.conflictBroad = normalizePlotField(text)
        nextProgress.settingBroad = undefined
      } else {
        nextPlot.setting = combinePlace(nextProgress.settingBroad, text)
        nextProgress.settingBroad = undefined
      }
    } else if (microStep === "conflict_hook") {
      nextProgress.conflictBroad = normalizePlotField(text)
    } else if (microStep === "conflict_detail") {
      nextPlot.conflict = combinePlace(nextProgress.conflictBroad, text)
      nextProgress.conflictBroad = undefined
    } else if (microStep === "goal_wish" && looksLikeGoalIntent(text)) {
      const goalText = text.replace(/^the hero wants to\s+/i, `${characterName} wants to `)
      nextPlot.goal = normalizePlotField(goalText)
    } else if (microStep === "goal_detail" && nextPlot.goal?.trim()) {
      const existing = nextPlot.goal.trim()
      if (!existing.toLowerCase().includes(text.toLowerCase())) {
        nextPlot.goal = normalizePlotField(`${existing} — ${text}`)
      }
    }
  }

  const focus = getPlotFocus(nextPlot)
  if (focus !== "done") {
    if (focus === "setting" && !nextPlot.setting && microStep === "setting_detail") {
      nextPlot.setting = combinePlace(nextProgress.settingBroad, text)
    }
    if (focus === "conflict" && !nextPlot.conflict && microStep === "conflict_detail") {
      nextPlot.conflict = combinePlace(nextProgress.conflictBroad, text)
    }
  }

  return { plot: nextPlot, progress: nextProgress }
}

export function stripOptionsFromAnswer(answer: string, suggestions: string[]): string {
  let text = answer.replace(/\r/g, "").trim()
  for (const option of suggestions) {
    const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    text = text.replace(new RegExp(`^\\s*[-•*–—]?\\s*${escaped}\\s*$`, "gim"), "")
    text = text.replace(new RegExp(`\\s*[-–—]\\s*${escaped}\\s*`, "gi"), " ")
  }
  text = text.replace(/\n\s*[-•*–—]\s+[^\n]+/g, "\n")
  text = text.replace(/\n{3,}/g, "\n\n").trim()
  return text
}

function microStepPrompt(
  microStep: PlotMicroStep,
  characterName: string,
  plot: PlotState,
  progress: PlotConversationProgress = {},
): string {
  const name = characterName || "your character"
  const place = plot.setting?.trim() || progress.settingBroad?.trim() || "that place"
  const trouble = progress.conflictBroad?.trim() || "the trouble"
  switch (microStep) {
    case "theme":
      return `Ask what kind of story feels fun for ${name} (one short question).`
    case "setting_place":
      return `Ask where this story could happen (general place only — not every option listed in the message).`
    case "setting_detail":
      return `Ask one small follow-up about WHERE inside "${place}" (a corner, room, or spot — must fit that place, not a random house room).`
    case "conflict_hook":
      return `Ask what funny or surprising trouble happens to ${name} at "${place}" (one silly or worrying hook, not the full story yet).`
    case "conflict_detail":
      return `Ask where at "${place}" the trouble "${trouble}" happens (one specific spot only).`
    case "goal_wish":
      return `Ask what ${name} hopes to do about the trouble (one clear wish).`
    case "goal_detail":
      return `Ask one follow-up: how ${name} plans to try, or who they want to help.`
    case "ready":
      return `Celebrate briefly in one sentence; invite structure pick. No new questions.`
    default:
      return "Ask one friendly follow-up."
  }
}

export function buildPlotPhasePromptRules(
  plot: PlotState,
  characterName: string,
  lastStudentMessage: string,
  userTurnCount: number,
  microStep: PlotMicroStep,
  progress: PlotConversationProgress = {},
): string {
  if (microStep === "ready") {
    return (
      `\n[PLOT — ready for structure]\n` +
      `One warm sentence wrapping up ${characterName}'s place, trouble, and wish.\n` +
      `suggestions: ["Pick Three Act", "Pick Freytag", "Pick Fichtean"]\n`
    )
  }

  const saved = [
    plot.setting?.trim() ? `Place: ${plot.setting}` : null,
    plot.conflict?.trim() ? `Trouble: ${plot.conflict}` : null,
    plot.goal?.trim() ? `Wish: ${plot.goal}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const pending = [
    progress.theme?.trim() ? `Story mood: ${progress.theme}` : null,
    progress.settingBroad?.trim() ? `General place picked: ${progress.settingBroad}` : null,
    progress.conflictBroad?.trim() ? `Trouble hint picked: ${progress.conflictBroad}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  return (
    `\n[PLOT — gradual chat, turn ${userTurnCount}]\n` +
    (saved ? `Already saved:\n${saved}\n` : "") +
    (pending ? `In progress:\n${pending}\n` : "") +
    `Student just said: "${lastStudentMessage.trim() || "…"}"\n` +
    `Step now: ${microStep}. ${microStepPrompt(microStep, characterName, plot, progress)}\n` +
    `Rules:\n` +
    `- Reply in 2-3 short sentences MAX. Echo one phrase they used.\n` +
    `- Ask ONLY the question for step "${microStep}" — do NOT ask about kitchens/attics unless step is setting_detail AND the place is a house/home.\n` +
    `- NEVER list or repeat the suggestion button labels in your message (buttons are separate).\n` +
    `- Do NOT use bullet lists or lines starting with "-" in the reply.\n` +
    `- Ask only ONE question this turn.\n` +
    `- Always return plot_update as null; the server already saved the student's answer.\n` +
    `- Leave suggestions in META empty []; the server will attach matching buttons.\n`
  )
}

export function buildPlotSuggestions(
  microStep: PlotMicroStep,
  characterName: string,
  plot: PlotState,
  themeHint?: string,
  progress: PlotConversationProgress = {},
): string[] {
  const name = characterName || "the hero"
  const theme = (progress.theme || themeHint || "").trim().toLowerCase()

  if (microStep === "theme") {
    return ["Adventure", "Magic", "Mystery", "Funny"]
  }
  if (microStep === "setting_place") {
    if (theme === "mystery") return ["Spooky forest", "Old house", "Hidden cave", "Quiet attic"]
    if (theme === "magic") return ["Magic forest", "Floating school", "Crystal cave", "Cloud city"]
    return ["Sunny village", "School yard", "By the sea", "Mountain path"]
  }
  if (microStep === "setting_detail") {
    return buildSettingDetailSuggestions(progress.settingBroad || plot.setting)
  }
  if (microStep === "conflict_hook") {
    return buildConflictHookSuggestions(theme, name)
  }
  if (microStep === "conflict_detail") {
    return buildConflictDetailSuggestions(plot.setting, progress.conflictBroad)
  }
  if (microStep === "goal_wish" || microStep === "goal_detail") {
    const trouble = `${plot.conflict || ""} ${progress.conflictBroad || ""}`.toLowerCase()
    if (/\b(help|hurt|injur|scared|cry|danger)\w*\b/.test(trouble)) {
      return [
        "Sing a brave song together",
        "Find a trusted teacher",
        "Help them feel safe",
        "Get help quickly",
      ]
    }
    if (/\b(missing|lost|stole|steal|clue)\w*\b/.test(trouble)) {
      return ["Find the missing item", "Follow the clues", "Ask a friend for help", "Search every corner"]
    }
    return [
      `${name} wants to rescue`,
      `${name} wants to find clues`,
      `${name} wants to stay brave`,
      `${name} wants to fix it`,
    ]
  }
  return ["Pick Three Act", "Pick Freytag", "Pick Fichtean"]
}

export function filterPlotSuggestions(
  _suggestions: string[] | undefined,
  microStep: PlotMicroStep,
  characterName: string,
  plot: PlotState,
  themeHint?: string,
  progress: PlotConversationProgress = {},
): string[] {
  return buildPlotSuggestions(microStep, characterName, plot, themeHint, progress)
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
    return (
      `\n[EXPLORE — follow their theme]\n` +
      `They said: "${last}". React in one sentence, then ask ONE question about where ${characterName}'s story could begin.\n` +
      `Do NOT list button labels in the reply. suggestions in META only (3-4 places, 2-6 words).\n`
    )
  }
  return (
    `\n[EXPLORE — story theme]\n` +
    `Ask what kind of story they want with ${characterName} (one question).\n` +
    `suggestions in META only: ["Adventure", "Magic", "Mystery", "Funny"].\n`
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
  progressIn: PlotConversationProgress | undefined,
  metaUpdate: PlotState | null | undefined,
  queryText: string,
  studentMessagesBeforeTurn: string[],
  characterName: string,
  metaSuggestions?: string[],
): {
  plot: PlotState
  plot_progress: PlotConversationProgress
  plot_update: PlotState | null
  plot_complete: boolean
  focus: PlotFocus
  suggestions: string[]
  phase: "explore" | "plot" | "structure"
  microStep: PlotMicroStep
} {
  const studentMessages = [...studentMessagesBeforeTurn, queryText]
  const userCount = studentMessages.length
  let progress = { ...(progressIn || {}) }
  const priorTheme = detectThemeFromMessages(studentMessagesBeforeTurn)
  if (priorTheme && !progress.theme) progress.theme = priorTheme

  const microStepBefore = getPlotMicroStep(basePlot || {}, studentMessagesBeforeTurn.length, progress)
  const { plot, progress: nextProgress } = applyProgressivePlotTurn(
    mergePlotState(basePlot, {}),
    progress,
    microStepBefore,
    queryText,
    metaUpdate,
    characterName,
  )
  progress = nextProgress
  const theme = detectThemeFromMessages(studentMessages)
  if (theme && !progress.theme) progress.theme = theme

  const microStep = getPlotMicroStep(plot, userCount, progress)
  const plot_complete = canCompletePlot(plot, userCount)
  const focus = getPlotFocus(plot)

  let phase: "explore" | "plot" | "structure" = "plot"
  if (plot_complete) phase = "structure"
  else if (userCount <= 1 && !plot.setting?.trim()) phase = "explore"

  const suggestions = plot_complete
    ? buildPlotSuggestions("ready", characterName, plot, theme, progress)
    : filterPlotSuggestions(metaSuggestions, microStep, characterName, plot, theme, progress)

  return {
    plot,
    plot_progress: progress,
    plot_update: diffPlotUpdate(basePlot, plot),
    plot_complete,
    focus,
    suggestions,
    phase,
    microStep,
  }
}

/**
 * Preview the plot state after applying the student's latest reply, and return the
 * NEXT micro-step the coach should ask about (kept in sync with finalize + buttons).
 */
export function resolvePlotAskStep(
  plot: PlotState,
  progress: PlotConversationProgress,
  lastStudentMessage: string,
  userTurns: number,
  characterName: string,
): { askStep: PlotMicroStep; plot: PlotState; progress: PlotConversationProgress } {
  const priorCount = Math.max(0, userTurns - (lastStudentMessage.trim() ? 1 : 0))
  const finalized = finalizePlotFromConversation(
    plot,
    progress,
    null,
    lastStudentMessage,
    Array.from({ length: priorCount }, () => ""),
    characterName,
  )
  return {
    askStep: finalized.microStep,
    plot: finalized.plot,
    progress: finalized.plot_progress,
  }
}

/** Student-facing reply when the LLM is unavailable — one short echo + one question. */
export function buildFallbackPlotAnswer(
  microStep: PlotMicroStep,
  characterName: string,
  queryText: string,
  plot: PlotState,
  progress: PlotConversationProgress = {},
): string {
  const name = characterName?.trim() || "the hero"
  const said = queryText.trim()
  const place = plot.setting?.trim() || progress.settingBroad?.trim() || "that place"
  const trouble = plot.conflict?.trim() || progress.conflictBroad?.trim() || "the trouble"
  const echo = said.length >= 2 && said.length <= 48 ? said : ""

  switch (microStep) {
    case "theme":
      return `Hi! What kind of story feels fun for ${name} — adventure, magic, mystery, or something funny?`
    case "setting_place":
      return echo
        ? `${echo} — nice! Where could ${name}'s story happen?`
        : `Where could ${name}'s story happen?`
    case "setting_detail":
      return echo
        ? `Cool — ${echo}! Where exactly inside ${place}? A corner, room, or special spot?`
        : `Where exactly inside ${place}? A corner, room, or special spot?`
    case "conflict_hook":
      return `${place} sounds great! What funny or surprising trouble happens to ${name} there?`
    case "conflict_detail":
      return echo
        ? `Oh no — ${echo}! Where at ${place} does that happen?`
        : `Where at ${place} does "${trouble}" happen?`
    case "goal_wish":
      return `That's a problem! What does ${name} hope to do about it?`
    case "goal_detail":
      return echo
        ? `I like "${echo}"! How will ${name} try, or who do they want to help?`
        : `How will ${name} try, or who do they want to help?`
    case "ready":
      return (
        `Awesome — we have a place, a problem, and a wish for ${name}! ` +
        `Pick a story structure below when you're ready.`
      )
    default:
      return `Tell me a bit more about ${name}'s story!`
  }
}
