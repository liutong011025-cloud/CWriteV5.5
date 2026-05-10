"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { BackButton } from "@/components/ui/back-button"
import {
  RESOURCE_DETAIL_EXIT,
  RESOURCE_DETAIL_SRC,
  RESOURCE_MAIN_HOTSPOTS,
  type ResourceImageRect,
  type ResourceMainKey,
} from "@/lib/resource-hotspots"

interface ResearchRoomProps {
  onBack?: () => void
}

const RESOURCE_BG = "/resources.png"
const HOVER_SOUND = "/soundreality-finger-snap-179180.mp3"
const BGM_LOOP = "/yoshiyuki_tatsuya-pixel-hearts-foreverwav-427383.mp3"

const MAIN_ORDER: ResourceMainKey[] = ["cefr", "longman", "srl"]

/** 與 object-cover 背景對齊的 overlay 矩形（px），同 My Farm / navigation */
interface CoverOverlayRect {
  width: number
  height: number
  left: number
  top: number
}

function cloneMain(
  m: Record<ResourceMainKey, ResourceImageRect>
): Record<ResourceMainKey, ResourceImageRect> {
  return {
    cefr: { ...m.cefr },
    longman: { ...m.longman },
    srl: { ...m.srl },
  }
}

function rectStyle(r: ResourceImageRect): CSSProperties {
  return {
    position: "absolute",
    left: `${r.left}%`,
    top: `${r.top}%`,
    width: `${r.width}%`,
    height: `${r.height}%`,
  }
}

function RectFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: ResourceImageRect
  onChange: (next: ResourceImageRect) => void
}) {
  const row = (key: keyof ResourceImageRect, caption: string) => (
    <label className="flex items-center gap-1 text-[10px] text-white/90">
      <span className="w-10 shrink-0">{caption}</span>
      <input
        type="number"
        step={0.1}
        className="w-14 rounded border border-white/30 bg-black/50 px-1 text-[11px]"
        value={value[key]}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          if (Number.isFinite(n)) onChange({ ...value, [key]: n })
        }}
      />
    </label>
  )
  return (
    <div className="rounded-md border border-amber-400/40 bg-black/70 p-2">
      <div className="mb-1 font-semibold text-amber-200">{label}</div>
      <div className="grid grid-cols-2 gap-1">
        {row("left", "L")}
        {row("top", "T")}
        {row("width", "W")}
        {row("height", "H")}
      </div>
    </div>
  )
}

