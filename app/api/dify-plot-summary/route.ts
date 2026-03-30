import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const SETTING_WORDS = new Set([
  "school", "park", "forest", "beach", "city", "village", "castle", "home", "library", "mountain", "spaceship",
])
const CONFLICT_WORDS = new Set([
  "storm", "danger", "dangerous", "thief", "monster", "fire", "trouble", "broken", "lost", "noise", "dark", "sick",
  "trap", "trapped", "stuck", "chase", "chased",
])
const GOAL_WORDS = new Set([
  "save", "help", "find", "protect", "escape", "win", "discover", "investigate", "hide", "fix", "ask", "call", "tell",
])

const normalizeWord = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()

const parseSummaryFields = (summaryText: string) => {
  const getField = (name: string) => {
    const m = summaryText.match(new RegExp(`^\\s*${name}[：:]\\s*(.+)$`, "im"))
    return (m?.[1] || "").trim()
  }
  const setting = getField("setting") || "unknown"
  const conflict = getField("conflict") || "unknown"
  const goal = getField("goal") || "unknown"
  const done = /\bdone\b/i.test(summaryText)
  return { setting, conflict, goal, done }
}

const extractByVocabulary = (studentMessages: string[]) => {
  const normalizedMessages = studentMessages
    .map((m) => normalizeWord(m))
    .map((m) => m.split(/\s+/).filter(Boolean).slice(0, 6).join(" "))
    .filter(Boolean)

  let setting = "unknown"
  let conflict = "unknown"
  let goal = "unknown"

  for (let i = 0; i < normalizedMessages.length; i++) {
    const words = normalizedMessages[i].split(/\s+/).filter(Boolean)
    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi]
      if (setting === "unknown" && SETTING_WORDS.has(w)) setting = w
      if (conflict === "unknown" && CONFLICT_WORDS.has(w)) conflict = w
      if (goal === "unknown" && GOAL_WORDS.has(w)) {
        const goalPhrase = [w, words[wi + 1]].filter(Boolean).join(" ").trim()
        goal = goalPhrase || w
      }
    }
  }

  if (setting === "unknown" && normalizedMessages[0]) setting = normalizedMessages[0]
  if (conflict === "unknown" && normalizedMessages.length >= 4)
    conflict = normalizedMessages[Math.min(3, normalizedMessages.length - 1)]
  if (goal === "unknown" && normalizedMessages.length >= 6) {
    goal = normalizedMessages.slice(-2).join(" ").split(/\s+/).slice(0, 3).join(" ").trim() || "unknown"
  } else if (goal === "unknown" && normalizedMessages.length >= 5) {
    goal = normalizedMessages[normalizedMessages.length - 1] || "unknown"
  }

  const done = setting !== "unknown" && conflict !== "unknown" && goal !== "unknown"
  const summary = `setting: ${setting}\nconflict: ${conflict}\ngoal: ${goal}${done ? "\ndone" : ""}`
  return { summary, setting, conflict, goal, done }
}

export async function POST(request: NextRequest) {
  try {
    const { conversation_history, conversation_id, user_id } = await request.json()

    const studentMessages = conversation_history
      .filter((msg: { role: string; content: string }) => msg.role === "user")
      .map((msg: { role: string; content: string }) => msg.content)

    const conversationText = studentMessages.join("\n\n")

    if (!conversationText || conversationText.trim() === "") {
      return NextResponse.json(
        { error: "No conversation history provided" },
        { status: 400 }
      )
    }

    const localFallback = extractByVocabulary(studentMessages)

    if (!isConfigured()) {
      return NextResponse.json({
        summary: localFallback.summary,
        conversation_id: conversation_id,
        source: "local_fallback_no_api_key",
      })
    }

    const latestStudentMessage = studentMessages[studentMessages.length - 1] || ""
    const studentMessageCount = studentMessages.length

    if (studentMessageCount < 1) {
      return NextResponse.json({
        summary: "",
        conversation_id: conversation_id,
        needsMoreConversation: true,
      })
    }

    const queryMessage = `Extract plot fields from student's words only.
Latest student message:
${latestStudentMessage}
Student message count: ${studentMessageCount}

Output exactly:
setting: [value or unknown]
conflict: [value or unknown]
goal: [value or unknown]
[optional] done

Rules:
- No inference.
- unknown when not explicit.
- done only if all three are not unknown.`

    let summaryText = ""
    try {
      summaryText = await chat({
        messages: [{ role: "user", content: queryMessage }],
      })
    } catch (err) {
      console.error("DeepSeek API error:", err)
      if (err instanceof DeepSeekError && err.isTimeout) {
        return NextResponse.json({
          summary: localFallback.summary,
          conversation_id: conversation_id,
          source: "local_fallback_timeout",
        })
      }
      return NextResponse.json({
        summary: localFallback.summary,
        conversation_id: conversation_id,
        source: "local_fallback_error",
      })
    }

    await logApiCall(
      user_id,
      "plot",
      "/api/dify-plot-summary",
      { conversation_history, conversation_id },
      { summary: summaryText }
    )

    if (!summaryText) {
      return NextResponse.json({
        summary: localFallback.summary,
        conversation_id: conversation_id,
        source: "local_fallback_empty_summary",
      })
    }

    const parsed = parseSummaryFields(summaryText)
    const resolvedSetting =
      parsed.setting.toLowerCase() === "unknown" ? localFallback.setting : parsed.setting
    const resolvedConflict =
      parsed.conflict.toLowerCase() === "unknown" ? localFallback.conflict : parsed.conflict
    const resolvedGoal =
      parsed.goal.toLowerCase() === "unknown" ? localFallback.goal : parsed.goal
    const resolvedDone =
      resolvedSetting.toLowerCase() !== "unknown" &&
      resolvedConflict.toLowerCase() !== "unknown" &&
      resolvedGoal.toLowerCase() !== "unknown"
    const resolvedSummary = `setting: ${resolvedSetting}\nconflict: ${resolvedConflict}\ngoal: ${resolvedGoal}${resolvedDone ? "\ndone" : ""}`

    return NextResponse.json({
      summary: resolvedSummary,
      conversation_id: conversation_id,
    })
  } catch (error) {
    console.error("Error in plot summary:", error)
    return NextResponse.json(
      {
        summary: "setting: unknown\nconflict: unknown\ngoal: unknown",
        source: "local_fallback_exception",
      }
    )
  }
}
