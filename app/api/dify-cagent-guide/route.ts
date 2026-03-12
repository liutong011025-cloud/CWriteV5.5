import { NextRequest, NextResponse } from "next/server"

const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages"
// 使用環境變量中的真正 API Key
const DIFY_API_KEY = process.env.DIFY_API_KEY || ""
// Cagent 專用 Dify 應用 ID（你提供的）
const DIFY_CAGENT_APP_ID = "app-lOPsCIBr4Fb97gxv1fTDq1GU"

const getStageButtonHint = (stage: string) => {
  const map: Record<string, string> = {
    welcome: 'Tell them to click the "Start" button.',
    character:
      'Tell them to fill the current field, then click "Generate Character". After the character image appears, tell them to click "Continue →" (or "Regenerate Image" if they want a new picture).',
    plot: 'Tell them to choose one word button or type in the input, then click the send button, and click "Continue →" when ready.',
    structure: 'Tell them to pick a structure card and click the next/continue button.',
    planTest: 'Tell them to answer a choice. If they want to leave, tell them to tap the back arrow to return to the map.',
    journeyTicket: 'Tell them to click the back arrow to go to the map, or click the main start/continue button to begin.',
    journeyMap: 'Tell them to click a visible place on the map to start. If there is a back arrow, tell them it returns to the previous page.',
    navigation: 'Tell them to tap a friend name in the list to visit that farm, or tap the back arrow to return to the map.',
    writing: 'Tell them what section to write next and which visible button to press to continue/submit. Do not mention any secret codes.',
    bookReviewWelcome: 'Tell them to click the start button for book review.',
    bookSelection: 'Tell them to click one book card.',
    bookReviewTypeSelection: 'Tell them to click one review type card.',
    letterAdventure: 'Tell them to fill input fields and click the continue/start button.',
    letterGame: 'Tell them to click submit/continue after finishing each section.',
    poetryWriting: 'Tell them which visible button to click next in this page.',
    dramaWriting: 'Tell them which visible button to click next in this page.',
    about: "This page is for reading only. Give a short, friendly introduction and do NOT ask the student to click any button.",
    aboutVision:
      "This page is for reading only. Briefly introduce the vision & philosophy. Do NOT tell the student to click any buttons.",
    aboutResearch:
      "This page is for reading only. Briefly introduce the research team. Do NOT tell the student to click any buttons.",
    research:
      "This page is for reading only. Briefly introduce what students can learn from these research books. Do NOT tell the student to click any buttons.",
    userProfileFarm:
      'This is the farm overview. Tell them: tap the back-arrow icon to go back to the map, tap the writing-board icon to view writings, tap the settings icon to open settings, and tap the "Visit Others Farm" sign to open the friend list.',
  }
  return map[stage] || 'Tell them the exact next button they should click on this page.'
}

/**
 * Cagent page-context guide: tells the student what they did, how they're doing, and what to do next.
 * Uses simple, cute language with emojis.
 */
export async function POST(request: NextRequest) {
  try {
    if (!DIFY_API_KEY) {
      console.error("[dify-cagent-guide] DIFY_API_KEY not configured")
      return NextResponse.json(
        { error: "Guide unavailable", message: "Cagent is resting. Try again in a bit! 🧸" },
        { status: 200 }
      )
    }

    const { stage, contextSummary, user_id, userMessage } = await request.json()

    const normalizedStage = String(stage || "unknown")
    const stageButtonHint = getStageButtonHint(normalizedStage)

    const isReadOnlyStage = [
      "about",
      "aboutVision",
      "aboutResearch",
      "research",
      "userProfileFarm",
    ].includes(normalizedStage)

    const buttonInstruction = isReadOnlyStage
      ? `- ${stageButtonHint}`
      : `- ${stageButtonHint}
- If you clearly know the real button label on this page, you may mention it in quotes (for example "Continue →"). If you are not sure, just describe the next action without inventing a fake button name.`

    const basePrompt = `You are Cagent, a friendly AI assistant for elementary students in a creative writing app. You know every page of the app. Your answers must always be in simple English that a young child can understand.

Current page/stage: ${normalizedStage}
What the student has done so far on this page (if any): ${contextSummary || "Nothing yet"}

Reply in 2-3 very short sentences. Use simple, cute language and include 1 emoji (sometimes 2, but not more). Vary your openings (do NOT always start with "Hi there" or use the same sentence pattern every time). Tell the student:
1. What they have done on this page (if anything)
2. How they are doing
3. What to do next

Important quality rule:
- Avoid generic replies like "Good start" only.
- Mention at least one concrete thing from the provided context summary or user message, then give one clear next action.
- Never mention any hidden/test/developer features, and NEVER mention any secret codes or words like "Cagentcode".
- ${buttonInstruction}

Write in English only. Be encouraging and warm. Do not use markdown.`

    const chatAddon = userMessage
      ? `

The student just typed this message to you:
"${String(userMessage).slice(0, 300)}"

In your reply, respond directly to what they said while still sounding like a cute guide on this page.`
      : ""

    const prompt = `${basePrompt}${chatAddon}`

    const response = await fetch(DIFY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: prompt,
        response_mode: "blocking",
        user: user_id || "cagent-user",
        app_id: DIFY_CAGENT_APP_ID,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[dify-cagent-guide] Dify error:", response.status, errText)
      return NextResponse.json(
        { error: "Guide unavailable", message: "Cagent is resting. Try again in a bit! 🧸" },
        { status: 200 }
      )
    }

    const data = await response.json()
    const answer = data.answer || "Keep going! You're doing great! ✨"
    return NextResponse.json({ message: answer, answer })
  } catch (error) {
    console.error("[dify-cagent-guide] Error:", error)
    return NextResponse.json(
      { error: "Guide unavailable", message: "Something went wrong. Try again! 🌟" },
      { status: 200 }
    )
  }
}
