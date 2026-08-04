"use client"

import React from "react"

type PixelStarRatingProps = {
  value: number
  max?: number
  /** 单个像素块大小（px） */
  pixel?: number
  /** 星星之间间距（px） */
  gap?: number
  /** 填充色 */
  fillColor?: string
  /** 描边/阴影色（像素风） */
  strokeColor?: string
  /** 未填充色 */
  emptyColor?: string
  className?: string
}

const STAR_PIXELS: Array<[number, number]> = [
  // 9x9 grid, a simple stardew-like chunky star
  [4, 0],
  [3, 1],[4, 1],[5, 1],
  [2, 2],[3, 2],[4, 2],[5, 2],[6, 2],
  [1, 3],[2, 3],[3, 3],[4, 3],[5, 3],[6, 3],[7, 3],
  [2, 4],[3, 4],[4, 4],[5, 4],[6, 4],
  [3, 5],[4, 5],[5, 5],
  [4, 6],
]

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}

function pixelShadow(
  pixels: Array<[number, number]>,
  pixel: number,
  color: string
) {
  return pixels.map(([x, y]) => `${x * pixel}px ${y * pixel}px 0 ${color}`).join(", ")
}

function pixelOutlinePixels(pixels: Array<[number, number]>): Array<[number, number]> {
  const set = new Set(pixels.map(([x, y]) => `${x},${y}`))
  const outline = new Set<string>()
  const dirs: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [x, y] of pixels) {
    for (const [dx, dy] of dirs) {
      const k = `${x + dx},${y + dy}`
      if (!set.has(k)) outline.add(k)
    }
  }
  return Array.from(outline).map((k) => k.split(",").map(Number) as [number, number])
}

const OUTLINE_PIXELS = pixelOutlinePixels(STAR_PIXELS)

function PixelStar({
  filled,
  pixel,
  fillColor,
  strokeColor,
  emptyColor,
}: {
  filled: boolean
  pixel: number
  fillColor: string
  strokeColor: string
  emptyColor: string
}) {
  const w = 9 * pixel
  const h = 9 * pixel
  const bodyColor = filled ? fillColor : emptyColor

  // 以 box-shadow 画像素：一个 1x1 像素块 + 多个阴影
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "inline-block",
        width: `${w}px`,
        height: `${h}px`,
        imageRendering: "pixelated",
      }}
    >
      {/* outline */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${pixel}px`,
          height: `${pixel}px`,
          background: "transparent",
          boxShadow: pixelShadow(OUTLINE_PIXELS, pixel, strokeColor),
        }}
      />
      {/* body */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${pixel}px`,
          height: `${pixel}px`,
          background: "transparent",
          boxShadow: pixelShadow(STAR_PIXELS, pixel, bodyColor),
        }}
      />
    </span>
  )
}

export function PixelStarRating({
  value,
  max = 5,
  pixel = 2,
  gap = 6,
  fillColor = "#ffd700",
  strokeColor = "rgba(0,0,0,0.45)",
  emptyColor = "rgba(255,215,0,0.25)",
  className,
}: PixelStarRatingProps) {
  const v = clampInt(value, 0, max)
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: `${gap}px`,
        lineHeight: 1,
      }}
      aria-label={`${v} / ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <PixelStar
          key={i}
          filled={i < v}
          pixel={pixel}
          fillColor={fillColor}
          strokeColor={strokeColor}
          emptyColor={emptyColor}
        />
      ))}
    </span>
  )
}

