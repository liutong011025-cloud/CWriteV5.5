import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

const FAL_NANO_BANANA_MODEL = "fal-ai/nano-banana"

type MapGenerateRequestBody = {
  userId: string
  title: string
  topic: string
  mapX: number
  mapY: number
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
    const { userId, title, topic, mapX, mapY } = body

    if (!userId || !topic) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId or topic." },
        { status: 400 }
      )
    }

    const prompt = `
You are creating the very first adventure map for a student's writing world.

View: top-down or light isometric; it must feel like a living, explorable world, not a flat diagram.

Student's starting story:
- Title: "${title || "Untitled"}"
- Topic / Setting: "${topic}"

Use the whole canvas to paint a rich world inspired by this topic.
Around the virtual coordinate of the student's first pin (a point that the UI will overlay at roughly (${mapX}, ${mapY}) on the map),
create a core scene that clearly expresses this topic: terrain, buildings, paths, rivers, trees, or other objects that belong to this world.

Do NOT render any UI, flags or text labels; just leave a small visually calm area near that starting point where the interface can later draw a START flag and title on top.

Overall style: imaginative, welcoming, slightly stylized, suitable for a children's learning game world.
Avoid logos and real-world text.
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
      } as any,
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

