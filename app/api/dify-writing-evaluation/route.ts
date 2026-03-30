import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export const maxDuration = 120

const GOOD_ENOUGH_CODE = process.env.CAGENT_GOOD_ENOUGH_CODE || "CAGENTGOODENOUGH"
const GIBBERISH_THRESHOLD = 0.45

const countWords = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

const tokenizeWords = (text: string) => (text.toLowerCase().match(/[a-z']+/g) || [])

const stopwords = new Set([
  "a","an","the","is","am","are","was","were","be","been","being","to","of","in","on","at","for","with","and","or","but","so","if","then","that","this","it","he","she","they","we","i","you","my","our","your","his","her","their",
])

const hasVowel = (word: string) => /[aeiou]/i.test(word)

const buildFailGuidance = (
  quality: { semanticFluency: number; contentMatch: number; structureCompleteness: number },
  sectionName: string
) => {
  const reasons: string[] = []
  const tips: string[] = []
  if (quality.semanticFluency < 40) {
    reasons.push("some sentences are unclear")
    tips.push("rewrite 1-2 sentences with clear subject + action")
  }
  if (quality.contentMatch < 35) {
    reasons.push("this part is not close enough to the section goal")
    const lower = sectionName.toLowerCase()
    if (lower.includes("confront")) {
      tips.push("add one clear problem sentence and one action to face the problem")
    } else if (lower.includes("resol")) {
      tips.push("add one sentence about how the problem is solved")
    } else {
      tips.push("add one sentence that shows where and what is happening")
    }
  }
  if (quality.structureCompleteness < 20) {
    reasons.push("story steps are still too thin")
    tips.push("add a connector like 'then' or 'because' to link events")
  }
  if (reasons.length === 0) return ""
  const reasonText = reasons.slice(0, 2).join(" and ")
  const tipText = tips.slice(0, 2).join("; ")
  return `\nNot passed yet: ${reasonText}.\nHow to improve: ${tipText}.`
}

const computeQualityScores = (
  textRaw: string,
  character: any,
  plot: any,
  currentSectionName: string
) => {
  const text = String(textRaw || "").trim()
  const words = tokenizeWords(text)
  const wordCount = words.length
  const sentenceCount = text.split(/[.!?。！？\n]+/).map((s) => s.trim()).filter(Boolean).length
  const gibberishWords = words.filter((w) => w.length >= 4 && !hasVowel(w))
  const gibberishRatio = wordCount > 0 ? gibberishWords.length / wordCount : 1

  const uniqueRatio = wordCount > 0 ? new Set(words).size / wordCount : 0
  let semanticFluency = 0
  if (wordCount >= 12) semanticFluency += 35
  if (sentenceCount >= 2) semanticFluency += 25
  if (uniqueRatio >= 0.45) semanticFluency += 20
  if (gibberishRatio <= 0.2) semanticFluency += 20
  semanticFluency = Math.min(100, semanticFluency)

  const textLower = text.toLowerCase()
  const characterName = String(character?.name || "").toLowerCase().trim()
  const settingTokens = tokenizeWords(String(plot?.setting || "")).filter((w) => !stopwords.has(w))
  const conflictTokens = tokenizeWords(String(plot?.conflict || "")).filter((w) => !stopwords.has(w))
  const goalTokens = tokenizeWords(String(plot?.goal || "")).filter((w) => !stopwords.has(w))
  const section = currentSectionName.toLowerCase()

  let contentMatch = 0
  if (characterName && textLower.includes(characterName)) contentMatch += 30
  if (settingTokens.some((w) => textLower.includes(w))) contentMatch += 25
  if (section.includes("setup")) {
    if (sentenceCount >= 2) contentMatch += 20
    if (wordCount >= 20) contentMatch += 20
    if (/\b(in|at|on|inside|near)\b/i.test(text)) contentMatch += 10
  }
  if (section.includes("confront")) {
    if (conflictTokens.some((w) => textLower.includes(w))) contentMatch += 25
    const hasConflictCue =
      /\b(problem|danger|trouble|sad|worried|afraid|hard|difficult|fall|broken|storm|drought)\b/i.test(text) ||
      /\b(because|but|however)\b/i.test(text)
    if (hasConflictCue) contentMatch += 20
    if (sentenceCount >= 3) contentMatch += 10
  }
  if (section.includes("resol") && goalTokens.some((w) => textLower.includes(w))) contentMatch += 25
  if (!section.includes("confront") && !section.includes("resol") && conflictTokens.some((w) => textLower.includes(w))) contentMatch += 10
  if (!section.includes("confront") && !section.includes("resol") && goalTokens.some((w) => textLower.includes(w))) contentMatch += 10
  contentMatch = Math.min(100, contentMatch)

  const actionVerbs = ["go","went","find","found","help","helped","save","saved","run","ran","look","looked","say","said","hold","held","climb","climbed","read","remember","decide","decided"]
  const hasAction = actionVerbs.some((v) => new RegExp(`\\b${v}\\b`, "i").test(text))
  const hasConnector = /\b(then|because|so|when|after|before|finally|next)\b/i.test(text)
  let structureCompleteness = 0
  if (sentenceCount >= 2) structureCompleteness += 35
  if (hasAction) structureCompleteness += 35
  if (hasConnector) structureCompleteness += 15
  if (wordCount >= 15) structureCompleteness += 15
  structureCompleteness = Math.min(100, structureCompleteness)

  const pass =
    semanticFluency >= 40 &&
    contentMatch >= 35 &&
    structureCompleteness >= 20 &&
    gibberishRatio < 0.35

  return {
    semanticFluency,
    contentMatch,
    structureCompleteness,
    gibberishRatio,
    pass,
  }
}

const buildLocalEvaluation = (text: string, level: number, currentSectionName: string) => {
  const quality = computeQualityScores(text, null, null, currentSectionName)
  const gibberishDetected = quality.gibberishRatio >= GIBBERISH_THRESHOLD
  if (gibberishDetected) {
    return {
      evaluation:
        "I cannot understand this text yet. It looks like random letters. Please rewrite 2-3 clear English sentences for this section.",
      done: false,
      quality,
      gibberishDetected,
    }
  }
  const done = quality.pass
  const firstSentence = text.split(/[.!?。\n]/).map((s) => s.trim()).filter(Boolean)[0] || "your sentence"
  const lines = [
    `I like this detail: "${firstSentence.slice(0, 60)}". It shows clear feeling.`,
    `For ${currentSectionName}, add one sentence about what happens next.`,
    `Add one sentence to connect this part to your plot problem or goal.`,
    `Grammar check: "He say" -> "He says". Keep subject and verb matched.`,
    `You show positive values like respect and responsibility in your writing.`,
    `For level ${level}, this is a strong start. Keep your ideas clear and connected.`,
  ]
  if (done) {
    lines.push("You can move on to the next part of your writing!")
  } else {
    lines.push("Please improve clarity and section match before moving on.")
  }
  return {
    evaluation: lines.join("\n"),
    done,
    quality,
    gibberishDetected,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, character, plot, structure, current_section, user_id, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "story")

    const currentSectionName = structure?.outline?.[current_section] || "Unknown"

    // 構建上下文信息
    const characterInfo = [
      `Character name: ${character?.name || "Unknown"}`,
      character?.species ? `Species: ${character.species}` : "",
      character?.age ? `Age: ${character.age} years old` : "",
      character?.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(", ")}` : "",
      character?.description ? `Description: ${character.description}` : "",
    ].filter(Boolean).join("\n")

    const plotInfo = [
      `Setting: ${plot?.setting || "Unknown"}`,
      `Conflict: ${plot?.conflict || "Unknown"}`,
      `Goal: ${plot?.goal || "Unknown"}`,
    ].filter(Boolean).join("\n")

    const structureInfo = structure?.outline?.join(" -> ") || "Unknown"

    const prompt = `You are an elementary school English writing teacher. You evaluate students' writing based on their character, plot, and story structure. Use very simple English, short sentences, and a friendly tone for children.

Character Information:
${characterInfo}

Plot Information:
${plotInfo}

Story Structure: ${structure?.type || "Unknown"}
Structure Steps: ${structureInfo}
Current Section Being Written: ${currentSectionName}

Student's Writing for Current Section:
${text || "(No text yet)"}

Please evaluate the student's writing in 6 short sentences:
1) Praise one concrete detail from the student's text.
2) Give one specific next step for this section — use the character's name and traits to make it personal (e.g. "Since [name] is [trait], try writing how [name] ...").
3) Give one more writing suggestion — connect it to the character's species, traits, or description to inspire the student.
4) Give one grammar check with quote and correction.
5) Mention one positive value shown.
6) Connect feedback to level ${level}.
Use clear, child-friendly English. No long paragraph.

