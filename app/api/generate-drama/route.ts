import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_APP_ID = 'app-TFDykrjN8LpJROY6eTRNjwo5'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { scenes, characters, title, userId } = await request.json()

    // Build a detailed prompt from all scene and character data
    let projectDescription = `Drama Title: "${title}"\n\n`

    // Character descriptions
    projectDescription += "CHARACTERS:\n"
    for (const char of characters) {
      projectDescription += `- ${char.name}: ${char.species || "Unknown species"}. ${char.appearance || "No description"}\n`
    }

    // Scene descriptions
    projectDescription += "\nSCENES:\n"
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      projectDescription += `\nScene ${i + 1}: ${scene.backgroundPrompt || "No background set"}\n`
      if (scene.notes) {
        projectDescription += `Notes: ${scene.notes}\n`
      }
      for (const placedChar of scene.characters) {
        const charInfo = characters.find(
          (c: { id: string }) => c.id === placedChar.characterId
        )
        if (charInfo) {
          if (placedChar.dialogue) {
            projectDescription += `${charInfo.name} says: "${placedChar.dialogue}"\n`
          }
          if (placedChar.thought) {
            projectDescription += `${charInfo.name} thinks: "${placedChar.thought}"\n`
          }
        }
      }
    }

    const systemPrompt = `You are a friendly drama writing helper for elementary school kids (ages 8-12). 
Your job is to:
1. Summarize the student's existing drama content - DO NOT add new story content
2. Write it as a simple drama script with stage directions
3. Give 3-5 friendly editing suggestions using emojis

Format your response EXACTLY like this:
---SUMMARY---
(A brief, encouraging summary of the drama in 2-3 sentences)
---SCRIPT---
(The complete drama script based ONLY on what the student created, using simple English)
---SUGGESTIONS---
(Each suggestion on a new line, starting with an emoji)

Use elementary-school-level English. Be encouraging and friendly. DO NOT add new characters or plot points.`

    if (!DIFY_API_KEY) {
      // Return fallback response
      return NextResponse.json({
        summary: `Great job creating "${title}"! Your drama has ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}. Keep up the amazing work!`,
        script: generateFallbackScript(scenes, characters, title),
        suggestions: [
          "Try adding more dialogue between your characters!",
          "What feelings do your characters have? Add some emotion words!",
          "Can you add what happens at the end of your story?",
          "Try making one character disagree with another - drama needs conflict!",
          "Add some action words to make your scenes more exciting!",
        ],
      })
    }

    const response = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: `${systemPrompt}\n\nHere is the student's drama project:\n\n${projectDescription}`,
        response_mode: "blocking",
        user: userId || "drama-builder-student",
        app_id: DIFY_APP_ID,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Drama] Dify error:", errorText)
      // Return a friendly fallback
      return NextResponse.json({
        summary: `Great job creating "${title}"! Your drama has ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}. Keep up the amazing work!`,
        script: generateFallbackScript(scenes, characters, title),
        suggestions: [
          "Try adding more dialogue between your characters!",
          "What feelings do your characters have? Add some emotion words!",
          "Can you add what happens at the end of your story?",
          "Try making one character disagree with another - drama needs conflict!",
          "Add some action words to make your scenes more exciting!",
        ],
      })
    }

    const data = await response.json()
    const answer = data.answer || ""

    // Parse the response
    const summaryMatch = answer.match(
      /---SUMMARY---([\s\S]*?)(?=---SCRIPT---|$)/
    )
    const scriptMatch = answer.match(
      /---SCRIPT---([\s\S]*?)(?=---SUGGESTIONS---|$)/
    )
    const suggestionsMatch = answer.match(/---SUGGESTIONS---([\s\S]*?)$/)

    const summary = summaryMatch
      ? summaryMatch[1].trim()
      : `Great job creating "${title}"! Your drama has ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}.`

    const script = scriptMatch
      ? scriptMatch[1].trim()
      : generateFallbackScript(scenes, characters, title)

    const suggestionsText = suggestionsMatch
      ? suggestionsMatch[1].trim()
      : ""
    const suggestions = suggestionsText
      ? suggestionsText
          .split("\n")
          .filter((s: string) => s.trim().length > 0)
          .map((s: string) => s.trim())
      : [
          "Try adding more dialogue between your characters!",
          "What feelings do your characters have?",
          "Can you add stage directions?",
        ]

    // 记录API调用
    await logApiCall(
      userId || "drama-builder-student",
      "dramaComplete",
      "/api/generate-drama",
      { title, scenesCount: scenes.length, charactersCount: characters.length },
      { summary, script, suggestions, conversation_id: data.conversation_id, message_id: data.id }
    )

    return NextResponse.json({ summary, script, suggestions })
  } catch (error) {
    console.error("[Drama] Drama generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate drama" },
      { status: 500 }
    )
  }
}

function generateFallbackScript(
  scenes: Array<{
    backgroundPrompt: string
    notes: string
    characters: Array<{
      characterId: string
      dialogue: string
      thought: string
    }>
  }>,
  characters: Array<{ id: string; name: string }>,
  title: string
): string {
  let script = `${title}\nA Drama by a Creative Young Writer\n\n`

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    script += `--- ACT ${i + 1} ---\n`
    script += `[Setting: ${scene.backgroundPrompt || "A mysterious place"}]\n`
    if (scene.notes) {
      script += `[${scene.notes}]\n`
    }
    script += "\n"

    for (const pc of scene.characters) {
      const char = characters.find((c) => c.id === pc.characterId)
      if (char) {
        if (pc.dialogue) {
          script += `${char.name}: "${pc.dialogue}"\n`
        }
        if (pc.thought) {
          script += `[${char.name} thinks: "${pc.thought}"]\n`
        }
      }
    }
    script += "\n"
  }

  return script
}
