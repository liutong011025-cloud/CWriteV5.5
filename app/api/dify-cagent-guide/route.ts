import { NextRequest, NextResponse } from "next/server"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const getStageButtonHint = (stage: string) => {
  const map: Record<string, string> = {
    welcome: 'Tell them to click the "Start" button.',
    character:
      'Tell them to fill the current field, then click "Generate Character". After the character image appears, tell them to click "Continue →" (or "Regenerate Image" if they want a new picture).',
    plot: 'Tell them to choose one word button or type in the input, then click the send button, and click "Continue →" when ready.',
    structure: 'Tell them to pick a structure card and click the next/continue button.',
    journeyTicket:
      'Tell them to drag one journey type card onto the ticket, then choose a difficulty number, and finally press the airplane "Start" button at the bottom to begin. Do not talk about choosing a destination or packing items here; only talk about these visible controls.',
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
      'This is the farm overview. Write 3–5 short, warm sentences. Put a related emoji next to each action: back-arrow ⬅️ (map 🗺️), writing-board 📝 (stories 📖), settings ⚙️, and "Visit Others Farm" 🏡 (friends 👫). End with a cheerful emoji like 🌟 or 😊. Do not use only one emoji for the whole reply.',
  }
  return map[stage] || 'Tell them the exact next button they should click on this page.'
}

export async function POST(request: NextRequest) {
  try {
    const { stage, contextSummary, user_id, userMessage, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "general")

    if (!isConfigured()) {
      console.error("[dify-cagent-guide] DEEPSEEK_API_KEY is missing in this deployment environment")
      return NextResponse.json(
        { error: "Guide unavailable", message: "Cagent is resting. Try again in a bit! 🧸" },
        { status: 200 }
      )
    }

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

    const isFarmStage = normalizedStage === "userProfileFarm"

    const basePrompt = `You are Cagent, a friendly AI writing coach for elementary students in a creative writing app. You know every page of the app. Your answers must be in simple English that a young child can understand.

Current page/stage: ${normalizedStage}
What the student has done so far on this page (if any): ${contextSummary || "Nothing yet"}

CRITICAL — FOR WRITING STAGES (story writing, book review, letter, drama, poetry): Your reply MUST contain ALL of the following, in 5–7 short sentences. Never reply with only 1–2 sentences on a writing stage.

1) EVALUATION (1–2 sentences): Say what they wrote or did, and give a clear evaluation. Be specific: name something good (e.g. "I like your character's name", "Your opening sentence is clear", "You used 'because' well"). Match your tone to their level (see below).

2) GRAMMAR / SPELLING (1 sentence, only if there is something to fix): If you see a grammar or spelling mistake in their text, point it out in a kind way and give the correct form. Example: "You wrote 'teh' — the right spelling is 'the'. Try it next time!" If their text has no clear errors, skip this sentence or say one thing they did right with words/spelling.

3) WHAT TO WRITE NEXT (1–2 sentences): Give a concrete suggestion for what to add or write next. Be specific to their level:
- Level 1: Suggest 1–2 very simple sentences (e.g. "Try writing: I like to play. It is fun.") or 2–3 keywords.
- Level 2: Suggest a short sentence pattern with "and"/"but"/"because" and one example.
- Level 3: Suggest adding when/why/how, or one longer sentence with "because" or "when".
- Level 4: Suggest giving a reason or example, or using a word like "however" or "therefore".
- Level 5: Ask a question to deepen ideas or suggest combining sentences / choosing a more precise word.

4) NEXT ACTION (1 sentence): Tell them which button to press or what to do next on the page (e.g. "When you're ready, click 'Continue →'."). ${stageButtonHint}

Level rules (use the level from context, e.g. "Level 3" or "writing level 2"):
- Level 1: Very warm, simple words. Lots of praise. Give copyable short sentences and keywords.
- Level 2: Friendly, clear. One example sentence pattern and basic linkers.
- Level 3: Encouraging, medium difficulty. Ask one why/when/how and suggest one complex sentence.
- Level 4: Supportive but push a bit. Suggest structure (point + reason + example) and one linker.
- Level 5: Brief praise, then one or two higher-order questions or revision tips; no sentence frames.

For NON‑writing stages (maps, menus, about, etc.): Reply in 1–2 short sentences only. Say what they did and what to do next. Use simple, cute language and 1 emoji.
${isFarmStage ? `
FOR THE FARM PAGE ONLY: Ignore the 1–2 sentence / 1 emoji limit above. Write 3–5 short sentences. Add a related emoji beside each farm action (⬅️ map, 📝 writing board, 📖 stories, ⚙️ settings, 🏡 visit friends). Keep it cute and easy to read.
` : ""}
Rules for all replies:
- Use simple, cute language. Include 1 emoji (or 2 at most), except on the farm page where you should use several related emojis as described above. Do not always start with "Hi there".
- Never mention secret codes, Cagentcode, or hidden features. Do not invent UI (forests, castles, suitcases, etc.).
- Write in English only. No markdown. Be encouraging and warm.
- ${buttonInstruction}${levelSuffix}`

    const chatAddon = userMessage
      ? `

The student just typed this message to you:
"${String(userMessage).slice(0, 300)}"

In your reply, respond directly to what they said while still sounding like a cute guide on this page.`
      : ""

    const prompt = `${basePrompt}${chatAddon}`

    const answer = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({ message: answer, answer })
  } catch (error) {
    console.error("[dify-cagent-guide] Error:", error)
    return NextResponse.json(
      { error: "Guide unavailable", message: "Something went wrong. Try again! 🌟" },
      { status: 200 }
    )
  }
}
