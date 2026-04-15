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
  storySummary?: {
    characterName?: string | null
    species?: string | null
    setting?: string | null
  } | null
}

const clampPercent = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(100, value))
}

const normalizeAbsoluteImageUrl = (request: NextRequest, raw: string) => {
  if (!raw) return ""
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/")) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
    const proto = request.headers.get("x-forwarded-proto") || "https"
    if (host) return `${proto}://${host}${trimmed}`
  }
  return ""
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
    const { userId, title, topic, mapX, mapY, previousMapImageUrl, storySummary } = body
    const safeMapX = clampPercent(mapX, 50)
    const safeMapY = clampPercent(mapY, 50)
    const safeTopic = (topic || "").trim()
    const safeTitle = (title || "Untitled").trim()

    if (!userId || !safeTopic || !previousMapImageUrl) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId, topic, or previousMapImageUrl." },
        { status: 400 }
      )
    }

    // Fal 需要能從公網直接訪問的圖片 URL
    // 如果傳進來的是類似 "/firstmap.png" 這種相對路徑，這裡補成完整的絕對 URL
    const resolvedImageUrl = normalizeAbsoluteImageUrl(request, previousMapImageUrl)
    if (!resolvedImageUrl) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid previousMapImageUrl." },
        { status: 400 }
      )
    }

    const characterName = storySummary?.characterName || null
    const species = storySummary?.species || null
    const detailedSetting = storySummary?.setting || null

    const prompt = `
You are updating a student's personal writing adventure map using image editing.

Base image:
- Use the provided previous map image strictly as the base. Preserve its overall style, camera angle and layout.

Coordinate system (very important for placement):
- Treat the map as a 2D canvas where (0, 0) is the TOP‑LEFT corner and (100, 100) is the BOTTOM‑RIGHT corner.
- The student's new step is centered near (${mapX}, ${mapY}) in this normalized coordinate system. Place the MAIN new visual focus close to this point.
- The student's new step is centered near (${safeMapX}, ${safeMapY}) in this normalized coordinate system. Place the MAIN new visual focus close to this point.

Student's new writing step:
- Title: "${safeTitle}"
- Character: "${characterName || "Unknown hero"}" (species: "${species || "unknown creature"}")
- Topic / Setting: "${safeTopic}"

Story details (for inspiration only, do not render text):
- Setting detail: "${detailedSetting || safeTopic || "unspecified"}"

Task:
- Focus your main new visual content on a **small local patch** centered very close to (${safeMapX}, ${safeMapY}), roughly a circle with radius about 3–5% of the map width. The strongest new shapes and colors should sit in this patch.
- Inside this small area, add or modify terrain, paths, rivers, buildings, plants, or other objects that clearly reflect this new topic and the character's journey, but keep these additions relatively small in scale compared to the whole map.
- You may also sprinkle a few very small, subtle details related to this topic elsewhere on the map (for example, tiny props, hints of color, or distant shapes), but they should feel naturally integrated and must not dominate the image.
- Outside the local patch, the map should remain almost completely unchanged at a glance.

Very important:
- This MUST look like a natural evolution of the previous map, not a brand‑new style.
- Keep the same overall palette, camera angle, and rendering style as the base image.
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
        safety_tolerance: 4,
      } as any,
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
      topic: safeTopic,
      title: safeTitle,
      mapX: safeMapX,
      mapY: safeMapY,
      userId,
    })
  } catch (error) {
    console.error("[map-update] Error:", {
      message: (error as any)?.message || "unknown",
      status: (error as any)?.status,
      requestId: (error as any)?.requestId,
      body: (error as any)?.body,
    })
    return NextResponse.json(
      { error: "map_unavailable", message: "Something went wrong updating the map." },
      { status: 200 }
    )
  }
}

