const ARK_IMAGE_API_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
const ARK_IMAGE_MODEL = "doubao-seedream-5-0-260128"
const DEFAULT_TIMEOUT_MS = 120_000
const MAX_INPUT_IMAGE_BYTES = 10 * 1024 * 1024

const SIZE_BY_ASPECT_RATIO: Record<string, string> = {
  "1:1": "2048x2048",
  "4:3": "2304x1728",
  "3:4": "1728x2304",
  "16:9": "2560x1440",
  "9:16": "1440x2560",
  "3:2": "2496x1664",
  "2:3": "1664x2496",
  "21:9": "3024x1296",
}

type ArkImageReference = string | string[]

type ArkGenerateImageOptions = {
  prompt: string
  size?: string
  image?: ArkImageReference
  outputFormat?: "png" | "jpeg"
  watermark?: boolean
  sequentialImageGeneration?: "disabled" | "auto"
  timeoutMs?: number
}

export class ArkImageError extends Error {
  status?: number
  detail?: string

  constructor(message: string, options?: { status?: number; detail?: string }) {
    super(message)
    this.name = "ArkImageError"
    this.status = options?.status
    this.detail = options?.detail
  }
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const isDataImageUrl = (value: string) =>
  /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(value)

const estimateBase64Bytes = (dataUrl: string) => {
  const base64 = dataUrl.split(",", 2)[1] || ""
  const normalized = base64.replace(/\s+/g, "")
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding)
}

const normalizeSingleImageInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new ArkImageError("Image input cannot be empty.")
  }

  if (isHttpUrl(trimmed)) {
    return trimmed
  }

  if (!isDataImageUrl(trimmed)) {
    throw new ArkImageError("Image input must be an absolute URL or a data:image base64 string.")
  }

  if (estimateBase64Bytes(trimmed) > MAX_INPUT_IMAGE_BYTES) {
    throw new ArkImageError("Input image exceeds Ark's 10MB limit.")
  }

  return trimmed
}

const normalizeImageInput = (value?: ArkImageReference) => {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.map(normalizeSingleImageInput)
  }
  return normalizeSingleImageInput(value)
}

const extractErrorText = async (response: Response) => {
  try {
    const text = await response.text()
    return text || response.statusText
  } catch {
    return response.statusText
  }
}

const extractImageUrl = (result: any) =>
  result?.data?.[0]?.url ||
  result?.data?.[0]?.image_url ||
  result?.images?.[0]?.url ||
  result?.image?.url ||
  result?.url ||
  null

const extractDescription = (result: any) =>
  result?.data?.[0]?.revised_prompt ||
  result?.data?.[0]?.description ||
  result?.description ||
  ""

export const getArkApiKey = () =>
  process.env.ARK_API_KEY || process.env.VOLCENGINE_ARK_API_KEY || null

export const getImageSizeFromAspectRatio = (aspectRatio?: string) =>
  SIZE_BY_ASPECT_RATIO[aspectRatio || "1:1"] || SIZE_BY_ASPECT_RATIO["1:1"]

export async function generateArkImage(options: ArkGenerateImageOptions) {
  const apiKey = getArkApiKey()
  if (!apiKey) {
    throw new ArkImageError("ARK_API_KEY is not configured.")
  }

  const prompt = options.prompt?.trim()
  if (!prompt) {
    throw new ArkImageError("Prompt cannot be empty.")
  }

  const requestBody = {
    model: ARK_IMAGE_MODEL,
    prompt,
    size: options.size || SIZE_BY_ASPECT_RATIO["1:1"],
    sequential_image_generation: options.sequentialImageGeneration || "disabled",
    response_format: "url",
    stream: false,
    watermark: options.watermark ?? false,
    ...(options.outputFormat ? { output_format: options.outputFormat } : {}),
    ...(options.image ? { image: normalizeImageInput(options.image) } : {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(ARK_IMAGE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await extractErrorText(response)
      throw new ArkImageError(`Ark image request failed (${response.status}).`, {
        status: response.status,
        detail,
      })
    }

    const result = await response.json()
    const imageUrl = extractImageUrl(result)

    if (!imageUrl) {
      throw new ArkImageError("Ark response did not contain an image URL.", {
        detail: JSON.stringify(result),
      })
    }

    return {
      imageUrl: imageUrl as string,
      description: extractDescription(result),
      raw: result,
    }
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new ArkImageError("Image generation timed out.", { status: 504 })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
