import { NextResponse } from "next/server"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, level: levelRaw } = body
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "general")

    let systemPrompt = ""
    let userPrompt = ""

    switch (action) {
      case "book_review_type": {
        const { bookTitle } = body
        if (!bookTitle) {
          return NextResponse.json({ error: "bookTitle is required" }, { status: 400 })
        }
        systemPrompt = "You are a helpful book review coach for elementary school students (ages 8-12). Respond with VALID JSON ONLY."
        userPrompt = `The student has chosen the book: "${bookTitle}".

There are three possible review types:
1. recommendation - the student recommends the book and explains why others should read it
2. critical - the student carefully evaluates the book, including both strengths and weaknesses
3. literary - the student analyzes deeper themes, symbols, and the author's writing style

Your tasks:
1. Decide which review type (recommendation, critical, or literary) is MOST suitable for this book for an elementary student.
2. For EACH of the three types, write ONE short, friendly guiding question in English that invites the student to write that kind of review about "${bookTitle}".
   - The questions should be clear, simple, and engaging.
   - They should directly mention the book title "${bookTitle}".
   - They should briefly connect to what happens in the story, the main character, or an important scene in "${bookTitle}" (for example, by mentioning a hero, a problem, or a lesson).
   - Each question MUST stay short (no more than 30 words).
   - They should sound like a warm teacher speaking to a child.

VERY IMPORTANT:
- Respond with VALID JSON ONLY. No explanations, no extra text.
- Use this exact JSON structure:
{
  "recommended_type": "recommendation" | "critical" | "literary",
  "questions": {
    "recommendation": "one question in English...",
    "critical": "one question in English...",
    "literary": "one question in English..."
  }
}

All questions MUST be in English and appropriate for ages 8-12.${levelSuffix}`
        break
      }

      case "drama_generate": {
        const { scenes, characters, title } = body
        let desc = `Drama Title: "${title}"\n\nCHARACTERS:\n`
        for (const char of characters) {
          desc += `- ${char.name}: ${char.species || "Unknown species"}. ${char.appearance || "No description"}\n`
        }
        desc += "\nSCENES:\n"
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i]
          desc += `\nScene ${i + 1}: ${scene.backgroundPrompt || "No background set"}\n`
          if (scene.notes) desc += `Notes: ${scene.notes}\n`
          for (const pc of scene.characters) {
            const ci = characters.find((c: { id: string }) => c.id === pc.characterId)
            if (ci) {
              if (pc.dialogue) desc += `${ci.name} says: "${pc.dialogue}"\n`
              if (pc.thought) desc += `${ci.name} thinks: "${pc.thought}"\n`
            }
          }
        }
        systemPrompt = "You are a friendly drama writing helper for elementary school kids (ages 8-12)."
        userPrompt = `Your job is to:
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

Use elementary-school-level English. Be encouraging and friendly. DO NOT add new characters or plot points.${levelSuffix}

Here is the student's drama project:

${desc}`
        break
      }

      case "drama_revise": {
        const { originalScript, modifiedScript, title } = body
        if (!originalScript || !modifiedScript) {
          return NextResponse.json({ error: "Both scripts required" }, { status: 400 })
        }
        systemPrompt = "You are a friendly creative writing teacher for young students (ages 8-14)."
        userPrompt = `A student has been working on a drama called "${title || "Untitled Drama"}".

Here is the ORIGINAL version of their script:
---
${originalScript}
---

Here is the student's MODIFIED version:
---
${modifiedScript}
---

Please:
1. Identify what the student changed and praise their creative choices
2. Offer 2-3 gentle, encouraging suggestions that refer to the MODIFIED script only
3. If there are grammar/spelling issues, note them kindly
4. Give the script a brief rating using stars (1-5)

Format your response EXACTLY like this:
---FEEDBACK---
(friendly feedback under 150 words)
---SUGGESTIONS---
(each current suggestion on a new line; make each one concrete and tied to the modified script)

Do not repeat old suggestions that no longer match the modified script. Use simple language.${levelSuffix}`
        break
      }

      case "rhyme": {
        const { topic, word } = body
        systemPrompt = "You are a friendly poetry helper for kids (ages 8-12)."
        userPrompt = `The student is writing Rhyming Couplets about "${topic}".
They need rhyming words for: "${word}"
Give exactly 8 rhyming words, sorted by difficulty:
- 3 Simple (common words kids know)
- 3 Medium (slightly harder)
- 2 Fancy (challenging vocabulary)
Format: one word per line, prefixed with [Simple], [Medium], or [Fancy].
Only output the word list, nothing else.${levelSuffix}`
        break
      }

      case "syllable": {
        const { topic, word, lineIndex } = body
        systemPrompt = "You are a friendly Haiku helper for kids (ages 8-12)."
        userPrompt = `The student is writing a Haiku about "${topic}".
Line ${(lineIndex ?? 0) + 1} currently: "${word}"
The target syllable count is ${lineIndex === 0 ? 5 : lineIndex === 1 ? 7 : 5}.
Suggest 2 shorter alternative phrases and 2 longer alternative phrases that keep the same meaning/image.
Format each on a new line as: [Shorter] phrase | or [Longer] phrase
Keep suggestions under 12 words each. Use simple English.${levelSuffix}`
        break
      }

      case "rhetoric": {
        const { topic, lines, device, activeLine } = body
        const deviceExplanation =
          device === "Metaphor" ? "comparing two things directly without 'like' or 'as'" :
          device === "Simile" ? "comparing things using 'like' or 'as'" :
          device === "Personification" ? "giving human qualities to non-human things" :
          device === "Onomatopoeia" ? "using words that sound like what they describe" :
          "repeating the same starting sound in nearby words"

        const hasActiveLine = activeLine && activeLine.trim().length > 0
        const allLines = (lines || []).filter((l: string) => l.trim()).join("\n")

        if (hasActiveLine) {
          systemPrompt = "You are a creative writing helper for kids (ages 8-12)."
          userPrompt = `The student is writing a Free Verse poem about "${topic}".
Their current poem so far:
${allLines || "(just started)"}

The student's CURRENT LINE is: "${activeLine}"

TASK: Rewrite this specific line "${activeLine}" using the rhetorical device "${device}" (${deviceExplanation}).
Give exactly 3 different rewrites of this line that:
1. Keep the same meaning and topic as the original line
2. Apply ${device} clearly
3. Use simple English suitable for kids (ages 8-12)
4. Each rewrite must be a single line, max 15 words

Format: one rewrite per line, nothing else. No labels, no numbers, no explanations.${levelSuffix}`
        } else {
          systemPrompt = "You are a creative writing helper for kids (ages 8-12)."
          userPrompt = `The student is writing a Free Verse poem about "${topic}".
Their current poem so far:
${allLines || "(just started)"}

TASK: Write 3 example lines about "${topic}" that use the rhetorical device "${device}" (${deviceExplanation}).
The lines should fit naturally with what the student has already written.
Rules:
- Each line max 15 words
- Use simple English suitable for kids
- Make the lines relevant to "${topic}" and the student's existing poem

Format: one line per line, nothing else. No labels, no numbers, no explanations.${levelSuffix}`
        }
        break
      }

      case "inspiration": {
        const { topic: insTopic } = body
        systemPrompt = "You are a creative writing helper for kids (ages 8-12)."
        userPrompt = `The student is writing a poem about "${insTopic}".

Generate sensory words related to "${insTopic}" for each of the five senses.
These words should help the student paint vivid pictures in their poem.

Format your response EXACTLY like this (6 words per sense, separated by commas):
sight: word1, word2, word3, word4, word5, word6
sound: word1, word2, word3, word4, word5, word6
smell: word1, word2, word3, word4, word5, word6
touch: word1, word2, word3, word4, word5, word6
taste: word1, word2, word3, word4, word5, word6

Rules:
- All words must be directly related to the topic "${insTopic}"
- Use simple English that kids can understand
- Each word should be a single adjective or verb (max 2 words)
- Make words vivid and specific to "${insTopic}", not generic
- Output ONLY the 5 lines in the format above, nothing else.${levelSuffix}`
        break
      }

      case "synonym": {
        const { topic, word } = body
        systemPrompt = "You are a vocabulary helper for kids (ages 8-12)."
        userPrompt = `The student selected the word: "${word}" in their poem about "${topic}".
Suggest 5 alternative words or short phrases (max 3 words each).
Include different tones: playful, serious, descriptive.
Format: one suggestion per line, with tone label like [playful] word.${levelSuffix}`
        break
      }

      case "review": {
        const { form, topic, lines } = body
        systemPrompt = "You are an encouraging poetry teacher for kids (ages 8-12)."
        userPrompt = `Form: ${form}
Topic: ${topic}
The student's poem:
${(lines || []).map((l: string, i: number) => `${i + 1}. ${l}`).join("\n")}

Give a brief, encouraging review in this format:
---FEEDBACK---
(2-3 sentences of kind, specific praise)
---TIPS---
(3 short, actionable tips to improve, each on a new line starting with a star *)
---SCORE---
Form: X/5
Language: X/5
Creativity: X/5

Use simple, friendly language. Be encouraging!${levelSuffix}`
        break
      }

      case "poetry_revise": {
        const { title, topic, originalPoem, modifiedPoem } = body
        systemPrompt = "You are an encouraging poetry teacher for kids (ages 8-12)."
        userPrompt = `The student revised their poem about "${title || topic}".

Original version:
${originalPoem}

Updated version:
${modifiedPoem}

Give brief, encouraging feedback (2-3 sentences) about what they changed and how it improved. Be specific about what got better. Use simple, friendly language.${levelSuffix}`
        break
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    // 檢查 API Key
    if (!isConfigured()) {
      return NextResponse.json(getFallbackResponse(action, body))
    }

    // 調用 DeepSeek
    const answer = await chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    })

    // 處理 book_review_type JSON 回應
    if (action === "book_review_type") {
      try {
        const parsed = JSON.parse(answer.trim())
        const recommended = parsed.recommended_type
        const questions = parsed.questions || {}
        return NextResponse.json({
          recommendedType: recommended === "critical" || recommended === "literary" ? recommended : "recommendation",
          questions: {
            recommendation: questions.recommendation || `Would you like to write a friendly recommendation review of "${body.bookTitle}" to tell others why they should read it?`,
            critical: questions.critical || `Would you like to write a critical review of "${body.bookTitle}" and think about both what is good and what is not so good?`,
            literary: questions.literary || `Would you like to write a literary review of "${body.bookTitle}" and explore its deeper themes and writing style?`,
          },
        })
      } catch (e) {
        console.error("[deepseek] Failed to parse book_review_type JSON:", e, answer)
        return NextResponse.json({
          recommendedType: "recommendation",
          questions: {
            recommendation: `Would you like to write a friendly recommendation review of "${body.bookTitle}" to tell others why they should read it?`,
            critical: `Would you like to write a critical review of "${body.bookTitle}" and think about both what is good and what is not so good?`,
            literary: `Would you like to write a literary review of "${body.bookTitle}" and explore its deeper themes and writing style?`,
          },
        })
      }
    }

    // 處理 drama 回應
    if (action === "drama_generate") {
      return NextResponse.json(parseDramaResponse(answer, body))
    }
    if (action === "drama_revise" || action === "poetry_revise") {
      if (action === "drama_revise") return NextResponse.json(parseDramaRevisionResponse(answer))
      return NextResponse.json({ feedback: answer || "Great work! Keep it up!" })
    }

    return NextResponse.json({ result: answer })
  } catch (error) {
    console.error("[deepseek] Error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout", message: "DeepSeek API timed out. Please try again." }, { status: 504 })
    }
    return NextResponse.json(getFallbackResponse("unknown", {}))
  }
}