VERY IMPORTANT:
- Always refer to the character by their name (${character?.name || "the character"}), not "your character".
- If text is nonsense or too short, do NOT write "done".
- Only write "done" when ALL are good: semantic fluency, content match to character/plot/section, and section completeness.
- Do NOT use word count alone to decide done.
- If quality is good enough, you MUST include the exact pass sentence: "You can move on to the next part of your writing!"
- If and only if you wrote "done", add on next NEW LINE: "${GOOD_ENOUGH_CODE}".
- If not done, you MUST explain why not passed and give 1-2 concrete improvement steps.

${levelSuffix}`

    // 如果未配置 DeepSeek，使用本地評估
    if (!isConfigured()) {
      const local = buildLocalEvaluation(String(text || ""), level, currentSectionName)
      return NextResponse.json({
        evaluation: local.evaluation,
        done: local.done,
        secretCodeDetected: local.done,
        secretCode: local.done ? GOOD_ENOUGH_CODE : null,
        source: "fallback_local_no_config",
        quality: local.quality,
        gibberishDetected: local.gibberishDetected,
      })
    }

    let evaluation = ""
    try {
      evaluation = await chat({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        timeout: 110_000,
      })
    } catch (err) {
      console.error("DeepSeek API error:", err)
      if (err instanceof DeepSeekError && err.isTimeout) {
        return NextResponse.json(
          {
            error: "timeout",
            message: "The writing coach took too long to reply. Try again with a shorter paragraph.",
          },
          { status: 504 }
        )
      }
      // Fallback to local evaluation on error
      const local = buildLocalEvaluation(String(text || ""), level, currentSectionName)
      return NextResponse.json({
        evaluation: local.evaluation,
        done: local.done,
        secretCodeDetected: local.done,
        secretCode: local.done ? GOOD_ENOUGH_CODE : null,
        source: "fallback_local_error",
        quality: local.quality,
        gibberishDetected: local.gibberishDetected,
      })
    }

    if (!evaluation) {
      const local = buildLocalEvaluation(String(text || ""), level, currentSectionName)
      return NextResponse.json({
        evaluation: local.evaluation,
        done: local.done,
        secretCodeDetected: local.done,
        secretCode: local.done ? GOOD_ENOUGH_CODE : null,
        source: "fallback_local_empty",
        quality: local.quality,
        gibberishDetected: local.gibberishDetected,
      })
    }

    // LLM 是 pass/fail 的決定者；本地算法只用於 gibberish 偵測
    const modelHasSecretCode = evaluation.includes(GOOD_ENOUGH_CODE)
    const quality = computeQualityScores(String(text || ""), character, plot, currentSectionName)
    const gibberishDetected = quality.gibberishRatio >= GIBBERISH_THRESHOLD
    const hasDone = modelHasSecretCode && !gibberishDetected
    const hasSecretCode = hasDone

    // 移除控制信號
    const cleanEvaluation = evaluation
      .replace(/\bdone\b/gi, "")
      .replace(new RegExp(GOOD_ENOUGH_CODE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "")
      .trim()
    const doneHint = "You can move on to the next part of your writing!"
    const baseEvaluation = cleanEvaluation || "Please continue improving this section."
    const failGuidance = !hasDone ? buildFailGuidance(quality, currentSectionName) : ""
    const displayEvaluation = gibberishDetected
      ? "I cannot understand this text yet. It looks like random letters. Please rewrite 2-3 clear English sentences for this section."
      : hasDone && !baseEvaluation.includes(doneHint)
        ? `${baseEvaluation}\n${doneHint}`
        : `${baseEvaluation}${failGuidance}`

    // 記錄 API 調用
    await logApiCall(
      user_id,
      "writing",
      "/api/dify-writing-evaluation",
      { text, character, plot, structure, current_section },
      {
        evaluation: displayEvaluation,
        done: hasDone,
        secretCodeDetected: hasSecretCode,
        quality,
        gibberishDetected,
      }
    )

    return NextResponse.json({
      evaluation: displayEvaluation,
      done: hasDone,
      secretCodeDetected: hasSecretCode,
      secretCode: hasDone ? GOOD_ENOUGH_CODE : null,
      quality,
      gibberishDetected,
    })
  } catch (error) {
    console.error("Error in writing evaluation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
