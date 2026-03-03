import { NextRequest, NextResponse } from "next/server"

const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages"
const DIFY_API_KEY = process.env.DIFY_API_KEY || "app-TFDykrjN8LpJROY6eTRNjwo5"

const VALUES_FRAMEWORK = `
The Hong Kong Values Education Curriculum Framework (試行版) emphasises ten core values: 堅毅 Perseverance, 尊重他人 Respect for others, 責任感 Responsibility, 國民身份認同 National identity, 承擔精神 Commitment, 誠信 Integrity, 關愛 Care, 守法 Law-abiding, 同理心 Empathy, 勤勞 Diligence.
Content should align with these values. Reject content that: promotes violence, bullying, discrimination, dishonesty, disrespect for others or the law, harm to self or others, or that contradicts care, empathy, or national identity in a negative way. Content for elementary students must be age-appropriate and positive.
`.trim()

/**
 * Cagent values check: judge if student writing/content complies with values education framework.
 * Returns { compliant: boolean, message?: string, suggestion?: string }.
 */
export async function POST(request: NextRequest) {
  try {
    const { stage, content, user_id } = await request.json()
    const text = typeof content === "string" ? content : JSON.stringify(content)

    const prompt = `You are a values education checker for a children's creative writing app. Use this framework:
${VALUES_FRAMEWORK}

Stage/context: ${stage || "unknown"}
Student content to check:
---
${text.slice(0, 4000)}
---

Reply with JSON only, no other text:
{"compliant": true} if the content is fine and aligns with positive values.
{"compliant": false, "message": "Short explanation which value is not met (in English, simple).", "suggestion": "Short suggestion for a better version (in English)."} if the content violates the framework.

Output valid JSON only.`

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
        user: user_id || "cagent-values-user",
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("[dify-cagent-values] Dify error:", response.status, errText)
      return NextResponse.json({ compliant: true })
    }

    const data = await response.json()
    const answer = (data.answer || "").trim()

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
      })
    } catch {
      return NextResponse.json({ compliant: true })
    }
  } catch (error) {
    console.error("[dify-cagent-values] Error:", error)
    return NextResponse.json({ compliant: true })
  }
}
