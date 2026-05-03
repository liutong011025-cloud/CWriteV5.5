import { NextRequest, NextResponse } from "next/server"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

const VALUE_LIKE_CODE = process.env.CAGENT_VALUES_LIKE_CODE || "CAGENTLIKE"

const VALUES_FRAMEWORK = `
The Hong Kong Values Education Curriculum Framework (試行版) emphasises ten core values: 堅毅 Perseverance, 尊重他人 Respect for others, 責任感 Responsibility, 國民身份認同 National identity, 承擔精神 Commitment, 誠信 Integrity, 關愛 Care, 守法 Law-abiding, 同理心 Empathy, 勤勞 Diligence.
Content should align with these values. Reject content that: promotes violence, bullying, discrimination, dishonesty, disrespect for others or the law, harm to self or others, or that contradicts care, empathy, or national identity in a negative way. Content for elementary students must be age-appropriate and positive.
`.trim()

export async function POST(request: NextRequest) {
  try {
    const { stage, content, user_id } = await request.json()
    const text = typeof content === "string" ? content : JSON.stringify(content)

    if (!isConfigured()) {
      return NextResponse.json({ compliant: true })
    }

    const prompt = `You are a values education checker for a children's creative writing app. Use this framework:
${VALUES_FRAMEWORK}

Stage/context: ${stage || "unknown"}
Student content to check:
---
${text.slice(0, 4000)}
---

Reply with JSON only, no other text:
1) If the content violates values:
{"compliant": false, "message": "Short explanation which value is not met (in English, simple).", "suggestion": "Short suggestion for a better version (in English)."}
2) If the content is acceptable but ordinary:
{"compliant": true, "valueSignal": "SIT"}
3) If the content clearly shows multi-dimensional positive values (for example empathy + responsibility + respect + care together):
{"compliant": true, "valueSignal": "${VALUE_LIKE_CODE}"}

Output valid JSON only.`

    let answer = ""
    try {
      answer = await chat({
        messages: [{ role: "user", content: prompt }],
      })
    } catch (err) {
      console.error("[dify-cagent-values] DeepSeek error:", err)
      return NextResponse.json({ compliant: true })
    }

    try {
      const start = answer.indexOf("{")
      const end = answer.lastIndexOf("}") + 1
      const jsonStr = start >= 0 && end > start ? answer.slice(start, end) : answer
      const parsed = JSON.parse(jsonStr)
      const compliant = parsed.compliant !== false
      return NextResponse.json({
        compliant,
        message: parsed.message || null,
        suggestion: parsed.suggestion || null,
        valueSignal: typeof parsed.valueSignal === "string" ? parsed.valueSignal : "SIT",
      })
    } catch {
      return NextResponse.json({ compliant: true, valueSignal: "SIT" })
    }
  } catch (error) {
    console.error("[dify-cagent-values] Error:", error)
    return NextResponse.json({ compliant: true, valueSignal: "SIT" })
  }
}
