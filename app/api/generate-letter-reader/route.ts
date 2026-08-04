import { NextRequest, NextResponse } from 'next/server'
import { FalImageError, generateFalImage } from '@/lib/fal-images'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipient, occasion } = body

    console.log('=== Generating Letter Reader Image ===')
    console.log('Recipient:', recipient)
    console.log('Occasion:', occasion)

    if (!recipient || !occasion) {
      console.error('Missing recipient or occasion')
      return NextResponse.json(
        { error: 'Recipient and occasion are required' },
        { status: 400 }
      )
    }

    // 生成收信人读信的照片，读信人必须是学生自定义的 recipient
    const prompt = `${recipient} reading a letter, occasion: ${occasion}, realistic photo, sharp focus`

    console.log('Prompt:', prompt)
    console.log('Fal aspect ratio: 1:1')

    const result = await generateFalImage({
      prompt,
      aspectRatio: '1:1',
      outputFormat: 'jpeg',
      resolution: '1K',
    })

    return NextResponse.json({ imageUrl: result.imageUrl })
  } catch (error) {
    console.error('Error generating letter reader image:', error)
    if (error instanceof FalImageError) {
      return NextResponse.json(
        { error: error.detail ? `${error.message} ${error.detail}` : error.message, imageUrl: null },
        { status: error.status || 500 }
      )
    }
    // 返回 null 而不是抛出错误
    return NextResponse.json({ imageUrl: null })
  }
}


