import type { JourneyType } from "@/components/stages/journey-ticket"

export type RoofPinId = JourneyType

export type RoofPinLayout = {
  left: number
  top: number
  width: number
}

export type RoofLayout = {
  roofWidth: number
  roofRight: number
  roofBottom: number
  levelLeft: number
  levelTop: number
  levelFont: number
  pins: Record<RoofPinId, RoofPinLayout>
}

export const ROOF_PINS: { id: RoofPinId; src: string; label: string }[] = [
  { id: "story", src: "/storypin.webp", label: "Story" },
  { id: "drama", src: "/dramapin.webp", label: "Drama" },
  { id: "bookReview", src: "/BRpin.webp", label: "Book Review" },
  { id: "letter", src: "/letterpin.webp", label: "Letter" },
  { id: "poetry", src: "/ppin.webp", label: "Poetry" },
]

/** Shelf art is 1024×1536. Pin offsets are percentages of that image. */
export const DEFAULT_ROOF_LAYOUT: RoofLayout = {
  roofWidth: 280,
  roofRight: 18,
  roofBottom: 12,
  levelLeft: 50,
  levelTop: 4.6,
  levelFont: 28,
  pins: {
    story: { left: 8, top: 14, width: 84 },
    drama: { left: 8, top: 30, width: 84 },
    bookReview: { left: 6, top: 46, width: 88 },
    letter: { left: 8, top: 62, width: 84 },
    poetry: { left: 8, top: 78, width: 84 },
  },
}

export const roofHeightFromWidth = (width: number) => Math.round(width * (1536 / 1024))
