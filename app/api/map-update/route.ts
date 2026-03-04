import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

const FAL_NANO_BANANA_EDIT_MODEL = "fal-ai/nano-banana-2/edit"

type MapUpdateRequestBody = {
  userId: string
  title: string
  topic: string
  mapX: number
  mapY: number
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
    const { userId, title, topic, mapX, mapY, previousMapImageUrl } = body

    if (!userId || !topic || !previousMapImageUrl) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId, topic, or previousMapImageUrl." },
        { status: 400 }
      )
    }

    // Fal 需要能從公網直接訪問的圖片 URL
    // 如果傳進來的是類似 "/firstmap.png" 這種相對路徑，這裡補成完整的絕對 URL
    let resolvedImageUrl = previousMapImageUrl
    if (resolvedImageUrl.startsWith("/")) {
      const host =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        ""
      const proto = request.headers.get("x-forwarded-proto") || "https"

      if (host) {
        resolvedImageUrl = `${proto}://${host}${resolvedImageUrl}`
      }
    }

    const prompt = `
You are updating a student's personal writing adventure map using image editing.

Base image:
- Use the provided previous map image strictly as the base. Preserve its overall style, camera angle and layout.

Student's new writing step:
- Title: "${title || "Untitled"}"
- Topic / Setting: "${topic}"
- Virtual map coordinate for this step: (${mapX}, ${mapY})

Task:
- ONLY update a **small local patch** around that virtual coordinate (roughly a circle with radius about 5–8% of the map width).
- Inside this small area, add or modify terrain, paths, rivers, buildings, plants, or other objects that clearly reflect this new topic.
- Outside this small area, keep the previous map almost completely unchanged.

Very important:
- This MUST look like a natural evolution of the previous map, not a brand‑new style.
- Do NOT add UI, text labels, or logos. Leave space so the interface can overlay flags or titles later.
`.trim()

    const result = await fal.subscribe(FAL_NANO_BANANA_EDIT_MODEL, {
      input: {
        prompt,
        image_urls: [resolvedImageUrl],
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

