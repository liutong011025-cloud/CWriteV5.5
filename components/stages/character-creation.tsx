"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Sparkles, Trash2, Eraser, PencilLine, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { EOB_TRAITS, type EobTrait } from "@/lib/character-eob-traits"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

const PIXEL_TRAIT_COLORS = [
  { idle: "bg-[#e8c547] border-[#c9a82e]", selected: "bg-[#c9a82e] border-[#a58b3d] text-white" },
  { idle: "bg-[#7ec850] border-[#5a9a32]", selected: "bg-[#5a9a32] border-[#3d8a3d] text-white" },
  { idle: "bg-[#87ceeb] border-[#5bc0de]", selected: "bg-[#5bc0de] border-[#3a8aa3] text-white" },
  { idle: "bg-[#c4a574] border-[#9a7b4f]", selected: "bg-[#9a7b4f] border-[#8b6914] text-white" },
  { idle: "bg-[#dda0dd] border-[#ba55d3]", selected: "bg-[#ba55d3] border-[#9932cc] text-white" },
  { idle: "bg-[#ff9999] border-[#e66767]", selected: "bg-[#e66767] border-[#c94b4b] text-white" },
  { idle: "bg-[#f5e6c8] border-[#d9c9a6]", selected: "bg-[#d9c9a6] border-[#c4a574] text-[#5a4a2a]" },
  { idle: "bg-[#6bc9e8] border-[#4aa8c7]", selected: "bg-[#4aa8c7] border-[#3a8aa3] text-white" },
  { idle: "bg-[#6fcf6f] border-[#4ca84c]", selected: "bg-[#4ca84c] border-[#3d8a3d] text-white" },
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
  const [strokeHex, setStrokeHex] = useState("#5a4a2a")
  const colorInputRef = useRef<HTMLInputElement>(null)

  const [traitDialogOpen, setTraitDialogOpen] = useState(false)
  const [traitDialogTrait, setTraitDialogTrait] = useState<EobTrait | null>(null)
  const [showPositionTool, setShowPositionTool] = useState(false)
  
  // Position adjustment state - can be tuned with the debug tool
  const [layoutConfig, setLayoutConfig] = useState({
    bearX: 60,
    bearY: -46,
    bearScale: 0.90,
    bubbleX: 155,
    bubbleY: -114,
    bubbleScale: 1.20,
    sketchX: 0,
    sketchY: -12,
    sketchWidth: 2200,
    sketchHeight: 500,
  })

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
  const canContinue = requiredTextComplete && !isGenerating

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

    // Store old dimensions and snapshot for proportional scaling
    const oldWidth = canvas.width
    const oldHeight = canvas.height
    let snapshotDataUrl: string | null = null
    if (preserveDrawing && hasInitializedCanvasRef.current && oldWidth > 0 && oldHeight > 0) {
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

    if (snapshotDataUrl && oldWidth > 0 && oldHeight > 0) {
      const img = new Image()
      img.onload = () => {
        const redrawCtx = canvas.getContext("2d")
        if (!redrawCtx) return
        
        // Calculate proportional scaling to fit the new canvas while maintaining aspect ratio
        const scaleX = canvas.width / oldWidth
        const scaleY = canvas.height / oldHeight
        const scale = Math.min(scaleX, scaleY) // Use the smaller scale to fit entirely
        
        const scaledWidth = oldWidth * scale
        const scaledHeight = oldHeight * scale
        
        // Center the scaled image in the new canvas
        const offsetX = (canvas.width - scaledWidth) / 2
        const offsetY = (canvas.height - scaledHeight) / 2
        
        // Draw the image with proportional scaling, centered
        redrawCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)
      }
      img.src = snapshotDataUrl
    }
  }

  const fillCanvasBase = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#f5e6c8"
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
      ctx.strokeStyle = "#f5e6c8"
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
      toast.error("Complete all required details before continuing.")
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
    <div className="min-h-screen relative overflow-hidden pixel-theme" style={{ paddingTop: "120px", paddingBottom: "120px" }}>
      {/* Pixel art background */}
      <div className="fixed inset-0 z-0" style={{
        background: `linear-gradient(180deg, 
          #b8e4f9 0%, 
          #87ceeb 25%, 
          #7ec850 65%, 
          #5a9a32 100%)`
      }}>
        {/* Pixel clouds */}
        <div className="absolute top-16 left-[10%] w-24 h-12 bg-white opacity-80" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-24 right-[15%] w-32 h-14 bg-white opacity-70" style={{
          clipPath: "polygon(0% 60%, 15% 40%, 30% 50%, 45% 20%, 60% 40%, 75% 30%, 90% 50%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        <div className="absolute top-32 left-[40%] w-20 h-10 bg-white opacity-75" style={{
          clipPath: "polygon(0% 60%, 20% 30%, 50% 50%, 80% 25%, 100% 60%, 100% 100%, 0% 100%)"
        }} />
        
        {/* Pixel decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0"
              style={{
                left: `${i * 5 + Math.random() * 2}%`,
                width: "8px",
                height: `${20 + Math.random() * 16}px`,
                background: i % 3 === 0 ? "#5a9a32" : "#7ec850",
              }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`flower-${i}`}
              className="absolute bottom-4"
              style={{
                left: `${10 + i * 12}%`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{
                background: ["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4],
                boxShadow: `3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, -3px 0 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}, 0 -3px 0 ${["#ff9999", "#ffcc66", "#ff66b2", "#66ccff"][i % 4]}`
              }} />
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={traitDialogOpen}
        onOpenChange={(open) => {
          setTraitDialogOpen(open)
          if (!open) setTraitDialogTrait(null)
        }}
      >
        <DialogContent 
          className="border-0 max-w-md z-[200]" 
          style={{ 
            background: "#f5e6c8",
            border: "4px solid #6b5210",
            boxShadow: "inset -4px -4px 0 0 #8b6914, inset 4px 4px 0 0 #a58b3d, 6px 6px 0 0 rgba(0,0,0,0.25)",
          }}>
          {traitDialogTrait && (
            <>
              <DialogHeader>
                <DialogTitle className="pixel-title text-xl" style={{ color: "#8b6914" }}>{traitDialogTrait.name}</DialogTitle>
                <DialogDescription className="text-sm mt-2" style={{ color: "#5a4a2a" }}>
                  {traitDialogTrait.explanationTemplate.replace(/\{\{name\}\}/g, name.trim() || "your character")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p className="text-sm font-bold" style={{ color: "#8b6914" }}>When writing, you can use:</p>
                <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: "#6b5210" }}>
                  {traitDialogTrait.writingTips.map((tip, i) => (
                    <li key={i}>&quot;{tip}&quot;</li>
                  ))}
                </ul>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                {selectedTraits.includes(traitDialogTrait.name) ? (
                  <Button
                    className="pixel-btn pixel-btn-red"
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
                    className="pixel-btn pixel-btn-green"
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
                  className="pixel-btn pixel-btn-wood"
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

      <div className="max-w-7xl mx-auto relative z-10 px-6 py-8">
        <StageHeader stage={1} title="Create Your Character" onBack={onBack} />
        
        {/* Position Adjustment Debug Tool */}
        <button 
          type="button"
          onClick={() => setShowPositionTool(!showPositionTool)}
          className="fixed bottom-4 right-4 z-50 pixel-btn pixel-btn-wood px-3 py-2 text-xs"
        >
          {showPositionTool ? "Hide" : "Adjust"} Layout
        </button>
        
        {showPositionTool && (
          <div className="fixed bottom-16 right-4 z-50 pixel-panel p-4 w-72 max-h-[70vh] overflow-y-auto text-xs" style={{ background: "#f5e6c8" }}>
            <h4 className="font-bold mb-3 pixel-title" style={{ color: "#8b6914" }}>Layout Config</h4>
            <div className="space-y-3">
              <div>
<label className="block mb-1" style={{ color: "#5a4a2a" }}>Sketch Width: {layoutConfig.sketchWidth}</label>
              <input type="range" min={600} max={2400} value={layoutConfig.sketchWidth}
                  onChange={(e) => setLayoutConfig(p => ({...p, sketchWidth: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Sketch Height: {layoutConfig.sketchHeight}</label>
                <input type="range" min={300} max={700} value={layoutConfig.sketchHeight} 
                  onChange={(e) => setLayoutConfig(p => ({...p, sketchHeight: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div className="pixel-divider my-2" />
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bear X: {layoutConfig.bearX}</label>
                <input type="range" min={-200} max={300} value={layoutConfig.bearX} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bearX: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bear Y: {layoutConfig.bearY}</label>
                <input type="range" min={-200} max={300} value={layoutConfig.bearY} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bearY: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bear Scale: {layoutConfig.bearScale.toFixed(2)}</label>
                <input type="range" min={30} max={150} value={layoutConfig.bearScale * 100} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bearScale: Number(e.target.value) / 100}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div className="pixel-divider my-2" />
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bubble X: {layoutConfig.bubbleX}</label>
                <input type="range" min={-200} max={400} value={layoutConfig.bubbleX} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bubbleX: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bubble Y: {layoutConfig.bubbleY}</label>
                <input type="range" min={-300} max={200} value={layoutConfig.bubbleY} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bubbleY: Number(e.target.value)}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
              <div>
                <label className="block mb-1" style={{ color: "#5a4a2a" }}>Bubble Scale: {layoutConfig.bubbleScale.toFixed(2)}</label>
                <input type="range" min={40} max={120} value={layoutConfig.bubbleScale * 100} 
                  onChange={(e) => setLayoutConfig(p => ({...p, bubbleScale: Number(e.target.value) / 100}))}
                  className="w-full" style={{ accentColor: "#7ec850" }} />
              </div>
            </div>
            <div className="mt-4 p-2 pixel-card text-[10px] font-mono break-all" style={{ background: "#fff", color: "#333" }}>
              {JSON.stringify(layoutConfig, null, 0)}
            </div>
          </div>
        )}

        {showGenerationHint && (
          <div className="mt-6 mx-auto max-w-4xl pixel-panel px-7 py-4">
            <p className="text-lg font-bold pixel-text" style={{ color: "#8b6914" }}>
              This may take some time. You can continue filling in your character details while the image is generating.
            </p>
          </div>
        )}

        <div className={`mt-8 ${showDetailsPanel ? "grid grid-cols-1 xl:grid-cols-12 gap-6" : "flex justify-center items-center min-h-[72vh] w-full gap-8"}`}>
          <section
            className={`self-start pixel-panel p-6 transition-all duration-700 ${
              showDetailsPanel
                ? "xl:col-span-7"
                : "scale-100"
            }`}
            style={
              showDetailsPanel
                ? { transform: `translate(${layoutConfig.sketchX - 12}px, ${layoutConfig.sketchY}px) scale(0.94)` }
                : {
                    width: "2200px",
                    maxWidth: "98vw",
                    transform: `translate(${layoutConfig.sketchX}px, ${layoutConfig.sketchY}px)`,
                  }
            }
          >
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <h2 className="text-2xl font-extrabold pixel-title" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Sketch Board</h2>
              <p className="text-sm font-bold pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.1)" }}>1) Choose species, 2) Draw, 3) Generate</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-extrabold mb-2 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Species (Required first)</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {SPECIES.map((spec) => {
                  const selected = species === spec.name
                  return (
                    <button
                      key={spec.name}
                      type="button"
                      onClick={() => setSpecies(spec.name)}
                      className={`px-3 py-2 text-sm font-bold transition pixel-btn ${
                        selected ? "pixel-btn-green pixel-selected" : "pixel-btn-wood"
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
                  className={`px-3 py-2 text-sm font-bold transition pixel-btn ${
                    species === "Custom"
                      ? "pixel-btn-green pixel-selected"
                      : "pixel-btn-wood"
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
                  className="mt-3 pixel-input"
                />
              )}
            </div>

            <div className="pixel-card p-4">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setDrawMode("pen")}
                    className={`pixel-btn ${drawMode === "pen" ? "pixel-btn-green" : "pixel-btn-wood"}`}
                  >
                    <PencilLine className="h-4 w-4 mr-1" />
                    Pen
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setDrawMode("eraser")}
                    className={`pixel-btn ${drawMode === "eraser" ? "pixel-btn-green" : "pixel-btn-wood"}`}
                  >
                    <Eraser className="h-4 w-4 mr-1" />
                    Eraser
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold pixel-text" style={{ color: "#8b6914" }}>Size</label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-28"
                    style={{ accentColor: "#7ec850" }}
                  />
                  <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    className="relative h-10 w-10 pixel-shadow disabled:opacity-50"
                    style={{ 
                      backgroundColor: strokeHex,
                      border: "3px solid #8b6914"
                    }}
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
                className="relative overflow-hidden transition-all duration-500"
                style={{ 
                  height: `${showDetailsPanel ? Math.max(300, layoutConfig.sketchHeight - 100) : layoutConfig.sketchHeight}px`,
                  border: "4px solid #8b6914",
                  boxShadow: "inset 3px 3px 0 rgba(0,0,0,0.1), 4px 4px 0 rgba(0,0,0,0.2)"
                }}
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
                <Button type="button" onClick={clearSketch} className="pixel-btn pixel-btn-red">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Board
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!canGenerate}
                  className="pixel-btn pixel-btn-green disabled:opacity-50"
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
                className="absolute top-10 left-1/2 -translate-x-1/2 w-[380px] pixel-panel px-4 py-3 text-center text-[15px] font-bold leading-snug"
                style={{ 
                  transform: `translate(calc(-50% + ${layoutConfig.bubbleX}px), ${layoutConfig.bubbleY}px) scale(${layoutConfig.bubbleScale})`,
                  color: "#5a4a2a"
                }}
              >
                After determining the species of your story characters, you can draw them on the drawing board.
                <br />
                Let&apos;s see who can draw it more Realistic !
              </div>
              <img
                src="/Cagentdraw.png"
                alt="Drawing Cagent"
                className="w-[380px] h-auto object-contain drop-shadow-2xl"
              />
            </aside>
          )}

          <section
            className={`xl:col-span-5 pixel-panel p-6 transition-all duration-500 ${
              showDetailsPanel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none hidden xl:block"
            }`}
          >
            <h2 className="text-2xl font-extrabold mb-4 pixel-title" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Character Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Lumi"
                  className="pixel-input"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Age *</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 8"
                  className="pixel-input"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Traits * (choose up to 3)</label>
                <div className="flex flex-wrap gap-2">
                  {EOB_TRAITS.map((trait, traitIndex) => {
                    const selected = selectedTraits.includes(trait.name)
                    const styleSet = PIXEL_TRAIT_COLORS[traitIndex % PIXEL_TRAIT_COLORS.length]
                    return (
                      <button
                        key={trait.name}
                        type="button"
                        onClick={() => {
                          setTraitDialogTrait(trait)
                          setTraitDialogOpen(true)
                        }}
                        className={`px-3 py-1.5 text-xs font-bold border-2 transition pixel-shadow ${
                          selected ? styleSet.selected : styleSet.idle
                        }`}
                        style={{ color: selected ? undefined : "#5a4a2a" }}
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
                    <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Background *</label>
                    <textarea
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      rows={3}
                      placeholder="Where does this character come from?"
                      className="w-full px-3 py-2 text-sm pixel-input"
                      style={{ color: "#5a4a2a" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Emotional Experience *</label>
                    <textarea
                      value={emotional}
                      onChange={(e) => setEmotional(e.target.value)}
                      rows={3}
                      placeholder="What feelings does this character often face?"
                      className="w-full px-3 py-2 text-sm pixel-input"
                      style={{ color: "#5a4a2a" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Symbolic Objects *</label>
                    <textarea
                      value={symbolic}
                      onChange={(e) => setSymbolic(e.target.value)}
                      rows={3}
                      placeholder="Any object that represents your character?"
                      className="w-full px-3 py-2 text-sm pixel-input"
                      style={{ color: "#5a4a2a" }}
                    />
                  </div>
                </>
              )}

              {!isHighLevel && (
                <div>
                  <label className="block text-sm font-extrabold mb-1 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Background (optional)</label>
                  <textarea
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    rows={3}
                    placeholder="Optional story details about your character..."
                    className="w-full px-3 py-2 text-sm pixel-input"
                    style={{ color: "#5a4a2a" }}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 pixel-card p-4">
              <h3 className="text-sm font-extrabold mb-2 pixel-text" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>Generation Preview</h3>
              {isGenerating && (
                <div className="mb-3 pixel-card px-3 py-2">
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "#7ec850" }}>
                    Generating image...
                  </div>
                </div>
              )}
              {imageUrl ? (
                <div className="space-y-3">
                  <div className={`h-[360px] w-full p-1 ${isGenerating ? "pixel-selected" : ""}`} style={{
                    border: "4px solid #8b6914",
                    background: "#f5e6c8"
                  }}>
                    <img src={imageUrl} alt="Generated character" className="h-full w-full object-contain" />
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={!finalSpecies.trim() || !hasSketchStroke || isGenerating}
                    className="w-full pixel-btn pixel-btn-blue"
                  >
                    {!isGenerating && <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate Image
                  </Button>
                </div>
              ) : (
                <div className={`p-4 ${isGenerating ? "pixel-selected" : ""}`} style={{
                  border: "4px solid #8b6914",
                  background: "#f5e6c8"
                }}>
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="h-2.5 w-2.5 bg-[#7ec850] animate-bounce" />
                    <span className="h-2.5 w-2.5 bg-[#e8c547] animate-bounce" style={{ animationDelay: "120ms" }} />
                    <span className="h-2.5 w-2.5 bg-[#87ceeb] animate-bounce" style={{ animationDelay: "240ms" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs pixel-text" style={{ color: "#6b5210" }}>
                Continue is unlocked only when all required details are complete.
              </p>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canContinue}
                className="w-full text-base font-bold py-5 pixel-btn pixel-btn-green disabled:opacity-50"
              >
                Continue →
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
