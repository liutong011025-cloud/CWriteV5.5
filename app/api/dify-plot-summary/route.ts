import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { extractDifyAnswer } from '@/lib/extract-dify-answer'

// 使用环境变量中的 DIFY_API_KEY（这是真正的 API Key）
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_PLOT_SUMMARY_APP_ID = 'app-HgMPyyxKQNPk2ZZP6znDalkp'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const SETTING_WORDS = new Set([
  'school', 'park', 'forest', 'beach', 'city', 'village', 'castle', 'home', 'library', 'mountain', 'spaceship',
])
const CONFLICT_WORDS = new Set([
  'storm', 'danger', 'dangerous', 'thief', 'monster', 'fire', 'trouble', 'broken', 'lost', 'noise', 'dark', 'sick',
  'trap', 'trapped', 'stuck', 'chase', 'chased',
])
const GOAL_WORDS = new Set([
  'save', 'help', 'find', 'protect', 'escape', 'win', 'discover', 'investigate', 'hide', 'fix', 'ask', 'call', 'tell',
])

const normalizeWord = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .trim()

const parseSummaryFields = (summaryText: string) => {
  const getField = (name: string) => {
    const m = summaryText.match(new RegExp(`^\\s*${name}[：:]\\s*(.+)$`, 'im'))
    return (m?.[1] || '').trim()
  }
  const setting = getField('setting') || 'unknown'
  const conflict = getField('conflict') || 'unknown'
  const goal = getField('goal') || 'unknown'
  const done = /\bdone\b/i.test(summaryText)
  return { setting, conflict, goal, done }
}

const extractByVocabulary = (studentMessages: string[]) => {
  const normalizedMessages = studentMessages
    .map((m) => normalizeWord(m))
    .map((m) => m.split(/\s+/).filter(Boolean).slice(0, 6).join(' '))
    .filter(Boolean)

  let setting = 'unknown'
  let conflict = 'unknown'
  let goal = 'unknown'

  for (let i = 0; i < normalizedMessages.length; i++) {
    const words = normalizedMessages[i].split(/\s+/).filter(Boolean)
    for (let wi = 0; wi < words.length; wi++) {
      const w = words[wi]
      if (setting === 'unknown' && SETTING_WORDS.has(w)) setting = w
      if (conflict === 'unknown' && CONFLICT_WORDS.has(w)) conflict = w
      if (goal === 'unknown' && GOAL_WORDS.has(w)) {
        // 优先保留动词+宾语（例如 "call teacher"）
        const goalPhrase = [w, words[wi + 1]].filter(Boolean).join(' ').trim()
        goal = goalPhrase || w
      }
    }
  }

  // 兜底：按对话节奏补齐字段，确保6轮内尽量收敛
  if (setting === 'unknown' && normalizedMessages[0]) setting = normalizedMessages[0]
  if (conflict === 'unknown' && normalizedMessages.length >= 4) conflict = normalizedMessages[Math.min(3, normalizedMessages.length - 1)]
  if (goal === 'unknown' && normalizedMessages.length >= 6) {
    goal = normalizedMessages.slice(-2).join(' ').split(/\s+/).slice(0, 3).join(' ').trim() || 'unknown'
  } else if (goal === 'unknown' && normalizedMessages.length >= 5) {
    goal = normalizedMessages[normalizedMessages.length - 1] || 'unknown'
  }

  const done = setting !== 'unknown' && conflict !== 'unknown' && goal !== 'unknown'
  const summary = `setting: ${setting}\nconflict: ${conflict}\ngoal: ${goal}${done ? '\ndone' : ''}`
  return { summary, setting, conflict, goal, done }
}

