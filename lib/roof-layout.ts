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
  roofWidth: 487,
  roofRight: -113,
  roofBottom: 363,
  levelLeft: 50.5,
  levelTop: 8.8,
  levelFont: 32,
  pins: {
    story: { left: 32.3, top: 16.2, width: 35.4 },
    drama: { left: 30.6, top: 30, width: 39 },
    bookReview: { left: 30.6, top: 43.1, width: 42.4 },
    letter: { left: 34, top: 58.1, width: 33.7 },
    poetry: { left: 32.3, top: 73, width: 37.2 },
  },
}

export const roofHeightFromWidth = (width: number) => Math.round(width * (1536 / 1024))
