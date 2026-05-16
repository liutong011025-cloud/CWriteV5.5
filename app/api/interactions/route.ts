import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { appendWritingEditRevision } from '@/lib/writing-revisions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // 从数据库查询用户（如果提供了userId）
    let user = null
    if (userId) {
      user = await prisma.user.findUnique({
        where: { username: userId },
      })
    }

    // 查询交互记录，包含关联的 stories、reviews、letters
    const where = user ? { userId: user.id } : {}
    const interactions = await prisma.interaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            role: true,
            noAi: true,
          },
        },
      },
    })

    // 查询关联的 stories、reviews、letters、dramas、poetries
    const storyIds = interactions.map(i => i.id).filter(Boolean)
    const stories = storyIds.length > 0 ? await prisma.story.findMany({
      where: { interactionId: { in: storyIds } },
    }) : []
    
    const reviews = storyIds.length > 0 ? await prisma.review.findMany({
      where: { interactionId: { in: storyIds } },
    }) : []
    
    const letters = storyIds.length > 0 ? await prisma.letter.findMany({
      where: { interactionId: { in: storyIds } },
    }) : []

    const dramas = storyIds.length > 0 ? await prisma.drama.findMany({
      where: { interactionId: { in: storyIds } },
    }) : []

    const poetries = storyIds.length > 0 ? await prisma.poetry.findMany({
      where: { interactionId: { in: storyIds } },
    }) : []

    // 创建映射以便快速查找
    const storyMap = new Map(stories.map(s => [s.interactionId, s]))
    const reviewMap = new Map(reviews.map(r => [r.interactionId, r]))
    const letterMap = new Map(letters.map(l => [l.interactionId, l]))
    const dramaMap = new Map(dramas.map(d => [d.interactionId, d]))
    const poetryMap = new Map(poetries.map(p => [p.interactionId, p]))

    // 转换为旧格式以保持兼容性，并包含关联数据
    const formattedInteractions = interactions.map((interaction) => {
      const story = storyMap.get(interaction.id)
      const review = reviewMap.get(interaction.id)
      const letter = letterMap.get(interaction.id)
      const drama = dramaMap.get(interaction.id)
      const poetry = poetryMap.get(interaction.id)
      
      const result: any = {
        user_id: interaction.user.username,
        timestamp: interaction.timestamp.getTime(),
        stage: interaction.stage,
        input: interaction.input || {},
        output: interaction.output || {},
        api_calls: interaction.apiCalls || [],
        user_noAi: interaction.user.noAi || false, // 包含用户的 noAi 状态
      }

      // 添加 story 数据
      if (story) {
        result.story = story.content
        result.character = story.character
        result.plot = story.plot
        result.structure = story.structure
      }

      // 添加 review 数据
      if (review) {
        result.review = review.content
        result.reviewType = review.reviewType
        result.bookTitle = review.bookTitle
        result.bookCoverUrl = review.bookCoverUrl
        result.bookSummary = review.bookSummary
      }

      // 添加 letter 数据
      if (letter) {
        result.letter = letter.content
        result.recipient = letter.recipient
        result.occasion = letter.occasion
      }

      // 添加 drama 数据
      if (drama) {
        result.drama = drama.content
        result.dramaTitle = drama.title
        result.dramaSummary = drama.summary
      }

      // 添加 poetry 数据
      if (poetry) {
        result.poetry = poetry.content
        result.poetryForm = poetry.form
        result.poetryTopic = poetry.topic
      }

      return result
    })

    return NextResponse.json({
      interactions: formattedInteractions,
    })
  } catch (error) {
    console.error('Get interactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      stage, 
      input, 
      output, 
      api_calls, 
      story,
      review,
      reviewType,
      bookTitle,
      bookCoverUrl,
      bookSummary: bookSummaryParam,
      letter,
      recipient,
      occasion,
      character,
      plot,
      structure,
      workId, // 如果提供 workId，表示更新已存在的作品
      drama,
      dramaTitle,
      dramaSummary,
      poetry,
      poetryForm,
      poetryTopic,
      poetryLines,
      save_edit_revision,
    } = body
    
    // 确保 bookSummary 有值（即使是空字符串）
    const bookSummary = bookSummaryParam !== undefined ? bookSummaryParam : null

    if (!user_id || !stage) {
      return NextResponse.json(
        { error: 'user_id and stage are required' },
        { status: 400 }
      )
    }

    console.log('=== Saving Interaction ===')
    console.log('User ID:', user_id)
    console.log('Stage:', stage)
    console.log('Has review:', !!review)
    console.log('Review Type:', reviewType)
    console.log('Book Title:', bookTitle)
    console.log('Has bookCoverUrl:', !!bookCoverUrl)
    console.log('Has letter:', !!letter)
    console.log('========================')

    // 查找或创建用户
    let user = await prisma.user.findUnique({
      where: { username: user_id },
    })

    if (!user) {
      // 如果用户不存在，创建一个（这种情况不应该发生，但为了安全起见）
      user = await prisma.user.create({
        data: {
          username: user_id,
          password: '123321', // 默认密码
          role: 'student',
          noAi: false,
        },
      })
    }

    // 如果提供了 workId，查找现有的作品并更新
    let interaction
    let existingStory = null
    let existingReview = null
    let existingLetter = null
    let existingDrama = null
    let existingPoetry = null

    if (workId) {
      // 查找现有的作品
      if (story) {
        existingStory = await prisma.story.findUnique({
          where: { id: workId },
          include: { interactions: true },
        })
        if (existingStory?.interactions) {
          interaction = existingStory.interactions
        }
      } else if (review) {
        existingReview = await prisma.review.findUnique({
          where: { id: workId },
          include: { interactions: true },
        })
        if (existingReview?.interactions) {
          interaction = existingReview.interactions
        }
      } else if (letter) {
        existingLetter = await prisma.letter.findUnique({
          where: { id: workId },
          include: { interactions: true },
        })
        if (existingLetter?.interactions) {
          interaction = existingLetter.interactions
        }
      } else if (drama) {
        existingDrama = await prisma.drama.findUnique({
          where: { id: workId },
          include: { interactions: true },
        })
        if (existingDrama?.interactions) {
          interaction = existingDrama.interactions
        }
      } else if (poetry) {
        existingPoetry = await prisma.poetry.findUnique({
          where: { id: workId },
          include: { interactions: true },
        })
        if (existingPoetry?.interactions) {
          interaction = existingPoetry.interactions
        }
      }
    }

    // 如果没有找到现有的 interaction，创建新的
    if (!interaction) {
      interaction = await prisma.interaction.create({
        data: {
          userId: user.id,
          stage,
          input: input || {},
          output: output || {},
          apiCalls: api_calls || [],
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      })
    } else {
      // 更新现有的 interaction
      interaction = await prisma.interaction.update({
        where: { id: interaction.id },
        data: {
          stage,
          input: input || {},
          output: output || {},
          apiCalls: api_calls || [],
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      })
    }

    // 如果有关联数据，保存到相应的表
    if (story && (character || plot || structure)) {
      if (existingStory) {
        // 更新现有的故事
        await prisma.story.update({
          where: { id: existingStory.id },
          data: {
            character: character || null,
            plot: plot || null,
            structure: structure || null,
            content: story,
            interactionId: interaction.id,
          },
        })
      } else {
        // 创建新故事或通过 interactionId 更新
        await prisma.story.upsert({
          where: {
            interactionId: interaction.id,
          },
          update: {
            character: character || null,
            plot: plot || null,
            structure: structure || null,
            content: story,
          },
          create: {
            userId: user.id,
            interactionId: interaction.id,
            character: character || null,
            plot: plot || null,
            structure: structure || null,
            content: story,
          },
        })
      }
    }

    if (review && reviewType && bookTitle) {
      if (existingReview) {
        // 更新现有的书评
        await prisma.review.update({
          where: { id: existingReview.id },
          data: {
            reviewType,
            bookTitle,
            bookCoverUrl: bookCoverUrl || null,
            bookSummary: bookSummary || null,
            structure: structure || null,
            content: review,
            interactionId: interaction.id,
          },
        })
      } else {
        // 创建新书评或通过 interactionId 更新
        await prisma.review.upsert({
          where: {
            interactionId: interaction.id,
          },
          update: {
            reviewType,
            bookTitle,
            bookCoverUrl: bookCoverUrl || null,
            bookSummary: bookSummary || null,
            structure: structure || null,
            content: review,
          },
          create: {
            userId: user.id,
            interactionId: interaction.id,
            reviewType,
            bookTitle,
            bookCoverUrl: bookCoverUrl || null,
            bookSummary: bookSummary || null,
            structure: structure || null,
            content: review,
          },
        })
      }
    }

    if (letter && recipient) {
      if (existingLetter) {
        // 更新现有的信件
        await prisma.letter.update({
          where: { id: existingLetter.id },
          data: {
            recipient,
            occasion: occasion || null,
            guidance: output?.guidance || null,
            readerImageUrl: output?.readerImageUrl || null,
            sections: input?.sections || null,
            content: letter,
            interactionId: interaction.id,
          },
        })
      } else {
        // 创建新信件或通过 interactionId 更新
        await prisma.letter.upsert({
          where: {
            interactionId: interaction.id,
          },
          update: {
            recipient,
            occasion: occasion || null,
            guidance: output?.guidance || null,
            readerImageUrl: output?.readerImageUrl || null,
            sections: input?.sections || null,
            content: letter,
          },
          create: {
            userId: user.id,
            interactionId: interaction.id,
            recipient,
            occasion: occasion || null,
            guidance: output?.guidance || null,
            readerImageUrl: output?.readerImageUrl || null,
            sections: input?.sections || null,
            content: letter,
          },
        })
      }
    }

    if (drama && typeof drama === 'string') {
      if (existingDrama) {
        await prisma.drama.update({
          where: { id: existingDrama.id },
          data: {
            title: dramaTitle ?? existingDrama.title,
            content: drama,
            summary: dramaSummary ?? existingDrama.summary,
            interactionId: interaction.id,
          },
        })
      } else {
        await prisma.drama.upsert({
          where: { interactionId: interaction.id },
          update: {
            title: dramaTitle ?? null,
            content: drama,
            summary: dramaSummary ?? null,
          },
          create: {
            userId: user.id,
            interactionId: interaction.id,
            title: dramaTitle ?? null,
            content: drama,
            summary: dramaSummary ?? null,
          },
        })
      }
    }

    if (poetry && typeof poetry === 'string') {
      if (existingPoetry) {
        await prisma.poetry.update({
          where: { id: existingPoetry.id },
          data: {
            form: poetryForm ?? existingPoetry.form,
            topic: poetryTopic ?? existingPoetry.topic,
            content: poetry,
            lines: poetryLines ?? existingPoetry.lines,
            interactionId: interaction.id,
          },
        })
      } else {
        await prisma.poetry.upsert({
          where: { interactionId: interaction.id },
          update: {
            form: poetryForm ?? null,
            topic: poetryTopic ?? null,
            content: poetry,
            lines: poetryLines ?? null,
          },
          create: {
            userId: user.id,
            interactionId: interaction.id,
            form: poetryForm ?? null,
            topic: poetryTopic ?? null,
            content: poetry,
            lines: poetryLines ?? null,
          },
        })
      }
    }

    console.log('Interaction saved:', {
      id: interaction.id,
      stage: interaction.stage,
      hasReview: !!review,
      hasLetter: !!letter,
    })

    if (save_edit_revision && workId) {
      try {
        if (story && typeof story === "string" && (character || plot || structure)) {
          await appendWritingEditRevision("story", workId, story)
        } else if (review && typeof review === "string" && reviewType && bookTitle) {
          await appendWritingEditRevision("review", workId, review)
        } else if (letter && typeof letter === "string" && recipient) {
          await appendWritingEditRevision("letter", workId, letter)
        }
      } catch (revisionError) {
        console.error("appendWritingEditRevision failed:", revisionError)
      }
    }

    return NextResponse.json({
      success: true,
      interaction: {
        id: interaction.id,
        user_id: interaction.user.username,
        timestamp: interaction.timestamp.getTime(),
        stage: interaction.stage,
        input: interaction.input,
        output: interaction.output,
        api_calls: interaction.apiCalls,
      },
    })
  } catch (error) {
    console.error('Post interaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    const action = searchParams.get('action') // 'clear' | 'deleteEmptyReviews' | 'clearUser'
    const targetUser = searchParams.get('user_id') // 僅在 action === 'clearUser' 時使用

    // 验证教师密码
    if (password !== 'yinyin2948') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (action === 'deleteEmptyReviews') {
      // 删除空的book review（内容少于50字符）
      const reviews = await prisma.review.findMany()
      let deletedCount = 0

      for (const review of reviews) {
        if (!review.content || review.content.trim().length <= 50) {
          await prisma.review.delete({
            where: { id: review.id },
          })
          // 同时删除关联的interaction
          await prisma.interaction.deleteMany({
            where: { id: review.id },
          })
          deletedCount++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} empty book reviews`,
        deletedCount,
      })
    } else if (action === 'clearUser') {
      if (!targetUser) {
        return NextResponse.json(
          { error: 'user_id is required for clearUser' },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { username: targetUser },
      })

      if (!user) {
        return NextResponse.json(
          { success: true, message: `No user found for username "${targetUser}", nothing to clear.` },
          { status: 200 }
        )
      }

      // 先刪除與該用戶相關的作品（stories/reviews/letters/dramas/poetries），再刪除交互
      await prisma.story.deleteMany({ where: { userId: user.id } })
      await prisma.review.deleteMany({ where: { userId: user.id } })
      await prisma.letter.deleteMany({ where: { userId: user.id } })
      await prisma.drama.deleteMany({ where: { userId: user.id } })
      await prisma.poetry.deleteMany({ where: { userId: user.id } })
      await prisma.interaction.deleteMany({ where: { userId: user.id } })

      return NextResponse.json({
        success: true,
        message: `All interactions and writings for user "${targetUser}" have been cleared.`,
      })
    } else {
      // 清空所有交互记录（级联删除会同时删除关联的 stories、reviews、letters、dramas、poetries）
      await prisma.interaction.deleteMany({})
      await prisma.story.deleteMany({})
      await prisma.review.deleteMany({})
      await prisma.letter.deleteMany({})
      await prisma.drama.deleteMany({})
      await prisma.poetry.deleteMany({})
      
      return NextResponse.json({
        success: true,
        message: 'All interactions cleared',
      })
    }
  } catch (error) {
    console.error('Delete interactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

