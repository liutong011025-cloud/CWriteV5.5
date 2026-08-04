import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { FalImageError, generateFalImage, normalizeFalAspectRatio } from '@/lib/fal-images'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prompt = body.prompt
    const aspectRatio = body.aspect_ratio || '1:1' // 允许从请求中指定宽高比
    const userId = body.user_id // 从请求中获取user_id
    // Support both stage and type: type "background" -> dramaBackground, "character" -> dramaCharacter
    let stage = body.stage
    if (!stage && body.type === 'background') stage = 'dramaBackground'
    if (!stage && body.type === 'character') stage = 'dramaCharacter'
    if (!stage) stage = 'character'

    console.log('Received prompt:', prompt)
    console.log('Prompt type:', typeof prompt)
    console.log('Prompt length:', prompt?.length)
    console.log('Aspect ratio:', aspectRatio)

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      console.error('Invalid prompt:', prompt)
      return NextResponse.json(
        { error: 'Prompt cannot be empty' },
        { status: 400 }
      )
    }

    // 根据场景选择输出格式：角色图优先 PNG，背景图保持 JPEG
    const outputFormat = stage === 'dramaCharacter' ? 'png' : 'jpeg'
    const normalizedAspectRatio = normalizeFalAspectRatio(aspectRatio)
    
    // 角色图尽量保持干净背景，方便在剧情场景中复用。
    let finalPrompt = prompt.trim()
    if (stage === 'dramaCharacter') {
      finalPrompt = `${finalPrompt}, cute cartoon style, friendly children's illustration, full-body character sprite only, isolated subject, no background, transparent alpha background, clean cutout edges, sticker style, no shadow, no scenery, no props, png with transparency`
    } else if (stage === 'dramaBackground') {
      finalPrompt = `${finalPrompt}, painterly semi-realistic background art, photorealistic texture, more realistic lighting, natural materials, subtle depth of field, cinematic atmosphere, detailed environment, background only, no people, no characters, no persons, landscape or setting only, empty scene background, composition with clear negative space in the center for character placement, keep the exact center area relatively plain and soft-blurred (no major objects/silhouettes/text), avoid foreground elements covering the middle, if any ground/terrain exists place it mostly at the bottom only, avoid cartoon, avoid anime, avoid sticker, avoid illustration, avoid flat vector`
    }

    console.log('Sending request to Fal image API:')
    console.log('Aspect ratio:', normalizedAspectRatio)
    console.log('Output format:', outputFormat)

    const result = await generateFalImage({
      prompt: finalPrompt,
      aspectRatio: normalizedAspectRatio,
      outputFormat,
      resolution: '1K',
    })

    await logApiCall(
      userId,
      stage,
      '/api/generate-image (Fal Nano Banana 2)',
      { prompt, aspect_ratio: normalizedAspectRatio },
      { imageUrl: result.imageUrl, description: result.description }
    )

    return NextResponse.json({
      imageUrl: result.imageUrl,
      description: result.description || ''
    })

  } catch (error) {
    console.error('Error generating image:', error)
    if (error instanceof FalImageError) {
      return NextResponse.json(
        { error: error.detail ? `${error.message} ${error.detail}` : error.message },
        { status: error.status || 500 }
      )
    }
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}

