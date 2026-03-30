/** 从 Dify chat-messages / workflow 等响应中取出可展示的文本 */
export function extractDifyAnswer(data: Record<string, unknown>): string {
  const pick = (v: unknown) => (typeof v === "string" ? v.trim() : "")
  const a = pick(data.answer)
  if (a) return a
  const m = pick(data.message)
  if (m) return m
  const text = pick(data.text)
  if (text) return text
  const d = data.data
  if (d && typeof d === "object" && d !== null) {
    const outputs = (d as Record<string, unknown>).outputs
    if (outputs && typeof outputs === "object" && outputs !== null) {
      const o = outputs as Record<string, unknown>
      for (const k of ["text", "answer", "result", "output"]) {
        const s = pick(o[k])
        if (s) return s
      }
    }
  }
  return ""
}
