import { NextRequest, NextResponse } from "next/server"
import { fal } from "@fal-ai/client"
import {
  extractFalImageUrl,
  FAL_NANO_BANANA_EDIT_MODEL,
  getFalKey,
  resolveMapImageUrlForFal,
} from "@/lib/fal-map"

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

const escapePromptValue = (value: string) => value.replace(/`/g, "'")

export async function POST(request: NextRequest) {
  try {
    if (!getFalKey()) {
      console.error("[character-image-edit] FAL_KEY not configured")
      return NextResponse.json(
        { error: "character_unavailable", message: "Character painter is resting. Try again later." },
        { status: 200 },
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
        { status: 400 },
      )
    }

    const safeSpecies = escapePromptValue((species || "unknown creature").trim())
    const safeName = escapePromptValue((name || "Unnamed").trim())
    const safeAge = escapePromptValue((age || "").trim())
    const safeTraits = escapePromptValue(
      Array.isArray(traits) && traits.length > 0 ? traits.join(", ") : "friendly",
    )
    const safeBackground = escapePromptValue((background || "").trim())
    const safeEmotional = escapePromptValue((emotional || "").trim())
    const safeSymbolic = escapePromptValue((symbolic || "").trim())

    const resolvedImageUrl = await resolveMapImageUrlForFal(request, drawingDataUrl)
    if (!resolvedImageUrl) {
      console.error("[character-image-edit] Could not upload sketch to Fal storage")
      return NextResponse.json(
        {
          error: "character_unavailable",
          message: "Could not load the sketch for editing. Please try again.",
        },
        { status: 200 },
      )
    }

    const prompt = `
You are editing a student's hand-drawn character sketch into a polished character image.

Keep from the sketch:
- Overall silhouette and pose
- Main recognizable shape and costume idea
- Face shape, hairstyle, clothing outline, and all visible props
- Relative proportions and placement of major parts

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
- Keep the same character design, pose, composition, and recognizable silhouette from the sketch
- This should look visibly edited and polished, not like the original sketch pasted back with only tiny cleanup
- Clean up rough hand-drawn lines, uneven coloring, messy sketch marks, and accidental wobble
- Refine the drawing into a neat, appealing final illustration with better edges, cleaner shapes, improved color harmony, and nicer lighting
- You may simplify unclear sketch marks and clarify ambiguous parts so the same design reads better
- Keep the character simple if the student's design is simple, but still make it feel like a finished illustration
- Do not redesign the character or invent new accessories, extra limbs, extra props, background objects, or dramatic style changes
- Do not add text, logos, watermark, or UI
- No transparent background, no scene/background elements, white backdrop only
- Return one final character image only
`.trim()

    console.info("[character-image-edit] fal image-to-image", {
      model: FAL_NANO_BANANA_EDIT_MODEL,
      species: safeSpecies,
    })

    const result = await fal.subscribe(FAL_NANO_BANANA_EDIT_MODEL, {
      input: {
        prompt,
        image_urls: [resolvedImageUrl],
        resolution: "1K",
        output_format: "png",
        num_images: 1,
        limit_generations: true,
        safety_tolerance: 4,
      },
      logs: false,
    })

    const imageUrl = extractFalImageUrl(result.data)
    if (!imageUrl) {
      console.error("[character-image-edit] Fal response missing image URL", result.data)
      return NextResponse.json(
        { error: "character_unavailable", message: "Could not generate the character image." },
        { status: 200 },
      )
    }

    const data = result.data as { description?: string }
    return NextResponse.json({
      imageUrl,
      description: data?.description || "",
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
          (error as any)?.status === 422
            ? "The sketch format was rejected by the model. Please try a simpler sketch and regenerate."
            : "Something went wrong generating the character image.",
      },
      { status: 200 },
    )
  }
}
