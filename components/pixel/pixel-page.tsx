"use client"

import type { ReactNode } from "react"

export default function PixelPage({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const normalizedStyle: React.CSSProperties | undefined = style
    ? {
        ...style,
        paddingTop:
          style.paddingTop === "128px" || style.paddingTop === "120px"
            ? "var(--stage-top-padding)"
            : style.paddingTop,
        paddingBottom:
          style.paddingBottom === "120px" || style.paddingBottom === "128px"
            ? "var(--stage-bottom-padding)"
            : style.paddingBottom,
      }
    : undefined

  return (
    <div className={`min-h-screen relative overflow-hidden pixel-theme ${className || ""}`.trim()} style={normalizedStyle}>
      {/* Pixel art background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(180deg,
            #b8e4f9 0%,
            #87ceeb 25%,
            #7ec850 65%,
            #5a9a32 100%)`,
        }}
      >
        <div
          className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80"
          style={{
            clipPath:
              "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)",
          }}
        />
        <div
          className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70"
          style={{
            clipPath:
              "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(22)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 4 + Math.random() * 2}%`,
                width: "8px",
                height: `${18 + Math.random() * 18}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

