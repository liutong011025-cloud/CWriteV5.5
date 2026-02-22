import { NextResponse } from "next/server";

const FAL_API_URL = "https://fal.run/fal-ai/nano-banana";
const FAL_REMBG_URL = "https://fal.run/fal-ai/birefnet/v2";
const FAL_API_KEY =
  "3872891e-f4df-455b-9bdb-001303773cfa:e849583c218edde9d493ccda355deb76";

async function removeBackground(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(FAL_REMBG_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
      }),
    });

    if (!response.ok) {
      console.error("[v0] fal.ai rembg error:", await response.text());
      return null;
    }

    const data = await response.json();
    return data?.image?.url || null;
  } catch (error) {
    console.error("[v0] Background removal error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    let fullPrompt = prompt;
    if (type === "character") {
      fullPrompt = `${prompt}, full body character, cartoon style, kid-friendly, centered, simple solid white background`;
    } else if (type === "background") {
      fullPrompt = `${prompt}, drama stage backdrop, theatrical scenery, wide scene background, cartoon illustration style, kid-friendly, colorful, vibrant, panoramic, landscape scenery only, empty stage set, absolutely no people, no characters, no figures, no living beings, no animals, no creatures, uninhabited environment only`;
    }

    const response = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: type === "background" ? "landscape_16_9" : "square",
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] fal.ai error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 },
      );
    }

    const data = await response.json();
    let imageUrl = data?.images?.[0]?.url || data?.image?.url || null;

    if (!imageUrl) {
      console.error("[v0] No image URL in response:", data);
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 },
      );
    }

    // For characters, remove background using birefnet
    if (type === "character" && imageUrl) {
      const transparentUrl = await removeBackground(imageUrl);
      if (transparentUrl) {
        imageUrl = transparentUrl;
      }
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("[v0] Image generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
