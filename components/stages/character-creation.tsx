"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Sparkles, Trash2, Eraser, PencilLine, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { EOB_TRAITS, type EobTrait } from "@/lib/character-eob-traits"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CharacterCreationProps {
  language: Language
  onCharacterCreate: (character: StoryState["character"]) => void
  onBack: () => void
  userId?: string
  level?: number
}

const SPECIES = [
  { name: "Boy", icon: "👦" },
  { name: "Girl", icon: "👧" },
  { name: "Cat", icon: "🐱" },
  { name: "Dog", icon: "🐶" },
  { name: "Rabbit", icon: "🐰" },
  { name: "Bear", icon: "🐻" },
  { name: "Fox", icon: "🦊" },
  { name: "Lion", icon: "🦁" },
  { name: "Tiger", icon: "🐯" },
  { name: "Dragon", icon: "🐉" },
  { name: "Unicorn", icon: "🦄" },
  { name: "Panda", icon: "🐼" },
]

const TRAIT_STYLE_CLASSES = [
  { idle: "bg-rose-100 border-rose-300 text-rose-900 hover:bg-rose-200", selected: "bg-rose-500 border-rose-600 text-white ring-2 ring-rose-300" },
  { idle: "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200", selected: "bg-amber-500 border-amber-600 text-white ring-2 ring-amber-300" },
  { idle: "bg-lime-100 border-lime-300 text-lime-900 hover:bg-lime-200", selected: "bg-lime-500 border-lime-600 text-white ring-2 ring-lime-300" },
  { idle: "bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200", selected: "bg-emerald-500 border-emerald-600 text-white ring-2 ring-emerald-300" },
  { idle: "bg-cyan-100 border-cyan-300 text-cyan-900 hover:bg-cyan-200", selected: "bg-cyan-500 border-cyan-600 text-white ring-2 ring-cyan-300" },
  { idle: "bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200", selected: "bg-sky-500 border-sky-600 text-white ring-2 ring-sky-300" },
  { idle: "bg-indigo-100 border-indigo-300 text-indigo-900 hover:bg-indigo-200", selected: "bg-indigo-500 border-indigo-600 text-white ring-2 ring-indigo-300" },
  { idle: "bg-violet-100 border-violet-300 text-violet-900 hover:bg-violet-200", selected: "bg-violet-500 border-violet-600 text-white ring-2 ring-violet-300" },
  { idle: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900 hover:bg-fuchsia-200", selected: "bg-fuchsia-500 border-fuchsia-600 text-white ring-2 ring-fuchsia-300" },
]

type DrawMode = "pen" | "eraser"

export default function CharacterCreation({ onCharacterCreate, onBack, userId, level = 1 }: CharacterCreationProps) {
  const [species, setSpecies] = useState("")
  const [customSpecies, setCustomSpecies] = useState("")
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [background, setBackground] = useState("")
  const [emotional, setEmotional] = useState("")
  const [symbolic, setSymbolic] = useState("")

  const [imageUrl, setImageUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)
  const [showGenerationHint, setShowGenerationHint] = useState(false)
  const [introMascotFading, setIntroMascotFading] = useState(false)
  const [hasSketchStroke, setHasSketchStroke] = useState(false)
  const [drawMode, setDrawMode] = useState<DrawMode>("pen")
  const [brushSize, setBrushSize] = useState(5)
  const [strokeHex, setStrokeHex] = useState("#1f2937")
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [traitDialogOpen, setTraitDialogOpen] = useState(false)
  const [traitDialogTrait, setTraitDialogTrait] = useState<EobTrait | null>(null)
  const layoutConfig = {
    bearX: 127,
    bearY: -54,
    bearScale: 1.67,
    bubbleX: 229,
    bubbleY: 249,
    bubbleScale: 0.81,
    sketchX: 0,
    sketchY: -12,
    sketchWidth: 1700,
    sketchHeight: 480,
  } as const

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const hasInitializedCanvasRef = useRef(false)

  const finalSpecies = species === "Custom" ? customSpecies.trim() : species
  const isHighLevel = level >= 4

  const requiredTextComplete = useMemo(() => {
    if (!finalSpecies.trim()) return false
    if (!name.trim()) return false
    if (!age.trim()) return false
    if (selectedTraits.length === 0) return false
    if (isHighLevel) {
      if (!background.trim()) return false
      if (!emotional.trim()) return false
      if (!symbolic.trim()) return false
    }
    return true
  }, [age, background, emotional, finalSpecies, isHighLevel, name, selectedTraits.length, symbolic])

  const canGenerate = !!finalSpecies.trim() && hasSketchStroke && !isGenerating
  const canContinue = requiredTextComplete && !!imageUrl && !isGenerating

  const getPointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
  }

  const resizeCanvas = (preserveDrawing: boolean) => {
    const canvas = canvasRef.current
    const host = containerRef.current
    if (!canvas || !host) return

    let snapshotDataUrl: string | null = null
    if (preserveDrawing && hasInitializedCanvasRef.current) {
      try {
        snapshotDataUrl = canvas.toDataURL("image/png")
      } catch {
        snapshotDataUrl = null
      }
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const cssWidth = Math.max(320, host.clientWidth)
    const cssHeight = Math.max(320, host.clientHeight)

    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    fillCanvasBase()

    if (snapshotDataUrl) {
      const img = new Image()
      img.onload = () => {
        const redrawCtx = canvas.getContext("2d")
        if (!redrawCtx) return
        redrawCtx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = snapshotDataUrl
    }
  }

  const fillCanvasBase = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  useEffect(() => {
    resizeCanvas(false)
    hasInitializedCanvasRef.current = true
    setHasSketchStroke(false)
  }, [])

  useEffect(() => {
    if (!hasInitializedCanvasRef.current) return
    const timer = window.setTimeout(() => {
      resizeCanvas(true)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [showDetailsPanel])

  const clearSketch = () => {
    fillCanvasBase()
    setHasSketchStroke(false)
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPointFromEvent(event)
    if (!point) return
    isDrawingRef.current = true
    lastPointRef.current = point
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const endDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore release failures when pointer is not captured.
      }
    }
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const point = getPointFromEvent(event)
    if (!canvas || !point) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const last = lastPointRef.current || point
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.lineWidth = brushSize

    if (drawMode === "eraser") {
      ctx.strokeStyle = "#ffffff"
    } else {
      ctx.strokeStyle = strokeHex
    }

    ctx.stroke()
    lastPointRef.current = point
    setHasSketchStroke(true)
  }

  const toggleTrait = (traitName: string) => {
    setSelectedTraits((prev) =>
      prev.includes(traitName) ? prev.filter((t) => t !== traitName) : [...prev, traitName].slice(0, 3)
    )
  }

  const handleGenerateImage = async () => {
    if (!canGenerate) {
      if (!finalSpecies.trim()) {
        toast.error("Choose a species first so AI can follow your design.")
        return
      }
      if (!hasSketchStroke) {
        toast.error("Please draw your character sketch first.")
        return
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas || !hasInitializedCanvasRef.current) {
      toast.error("Drawing board is not ready yet.")
      return
    }

    setIsGenerating(true)
    setShowGenerationHint(true)
    if (!showDetailsPanel) {
      setIntroMascotFading(true)
      window.setTimeout(() => setShowDetailsPanel(true), 700)
    }
    toast.info("Generating image... This can take some time. You can continue filling details while waiting.")

    try {
      const drawingDataUrl = canvas.toDataURL("image/png")
      const response = await fetch("/api/character-image-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawingDataUrl,
          species: finalSpecies,
          name: name.trim() || null,
          age: age.trim() || null,
          traits: selectedTraits,
          background: background.trim() || null,
          emotional: emotional.trim() || null,
          symbolic: symbolic.trim() || null,
          userId: userId || "default-user",
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        toast.error(data.message || data.error || "Failed to generate image.")
        return
      }

      if (data.imageUrl) {
        setImageUrl(data.imageUrl as string)
        setShowGenerationHint(false)
        toast.success("Character image generated!")
      } else {
        toast.error("No image returned. Please try again.")
      }
    } catch (error) {
      console.error("Error generating character image:", error)
      toast.error("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreate = () => {
    if (!canContinue) {
      toast.error("Complete all required details and generate the image before continuing.")
      return
    }

    const parsedAge = Number.parseInt(age.trim(), 10)
    const safeAge = Number.isFinite(parsedAge) ? parsedAge : finalSpecies === "Boy" || finalSpecies === "Girl" ? 8 : 0

    onCharacterCreate({
      name: name.trim(),
      age: safeAge,
      traits: selectedTraits,
      description: background.trim(),
      imageUrl,
      species: finalSpecies,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-fuchsia-50 to-amber-50 px-6 py-8 relative overflow-hidden" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-fuchsia-200/50 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-16 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl animate-pulse" style={{ animationDelay: "300ms" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl animate-pulse" style={{ animationDelay: "700ms" }} />
      </div>
      <div className="pointer-events-none absolute top-[140px] left-10 text-5xl animate-bounce" style={{ animationDuration: "2.6s" }}>🎨</div>
      <div className="pointer-events-none absolute top-[210px] right-14 text-4xl animate-bounce" style={{ animationDelay: "0.7s", animationDuration: "2.9s" }}>🖍️</div>
      <div className="pointer-events-none absolute top-[110px] left-1/3 text-4xl animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "3.1s" }}>🧁</div>
      <div className="pointer-events-none absolute top-[180px] right-1/3 text-4xl animate-bounce" style={{ animationDelay: "1.2s", animationDuration: "2.7s" }}>🪄</div>
      <div className="pointer-events-none absolute bottom-[120px] left-16 text-4xl animate-bounce" style={{ animationDelay: "1.1s", animationDuration: "3.2s" }}>✨</div>
      <div className="pointer-events-none absolute bottom-[170px] right-10 text-5xl animate-bounce" style={{ animationDelay: "1.5s", animationDuration: "2.8s" }}>🌈</div>
      <div className="pointer-events-none absolute bottom-[100px] left-1/3 text-4xl animate-bounce" style={{ animationDelay: "0.9s", animationDuration: "3.4s" }}>🎀</div>
      <div className="pointer-events-none absolute bottom-[220px] right-1/4 text-4xl animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "2.5s" }}>🧸</div>
      <div className="pointer-events-none absolute top-[300px] left-[8%] text-3xl animate-bounce" style={{ animationDelay: "1.8s", animationDuration: "3.2s" }}>⭐</div>
      <div className="pointer-events-none absolute top-[330px] right-[10%] text-3xl animate-bounce" style={{ animationDelay: "1.4s", animationDuration: "3s" }}>💫</div>
      <div className="pointer-events-none absolute top-[240px] left-[20%] text-4xl animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3.1s" }}>🦄</div>
      <div className="pointer-events-none absolute top-[260px] right-[22%] text-4xl animate-bounce" style={{ animationDelay: "1s", animationDuration: "2.6s" }}>🌟</div>
      <div className="pointer-events-none absolute bottom-[240px] left-[24%] text-4xl animate-bounce" style={{ animationDelay: "1.6s", animationDuration: "3.3s" }}>🍭</div>
      <div className="pointer-events-none absolute bottom-[260px] right-[18%] text-4xl animate-bounce" style={{ animationDelay: "0.8s", animationDuration: "2.9s" }}>🫧</div>
      <div className="pointer-events-none absolute top-[380px] left-[6%] text-3xl animate-bounce" style={{ animationDelay: "1.3s", animationDuration: "3.5s" }}>🎈</div>
      <div className="pointer-events-none absolute top-[410px] right-[6%] text-3xl animate-bounce" style={{ animationDelay: "0.6s", animationDuration: "2.7s" }}>🧠</div>
      <div className="pointer-events-none absolute bottom-[70px] left-[40%] text-4xl animate-bounce" style={{ animationDelay: "1.9s", animationDuration: "3.2s" }}>🎉</div>
      <div className="pointer-events-none absolute bottom-[80px] right-[38%] text-4xl animate-bounce" style={{ animationDelay: "1.1s", animationDuration: "2.8s" }}>🎊</div>
      <Dialog
        open={traitDialogOpen}
        onOpenChange={(open) => {
          setTraitDialogOpen(open)
          if (!open) setTraitDialogTrait(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {traitDialogTrait && (
            <>
              <DialogHeader>
                <DialogTitle>{traitDialogTrait.name}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-foreground">
                {traitDialogTrait.explanationTemplate.replace(/\{\{name\}\}/g, name.trim() || "your character")}
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">When writing, you can use:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {traitDialogTrait.writingTips.map((tip, i) => (
                    <li key={i}>"{tip}"</li>
                  ))}
                </ul>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                {selectedTraits.includes(traitDialogTrait.name) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleTrait(traitDialogTrait.name)
                      setTraitDialogOpen(false)
                      setTraitDialogTrait(null)
                    }}
                  >
                    Unselect
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      toggleTrait(traitDialogTrait.name)
                      setTraitDialogOpen(false)
                      setTraitDialogTrait(null)
                    }}
                  >
                    Select this trait
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setTraitDialogOpen(false)
                    setTraitDialogTrait(null)
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto relative z-10">
        <StageHeader stage={1} title="Create Your Character" onBack={onBack} />

        {showGenerationHint && (
          <div className="mt-6 mx-auto max-w-4xl rounded-2xl border-2 border-fuchsia-300 bg-white/95 px-7 py-4 text-lg font-bold text-fuchsia-700 shadow-xl">
            This may take some time. You can continue filling in your character details while the image is generating.
          </div>
        )}

        <div className={`mt-8 ${showDetailsPanel ? "grid grid-cols-1 xl:grid-cols-12 gap-6" : "flex justify-center items-center min-h-[72vh] w-full gap-8"}`}>
          <section
            className={`self-start rounded-3xl border-2 border-violet-200 bg-white/80 backdrop-blur-sm shadow-xl p-6 transition-all duration-700 ${
              showDetailsPanel
                ? "xl:col-span-7"
                : "scale-100"
            }`}
            style={
              showDetailsPanel
                ? { transform: `translate(${layoutConfig.sketchX - 12}px, ${layoutConfig.sketchY}px) scale(0.94)` }
                : {
                    width: `${layoutConfig.sketchWidth}px`,
                    maxWidth: "94vw",
                    transform: `translate(${layoutConfig.sketchX}px, ${layoutConfig.sketchY}px)`,
                  }
            }
          >
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-2xl font-bold text-violet-700">Sketch Board</h2>
              <p className="text-sm text-violet-600">1) Choose species, 2) Draw, 3) Generate</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-violet-700 mb-2">Species (Required first)</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {SPECIES.map((spec) => {
                  const selected = species === spec.name
                  return (
                    <button
                      key={spec.name}
                      type="button"
                      onClick={() => setSpecies(spec.name)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                        selected ? "border-violet-500 bg-violet-100 text-violet-800" : "border-violet-100 bg-white text-slate-700 hover:border-violet-300"
                      }`}
                    >
                      <span className="mr-1">{spec.icon}</span>
                      {spec.name}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setSpecies("Custom")}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                    species === "Custom"
                      ? "border-violet-500 bg-violet-100 text-violet-800"
                      : "border-violet-100 bg-white text-slate-700 hover:border-violet-300"
                  }`}
                >
                  ✏️ Custom
                </button>
              </div>
              {species === "Custom" && (
                <Input
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  placeholder="Enter custom species..."
                  className="mt-3 border-violet-200 focus-visible:ring-violet-400"
                />
              )}
            </div>

            <div className="rounded-2xl border border-[#d2b48c] bg-[#f3e7cf] p-4 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={drawMode === "pen" ? "default" : "outline"}
                    onClick={() => setDrawMode("pen")}
                    className={drawMode === "pen" ? "bg-violet-600 hover:bg-violet-700" : "border-violet-300 text-violet-700"}
                  >
                    <PencilLine className="h-4 w-4 mr-1" />
                    Pen
                  </Button>
                  <Button
                    type="button"
                    variant={drawMode === "eraser" ? "default" : "outline"}
                    onClick={() => setDrawMode("eraser")}
                    className={drawMode === "eraser" ? "bg-violet-600 hover:bg-violet-700" : "border-violet-300 text-violet-700"}
                  >
                    <Eraser className="h-4 w-4 mr-1" />
                    Eraser
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-violet-700 font-semibold">Size</label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-28 accent-violet-600"
                  />
                  <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    className="relative h-10 w-10 rounded-full border-2 border-violet-200 shadow-sm disabled:opacity-50"
                    style={{ backgroundColor: strokeHex }}
                    disabled={drawMode === "eraser"}
                    aria-label="Choose stroke color"
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={strokeHex}
                    onChange={(e) => setStrokeHex(e.target.value)}
                    className="sr-only"
                    disabled={drawMode === "eraser"}
                    aria-label="Stroke color picker"
                  />
                </div>
              </div>

              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden border-2 border-violet-200 bg-white transition-all duration-500"
                style={{ height: `${showDetailsPanel ? Math.max(300, layoutConfig.sketchHeight - 100) : layoutConfig.sketchHeight}px` }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 touch-none"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={endDrawing}
                  onPointerCancel={endDrawing}
                  onPointerLeave={endDrawing}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <Button type="button" variant="outline" onClick={clearSketch} className="border-violet-300 text-violet-700">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Board
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!canGenerate}
                  className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate from Sketch
                    </>
                  )}
                </Button>
              </div>

            </div>
          </section>

          {!showDetailsPanel && (
            <aside
              className={`hidden xl:flex relative flex-col items-center justify-end w-[420px] min-h-[620px] transition-all duration-700 ${
                introMascotFading ? "opacity-0" : "opacity-100"
              }`}
              style={{
                transform: `translate(${layoutConfig.bearX + (introMascotFading ? 24 : 0)}px, ${layoutConfig.bearY}px) scale(${layoutConfig.bearScale * (introMascotFading ? 0.95 : 1)})`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute top-10 left-1/2 -translate-x-1/2 w-[380px] rounded-2xl border-2 border-amber-200 bg-white/95 px-4 py-3 text-center text-[15px] font-bold text-amber-700 shadow-xl leading-snug"
                style={{ transform: `translate(calc(-50% + ${layoutConfig.bubbleX}px), ${layoutConfig.bubbleY}px) scale(${layoutConfig.bubbleScale})` }}
              >
                After determining the species of your story characters, you can draw them on the drawing board.
                <br />
                Let's see who can draw it more Realistic !
              </div>
              <img
                src="/Cagentdraw.png"
                alt="Drawing Cagent"
                className="w-[380px] h-auto object-contain drop-shadow-2xl"
              />
            </aside>
          )}

          <section
            className={`xl:col-span-5 rounded-3xl border-2 border-cyan-200 bg-white/85 backdrop-blur-sm shadow-xl p-6 transition-all duration-500 ${
              showDetailsPanel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none hidden xl:block"
            }`}
          >
            <h2 className="text-2xl font-bold text-cyan-700 mb-4">Character Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cyan-700 mb-1">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Lumi"
                  className="border-cyan-200 focus-visible:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-700 mb-1">Age *</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 8"
                  className="border-cyan-200 focus-visible:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-700 mb-1">Traits * (choose up to 3)</label>
                <div className="flex flex-wrap gap-2">
                  {EOB_TRAITS.map((trait, traitIndex) => {
                    const selected = selectedTraits.includes(trait.name)
                    const styleSet = TRAIT_STYLE_CLASSES[traitIndex % TRAIT_STYLE_CLASSES.length]
                    return (
                      <button
                        key={trait.name}
                        type="button"
                        onClick={() => {
                          setTraitDialogTrait(trait)
                          setTraitDialogOpen(true)
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          selected ? styleSet.selected : styleSet.idle
                        }`}
                      >
                        {trait.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isHighLevel && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-cyan-700 mb-1">Background *</label>
                    <textarea
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      rows={3}
                      placeholder="Where does this character come from?"
                      className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-cyan-700 mb-1">Emotional Experience *</label>
                    <textarea
                      value={emotional}
                      onChange={(e) => setEmotional(e.target.value)}
                      rows={3}
                      placeholder="What feelings does this character often face?"
                      className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-cyan-700 mb-1">Symbolic Objects *</label>
                    <textarea
                      value={symbolic}
                      onChange={(e) => setSymbolic(e.target.value)}
                      rows={3}
                      placeholder="Any object that represents your character?"
                      className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </>
              )}

              {!isHighLevel && (
                <div>
                  <label className="block text-sm font-semibold text-cyan-700 mb-1">Background (optional)</label>
                  <textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    rows={3}
                    placeholder="Optional story details about your character..."
                    className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <h3 className="text-sm font-bold text-cyan-800 mb-2">Generation Preview</h3>
              {isGenerating && (
                <div className="mb-3 rounded-xl border border-cyan-300 bg-white px-3 py-2">
                  <div className="flex items-center gap-2 text-cyan-700 text-sm font-semibold mb-2">
                    Generating image...
                  </div>
                </div>
              )}
              {imageUrl ? (
                <div className="space-y-3">
                  <div className={`h-[360px] w-full rounded-xl border bg-white p-1 ${isGenerating ? "preview-loading-glow border-fuchsia-300" : "border-cyan-200"}`}>
                    <img src={imageUrl} alt="Generated character" className="h-full w-full rounded-lg object-contain" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={!finalSpecies.trim() || !hasSketchStroke || isGenerating}
                    className="w-full border-cyan-300 text-cyan-700"
                  >
                    {!isGenerating && <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate Image
                  </Button>
                </div>
              ) : (
                <div className={`rounded-xl border bg-white p-4 ${isGenerating ? "preview-loading-glow border-fuchsia-300" : "border-cyan-200"}`}>
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-bounce" />
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: "120ms" }} />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "240ms" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs text-slate-600">
                Continue is unlocked only when all required details are complete and the image has been generated.
              </p>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canContinue}
                className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:from-cyan-700 hover:via-blue-700 hover:to-violet-700 text-white text-base font-bold py-5"
              >
                Continue →
              </Button>
            </div>
          </section>
        </div>
      </div>
      <style jsx global>{`
        @keyframes previewBorderGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.15), 0 0 0 0 rgba(6, 182, 212, 0.1);
            border-color: rgba(236, 72, 153, 0.45);
          }
          50% {
            box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2), 0 0 24px 3px rgba(6, 182, 212, 0.2);
            border-color: rgba(14, 165, 233, 0.7);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.15), 0 0 0 0 rgba(6, 182, 212, 0.1);
            border-color: rgba(236, 72, 153, 0.45);
          }
        }
        .preview-loading-glow {
          animation: previewBorderGlow 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

