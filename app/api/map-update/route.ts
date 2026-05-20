import { NextRequest, NextResponse } from "next/server"
import {
  ArkImageError,
  generateArkImage,
  resolveArkImageInput,
  truncateArkPrompt,
} from "@/lib/ark-images"

type MapUpdateRequestBody = {
  userId: string
  title: string
  topic: string
  mapX: number
  mapY: number
  previousMapImageUrl: string
  storySummary?: {
    characterName?: string | null
    species?: string | null
    setting?: string | null
    conflict?: string | null
    goal?: string | null
    plotSummary?: string | null
    structureType?: string | null
  } | null
  mapPrompt?: string
}

const clampPercent = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(100, value))
}

function buildMapUpdatePrompt(params: {
  safeTitle: string
  safeTopic: string
  safeMapX: number
  safeMapY: number
  characterName: string | null
  species: string | null
  detailedSetting: string | null
  detailedConflict: string | null
  detailedGoal: string | null
  structureType: string | null
  extraPrompt: string
  useBaseImage: boolean
}): string {
  const {
    safeTitle,
    safeTopic,
    safeMapX,
    safeMapY,
    characterName,
    species,
    detailedSetting,
    detailedConflict,
    detailedGoal,
    structureType,
    extraPrompt,
    useBaseImage,
  } = params

  const base = useBaseImage
    ? `Edit the provided map image. Keep style, palette, and camera angle.`
    : `Paint a children's adventure map in the same cozy illustrated style as a learning game world.`

  return truncateArkPrompt(
    [
      base,
      `Pin at (${safeMapX}, ${safeMapY}) on a 0–100 grid (top-left origin).`,
      `Add only tiny map-scale details in a 2–3% radius patch at the pin: small paths, plants, props, mini buildings.`,
      `Topic: ${safeTopic}. Title: ${safeTitle}.`,
      `Hero: ${characterName || "hero"} (${species || "creature"}).`,
      `Plot hints — place: ${detailedSetting || safeTopic}; trouble: ${detailedConflict || "—"}; wish: ${detailedGoal || "—"}.`,
      structureType ? `Structure: ${structureType}.` : "",
      "No text labels, logos, or UI. Rest of map nearly unchanged.",
      extraPrompt || "Elements must stay small and subtle.",
    ]
      .filter(Boolean)
      .join(" "),
  )
}

async function runMapImageGeneration(
  promptWithImage: string,
  promptTextOnly: string,
  baseImage: string | null,
) {
  if (baseImage) {
    try {
      return await generateArkImage({
        prompt: promptWithImage,
        image: baseImage,
        size: "2048x2048",
        outputFormat: "png",
      })
    } catch (error) {
      if (error instanceof ArkImageError && error.status === 400) {
        console.warn(
          "[map-update] image-to-image failed (400), retrying without base image:",
          error.detail?.slice(0, 200),
        )
        return await generateArkImage({
          prompt: promptTextOnly,
          size: "2048x2048",
          outputFormat: "png",
        })
      }
      throw error
    }
  }

  return await generateArkImage({
    prompt: promptTextOnly,
    size: "2048x2048",
    outputFormat: "png",
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ARK_API_KEY && !process.env.VOLCENGINE_ARK_API_KEY) {
      console.error("[map-update] ARK_API_KEY not configured")
      return NextResponse.json(
        { error: "map_unavailable", message: "Map is resting. Try again later." },
        { status: 200 },
      )
    }

    const body = (await request.json()) as MapUpdateRequestBody
    const { userId, title, topic, mapX, mapY, previousMapImageUrl, storySummary, mapPrompt } = body
    const safeMapX = clampPercent(mapX, 50)
    const safeMapY = clampPercent(mapY, 50)
    const safeTopic = (topic || "").trim()
    const safeTitle = (title || "Untitled").trim()

    if (!userId || !safeTopic || !previousMapImageUrl) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing userId, topic, or previousMapImageUrl." },
        { status: 400 },
      )
    }

    const baseImage = await resolveArkImageInput(previousMapImageUrl, {
      requestHeaders: request.headers,
    })

    if (!baseImage) {
      console.warn("[map-update] Could not load base map as Ark input; using text-only generation.", {
        previousMapImageUrl,
      })
    }

    const promptParams = {
      safeTitle,
      safeTopic,
      safeMapX,
      safeMapY,
      characterName: storySummary?.characterName || null,
      species: storySummary?.species || null,
      detailedSetting: storySummary?.setting || null,
      detailedConflict: storySummary?.conflict || null,
      detailedGoal: storySummary?.goal || null,
      structureType: storySummary?.structureType || null,
      extraPrompt: (mapPrompt || "").trim(),
    }

    const result = await runMapImageGeneration(
      buildMapUpdatePrompt({ ...promptParams, useBaseImage: true }),
      buildMapUpdatePrompt({ ...promptParams, useBaseImage: false }),
      baseImage,
    )

    return NextResponse.json({
      imageUrl: result.imageUrl,
      description: result.description || "",
      topic: safeTopic,
      title: safeTitle,
      mapX: safeMapX,
      mapY: safeMapY,
      userId,
    })
  } catch (error) {
    console.error("[map-update] Error:", {
      message: (error as { message?: string })?.message || "unknown",
      status: (error as { status?: number })?.status,
      detail: (error as { detail?: string })?.detail?.slice?.(0, 500),
    })
    if (error instanceof ArkImageError) {
      return NextResponse.json(
        {
          error: "map_unavailable",
          message: error.detail ? `${error.message} ${error.detail}` : error.message,
        },
        { status: 200 },
      )
    }
    return NextResponse.json(
      { error: "map_unavailable", message: "Something went wrong updating the map." },
      { status: 200 },
    )
  }
}
