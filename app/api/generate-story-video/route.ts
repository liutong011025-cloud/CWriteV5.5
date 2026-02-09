import { NextRequest, NextResponse } from 'next/server'
import { logApiCall } from '@/lib/log-api-call'

// 直接在代码中配置 FAL Key（不依赖环境变量）
const FAL_KEY = 'fe7aa0cd-770b-4637-ab05-523a332169b4:dca9c9ff8f073a4c33704236d8942faa'
const FAL_VIDEO_API_ENDPOINT = 'https://fal.run/fal-ai/veo3/fast' // 使用 Veo 3 Fast 模型

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { story, character, plot, user_id, duration } = body

    if (!story) {
      return NextResponse.json(
        { error: 'Story content is required' },
        { status: 400 }
      )
    }

    // 构建视频提示词
    let videoPrompt = ''
    
    if (character && plot) {
      // 基于角色和情节构建提示词
      const characterDesc = character.name 
        ? `${character.name}${character.species ? `, a ${character.species}` : ''}${character.traits && character.traits.length > 0 ? ` with traits: ${character.traits.join(', ')}` : ''}`
        : 'a character'
      
      const settingDesc = plot.setting || 'a magical place'
      const conflictDesc = plot.conflict || 'a challenge'
      
      // 从故事中提取关键场景描述（前100个字符）
      const storyPreview = story.substring(0, 200).replace(/\n/g, ' ').trim()
      
      videoPrompt = `A cinematic scene showing ${characterDesc} in ${settingDesc}. ${storyPreview}. Beautiful, colorful, animated, storybook style, children's book illustration.`
    } else {
      // 如果没有角色和情节信息，直接从故事中提取
      const storyPreview = story.substring(0, 200).replace(/\n/g, ' ').trim()
      videoPrompt = `A cinematic animated scene: ${storyPreview}. Beautiful, colorful, animated, storybook style, children's book illustration.`
    }

    console.log('Story video prompt:', videoPrompt)

    // Veo 3 Fast 支持的参数
    const aspectRatio = '16:9' // 16:9 或 9:16
    const videoDuration = duration || '8s' // 4s, 6s, 或 8s
    const resolution = '720p' // 720p 或 1080p
    
    const requestBody = {
      prompt: videoPrompt.trim(),
      aspect_ratio: aspectRatio,
      duration: videoDuration,
      resolution: resolution,
      generate_audio: true,
      auto_fix: true,
    }

    // 使用 fal.ai API 生成视频
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 600000) // 600秒超时（10分钟）

    try {
      console.log('=== Starting Story Video Generation ===')
      console.log('Endpoint:', FAL_VIDEO_API_ENDPOINT)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(FAL_VIDEO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${FAL_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Fal.ai API error:', response.status, errorText)
        return NextResponse.json(
          { error: `Failed to generate video (${response.status}): ${errorText.substring(0, 200)}` },
          { status: response.status }
        )
      }

      const result = await response.json()
      console.log('Fal.ai video response:', JSON.stringify(result, null, 2))
      
      // Veo 3 Fast 返回格式：{ video: { url: "..." } }
      const videoUrl = result.video?.url || result.video_url || result.url || null
      
      if (!videoUrl) {
        console.error('No video URL in response. Full response:', JSON.stringify(result, null, 2))
        return NextResponse.json(
          { error: 'Failed to get video URL from response' },
          { status: 500 }
        )
      }
      
      // 记录API调用
      await logApiCall(
        user_id || 'default-user',
        'storyVideo',
        '/api/generate-story-video',
        { story: story.substring(0, 100), character: character?.name, plot: plot?.setting },
        { videoUrl }
      )
      
      console.log('Story video generation successful! URL:', videoUrl)
      
      return NextResponse.json({ 
        videoUrl,
        imageUrl: videoUrl, // 保持向后兼容
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout')
        return NextResponse.json(
          { error: 'Video generation timeout. Please try again.' },
          { status: 504 }
        )
      }
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: `Video generation error: ${fetchError.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating story video:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}