function parseDramaResponse(
  answer: string,
  body: { scenes?: unknown[]; characters?: unknown[]; title?: string },
) {
  const summaryMatch = answer.match(/---SUMMARY---([\s\S]*?)(?=---SCRIPT---|$)/)
  const scriptMatch = answer.match(/---SCRIPT---([\s\S]*?)(?=---SUGGESTIONS---|$)/)
  const suggestionsMatch = answer.match(/---SUGGESTIONS---([\s\S]*?)$/)

  const scenes = (body.scenes || []) as Array<{
    backgroundPrompt: string
    notes: string
    characters: Array<{ characterId: string; dialogue: string; thought: string }>
  }>
  const characters = (body.characters || []) as Array<{ id: string; name: string }>
  const title = body.title || "Untitled"

  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : `Great job creating "${title}"! Your drama has ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}.`

  const script = scriptMatch ? scriptMatch[1].trim() : generateFallbackScript(scenes, characters, title)

  const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : ""
  const suggestions = suggestionsText
    ? suggestionsText.split("\n").filter((s: string) => s.trim().length > 0).map((s: string) => s.trim())
    : ["Try adding more dialogue!", "What feelings do your characters have?", "Can you add stage directions?"]

  return { summary, script, suggestions }
}

function parseDramaRevisionResponse(answer: string) {
  const feedbackMatch = answer.match(/---FEEDBACK---([\s\S]*?)(?=---SUGGESTIONS---|$)/)
  const suggestionsMatch = answer.match(/---SUGGESTIONS---([\s\S]*?)$/)
  const feedback = (feedbackMatch ? feedbackMatch[1] : answer).trim() || "Great edits! Keep writing and improving."
  const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : ""
  const suggestions = suggestionsText
    ? suggestionsText
        .split("\n")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : []

  return { feedback, suggestions }
}

