import { NextRequest, NextResponse } from "next/server"
import { ArkImageError, generateArkImage } from "@/lib/ark-images"

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

const extractErrorDetail = (error: any) => {
  const detail = error?.detail || error?.body?.detail
  if (!detail) return ""
  try {
    return typeof detail === "string" ? detail : JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ARK_API_KEY && !process.env.VOLCENGINE_ARK_API_KEY) {
      console.error("[character-image-edit] ARK_API_KEY not configured")
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
- Use a clean pure white background only (solid #FFFFFF)

Output rules:
- Use the uploaded sketch image as the base reference
- Do not add text, logos, watermark, or UI
- No transparent background, no scene/background elements, white backdrop only
- Return one final character image only
`.trim()

    const result = await generateArkImage({
      prompt,
      image: drawingDataUrl,
      size: "2048x2048",
      outputFormat: "png",
    })

    return NextResponse.json({
      imageUrl: result.imageUrl,
      description: result.description || "",
      species: safeSpecies,
      userId: userId || "default-user",
    })
  } catch (error) {
    const detail = extractErrorDetail(error)
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
          error instanceof ArkImageError && /10MB limit/i.test(error.message)
            ? "The sketch is too large for image editing. Please clear some details or use a smaller canvas and try again."
            : (error as any)?.status === 422
            ? "The sketch format was rejected by the model. Please try a simpler sketch and regenerate."
            : "Something went wrong generating the character image.",
      },
      { status: 200 }
    )
  }
}

