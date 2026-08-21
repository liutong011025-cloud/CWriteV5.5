import { NextRequest, NextResponse } from "next/server"
import { getLevelPromptSuffix } from "@/lib/level-details"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      article_type,
      original_content,
      modified_content,
      modified_section,
      user_id,
      level: levelRaw,
      language,
    } = body
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(
      level,
      article_type === "letter" ? "letter" : article_type === "review" ? "book" : "story"
    )

    if (!original_content || !modified_content) {
      return NextResponse.json(
        { error: "original_content and modified_content are required" },
        { status: 400 }
      )
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const languageRule =
      language === "zh"
        ? " Reply in Simplified Chinese. The student's story text is English and must stay English — do not rewrite it in Chinese."
        : " Reply in English."

    const intent = body.intent === "open" || original_content.trim() === modified_content.trim() ? "open" : "revise"
    const prompt =
      intent === "open"
        ? `You are Luna, a friendly elementary school English writing teacher. The student opened their finished ${article_type} to edit it.

Their ${article_type}:
${original_content}

${modified_section ? `Focus on this section if useful: ${modified_section}` : ""}

Give 2-3 short, specific, encouraging tips for making it even better. Do NOT rewrite the whole piece. Keep it around 40-60 words, warm and simple for ages 8-12. Use 1-2 emojis.${languageRule}${levelSuffix}`
        : `You are Luna, a friendly and encouraging elementary school English writing teacher assistant. A student has made some changes to their ${article_type}.

Original content:
${original_content}

Modified content:
${modified_content}

${modified_section ? `The student modified this section: ${modified_section}` : ""}

IMPORTANT: Analyze the content carefully. If the content is just test words (like "test", "testtest", random letters, or placeholder text), do NOT praise it. Instead, gently encourage them to write real content. Only praise when there is actual meaningful writing.

Please provide helpful, encouraging feedback and suggestions for improvement. Use a friendly, warm tone suitable for elementary school students. Include emojis to make it more engaging.

Guidelines:
1. If the content is meaningful and shows effort: Praise what they did well, then give specific suggestions
2. If the content is just test/placeholder text: Gently encourage them to write real content, don't praise test content
3. Always provide specific, actionable suggestions for improvement
4. Be encouraging but honest - don't give false praise

Do NOT rewrite the entire article. Only provide feedback and suggestions. Keep your response concise (around 30-50 words). Be conversational and warm, like a caring teacher.${languageRule}${levelSuffix}`

    const suggestion = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    return NextResponse.json({ success: true, suggestion })
  } catch (error) {
    console.error("Edit Assistant API Error:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
