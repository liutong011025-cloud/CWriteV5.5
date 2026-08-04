import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'
import { ArkImageError, generateArkImage, getImageSizeFromAspectRatio } from '@/lib/ark-images'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bookTitle = body.bookTitle
    const userId = body.user_id

    if (!bookTitle || typeof bookTitle !== 'string' || bookTitle.trim() === '') {
      return NextResponse.json(
        { error: 'Book title cannot be empty' },
        { status: 400 }
      )
    }

    // 生成拟真风格的书封面，正对视角，不倾斜
    const prompt = `Professional book cover for "${bookTitle}". Realistic hardcover book, front view, straight perspective, no tilt or angle. Elegant typography on front cover, realistic textures, bookstore quality, professional book design.`
    const size = getImageSizeFromAspectRatio('2:3')

    console.log('=== Generating Book Cover ===')
    console.log('Book Title:', bookTitle)
    console.log('Ark image size:', size)
    console.log('============================')

    const result = await generateArkImage({
      prompt,
      size,
      outputFormat: 'jpeg',
    })

    await logApiCall(
      userId,
      'bookReviewWriting',
      '/api/generate-book-cover (Volcengine Ark)',
      { bookTitle, size },
      { imageUrl: result.imageUrl }
    )

    return NextResponse.json({
      imageUrl: result.imageUrl,
    })

  } catch (error) {
    console.error('Error generating book cover:', error)
    if (error instanceof ArkImageError) {
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

