import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"

const FAL_NANO_BANANA_EDIT_MODEL = "fal-ai/nano-banana-2/edit"

type CharacterImageEditRequestBody = {
  drawingDataUrl: string
  species?: string | null
  name?: string | null
  age?: string | null
  traits?: string[]
  background?: string | null
  emotional?: string | null
  symbolic?: string | null
  userId?: string | null
}

type FalUploadResult = string | { url?: string } | null | undefined

const parseDataUrlToBlob = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.*?);base64,(.+)$/)
  if (!match) return null
  const mimeType = match[1] || "image/png"
  const base64Data = match[2] || ""
  const binary = Buffer.from(base64Data, "base64")
  return new Blob([binary], { type: mimeType })
}

const normalizeUploadedUrl = (value: FalUploadResult) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && typeof value.url === "string") return value.url
  return ""
}

const extractFalErrorDetail = (error: any) => {
  const detail = error?.body?.detail
  if (!detail) return ""
  try {
    return typeof detail === "string" ? detail : JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      console.error("[character-image-edit] FAL_KEY not configured")
      return NextResponse.json(
        { error: "character_unavailable", message: "Character painter is resting. Try again later." },
        { status: 200 }
      )
    }

    const body = (await request.json()) as CharacterImageEditRequestBody
    const {
      drawingDataUrl,
      species,
      name,
      age,
      traits = [],
      background,
      emotional,
      symbolic,
      userId,
    } = body

    if (!drawingDataUrl || typeof drawingDataUrl !== "string" || !drawingDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing valid drawing image." },
        { status: 400 }
      )
    }

    const blob = parseDataUrlToBlob(drawingDataUrl)
    if (!blob) {
      return NextResponse.json(
        { error: "bad_request", message: "Could not parse drawing image." },
        { status: 400 }
      )
    }

    const uploadResult = (await fal.storage.upload(blob as any)) as FalUploadResult
    const sketchUrl = normalizeUploadedUrl(uploadResult)

    if (!sketchUrl || !/^https?:\/\//i.test(sketchUrl)) {
      console.error("[character-image-edit] Invalid uploaded sketch URL:", uploadResult)
      return NextResponse.json(
        { error: "character_unavailable", message: "Failed to upload drawing image." },
        { status: 200 }
      )
    }

    const safeSpecies = (species || "unknown creature").trim()
    const safeName = (name || "Unnamed").trim()
    const safeAge = (age || "").trim()
    const safeTraits = Array.isArray(traits) && traits.length > 0 ? traits.join(", ") : "friendly"
    const safeBackground = (background || "").trim()
    const safeEmotional = (emotional || "").trim()
    const safeSymbolic = (symbolic || "").trim()

    const prompt = `
You are editing a student's hand-drawn character sketch into a polished character image.

Keep from the sketch:
- Overall silhouette and pose
- Main recognizable shape and costume idea

Character context:
- Species: ${safeSpecies}
- Name: ${safeName}
- Age: ${safeAge || "not specified"}
- Traits: ${safeTraits}
- Background detail: ${safeBackground || "not specified"}
- Emotional tone: ${safeEmotional || "not specified"}
- Symbolic objects: ${safeSymbolic || "not specified"}

Style target:
- Cute and premium children's story illustration
- Soft but rich lighting, clean details, elegant rendering
- Keep one main character as visual focus

Output rules:
- Use the uploaded sketch image as the base reference
- Do not add text, logos, watermark, or UI
- Return one final character image only
`.trim()

    const callEdit = async (simpleMode: boolean) =>
      fal.subscribe(FAL_NANO_BANANA_EDIT_MODEL, {
        input: {
          prompt,
          image_urls: [sketchUrl],
          resolution: "1K",
          output_format: "png",
          num_images: 1,
          ...(simpleMode
            ? {}
            : {
                limit_generations: true,
                safety_tolerance: 4,
              }),
        },
        logs: false,
      })

    let result: any
    try {
      result = await callEdit(false)
    } catch (firstError: any) {
      // 针对 422 做一次简化请求重试，规避模型参数校验差异
      if (firstError?.status === 422) {
        console.warn("[character-image-edit] First attempt 422, retrying with simplified payload", {
          requestId: firstError?.requestId,
          detail: extractFalErrorDetail(firstError),
        })
        result = await callEdit(true)
      } else {
        throw firstError
      }
    }

    const data: any = result.data
    const firstImage = data?.images?.[0]

    if (!firstImage?.url) {
      console.error("[character-image-edit] Fal response missing image URL", data)
      return NextResponse.json(
        { error: "character_unavailable", message: "Could not generate character image." },
        { status: 200 }
      )
    }

    return NextResponse.json({
      imageUrl: firstImage.url as string,
      description: (data?.description as string) || "",
      species: safeSpecies,
      userId: userId || "default-user",
    })
  } catch (error) {
    const detail = extractFalErrorDetail(error)
    console.error("[character-image-edit] Error:", {
      message: (error as any)?.message || "unknown",
      status: (error as any)?.status,
      requestId: (error as any)?.requestId,
      detail,
      body: (error as any)?.body,
    })
    return NextResponse.json(
      {
        error: "character_unavailable",
        message:
          (error as any)?.status === 422
            ? "The sketch format was rejected by the model. Please try a simpler sketch and regenerate."
            : "Something went wrong generating the character image.",
      },
      { status: 200 }
    )
  }
}