export default function ResearchRoom({ onBack }: ResearchRoomProps) {
  const [detail, setDetail] = useState<ResourceMainKey | null>(null)
  const [calibrate, setCalibrate] = useState(false)
  const [mainRects, setMainRects] = useState(() => cloneMain(RESOURCE_MAIN_HOTSPOTS))
  const [exitRect, setExitRect] = useState<ResourceImageRect>(() => ({
    ...RESOURCE_DETAIL_EXIT,
  }))
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null)

  const mainContainerRef = useRef<HTMLDivElement | null>(null)
  const mainImageRef = useRef<HTMLImageElement | null>(null)
  const [mainCoverRect, setMainCoverRect] = useState<CoverOverlayRect | null>(null)

  const updateMainCoverRect = useCallback(() => {
    const container = mainContainerRef.current
    const img = mainImageRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const s = Math.max(cw / iw, ch / ih)
    setMainCoverRect({
      width: s * iw,
      height: s * ih,
      left: -(s * iw - cw) / 2,
      top: -(s * ih - ch) / 2,
    })
  }, [])

  useEffect(() => {
    try {
      setCalibrate(
        typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("calibrateResources") === "1"
      )
    } catch {
      setCalibrate(false)
    }
  }, [])

  useEffect(() => {
    const container = mainContainerRef.current
    const img = mainImageRef.current
    if (!img || !container) return
    if (img.complete && img.naturalWidth) updateMainCoverRect()
    img.addEventListener("load", updateMainCoverRect)
    window.addEventListener("resize", updateMainCoverRect)
    const ro = new ResizeObserver(updateMainCoverRect)
    ro.observe(container)
    return () => {
      img.removeEventListener("load", updateMainCoverRect)
      window.removeEventListener("resize", updateMainCoverRect)
      ro.disconnect()
    }
  }, [updateMainCoverRect])

  useEffect(() => {
    const a = new Audio(HOVER_SOUND)
    a.preload = "auto"
    hoverAudioRef.current = a
    return () => {
      hoverAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    const bgm = new Audio(BGM_LOOP)
    bgm.loop = true
    bgm.volume = 0.3
    bgm.preload = "auto"
    const tryPlay = () => void bgm.play().catch(() => {})
    tryPlay()
    const onFirstGesture = () => {
      tryPlay()
      window.removeEventListener("pointerdown", onFirstGesture)
    }
    window.addEventListener("pointerdown", onFirstGesture, { passive: true })
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture)
      bgm.pause()
      bgm.src = ""
    }
  }, [])

  const playHoverSound = useCallback(() => {
    const a = hoverAudioRef.current
    if (!a) return
    try {
      a.currentTime = 0
      void a.play().catch(() => {})
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detail])

  const copyCalibrationSnippet = useCallback(() => {
    const { cefr, longman, srl } = mainRects
    const snippet = `// 貼到 lib/resource-hotspots.ts，覆蓋同名常數即可

export const RESOURCE_MAIN_HOTSPOTS: Record<ResourceMainKey, ResourceImageRect> = {
  cefr: { left: ${cefr.left}, top: ${cefr.top}, width: ${cefr.width}, height: ${cefr.height} },
  longman: { left: ${longman.left}, top: ${longman.top}, width: ${longman.width}, height: ${longman.height} },
  srl: { left: ${srl.left}, top: ${srl.top}, width: ${srl.width}, height: ${srl.height} },
}

export const RESOURCE_DETAIL_EXIT: ResourceImageRect = {
  left: ${exitRect.left}, top: ${exitRect.top}, width: ${exitRect.width}, height: ${exitRect.height},
}
`
    void navigator.clipboard.writeText(snippet)
  }, [mainRects, exitRect])

  const overlayBoxStyle = (rect: CoverOverlayRect | null): CSSProperties =>
    rect
      ? {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
        }
      : { left: 0, top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }

  return (
    <div
      className="min-h-screen w-full bg-transparent"
      style={{ paddingTop: 0, paddingBottom: 0 }}
      data-stage="research"
    >
      {onBack && (
        <div
          className="fixed left-2.5 z-[60] sm:left-4 md:left-5"
          style={{
            top: "max(0.5rem, calc(var(--stage-top-padding) + 10px))",
          }}
        >
          <BackButton
            onClick={onBack}
            variant="amber"
            noFixed
            aria-label="Back"
            className="!h-16 !w-16 border-[3px] shadow-lg md:!h-[4.5rem] md:!w-[4.5rem] md:border-4 xl:!h-24 xl:!w-24 xl:border-[5px] [&_svg]:!h-8 [&_svg]:!w-8 md:[&_svg]:!h-9 md:[&_svg]:!w-9 xl:[&_svg]:!h-12 xl:[&_svg]:!w-12"
          />
        </div>
      )}

      {/* 與 My Farm 相同：固定視窗鋪滿，object-cover，熱區在 cover 對齊層內用 % */}
      <div ref={mainContainerRef} className="fixed inset-0 h-full w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- 與農場一致，配合 cover 矩陣對齊熱區 */}
        <img
          ref={mainImageRef}
          src={RESOURCE_BG}
          alt="Resources"
          className="absolute inset-0 h-full w-full object-cover object-center select-none"
          draggable={false}
        />

        <div className="absolute" style={overlayBoxStyle(mainCoverRect)}>
          {MAIN_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={key === "cefr" ? "CEFR" : key === "longman" ? "Longman" : "SRL"}
              className={`absolute z-20 cursor-pointer border-0 bg-transparent p-0 outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-amber-300 ${
                calibrate ? "border-2 border-dashed border-red-400/80 bg-red-500/20" : ""
              }`}
              style={rectStyle(mainRects[key])}
              onPointerEnter={playHoverSound}
              onClick={() => setDetail(key)}
            />
          ))}
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/80 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Resource detail"
        >
          {/* 約 √5 倍邊長 → 顯示面積約 5 倍（相對原 640×560 上限） */}
          <div className="relative inline-block max-w-[min(1430px,96vw)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 詳情居中，熱區相對圖片包盒 */}
            <img
              src={RESOURCE_DETAIL_SRC[detail]}
              alt=""
              className="block h-auto max-h-[min(90vh,1240px)] w-full object-contain select-none"
              draggable={false}
            />
            <button
              type="button"
              aria-label="Close"
              className={`absolute z-20 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                calibrate ? "border-2 border-dashed border-cyan-400/80 bg-cyan-500/20" : ""
              }`}
              style={rectStyle(exitRect)}
              onClick={() => setDetail(null)}
            />
          </div>
        </div>
      )}

      {calibrate && (
        <div className="fixed bottom-2 left-2 z-[250] max-h-[70vh] w-[min(100vw-16px,320px)] overflow-y-auto rounded-xl border border-amber-500/50 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur-sm">
          <div className="mb-2 font-bold text-amber-300">Resource 熱區校準</div>
          <p className="mb-2 text-[10px] leading-snug text-slate-300">
            拖曳視窗對齊後，調整數值；完成後點「複製」把結果貼給開發者更新{" "}
            <code className="text-amber-200/90">lib/resource-hotspots.ts</code>。移除此模式：去掉網址{" "}
            <code className="text-amber-200/90">?calibrateResources=1</code>。
          </p>
          <div className="flex flex-col gap-2">
            {MAIN_ORDER.map((key) => (
              <RectFields
                key={key}
                label={key.toUpperCase()}
                value={mainRects[key]}
                onChange={(next) =>
                  setMainRects((prev) => ({
                    ...prev,
                    [key]: next,
                  }))
                }
              />
            ))}
            <RectFields label="詳情頁退出鈕 (X)" value={exitRect} onChange={setExitRect} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
              onClick={copyCalibrationSnippet}
            >
              複製設定片段
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
              onClick={() => {
                setMainRects(cloneMain(RESOURCE_MAIN_HOTSPOTS))
                setExitRect({ ...RESOURCE_DETAIL_EXIT })
              }}
            >
              還原預設
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
