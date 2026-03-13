import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_APP_ID = 'app-TFDykrjN8LpJROY6eTRNjwo5'
const DIFY_BASE_URL = 'https://api.dify.ai/v1'

export async function POST(request: NextRequest) {
  try {
    const { content, userId, isSuggestion } = await request.json()

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    let prompt = ''
    if (isSuggestion) {
      prompt = content // content已经是完整的prompt
    } else {
      prompt = `请总结以下drama内容，用小学生口吻，不要添加任何新内容，只总结已知信息。内容如下：\n\n${content}\n\n请用简单易懂的语言，以小学生口吻总结这个drama故事。`
    }

    const url = `${DIFY_BASE_URL}/chat-messages`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }
    
    const requestBody: any = {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      user: userId || 'default-user',
      app_id: DIFY_APP_ID,
    }

    console.log('Dify Drama Summary API Request:', JSON.stringify({
      url,
      app_id: DIFY_APP_ID,
      isSuggestion,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const summary = data.answer || data.message || ''

    // 记录API调用
    await logApiCall(
      userId || 'default-user',
      'dramaComplete',
      '/api/dify-drama-summary',
      { content, isSuggestion },
      { summary, conversation_id: data.conversation_id, message_id: data.id }
    )

    return NextResponse.json({
      summary,
      conversationId: data.conversation_id,
      messageId: data.id,
    })
  } catch (error) {
    console.error('Drama summary API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
