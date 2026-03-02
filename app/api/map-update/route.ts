import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

const FAL_NANO_BANANA_EDIT_MODEL = "fal-ai/nano-banana-2/edit"

type MapUpdateRequestBody = {
  userId: string
  title: string
  topic: string
  mapX: number
  mapY: number
  scores: {
    vocabRichness: number
    descriptiveAccuracy: number
    logicalCoherence: number
  }
  /**
   * 上一張地圖圖片的 URL。
   * 首次生成時可以傳入一張預設的空白地圖 URL。
   */
  previousMapImageUrl: string
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      console.error("[map-update] FAL_KEY not configured")
      return NextResponse.json(
        { error: "map_unavailable", message: "Map is resting. Try again later." },
        { status: 200 }
      )
    }

    const body = (await request.json()) as MapUpdateRequestBody
    const { userId, title, topic, mapX, mapY, scores, previousMapImageUrl } = body

    if (!userId || !topic || !previousMapImageUrl) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId, topic, or previousMapImageUrl." },
        { status: 400 }
      )
    }

    const { vocabRichness, descriptiveAccuracy, logicalCoherence } = scores || {}

    const prompt = `
You are updating a student's personal writing adventure map.

Base image:
- Use the existing map image as the base. Do NOT change the overall style or layout, only gently improve and extend it.

Student's new finished writing:
- Title: "${title || "Untitled"}"
- Topic: "${topic}"
- Map coordinate (virtual): (${mapX}, ${mapY})

At the coordinate of the student's new pin, add a new small scene that visually represents this topic. 
Use terrain, buildings, or objects related to the topic (for example, forests, mountains, rivers, castles, streets, schools, etc.).
Add a small flag or marker at that location with space where the UI can overlay the title text.

Use the three scores to guide the visual style:
- Vocabulary richness (0-100): ${vocabRichness ?? 0}
  - Higher score → more diverse and vivid colors across the whole map.
  - Lower score → keep the colors closer to grayscale or low saturation.
- Descriptive accuracy (0-100): ${descriptiveAccuracy ?? 0}
  - Higher score → sharper details and higher resolution feeling, clearer shapes and textures.
  - Lower score → more pixelated / slightly blurry look, fewer fine details.
- Logical coherence (0-100): ${logicalCoherence ?? 0}
  - Higher score → more organized, clear layout and structure of roads, rivers, and buildings.
  - Lower score → slightly looser, less organized layout (but still readable and not chaotic).

Very important:
- This MUST look like an evolution of the previous map, not a completely new style.
- Keep the same general color palette, camera angle, and rendering style as the previous image.
- Only add or refine details based on the new writing and the scores.
`.trim()

    const result = await fal.subscribe(FAL_NANO_BANANA_EDIT_MODEL, {
      input: {
        prompt,
        image_urls: [previousMapImageUrl],
        // 可按需調整解析度與輸出格式
        resolution: "1K",
        output_format: "png",
        num_images: 1,
        limit_generations: true,
        safety_tolerance: "4",
      },
      logs: false,
    })

    const data: any = result.data
    const firstImage = data?.images?.[0]

    if (!firstImage?.url) {
      console.error("[map-update] Fal response missing image URL", data)
      return NextResponse.json(
        { error: "map_unavailable", message: "Could not update map image." },
        { status: 200 }
      )
    }

    return NextResponse.json({
      imageUrl: firstImage.url as string,
      description: (data?.description as string) || "",
      // 前端可用來更新本地狀態
      scores: {
        vocabRichness: vocabRichness ?? 0,
        descriptiveAccuracy: descriptiveAccuracy ?? 0,
        logicalCoherence: logicalCoherence ?? 0,
      },
      topic,
      title,
      mapX,
      mapY,
      userId,
    })
  } catch (error) {
    console.error("[map-update] Error:", error)
    return NextResponse.json(
      { error: "map_unavailable", message: "Something went wrong updating the map." },
      { status: 200 }
    )
  }
}

