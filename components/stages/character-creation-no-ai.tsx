"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import StageHeader from "@/components/stage-header"
import { Eraser, PencilLine, Sparkles, Trash2 } from "lucide-react"
import { EOB_TRAITS, type EobTrait } from "@/lib/character-eob-traits"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CharacterCreationNoAiProps {
  language: "en" | "zh"
  onCharacterCreate: (character: {
    name: string
    age: number
    traits: string[]
    description: string
    imageUrl?: string
    species?: string
  }) => void
  onBack: () => void
  userId?: string
}

const SPECIES = [
  { name: "Boy", icon: "👦", color: "from-blue-400 to-blue-600" },
  { name: "Girl", icon: "👧", color: "from-pink-400 to-pink-600" },
  { name: "Dragon", icon: "🐉", color: "from-green-400 to-green-600" },
  { name: "Robot", icon: "🤖", color: "from-gray-400 to-gray-600" },
  { name: "Unicorn", icon: "🦄", color: "from-purple-400 to-purple-600" },
  { name: "Cat", icon: "🐱", color: "from-yellow-400 to-yellow-600" },
  { name: "Dog", icon: "🐶", color: "from-amber-400 to-amber-600" },
  { name: "Rabbit", icon: "🐰", color: "from-gray-400 to-gray-600" },
  { name: "Bear", icon: "🐻", color: "from-brown-400 to-brown-600" },
  { name: "Fox", icon: "🦊", color: "from-orange-400 to-orange-600" },
  { name: "Lion", icon: "🦁", color: "from-yellow-400 to-orange-600" },
  { name: "Tiger", icon: "🐯", color: "from-orange-400 to-red-600" },
  { name: "Panda", icon: "🐼", color: "from-gray-400 to-black" },
  { name: "Elephant", icon: "🐘", color: "from-gray-500 to-gray-700" },
  { name: "Penguin", icon: "🐧", color: "from-blue-500 to-black" },
  { name: "Owl", icon: "🦉", color: "from-amber-500 to-brown-600" },
]

const EOB_TRAIT_COLORS: Record<string, string> = {
  Kind: "from-green-400 to-green-600",
  Helpful: "from-teal-400 to-teal-600",
  Brave: "from-red-400 to-red-600",
  Honest: "from-blue-400 to-blue-600",
  Responsible: "from-amber-400 to-amber-600",
  "Team-player": "from-indigo-400 to-indigo-600",
  "Obeys rules": "from-slate-400 to-slate-600",
  Hardworking: "from-orange-400 to-orange-600",
  Empathetic: "from-pink-400 to-pink-600",
}

type DrawMode = "pen" | "eraser"

