import { readFile } from "node:fs/promises"
import path from "node:path"

const ARK_IMAGE_API_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
const ARK_IMAGE_MODEL = "doubao-seedream-5-0-260128"
const DEFAULT_TIMEOUT_MS = 120_000
const MAX_INPUT_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_MAP_PROMPT_CHARS = 1800

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

/** Map edits — must meet Ark min total pixels (~3.68M); 1536² is rejected with 400. */
export const MAP_UPDATE_IMAGE_SIZE = SIZE_BY_ASPECT_RATIO["1:1"]

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

/** Ark Seedream expects `images: string[]`, not `image`. */
const normalizeImagesArray = (value?: ArkImageReference): string[] | undefined => {
  if (!value) return undefined
  if (Array.isArray(value)) {
    return value.map(normalizeSingleImageInput)
  }
  return [normalizeSingleImageInput(value)]
}

export function parseArkErrorMessage(detail: string): string {
  const trimmed = detail.trim()
  if (!trimmed) return ""
  try {
    const parsed = JSON.parse(trimmed) as { error?: { message?: string; code?: string }; message?: string }
    const msg = parsed?.error?.message || parsed?.message
    const code = parsed?.error?.code
    if (msg && code) return `${code}: ${msg}`
    return msg || trimmed
  } catch {
    return trimmed.slice(0, 400)
  }
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

export function truncateArkPrompt(prompt: string, maxChars = MAX_MAP_PROMPT_CHARS): string {
  const t = prompt.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars - 3)}...`
}

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local")
}

function mimeFromPathname(pathname: string): string {
  const lower = pathname.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".webp")) return "image/webp"
  return "image/webp"
}

function toDataUrl(buffer: Buffer, mime: string): string {
  if (buffer.length > MAX_INPUT_IMAGE_BYTES) {
    throw new ArkImageError("Input image exceeds Ark's 10MB limit.")
  }
  return `data:${mime};base64,${buffer.toString("base64")}`
}

/**
 * Ark cannot fetch localhost/private URLs. Convert local base maps to base64 for image-to-image.
 */
export async function resolveArkImageInput(
  imageRef: string,
  options?: {
    requestHeaders?: Headers
    appBaseUrl?: string
  },
): Promise<string | null> {
  const trimmed = imageRef.trim()
  if (!trimmed) return null
  if (isDataImageUrl(trimmed)) return normalizeSingleImageInput(trimmed)

  let absolute = trimmed
  if (trimmed.startsWith("/")) {
    const envBase = (options?.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim()
    if (envBase) {
      absolute = `${envBase.replace(/\/$/, "")}${trimmed}`
    } else if (options?.requestHeaders) {
      const host = options.requestHeaders.get("x-forwarded-host") || options.requestHeaders.get("host") || ""
      const proto = options.requestHeaders.get("x-forwarded-proto") || "http"
      if (host) absolute = `${proto}://${host}${trimmed}`
    }
  }

  if (!isHttpUrl(absolute)) return null

  const url = new URL(absolute)
  const pathname = decodeURIComponent(url.pathname)

  if (pathname.startsWith("/") && !pathname.includes("..")) {
    try {
      const filePath = path.join(process.cwd(), "public", pathname.replace(/^\//, ""))
      const buf = await readFile(filePath)
      return toDataUrl(buf, mimeFromPathname(pathname))
    } catch {
      // fall through to fetch
    }
  }

  if (!isLocalHostname(url.hostname)) {
    return absolute
  }

  try {
    const res = await fetch(absolute, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || mimeFromPathname(pathname)
    return toDataUrl(buf, mime)
  } catch {
    return null
  }
}

async function postArkImageRequest(
  apiKey: string,
  requestBody: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ imageUrl: string; description: string; raw: unknown }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === "AbortError") {
      throw new ArkImageError("Image generation timed out.", { status: 504 })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function generateArkImage(options: ArkGenerateImageOptions) {
  const apiKey = getArkApiKey()
  if (!apiKey) {
    throw new ArkImageError("ARK_API_KEY is not configured.")
  }

  const prompt = options.prompt?.trim()
  if (!prompt) {
    throw new ArkImageError("Prompt cannot be empty.")
  }

  const images = normalizeImagesArray(options.image)
  const size = options.size || SIZE_BY_ASPECT_RATIO["1:1"]
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS

  const baseBody: Record<string, unknown> = {
    model: ARK_IMAGE_MODEL,
    prompt,
    size,
    sequential_image_generation: options.sequentialImageGeneration || "disabled",
    response_format: "url",
    stream: false,
    watermark: options.watermark ?? false,
    ...(options.outputFormat ? { output_format: options.outputFormat } : {}),
    ...(images?.length ? { images } : {}),
  }

  try {
    return await postArkImageRequest(apiKey, baseBody, timeoutMs)
  } catch (error) {
    if (!(error instanceof ArkImageError) || error.status !== 400 || !images?.length) {
      throw error
    }

    const detail = error.detail || ""
    const retryBodies: Record<string, unknown>[] = []

    if (/image/i.test(detail)) {
      retryBodies.push({ ...baseBody, images })
    }

    retryBodies.push({
      ...baseBody,
      images,
      size: "2K",
      output_format: options.outputFormat || "jpeg",
    })

    retryBodies.push({
      ...baseBody,
      images,
      size: "2K",
    })
    delete retryBodies[retryBodies.length - 1].output_format

    const seen = new Set<string>()
    for (const body of retryBodies) {
      const key = JSON.stringify(body)
      if (seen.has(key)) continue
      seen.add(key)
      try {
        return await postArkImageRequest(apiKey, body, timeoutMs)
      } catch (retryErr) {
        if (!(retryErr instanceof ArkImageError) || retryErr.status !== 400) {
          throw retryErr
        }
      }
    }

    throw error
  }
}
