"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useMainStage } from "@/hooks/use-main-stage"

type FooterBoxKey = "text" | "logos" | "road"

type FooterBox = {
  x: number
  y: number
  w: number
  h: number
}

type FooterCalibration = Record<FooterBoxKey, FooterBox>

const FOOTER_HEIGHT = 108

function getDefaultFooterCalibration(): FooterCalibration {
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth
  return {
    text: { x: 24, y: 10, w: Math.max(520, viewportWidth - 900), h: 88 },
    logos: { x: Math.max(520, viewportWidth - 760), y: 16, w: 500, h: 76 },
    road: { x: viewportWidth - 385, y: 0, w: 385, h: FOOTER_HEIGHT },
  }
}

function FooterRoad({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 520 150"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d="M218 150C247 109 286 80 345 54C405 28 461 9 520 0V150Z"
        fill="rgb(232, 184, 140)"
      />
      <path
        d="M280 150C306 113 336 88 382 66C428 44 471 21 512 2"
        fill="none"
        stroke="rgb(247, 215, 186)"
        strokeWidth="24"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M318 142C332 124 346 108 365 94M385 81C404 68 423 57 445 45M464 34C482 24 497 15 512 8"
        fill="none"
        stroke="rgba(255,255,255,0.86)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Footer() {
  const pathname = usePathname()
  const stage = useMainStage()
  const [calibrateFooter, setCalibrateFooter] = useState(false)
  const [footerBoxes, setFooterBoxes] = useState<FooterCalibration>(getDefaultFooterCalibration)

  useEffect(() => {
    if (typeof window === "undefined") return
    const enabled = new URLSearchParams(window.location.search).get("calibrateFooter") === "1"
    setCalibrateFooter(enabled && stage === "login")
    if (enabled && stage === "login") {
      setFooterBoxes(getDefaultFooterCalibration())
    }
  }, [stage])

  const footerCalibrationText = useMemo(
    () => JSON.stringify(footerBoxes, null, 2),
    [footerBoxes],
  )

  const startMove = (key: FooterBoxKey, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const startBox = footerBoxes[key]

    const onMove = (moveEvent: PointerEvent) => {
      setFooterBoxes((current) => ({
        ...current,
        [key]: {
          ...current[key],
          x: Math.round(startBox.x + moveEvent.clientX - startX),
          y: Math.round(startBox.y + moveEvent.clientY - startY),
        },
      }))
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const startResize = (key: FooterBoxKey, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const startBox = footerBoxes[key]

    const onMove = (moveEvent: PointerEvent) => {
      setFooterBoxes((current) => ({
        ...current,
        [key]: {
          ...current[key],
          w: Math.max(80, Math.round(startBox.w + moveEvent.clientX - startX)),
          h: Math.max(24, Math.round(startBox.h + moveEvent.clientY - startY)),
        },
      }))
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const renderCalibrationFrame = (key: FooterBoxKey, label: string, children: React.ReactNode) => {
    const box = footerBoxes[key]
    return (
      <div
        className="absolute z-30 cursor-move border-2 border-dashed border-amber-300/90 bg-sky-950/10"
        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        onPointerDown={(event) => startMove(key, event)}
      >
        <div className="pointer-events-none absolute left-0 top-0 z-40 rounded-br bg-amber-300 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
          {label}
        </div>
        {children}
        <div
          className="absolute bottom-0 right-0 z-50 h-4 w-4 cursor-se-resize bg-amber-300"
          onPointerDown={(event) => startResize(key, event)}
        />
      </div>
    )
  }

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // 教师工作台：与首页沉浸像素场景一致，隐藏底部 EdUHK 横条
  if (stage === "dashboard") {
    return null
  }

  if (calibrateFooter) {
    return (
      <footer
        className="relative mt-auto h-[108px] w-full overflow-hidden text-white"
        style={{ background: "linear-gradient(180deg, #123f71 0%, #103565 52%, #0b2854 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 5% 56%, rgba(255,255,255,0.72) 0px, rgba(255,255,255,0.72) 1px, transparent 2px), radial-gradient(circle at 10% 38%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 17% 68%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 24% 30%, rgba(255,229,166,0.75) 0px, rgba(255,229,166,0.75) 1px, transparent 2px), radial-gradient(circle at 31% 62%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px), radial-gradient(circle at 43% 48%, rgba(255,255,255,0.46) 0px, rgba(255,255,255,0.46) 1px, transparent 2px), radial-gradient(circle at 52% 42%, rgba(255,229,166,0.76) 0px, rgba(255,229,166,0.76) 1.5px, transparent 3px), radial-gradient(circle at 61% 66%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 72% 35%, rgba(255,255,255,0.68) 0px, rgba(255,255,255,0.68) 1px, transparent 2px), radial-gradient(circle at 80% 58%, rgba(255,229,166,0.72) 0px, rgba(255,229,166,0.72) 1px, transparent 2px), radial-gradient(circle at 89% 62%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 96% 42%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px)",
          }}
        />

        {renderCalibrationFrame("text", "TEXT", (
          <div className="h-full w-full overflow-hidden p-2 text-left drop-shadow-[0_2px_3px_rgba(0,0,0,0.38)]">
            <p className="text-[17px] font-semibold leading-6 text-sky-50">Strategic Plan Start-up Project @EdUHK</p>
            <p className="mt-0.5 text-[17px] font-semibold leading-6 text-white">
              Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
            </p>
            <p className="mt-1 text-[12px] font-medium leading-[14px] text-sky-50/80">
              <span className="font-bold uppercase tracking-[0.14em]">Disclaimer:</span>
              {" "}This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect
              information. Please think carefully, check important information, and ask a teacher or parent if you are
              unsure. By using this website, you understand that AI is not always perfect.
            </p>
          </div>
        ))}

        {renderCalibrationFrame("logos", "LOGOS", (
          <div className="flex h-full w-full items-center justify-center gap-8 p-2">
            <Image
              src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
              alt="The Education University of Hong Kong logo"
              width={280}
              height={92}
              className="h-auto w-[54%] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.28)]"
              priority={false}
            />
            <Image
              src="/MIT_Logo2-1024x290.webp"
              alt="MIT logo"
              width={210}
              height={60}
              className="h-auto w-[46%] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.22)]"
              priority={false}
            />
          </div>
        ))}

        {renderCalibrationFrame("road", "ROAD", (
          <FooterRoad className="h-full w-full" />
        ))}

        <div className="absolute right-3 top-3 z-[60] w-[300px] rounded-lg border border-amber-300 bg-slate-950/90 p-3 text-xs text-amber-50 shadow-2xl">
          <div className="mb-2 font-bold text-amber-300">Footer 校准模式</div>
          <div className="mb-2 text-[11px] leading-snug text-slate-200">拖动虚线框移动元素，拖右下角黄色块缩放。完成后复制下面数据发给我。</div>
          <textarea
            readOnly
            value={footerCalibrationText}
            className="h-28 w-full resize-none rounded border border-slate-700 bg-slate-900 p-2 font-mono text-[10px] text-slate-100"
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="mt-2 rounded bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950"
            onClick={() => void navigator.clipboard?.writeText(footerCalibrationText)}
          >
            复制数据
          </button>
        </div>
      </footer>
    )
  }

  return (
    <footer
      className="relative mt-auto h-[108px] w-full overflow-hidden text-white sm:h-[104px]"
      style={{ background: "linear-gradient(180deg, #123f71 0%, #103565 52%, #0b2854 100%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 5% 56%, rgba(255,255,255,0.72) 0px, rgba(255,255,255,0.72) 1px, transparent 2px), radial-gradient(circle at 10% 38%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 17% 68%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 24% 30%, rgba(255,229,166,0.75) 0px, rgba(255,229,166,0.75) 1px, transparent 2px), radial-gradient(circle at 31% 62%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px), radial-gradient(circle at 43% 48%, rgba(255,255,255,0.46) 0px, rgba(255,255,255,0.46) 1px, transparent 2px), radial-gradient(circle at 52% 42%, rgba(255,229,166,0.76) 0px, rgba(255,229,166,0.76) 1.5px, transparent 3px), radial-gradient(circle at 61% 66%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 72% 35%, rgba(255,255,255,0.68) 0px, rgba(255,255,255,0.68) 1px, transparent 2px), radial-gradient(circle at 80% 58%, rgba(255,229,166,0.72) 0px, rgba(255,229,166,0.72) 1px, transparent 2px), radial-gradient(circle at 89% 62%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 96% 42%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px)",
        }}
      />
      <svg
        className="pointer-events-none absolute bottom-0 right-0 z-[1] h-[108px] w-[220px] opacity-100 sm:h-[104px] sm:w-[260px] md:w-[295px] lg:w-[330px] xl:w-[385px]"
        viewBox="0 0 520 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          d="M218 150C247 109 286 80 345 54C405 28 461 9 520 0V150Z"
          fill="rgb(232, 184, 140)"
        />
        <path
          d="M280 150C306 113 336 88 382 66C428 44 471 21 512 2"
          fill="none"
          stroke="rgb(247, 215, 186)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M318 142C332 124 346 108 365 94M385 81C404 68 423 57 445 45M464 34C482 24 497 15 512 8"
          fill="none"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 mx-auto flex h-full max-w-[1900px] items-center gap-6 px-3 pr-[138px] sm:px-5 sm:pr-[165px] md:pr-[188px] lg:gap-10 lg:px-8 lg:pr-[218px] xl:pr-[255px]">
        <div className="relative z-20 hidden min-w-0 max-w-[980px] flex-1 text-left drop-shadow-[0_2px_3px_rgba(0,0,0,0.38)] lg:block">
          <p className="text-[17px] font-semibold leading-6 text-sky-50">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-0.5 break-words text-[17px] font-semibold leading-6 text-white">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="mt-1 max-w-[930px] break-words text-[12px] font-medium leading-[14px] text-sky-50/80">
            <span className="font-bold uppercase tracking-[0.14em]">Disclaimer:</span>
            {" "}This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect
            information. Please think carefully, check important information, and ask a teacher or parent if you are
            unsure. By using this website, you understand that AI is not always perfect.
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-8">
          <Image
            src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
            alt="The Education University of Hong Kong logo"
            width={280}
            height={92}
            className="h-auto w-[160px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.28)] sm:w-[195px] md:w-[225px] xl:w-[270px]"
            priority={false}
          />

          <Image
            src="/MIT_Logo2-1024x290.webp"
            alt="MIT logo"
            width={210}
            height={60}
            className="h-auto w-[138px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.22)] sm:w-[168px] md:w-[195px] xl:w-[230px]"
            priority={false}
          />
        </div>
      </div>
    </footer>
  )
}


