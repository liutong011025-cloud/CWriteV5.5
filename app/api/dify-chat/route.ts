import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY ||
  'sk-1101bd83b9f647588cb786372e68f441'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id, conversation_history } = await request.json()

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY not configured' },
        { status: 500 }
      )
    }

    const url = `${DEEPSEEK_BASE_URL}/chat/completions`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    }

    const normalizedConversationId =
      typeof conversation_id === 'string' && conversation_id.trim().length > 0
        ? conversation_id
        : crypto.randomUUID()

    const mappedHistory: ChatMsg[] = Array.isArray(conversation_history)
      ? conversation_history
          .map((m: any) => {
            if (!m || typeof m.content !== 'string') return null
            if (m.role === 'user') return { role: 'user' as const, content: m.content }
            if (m.role === 'ai' || m.role === 'assistant') return { role: 'assistant' as const, content: m.content }
            if (m.role === 'system') return { role: 'system' as const, content: m.content }
            return null
          })
          .filter(Boolean) as ChatMsg[]
      : []

    const requestMessages: ChatMsg[] =
      mappedHistory.length > 0
        ? mappedHistory
        : [{ role: 'user', content: typeof message === 'string' ? message : '' }]

    console.log('Dify Chat API Request:', JSON.stringify({
      url,
      model: 'deepseek-chat',
      has_conversation_id: !!conversation_id,
    }, null, 2))

    const callDeepSeek = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: requestMessages,
          stream: false,
          temperature: 0.7,
        }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('DeepSeek API error:', errorText)
        return { ok: false as const, status: response.status, statusText: response.statusText, data: null as Record<string, unknown> | null }
      }
      const data = (await response.json()) as Record<string, unknown>
      return { ok: true as const, status: 200, statusText: 'OK', data }
    }

    let firstTry = await callDeepSeek()
    if (!firstTry.ok || !firstTry.data) {
      return NextResponse.json(
        { error: `DeepSeek API error: ${firstTry.statusText}` },
        { status: firstTry.status }
      )
    }

    let data = firstTry.data
    const choices = Array.isArray(data.choices) ? data.choices : []
    const firstChoice = choices[0] as Record<string, unknown> | undefined
    const msgObj = firstChoice?.message as Record<string, unknown> | undefined
    let answerText = typeof msgObj?.content === 'string' ? msgObj.content.trim() : ''

    // 偶发空回复：自动重试一次，避免前端出现“无回答”
    if (!answerText) {
      const secondTry = await callDeepSeek()
      if (secondTry.ok && secondTry.data) {
        data = secondTry.data
        const retryChoices = Array.isArray(data.choices) ? data.choices : []
        const retryFirst = retryChoices[0] as Record<string, unknown> | undefined
        const retryMsg = retryFirst?.message as Record<string, unknown> | undefined
        answerText = typeof retryMsg?.content === 'string' ? retryMsg.content.trim() : ''
      }
    }

    const messageId = typeof data.id === 'string' ? data.id : ''
    
    // 记录API调用
    await logApiCall(
      user_id,
      'plot',
      '/api/dify-chat',
      { message, conversation_id },
      { answer: answerText, conversation_id: normalizedConversationId, message_id: messageId }
    )
    
    return NextResponse.json({
      answer: answerText || "I did not catch that. Please answer in one short phrase.",
      conversation_id: normalizedConversationId,
      message_id: messageId || null,
    })
  } catch (error) {
    console.error('Error calling Dify API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

