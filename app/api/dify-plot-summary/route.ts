import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { getLevelPromptSuffix } from '@/lib/level-details'
import { extractDifyAnswer } from '@/lib/extract-dify-answer'

// 使用环境变量中的 DIFY_API_KEY（这是真正的 API Key）
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_PLOT_SUMMARY_APP_ID = 'app-HgMPyyxKQNPk2ZZP6znDalkp'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { conversation_history, conversation_id, user_id, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, 'story')

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

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

    // 构建提示词（严格证据提取）
    const queryMessage = `You are analyzing a student's plot brainstorming conversation. The student has had ${studentMessageCount} exchanges with the AI.

Student's conversation:
${conversationText}

REQUIREMENTS:
1) Extract ONLY what the student explicitly mentioned in their own words.
2) Do NOT infer, invent, or fill missing details.
3) If a field is not clearly mentioned, output exactly "unknown" for that field.
4) Keep each extracted value short (1-8 words), preserving student meaning.
5) Use the whole conversation context to decide meaning (not only the latest line).

Format your response exactly as:
setting: [setting or unknown]
conflict: [conflict or unknown]
goal: [goal or unknown]
[optional line: done only when all three are NOT unknown]

Only output "done" when setting/conflict/goal are all clearly present (none is unknown).${levelSuffix}`
    
    const scopedUser = `${user_id || 'default-user'}::plot-summary`

    const requestBody: any = {
      inputs: {
        conversation: conversationText, // 对话历史作为输入变量（如果Dify机器人需要）
      },
      query: queryMessage, // 查询消息包含完整对话，确保AI能看到
      response_mode: 'blocking',
      conversation_id: conversation_id || undefined, // 使用conversation_id保持总结机器人的对话上下文
      user: scopedUser,
      app_id: DIFY_PLOT_SUMMARY_APP_ID, // 指定使用正确的机器人
    }
    
    console.log('Plot Summary API Request:', JSON.stringify({
      url,
      app_id: DIFY_PLOT_SUMMARY_APP_ID,
      has_conversation_id: !!conversation_id,
      conversation_length: conversationText.length,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(110_000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify Plot Summary API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = (await response.json()) as Record<string, unknown>
    const summaryText = extractDifyAnswer(data)
    console.log('Plot Summary - AI Response:', summaryText)
    
    // 记录API调用
    await logApiCall(
      user_id,
      'plot',
      '/api/dify-plot-summary',
      { conversation_history, conversation_id },
      { summary: summaryText, conversation_id: data.conversation_id }
    )
    
    return NextResponse.json({
      summary: summaryText || '',
      conversation_id: data.conversation_id, // 返回conversation_id，以便后续调用使用
    })
  } catch (error) {
    console.error('Error calling Dify Plot Summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

