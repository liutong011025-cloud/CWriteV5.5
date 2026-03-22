import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { extractDifyAnswer } from '@/lib/extract-dify-answer'

const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_CHAT_APP_ID = 'app-TFDykrjN8LpJROY6eTRNjwo5'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { message, conversation_id, user_id } = await request.json()

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

    const queryText = typeof message === 'string' ? message.trim() : ''
    if (!queryText) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const url = `${DIFY_BASE_URL}/chat-messages`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }

    const scopedUser = `${user_id || 'default-user'}::plot-chat`
    const requestBody = {
      inputs: {},
      query: queryText,
      response_mode: 'blocking',
      conversation_id:
        typeof conversation_id === 'string' && conversation_id.trim().length > 0
          ? conversation_id
          : undefined,
      user: scopedUser,
      app_id: DIFY_CHAT_APP_ID,
    }

    console.log('Dify Chat API Request:', JSON.stringify({
      url,
      app_id: DIFY_CHAT_APP_ID,
      has_conversation_id: !!conversation_id,
    }, null, 2))

    const callDify = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(110_000),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Dify Chat API error:', errorText)
        return { ok: false as const, status: response.status, statusText: response.statusText, data: null as Record<string, unknown> | null }
      }
      const data = (await response.json()) as Record<string, unknown>
      return { ok: true as const, status: 200, statusText: 'OK', data }
    }

    let firstTry = await callDify()
    if (!firstTry.ok || !firstTry.data) {
      return NextResponse.json(
        { error: `Dify API error: ${firstTry.statusText}` },
        { status: firstTry.status }
      )
    }

    let data = firstTry.data
    let answerText = extractDifyAnswer(data)

    if (!answerText) {
      const secondTry = await callDify()
      if (secondTry.ok && secondTry.data) {
        data = secondTry.data
        answerText = extractDifyAnswer(data)
      }
    }

    const messageId = typeof data.message_id === 'string' ? data.message_id : null
    const responseConversationId =
      typeof data.conversation_id === 'string' && data.conversation_id.trim().length > 0
        ? data.conversation_id
        : typeof conversation_id === 'string'
          ? conversation_id
          : ''

    await logApiCall(
      user_id,
      'plot',
      '/api/dify-chat',
      { message, conversation_id },
      { answer: answerText, conversation_id: responseConversationId, message_id: messageId }
    )

    return NextResponse.json({
      answer:
        answerText ||
        'Could you answer in one short phrase? I will use it to continue your story plan.',
      conversation_id: responseConversationId,
      message_id: messageId,
    })
  } catch (error) {
    console.error('Error calling Dify Chat API:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Dify chat timed out. Please try again.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

