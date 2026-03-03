import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

const FAL_NANO_BANANA_MODEL = "fal-ai/nano-banana"

type MapGenerateRequestBody = {
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
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      console.error("[map-generate] FAL_KEY not configured")
      return NextResponse.json(
        { error: "map_unavailable", message: "Map is resting. Try again later." },
        { status: 200 }
      )
    }

    const body = (await request.json()) as MapGenerateRequestBody
    const { userId, title, topic, mapX, mapY, scores } = body

    if (!userId || !topic) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId or topic." },
        { status: 400 }
      )
    }

    const { vocabRichness, descriptiveAccuracy, logicalCoherence } = scores || {}

    const prompt = `
You are creating the very first adventure map for a student's writing world.

The map should feel like a living world seen from above (isometric or top-down), not a flat diagram.

Student's finished writing:
- Title: "${title || "Untitled"}"
- Topic: "${topic}"

Around the map coordinate of the student's first pin, create a core scene that visually represents this topic.
Use terrain, buildings, or objects related to the topic (for example, forests, mountains, rivers, castles, streets, schools, etc.).
Reserve a small clear area near that point where the UI can overlay the title text later (do not render the text yourself).

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
- This is the student's personal world. It should feel inviting, imaginative, and slightly stylized.
- Avoid text, UI, or logos in the image. Only paint the world itself.
`.trim()

    const result = await fal.subscribe(FAL_NANO_BANANA_MODEL, {
      input: {
        prompt,
        // 初始地图给足分辨率，后续由 edit 模型继续演化
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
      console.error("[map-generate] Fal response missing image URL", data)
      return NextResponse.json(
        { error: "map_unavailable", message: "Could not generate initial map image." },
        { status: 200 }
      )
    }

    return NextResponse.json({
      imageUrl: firstImage.url as string,
      description: (data?.description as string) || "",
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
    console.error("[map-generate] Error:", error)
    return NextResponse.json(
      { error: "map_unavailable", message: "Something went wrong generating the map." },
      { status: 200 }
    )
  }
}

