import { NextRequest, NextResponse } from "next/server"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const structureNames: Record<string, string> = {
  freytag: "Freytag's Pyramid",
  threeAct: "Three Act Structure",
  fichtean: "Fichtean Curve",
}

export async function POST(request: NextRequest) {
  try {
    const { structure_type, character, plot, user_id, generate_all, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, "story")

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const characterInfo = [
      `Character name: ${character?.name || "Unknown"}`,
      character?.species ? `Species: ${character.species}` : "",
      character?.age ? `Age: ${character.age} years old` : "",
      character?.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(", ")}` : "",
      character?.description ? `Description: ${character.description}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    const plotInfo = [
      `Setting: ${plot?.setting || "Unknown"}`,
      `Conflict: ${plot?.conflict || "Unknown"}`,
      `Goal: ${plot?.goal || "Unknown"}`,
    ]
      .filter(Boolean)
      .join("\n")

    let stories: Record<string, string> = {}

    if (generate_all) {
      const prompt = `根据我输入的人物和情节，生成简短的实例故事，分别为Freytag's Pyramid结构、Three Act Structure结构、Fichtean Curve结构。

人物信息：
${characterInfo}

情节信息：
${plotInfo}

请生成三个简短的故事（每个3-5句话），分别使用以下三种结构：
1. Freytag's Pyramid（起承转合结构）
2. Three Act Structure（三幕结构）
3. Fichtean Curve（多危机结构）

请按照以下格式输出，每个故事之间用"---"分隔：
**Freytag's Pyramid:**
[故事内容]

**Three Act Structure:**
[故事内容]

**Fichtean Curve:**
[故事内容]

所有故事都应适合儿童阅读，有趣且引人入胜。${levelSuffix}`

      const allStories = await chat({ messages: [{ role: "user", content: prompt }] })

      let cleanedStories = allStories
      const sixWordsPattern = /[,\s]*[a-zA-Z]+[,\s]+[a-zA-Z]+[,\s]+[a-zA-Z]+[,\s]+[a-zA-Z]+[,\s]+[a-zA-Z]+[,\s]+[a-zA-Z]+[.\s]*$/i
      cleanedStories = cleanedStories.replace(sixWordsPattern, "").trim()

      const freytagMatch = cleanedStories.match(/\*\*?Freytag'?s?\s+Pyramid:?\*\*?\s*\n?\s*([\s\S]*?)(?=\*\*?(?:Three\s+Act|Fichtean)|$)/i)
      const threeActMatch = cleanedStories.match(/\*\*?Three\s+Act\s+Structure:?\*\*?\s*\n?\s*([\s\S]*?)(?=\*\*?Fichtean|$)/i)
      const fichteanMatch = cleanedStories.match(/\*\*?Fichtean\s+Curve:?\*\*?\s*\n?\s*([\s\S]*?)$/i)

      const cleanStory = (story: string) => {
        if (!story) return ""
        story = story.replace(/^(Freytag'?s?\s+Pyramid|Three\s+Act\s+Structure|Fichtean\s+Curve):?\s*/i, "")
        story = story.replace(/^Act\s+\d+:\s*/gi, "")
        story = story.replace(/\n{3,}/g, "\n\n").trim()
        return story
      }

      stories.freytag = freytagMatch ? cleanStory(freytagMatch[1]) : ""
      stories.threeAct = threeActMatch ? cleanStory(threeActMatch[1]) : ""
      stories.fichtean = fichteanMatch ? cleanStory(fichteanMatch[1]) : ""
    } else {
      const structureName = structureNames[structure_type] || structure_type
      const prompt = `根据我输入的人物和情节，生成简短的实例故事，使用${structureName}结构。

人物信息：
${characterInfo}

情节信息：
${plotInfo}

请生成一个简短的故事（3-5句话），使用${structureName}结构，适合儿童阅读，有趣且引人入胜。${levelSuffix}`

      const exampleStory = await chat({ messages: [{ role: "user", content: prompt }] })

      return NextResponse.json({
        story: exampleStory,
        structure_type,
      })
    }

    const defaultStory = `Once upon a time, ${character?.name || "a hero"} lived in ${plot?.setting || "a magical place"}. They faced ${plot?.conflict || "a challenge"} and worked hard to ${plot?.goal || "achieve their goal"}. In the end, they succeeded and learned an important lesson.`

    const result = {
      freytag: {
        story: stories.freytag || defaultStory,
        structure_type: "freytag",
      },
      threeAct: {
        story: stories.threeAct || defaultStory,
        structure_type: "threeAct",
      },
      fichtean: {
        story: stories.fichtean || defaultStory,
        structure_type: "fichtean",
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating structure example:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