export async function POST(request: NextRequest) {
  try {
    const { conversation_history, conversation_id, user_id } = await request.json()

    // 只使用学生的回答，忽略AI的回答（AI的回答是问句还带有六个单词，不是学生的想法）
    const studentMessages = conversation_history
      .filter((msg: { role: string; content: string }) => msg.role === 'user')
      .map((msg: { role: string; content: string }) => msg.content)
    
    // 构建对话历史文本（只包含学生的回答）
    const conversationText = studentMessages.join('\n\n')

    if (!conversationText || conversationText.trim() === '') {
      return NextResponse.json(
        { error: 'No conversation history provided' },
        { status: 400 }
      )
    }

    console.log('Plot Summary - Conversation history:', conversationText)
    console.log('Plot Summary - Conversation history length:', conversationText.length)

    // Dify API configuration - 直接将对话历史传递给总结机器人
    const url = `${DIFY_BASE_URL}/chat-messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }
    
    // 总结机器人：仅按学生“明确提到”的内容提取，不推测/补全
    const studentMessageCount = studentMessages.length

    // 至少需要1轮对话才开始总结
    if (studentMessageCount < 1) {
      return NextResponse.json({
        summary: '',
        conversation_id: conversation_id,
        needsMoreConversation: true,
      })
    }

    // 本地兜底抽取：Dify 为空或超时时仍可返回结构化结果
    const localFallback = extractByVocabulary(studentMessages)

    if (!DIFY_API_KEY) {
      return NextResponse.json({
        summary: localFallback.summary,
        conversation_id: conversation_id,
        source: 'local_fallback_no_api_key',
      })
    }

    // 只发送本轮增量信息，配合 conversation_id 复用上下文，减少重复 token
    const latestStudentMessage = studentMessages[studentMessages.length - 1] || ''
    const queryMessage = `Extract plot fields from student's words only.
Latest student message:
${latestStudentMessage}
Student message count: ${studentMessageCount}

Output exactly:
setting: [value or unknown]
conflict: [value or unknown]
goal: [value or unknown]
[optional] done

Rules:
- No inference.
- unknown when not explicit.
- done only if all three are not unknown.`
    
    const scopedUser = `${user_id || 'default-user'}::plot-summary`

    const requestBody: any = {
      inputs: {
        conversation: conversationText, // 对话历史作为输入变量（如果Dify机器人需要）
      },
      query: queryMessage, // 查询消息包含完整对话，确保AI能看到
      response_mode: 'blocking',
      // 复用同一个总结会话，避免每次请求都新建对话导致上下文断裂
      conversation_id: conversation_id || undefined,
      user: scopedUser,
      app_id: DIFY_PLOT_SUMMARY_APP_ID, // 指定使用正确的机器人
    }
    
    console.log('Plot Summary API Request:', JSON.stringify({
      url,
      app_id: DIFY_PLOT_SUMMARY_APP_ID,
      has_conversation_id: !!conversation_id,
      conversation_length: conversationText.length,
    }, null, 2))

    const callDify = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(45_000),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Dify Plot Summary API error:', errorText)
        return { ok: false as const, status: response.status, statusText: response.statusText, data: null as Record<string, unknown> | null }
      }
      const data = (await response.json()) as Record<string, unknown>
      return { ok: true as const, status: 200, statusText: 'OK', data }
    }

    let data: Record<string, unknown> = {}
    let summaryText = ''
    const maxAttempts = 2
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await callDify()
      if (!result.ok || !result.data) {
        if (attempt < maxAttempts && RETRYABLE_STATUS.has(result.status)) {
          await sleep(attempt * 700)
          continue
        }
        return NextResponse.json({
          summary: localFallback.summary,
          conversation_id: conversation_id,
          source: `local_fallback_http_${result.status}`,
        })
      }
      data = result.data
      summaryText = extractDifyAnswer(data)
      if (summaryText) break
      if (attempt < maxAttempts) {
        await sleep(attempt * 700)
      }
    }
    console.log('Plot Summary - AI Response:', summaryText)
    
    // 记录API调用
    await logApiCall(
      user_id,
      'plot',
      '/api/dify-plot-summary',
      { conversation_history, conversation_id },
      { summary: summaryText, conversation_id: data.conversation_id }
    )
    
    if (!summaryText) {
      return NextResponse.json({
        summary: localFallback.summary,
        conversation_id: conversation_id,
        source: 'local_fallback_empty_summary',
      })
    }

    // Dify 若返回 unknown，用本地启发式补齐，避免多轮后仍无法收敛
    const parsed = parseSummaryFields(summaryText)
    const resolvedSetting =
      parsed.setting.toLowerCase() === 'unknown' ? localFallback.setting : parsed.setting
    const resolvedConflict =
      parsed.conflict.toLowerCase() === 'unknown' ? localFallback.conflict : parsed.conflict
    const resolvedGoal =
      parsed.goal.toLowerCase() === 'unknown' ? localFallback.goal : parsed.goal
    const resolvedDone =
      resolvedSetting.toLowerCase() !== 'unknown' &&
      resolvedConflict.toLowerCase() !== 'unknown' &&
      resolvedGoal.toLowerCase() !== 'unknown'
    const resolvedSummary = `setting: ${resolvedSetting}\nconflict: ${resolvedConflict}\ngoal: ${resolvedGoal}${resolvedDone ? '\ndone' : ''}`

    return NextResponse.json({
      summary: resolvedSummary,
      conversation_id: data.conversation_id, // 返回conversation_id，以便后续调用使用
    })
  } catch (error) {
    console.error('Error calling Dify Plot Summary API:', error)
    return NextResponse.json(
      {
        summary: 'setting: unknown\nconflict: unknown\ngoal: unknown',
        source: 'local_fallback_exception',
      }
    )
  }
}

