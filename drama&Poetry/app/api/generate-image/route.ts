import { NextResponse } from "next/server"
import { FalImageError, generateFalImage } from "@/lib/fal-images"

export async function POST(request: Request) {
  try {
    const { prompt, type } = await request.json()

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    let fullPrompt = prompt.trim()
    if (type === "character") {
      fullPrompt = `${fullPrompt}, full body character, cartoon style, kid-friendly, centered, simple solid white background`
    } else if (type === "background") {
      fullPrompt = `${fullPrompt}, drama stage backdrop, theatrical scenery, wide scene background, cartoon illustration style, kid-friendly, colorful, vibrant, panoramic, landscape scenery only, empty stage set, absolutely no people, no characters, no figures, no living beings, no animals, no creatures, uninhabited environment only`
    }

    const result = await generateFalImage({
      prompt: fullPrompt,
      aspectRatio: type === "background" ? "16:9" : "1:1",
      outputFormat: type === "background" ? "jpeg" : "png",
      resolution: "1K",
    })

    return NextResponse.json({ imageUrl: result.imageUrl })
  } catch (error) {
    console.error("[legacy generate-image] Fal error:", error)
    if (error instanceof FalImageError) {
      return NextResponse.json(
        { error: error.detail ? `${error.message} ${error.detail}` : error.message },
        { status: error.status || 500 }
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