export default function CharacterCreationNoAi({ language, onCharacterCreate, onBack, userId }: CharacterCreationNoAiProps) {
  const [name, setName] = useState("")
  const [species, setSpecies] = useState("")
  const [customSpecies, setCustomSpecies] = useState("")
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [traitDialogOpen, setTraitDialogOpen] = useState(false)
  const [traitDialogTrait, setTraitDialogTrait] = useState<EobTrait | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>("pen")
  const [brushSize, setBrushSize] = useState(5)
  const [strokeHex, setStrokeHex] = useState("#1f2937")
  const [hasSketchStroke, setHasSketchStroke] = useState(false)
  const [sketchPreviewUrl, setSketchPreviewUrl] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const hasInitializedCanvasRef = useRef(false)

  const finalSpecies = species === "Custom" ? customSpecies.trim() : species
  const canContinue = name.trim() && finalSpecies && selectedTraits.length > 0

  const syncSketchPreview = (force = false) => {
    const canvas = canvasRef.current
    if (!canvas || !hasInitializedCanvasRef.current || (!force && !hasSketchStroke)) {
      setSketchPreviewUrl("")
      return
    }

    try {
      setSketchPreviewUrl(canvas.toDataURL("image/png"))
    } catch {
      setSketchPreviewUrl("")
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
    const cssHeight = Math.max(280, host.clientHeight)

    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    fillCanvasBase()

    if (snapshotDataUrl) {
      const img = new Image()
      img.onload = () => {
        const redrawCtx = canvas.getContext("2d")
        if (!redrawCtx) return
        redrawCtx.drawImage(img, 0, 0, canvas.width, canvas.height)
        syncSketchPreview(true)
      }
      img.src = snapshotDataUrl
      return
    }

    setSketchPreviewUrl("")
  }

  useEffect(() => {
    resizeCanvas(false)
    hasInitializedCanvasRef.current = true

    const handleWindowResize = () => resizeCanvas(true)
    window.addEventListener("resize", handleWindowResize)
    return () => window.removeEventListener("resize", handleWindowResize)
  }, [])

  const getPointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
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
    syncSketchPreview(true)
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
    ctx.strokeStyle = drawMode === "eraser" ? "#ffffff" : strokeHex
    ctx.stroke()

    lastPointRef.current = point
    if (!hasSketchStroke) {
      setHasSketchStroke(true)
    }
  }

  const clearSketch = () => {
    fillCanvasBase()
    setHasSketchStroke(false)
    setSketchPreviewUrl("")
  }

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    )
  }

  const handleCreate = () => {
    if (!name.trim()) {
      return
    }
    if (!finalSpecies) {
      return
    }

    const defaultAge = finalSpecies === "Boy" || finalSpecies === "Girl" ? 8 : 0
    const imageUrl = sketchPreviewUrl || undefined

    const character = {
      name,
      age: defaultAge,
      traits: selectedTraits,
      description,
      imageUrl,
      species: finalSpecies,
    }

    if (userId) {
      fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          stage: "character",
          input: {},
          output: { character },
        }),
      }).catch((error) => {
        console.error("Error saving character:", error)
      })
    }

    onCharacterCreate(character)
  }

  return (
    <div className="min-h-screen py-8 px-6 bg-gradient-to-br from-indigo-100 via-purple-50 via-pink-50 to-orange-50 relative" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
      <Dialog open={traitDialogOpen} onOpenChange={(open) => { setTraitDialogOpen(open); if (!open) setTraitDialogTrait(null) }}>
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
                    onClick={() => { toggleTrait(traitDialogTrait.name); setTraitDialogOpen(false); setTraitDialogTrait(null) }}
                  >
                    Unselect
                  </Button>
                ) : (
                  <Button
                    onClick={() => { toggleTrait(traitDialogTrait.name); setTraitDialogOpen(false); setTraitDialogTrait(null) }}
                  >
                    Select this trait
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setTraitDialogOpen(false); setTraitDialogTrait(null) }}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <StageHeader stage={1} title="Create Your Character" onBack={onBack} />

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 border-4 border-blue-300 shadow-2xl backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-blue-700 mb-6" style={{ fontFamily: "var(--font-patrick-hand)" }}>
              Design Your Hero!
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold mb-2 text-blue-700">Character Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sparky the Dragon"
                  className="border-2 border-blue-200 focus:border-blue-500 rounded-xl p-3 text-base"
                />
              </div>

              <div>
                <label className="block text-lg font-bold mb-2 text-blue-700">Species</label>
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-2">
                  {SPECIES.map((spec) => {
                    const isSelected = species === spec.name
                    return (
                      <Button
                        key={spec.name}
                        onClick={() => setSpecies(spec.name)}
                        className={`flex flex-col items-center justify-center p-3 h-auto rounded-xl border-2 transition-all transform hover:scale-105 ${
                          isSelected
                            ? `bg-gradient-to-r ${spec.color} text-white border-blue-400 shadow-lg`
                            : "bg-white border-blue-200 text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        <span className="text-2xl mb-1">{spec.icon}</span>
                        <span className="text-xs font-semibold">{spec.name}</span>
                      </Button>
                    )
                  })}
                  <Button
                    onClick={() => setSpecies("Custom")}
                    className={`flex flex-col items-center justify-center p-3 h-auto rounded-xl border-2 transition-all transform hover:scale-105 ${
                      species === "Custom"
                        ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white border-blue-400 shadow-lg"
                        : "bg-white border-blue-200 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <span className="text-2xl mb-1">✏️</span>
                    <span className="text-xs font-semibold">Custom</span>
                  </Button>
                </div>
                {species === "Custom" && (
                  <Input
                    value={customSpecies}
                    onChange={(e) => setCustomSpecies(e.target.value)}
                    placeholder="Enter custom species..."
                    className="mt-3 border-2 border-blue-200 focus:border-blue-500 rounded-xl p-3 text-base"
                  />
                )}
              </div>

              <div>
                <label className="block text-lg font-bold mb-2 text-blue-700">Traits (Select at least one)</label>
                <div className="flex flex-wrap gap-2">
                  {EOB_TRAITS.map((trait) => {
                    const isSelected = selectedTraits.includes(trait.name)
                    const color = EOB_TRAIT_COLORS[trait.name] ?? "from-gray-400 to-gray-600"
                    return (
                      <Button
                        key={trait.name}
                        onClick={() => {
                          setTraitDialogTrait(trait)
                          setTraitDialogOpen(true)
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all transform hover:scale-105 ${
                          isSelected
                            ? `bg-gradient-to-r ${color} text-white border-blue-400 shadow-md`
                            : "bg-white border-blue-200 text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        {trait.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold mb-2 text-blue-700">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., A friendly dragon who loves to read books and help others."
                  rows={3}
                  className="w-full p-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 bg-white text-foreground text-base"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!canContinue}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-xl py-4 text-lg font-bold disabled:opacity-50"
              >
                <Sparkles className="mr-2 h-5 w-5 inline" />
                Continue
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-4 border-purple-300 shadow-2xl backdrop-blur-sm">
              {name && finalSpecies && selectedTraits.length > 0 ? (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center text-8xl shadow-2xl overflow-hidden">
                      {sketchPreviewUrl ? (
                        <img
                          src={sketchPreviewUrl}
                          alt={`${name || "Character"} sketch`}
                          className="h-full w-full object-contain bg-white"
                        />
                      ) : (
                        <span>{SPECIES.find((s) => s.name === species)?.icon || "👤"}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {name}
                    </h3>
                    <p className="text-xl text-gray-700 font-semibold mb-4">{finalSpecies}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedTraits.map((trait) => {
                        const color = EOB_TRAIT_COLORS[trait] ?? "from-gray-400 to-gray-600"
                        return (
                          <span
                            key={trait}
                            className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${color} text-white shadow-lg`}
                          >
                            {trait}
                          </span>
                        )
                      })}
                    </div>
                    {description && (
                      <p className="mt-4 text-gray-600 italic">{description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-7xl mb-4">🥚</div>
                  <p className="text-xl font-semibold">Fill in the form to see your character!</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl p-6 border-4 border-indigo-300 shadow-2xl backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-700">Character Drawing Board</h3>
                  <p className="mt-1 text-sm text-indigo-700/80">
                    Draw your hero here. If you sketch something, it will be carried into the story flow as the character image.
                  </p>
                </div>
                {hasSketchStroke && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-300">
                    Sketch Ready
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={drawMode === "pen" ? "default" : "outline"}
                  onClick={() => setDrawMode("pen")}
                  className={drawMode === "pen" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 text-indigo-700"}
                >
                  <PencilLine className="h-4 w-4 mr-2" />
                  Pen
                </Button>
                <Button
                  type="button"
                  variant={drawMode === "eraser" ? "default" : "outline"}
                  onClick={() => setDrawMode("eraser")}
                  className={drawMode === "eraser" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-300 text-indigo-700"}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Eraser
                </Button>
                <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-2">
                  <span className="text-xs font-semibold text-indigo-700">Brush</span>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    step={1}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="accent-indigo-600"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700">
                  Color
                  <input
                    type="color"
                    value={strokeHex}
                    onChange={(e) => setStrokeHex(e.target.value)}
                    disabled={drawMode === "eraser"}
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                    aria-label="Pick stroke color"
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSketch}
                  className="border-rose-300 text-rose-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Board
                </Button>
              </div>

              <div
                ref={containerRef}
                className="mt-4 relative h-[320px] overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-white shadow-inner"
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

              <p className="mt-3 text-sm text-slate-600">
                The drawing board is optional. You can continue without a sketch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
