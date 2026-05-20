import { NextRequest, NextResponse } from "next/server"
import {
  ArkImageError,
  generateArkImage,
  MAP_UPDATE_IMAGE_SIZE,
  parseArkErrorMessage,
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

/** Same style as the original map-update: strict edit on the uploaded base map. */
function buildMapEditPrompt(params: {
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
  } = params

  return [
    "Edit the provided map image. Keep style, palette, hills, rivers, paths, forests, and camera angle.",
    "Preserve at least 95% of pixels unchanged. Do NOT redraw the whole map or change zoom.",
    `Pin at (${safeMapX}, ${safeMapY}) on a 0–100 grid (top-left origin).`,
    "Add only tiny map-scale details in a 2–3% radius patch at the pin: small paths, plants, props, mini buildings.",
    `Topic: ${safeTopic}. Title: ${safeTitle}.`,
    `Hero: ${characterName || "hero"} (${species || "creature"}).`,
    `Plot hints — place: ${detailedSetting || safeTopic}; trouble: ${detailedConflict || "—"}; wish: ${detailedGoal || "—"}.`,
    structureType ? `Structure: ${structureType}.` : "",
    "No text labels, logos, or UI. Rest of map nearly unchanged.",
    extraPrompt || "Elements must stay small and subtle.",
  ]
    .filter(Boolean)
    .join(" ")
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
      console.error("[map-update] No base image for edit — refusing full regen.", { previousMapImageUrl })
      return NextResponse.json(
        {
          error: "map_unavailable",
          message: "Could not load the current map for editing. Your old map is unchanged.",
        },
        { status: 200 },
      )
    }

    const baseKind = baseImage.startsWith("data:") ? "base64" : "url"
    console.info("[map-update] image-to-image", {
      previousMapImageUrl: previousMapImageUrl.slice(0, 120),
      baseKind,
      mapX: safeMapX,
      mapY: safeMapY,
    })

    const prompt = buildMapEditPrompt({
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
    })

    const result = await generateArkImage({
      prompt: truncateArkPrompt(prompt),
      image: baseImage,
      size: MAP_UPDATE_IMAGE_SIZE,
      outputFormat: "png",
      timeoutMs: 120_000,
    })

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
      const detail = error.detail || ""
      const arkMsg = parseArkErrorMessage(detail)
      const userMessage =
        error.status === 400
          ? `Map edit was rejected by the image API${arkMsg ? ` (${arkMsg})` : ""}. Your previous map is unchanged.`
          : "Map update failed. Your previous map is unchanged."
      console.error("[map-update] Ark detail:", arkMsg || detail.slice(0, 800))
      return NextResponse.json(
        {
          error: "map_unavailable",
          message: userMessage,
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
