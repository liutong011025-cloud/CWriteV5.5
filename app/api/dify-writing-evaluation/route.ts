import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { getLevelPromptSuffix } from '@/lib/level-details'

const DIFY_API_KEY = process.env.DIFY_API_KEY || ''
const DIFY_WRITING_EVAL_APP_ID = 'app-wLT4t7SzLiDXIkTyAu1jfwOK' // Luna Writing Evaluation
const DIFY_BASE_URL = 'https://api.dify.ai/v1'
const GOOD_ENOUGH_CODE = process.env.CAGENT_GOOD_ENOUGH_CODE || "CAGENTGOODENOUGH"

export async function POST(request: NextRequest) {
  try {
    const { text, character, plot, structure, current_section, user_id, level: levelRaw } = await request.json()
    const level = Math.min(5, Math.max(1, Number(levelRaw) || 1))
    const levelSuffix = getLevelPromptSuffix(level, 'story')

    if (!DIFY_API_KEY) {
      return NextResponse.json(
        { error: 'DIFY_API_KEY not configured' },
        { status: 500 }
      )
    }
    
    console.log('Luna Writing Evaluation API - Using app ID:', DIFY_WRITING_EVAL_APP_ID)

    // 构建上下文信息
    const characterInfo = [
      `Character name: ${character?.name || 'Unknown'}`,
      character?.age ? `Age: ${character.age} years old` : '',
      character?.traits && character.traits.length > 0 ? `Traits: ${character.traits.join(', ')}` : '',
      character?.description ? `Description: ${character.description}` : '',
    ].filter(Boolean).join('\n')

    const plotInfo = [
      `Setting: ${plot?.setting || 'Unknown'}`,
      `Conflict: ${plot?.conflict || 'Unknown'}`,
      `Goal: ${plot?.goal || 'Unknown'}`,
    ].filter(Boolean).join('\n')

    const structureInfo = structure?.outline?.join(' -> ') || 'Unknown'
    const currentSectionName = structure?.outline?.[current_section] || 'Unknown'

    // 构建提示词：必須結合學生文本給出具體評價 + 下一步建議
    const prompt = `You are an elementary school English writing teacher. You evaluate students' writing based on their character, plot, and story structure. Use very simple English, short sentences, and a friendly tone for children.

Character Information:
${characterInfo}

Plot Information:
${plotInfo}

Story Structure: ${structure?.type || 'Unknown'}
Structure Steps: ${structureInfo}
Current Section Being Written: ${currentSectionName}

Student's Writing for Current Section:
${text || '(No text yet)'}

Please evaluate the student's writing for the current section. In 4-6 SHORT sentences:
- Sentence 1: mention one concrete detail from the student's text (for example a word, action, or idea) and praise it.
- Sentence 2-3: give 1-2 clear next-step suggestions for THIS section (tell the child what to add next).
- Sentence 4: quickly check grammar/spelling (say what is wrong, or say it is clear).
- Sentence 5: mention what positive values are shown (for example kindness, responsibility, respect), or say which value is missing.
- If writing is not good enough, clearly tell the child how to revise and improve before passing.
- Optional last sentence: short encouragement.
- Do NOT give generic comments like "Good start" alone.
- Do NOT write long paragraphs.

VERY IMPORTANT:
- If the student's text is nonsense or only a few random words, do NOT write "done".
- Only when the student writes a complete and good enough part, OR the total word count is more than 10, you add the word "done" on a NEW LINE at the very end of your answer (just the word done). Strictly follow this rule.
- If and only if you wrote "done", add one more NEW LINE with this exact secret code: "${GOOD_ENOUGH_CODE}".

${levelSuffix}`

    const url = `${DIFY_BASE_URL}/chat-messages`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`,
    }

    const requestBody: any = {
      inputs: {
        character_info: JSON.stringify(character || {}),
        plot_info: JSON.stringify(plot || {}),
        structure_info: JSON.stringify(structure || {}),
        current_text: text || '',
        current_section: currentSectionName,
      },
      query: prompt,
      response_mode: 'blocking',
      user: user_id || 'default-user',
      app_id: DIFY_WRITING_EVAL_APP_ID, // 指定使用正确的机器人
    }

    console.log('Luna API Request:', JSON.stringify({
      url,
      app_id: DIFY_WRITING_EVAL_APP_ID,
      user: user_id,
      current_section: currentSectionName,
    }, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify Writing Evaluation API error:', errorText)
      return NextResponse.json(
        { error: `Dify API error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Luna API Response:', JSON.stringify({
      has_answer: !!data.answer,
      answer_length: data.answer?.length || 0,
      conversation_id: data.conversation_id,
    }, null, 2))
    
    const evaluation = data.answer || ''
    
    // 检查是否包含"done"（不区分大小写）
    const hasDone = /\bdone\b/i.test(evaluation)
    const hasSecretCode = evaluation.includes(GOOD_ENOUGH_CODE)
    
    // 移除控制信号，避免直接展示在前端反馈文本中
    const cleanEvaluation = evaluation
      .replace(/\bdone\b/gi, '')
      .replace(new RegExp(GOOD_ENOUGH_CODE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
      .trim()

    // 记录API调用
    await logApiCall(
      user_id,
      'writing',
      '/api/dify-writing-evaluation',
      { text, character, plot, structure, current_section },
      { evaluation: cleanEvaluation, done: hasDone, secretCodeDetected: hasSecretCode }
    )

    return NextResponse.json({
      evaluation: cleanEvaluation,
      done: hasDone,
      secretCodeDetected: hasSecretCode,
      secretCode: hasSecretCode ? GOOD_ENOUGH_CODE : null,
    })
  } catch (error) {
    console.error('Error calling Dify Writing Evaluation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