function generateFallbackScript(
  scenes: Array<{
    backgroundPrompt: string
    notes: string
    characters: Array<{ characterId: string; dialogue: string; thought: string }>
  }>,
  characters: Array<{ id: string; name: string }>,
  title: string,
): string {
  let script = `${title}\nA Drama by a Creative Young Writer\n\n`
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    script += `--- ACT ${i + 1} ---\n`
    script += `[Setting: ${scene.backgroundPrompt || "A mysterious place"}]\n`
    if (scene.notes) script += `[${scene.notes}]\n`
    script += "\n"
    for (const pc of scene.characters) {
      const char = characters.find((c) => c.id === pc.characterId)
      if (char) {
        if (pc.dialogue) script += `${char.name}: "${pc.dialogue}"\n`
        if (pc.thought) script += `[${char.name} thinks: "${pc.thought}"]\n`
      }
    }
    script += "\n"
  }
  return script
}

function getFallbackResponse(action: string, body: Record<string, unknown>) {
  switch (action) {
    case "drama_generate": {
      const scenes = (body.scenes || []) as Array<{
        backgroundPrompt: string; notes: string
        characters: Array<{ characterId: string; dialogue: string; thought: string }>
      }>
      const characters = (body.characters || []) as Array<{ id: string; name: string }>
      const title = (body.title as string) || "Untitled"
      return {
        summary: `Great job creating "${title}"!`,
        script: generateFallbackScript(scenes, characters, title),
        suggestions: [
          "Try adding more dialogue!",
          "What feelings do your characters have?",
          "Can you add what happens at the end?",
        ],
      }
    }
    case "drama_revise":
    case "poetry_revise":
      return { feedback: "Great edits! Keep writing and improving. Every revision makes it better!" }
    case "rhyme":
      return { result: "[Simple] day\n[Simple] play\n[Simple] way\n[Medium] display\n[Medium] hooray\n[Medium] relay\n[Fancy] bouquet\n[Fancy] ballet" }
    case "syllable":
      return { result: "[Shorter] morning light\n[Shorter] soft breeze\n[Longer] the morning light shines\n[Longer] a gentle breeze blows through" }
    case "rhetoric":
      return { result: "The sun smiled down upon the earth\nTime crawled slowly by" }
    case "synonym":
      return { result: "[playful] cheerful\n[serious] solemn\n[descriptive] radiant\n[playful] bubbly\n[descriptive] vivid" }
    case "review":
      return { result: "---FEEDBACK---\nGreat effort on your poem!\n---TIPS---\n* Try adding more sensory details\n* Read your poem aloud\n* Add one surprising image\n---SCORE---\nForm: 3/5\nLanguage: 3/5\nCreativity: 4/5" }
    default:
      return { result: "Great work! Keep writing!" }
  }
}
