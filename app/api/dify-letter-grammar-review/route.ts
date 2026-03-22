import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1'
const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
// 使用letter guide的app ID，或者可以创建一个专门的语法检查机器人
const DIFY_LETTER_APP_ID = 'app-3iAjb8MCQEXkUxcjvky6lhXt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, type, recipient, occasion, bookTitle, reviewType, user_id } = body

    // 支持多种类型：letter, story, review
    const content = text || body.letter || body.story || body.review
    const contentType = type || (body.letter ? 'letter' : body.story ? 'story' : body.review ? 'review' : 'letter')

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (!DIFY_API_KEY) {
      console.error('DIFY_API_KEY not configured')
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }

    // 构建提示词，要求AI返回结构化的语法错误信息
    let contextInfo = ''
    if (contentType === 'letter') {
      contextInfo = `Letter to: ${recipient || 'Recipient'}\nOccasion: ${occasion || 'General'}`
    } else if (contentType === 'story') {
      contextInfo = `This is a creative story.`
    } else if (contentType === 'review') {
      contextInfo = `Book Review Type: ${reviewType || 'General'}\nBook Title: ${bookTitle || 'Unknown'}`
    }

    const prompt = `You are an English grammar checker. Review the following ${contentType} and identify ALL grammar, spelling, and punctuation errors.

${contextInfo}

${contentType.charAt(0).toUpperCase() + contentType.slice(1)} content:
${content}

IMPORTANT: You must return a JSON array of errors in the following exact format:
[
  {
    "start": <character_index_start>,
    "end": <character_index_end>,
    "original": "<the_incorrect_text>",
    "corrected": "<the_corrected_text>",
    "issue": "<brief_description_of_the_error>"
  }
]

Rules:
1. Only include actual errors (grammar, spelling, punctuation)
2. CRITICAL: You must identify the PROBLEM WORD only, NOT the position.
   - original: The incorrect word ONLY (no spaces, no punctuation, just the word)
   - corrected: The corrected word ONLY (no spaces, no punctuation, just the word)
   - start and end: You can set these to 0, they will be ignored. We will find the word in the text automatically.
   - ONLY identify the single word that has the error, not phrases or sentences
3. original MUST be ONLY the incorrect word, NO spaces, NO punctuation, NO surrounding words
4. corrected MUST be ONLY the corrected word, NO spaces, NO punctuation
5. issue MUST include both the error type AND a brief explanation in this format: "Error Type: Brief explanation"
   - For example: "Subject-verb agreement: 'go' should be 'goes' with third person singular subject"
   - For example: "Spelling error: 'tresure' should be spelled 'treasure'"
   - For example: "Missing comma: A comma is needed after 'library'"
   - Keep the explanation very brief (one short sentence)
6. start and end can be set to 0 (they will be recalculated automatically)
7. If there are no errors, return an empty array: []
8. Return ONLY the JSON array, no other text before or after
9.首字母如果前一句话是逗号表示没有结束，这一句开头不用大写。

Example format:
[
  {
    "start": 0,
    "end": 0,
    "original": "are",
    "corrected": "am",
    "issue": "Subject-verb agreement: 'are' should be 'am' with first person singular subject"
  },
  {
    "start": 0,
    "end": 0,
    "original": "go",
    "corrected": "goes",
    "issue": "Subject-verb agreement: 'go' should be 'goes' with third person singular subject"
  },
  {
    "start": 0,
    "end": 0,
    "original": "tresure",
    "corrected": "treasure",
    "issue": "Spelling error: 'tresure' should be spelled 'treasure'"
  }
]`

    const url = `${DIFY_BASE_URL}/chat-messages`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }

    const requestBody: any = {
      inputs: {
        content_type: contentType,
        recipient: recipient || '',
        occasion: occasion || '',
        bookTitle: bookTitle || '',
        reviewType: reviewType || '',
        content: content,
      },
      query: prompt,
      response_mode: 'blocking',
      user: user_id || 'default-user',
      app_id: DIFY_LETTER_APP_ID,
    }

    console.log('Grammar Review API Request:', JSON.stringify({
      url,
      app_id: DIFY_LETTER_APP_ID,
      user: user_id,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API Error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.answer || data.message || '[]'

    // 尝试解析JSON响应
    let errors = []
    try {
      // 尝试从响应中提取JSON数组
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0])
      } else {
        // 如果找不到JSON，尝试直接解析整个响应
        errors = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('AI Response:', aiResponse)
      // 如果解析失败，返回空数组
      errors = []
    }

    // 验证错误格式
    if (!Array.isArray(errors)) {
      errors = []
    }

    // 不去重，保留所有错误（因为AI可能为不同位置的相同单词返回多个错误）
    const validErrors = errors.filter((error: any) => error.original && error.corrected)

    // 处理错误：根据单词在文本中查找位置并扩展为完整单词
    // 如果AI返回了多个相同的错误，为每个错误标记不同的位置
    const processedErrors: any[] = []
    const usedPositions = new Set<string>() // 跟踪已使用的位置，避免重复
    const errorCountMap = new Map<string, number>() // 跟踪每个错误单词已处理的数量

    validErrors.forEach((error: any) => {
      const word = error.original.trim()
      
      // 在文本中查找单词位置（不区分大小写，支持单词边界）
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = Array.from(content.matchAll(wordRegex))
      
      if (matches.length === 0) {
        // 如果找不到精确匹配，尝试模糊匹配（去除标点）
        const wordWithoutPunct = word.replace(/[.,!?;:]/g, '')
        const fuzzyRegex = new RegExp(`\\b${wordWithoutPunct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        const fuzzyMatches = Array.from(content.matchAll(fuzzyRegex))
        
        if (fuzzyMatches.length > 0) {
          // 根据错误出现的次数，选择对应的匹配位置
          const errorKey = `${error.original.toLowerCase()}_${error.corrected.toLowerCase()}`
          const errorIndex = errorCountMap.get(errorKey) || 0
          errorCountMap.set(errorKey, errorIndex + 1)
          
          // 如果匹配数量少于错误索引，说明没有足够的匹配位置，跳过
          if (errorIndex >= fuzzyMatches.length) {
            return
          }
          
          // 使用对应索引的匹配位置
          const match = fuzzyMatches[errorIndex]
          const matchStart = match.index || 0
          const matchEnd = matchStart + match[0].length
          const positionKey = `${matchStart}-${matchEnd}`
          
          // 检查位置是否已被使用
          if (usedPositions.has(positionKey)) {
            return
          }
          
          // 扩展为完整单词（不包含前后空格和标点）
          let start = matchStart
          let end = matchEnd
          
          // 向前扩展直到遇到空格、标点或行首
          while (start > 0 && !/\s/.test(content[start - 1]) && !/[.,!?;:]/.test(content[start - 1])) {
            start--
          }
          
          // 向后扩展直到遇到空格、标点或行尾
          while (end < content.length && !/\s/.test(content[end]) && !/[.,!?;:]/.test(content[end])) {
            end++
          }
          
          const finalPositionKey = `${start}-${end}`
          if (!usedPositions.has(finalPositionKey)) {
            usedPositions.add(finalPositionKey)
            processedErrors.push({
              ...error,
              start,
              end,
            })
          }
        }
        return
      }

      // 根据错误出现的次数，选择对应的匹配位置
      const errorKey = `${error.original.toLowerCase()}_${error.corrected.toLowerCase()}`
      const errorIndex = errorCountMap.get(errorKey) || 0
      errorCountMap.set(errorKey, errorIndex + 1)
      
      // 如果匹配数量少于错误索引，说明没有足够的匹配位置，跳过
      if (errorIndex >= matches.length) {
        return
      }
      
      // 使用对应索引的匹配位置
      const match = matches[errorIndex]
      const matchStart = match.index || 0
      const matchEnd = matchStart + match[0].length
      const positionKey = `${matchStart}-${matchEnd}`
      
      // 检查位置是否已被使用
      if (usedPositions.has(positionKey)) {
        return
      }
      
      // 扩展为完整单词（不包含前后空格和标点）
      let start = matchStart
      let end = matchEnd
      
      // 向前扩展直到遇到空格、标点或行首
      while (start > 0 && !/\s/.test(content[start - 1]) && !/[.,!?;:]/.test(content[start - 1])) {
        start--
      }
      
      // 向后扩展直到遇到空格、标点或行尾
      while (end < content.length && !/\s/.test(content[end]) && !/[.,!?;:]/.test(content[end])) {
        end++
      }
      
      const finalPositionKey = `${start}-${end}`
      if (!usedPositions.has(finalPositionKey)) {
        usedPositions.add(finalPositionKey)
        processedErrors.push({
          ...error,
          start,
          end,
        })
      }
    })

    // 记录 API 调用
    try {
      await logApiCall(
        user_id || 'default-user',
        'grammarReview',
        '/api/dify-letter-grammar-review',
        { type: contentType, content: content.substring(0, 100) },
        { errorCount: errors.length }
      )
    } catch (logError) {
      console.error('Error logging API call:', logError)
    }

    return NextResponse.json({
      success: true,
      errors: processedErrors,
    })
  } catch (error) {
    console.error('Grammar Review API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
