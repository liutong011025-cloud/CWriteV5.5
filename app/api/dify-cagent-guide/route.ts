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
    planTest: 'Tell them to answer each multiple-choice question and pick the best answer. If they want to stop, tell them to tap the back arrow to return to the map.',
    journeyTicket:
      'Tell them to drag one journey type card onto the ticket, then choose a difficulty number, and finally press the airplane "Start" button at the bottom to begin. Do not talk about choosing a destination or packing items here; only talk about these visible controls.',
    journeyMap:
      'Tell them to first tap the pin box to pick up a pin, then click one spot on the map to drop the pin. After the pin appears, tell them to press the Start button above the pin to begin their writing adventure. Do not talk about choosing a forest/castle/beach type here, only about dropping the pin and starting.',
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

    const isWritingStage = [
      "writing",
      "bookReviewWriting",
      "bookReviewWritingNoAi",
      "letterGame",
      "letterAdventure",
      "dramaWriting",
      "poetryWriting",
      "poetryEditor",
    ].includes(normalizedStage)

    const buttonInstruction = isReadOnlyStage
      ? `- ${stageButtonHint}`
      : `- ${stageButtonHint}
- If you clearly know the real button label on this page, you may mention it in quotes (for example "Continue →"). If you are not sure about the exact label, or there is no clear button, do NOT invent a button name. Just describe the next action in simple words (for example "start your writing" or "choose one card").`

    const basePrompt = `You are Cagent, a friendly AI assistant for elementary students in a creative writing app. You know every page of the app. Your answers must always be in simple English that a young child can understand.

Current page/stage: ${normalizedStage}
What the student has done so far on this page (if any): ${contextSummary || "Nothing yet"}

If the context mentions a "level" from 1 to 5 (for example "Level 1", "level: 3", "writing level 5"), and this is a writing stage (story, book review, letter, drama or poetry), use it as the student's writing level with these rules:
- Level 1 (A2.1, beginner low): Very high support. Give very concrete sentence ideas about self and daily life (name, likes, simple routine). Suggest 1–3 short simple sentences they can copy or adapt, and maybe 2–4 keywords. Focus on basic task completion and simple spelling.
- Level 2 (A2.2, beginner high): High but reduced support. Ask for a 3–5 sentence paragraph about a recent experience or plan. Suggest how to use basic linkers like "and", "but", "because", and give one short example sentence pattern they can follow.
- Level 3 (B1.1–B1.2, intermediate): Medium support. Encourage a 5–8 sentence story or paragraph with time order and reasons. Ask 1–2 "why/when/how" questions and suggest adding at least one complex sentence with "when / because / if / that".
- Level 4 (B1.3–B2.1, upper‑intermediate): Strategy support. Remind them to give 2–3 reasons or examples for an opinion. Mention simple planning ideas like "Point + Reason + Example + Ending" and suggest using a contrast or cause/effect linker (however, therefore, although).
- Level 5 (B2.2–B2.3, advanced): Light support. Do not give sentence frames. Instead, praise their control and ask 1–2 higher‑order questions to deepen ideas (for example: "Can you add a stronger example?" "Can you combine sentences or choose more precise words?"). Encourage them to revise and polish.

For writing stages (like story writing, book review writing, letter writing, drama writing or poetry writing), reply in 5-6 short sentences. For non‑writing stages (like maps, menus, tests, about pages), reply in just 1 short paragraph of 1-2 sentences.
In all cases, use simple, cute language and include 1 emoji (sometimes 2, but not more). Vary your openings (do NOT always start with "Hi there" or use the same sentence pattern every time).

Always follow this structure:
1. First sentence: say what the student already did on this page and give a short evaluation (for example, if the writing is simple, say it is a good start; if it is richer, say it is strong or detailed).
2. Second and (if needed) third sentence: give 1-2 very concrete suggestions about what they can add or change next. For writing stages, suggest specific things to write (for example: add more details, reasons, feelings, dialogue, or what happens next) that match their current level. For non‑writing stages, tell them clearly and briefly what action to take next on this page.
3. Last sentence: if there is a clear next step button or action, remind them what to do next in simple words. If there is no clear next action, just encourage them to keep going (in only one more short sentence for non‑writing pages).

Important quality rule:
- Avoid generic replies like "Good start" only.
- Mention at least one concrete thing from the provided context summary or user message, then give one clear next action.
- Never mention any hidden/test/developer features, and NEVER mention any secret codes or words like "Cagentcode".
- Do not invent UI elements or content (such as forests, castles, beaches, suitcases, or packing lists) that are not clearly present in the page or context; only refer to actions and content that really exist on this stage.
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
