"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { EOB_TRAITS, type EobTrait } from "@/lib/character-eob-traits"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CharacterCreationProps {
  language: Language
  onCharacterCreate: (character: StoryState["character"]) => void
  onBack: () => void
  userId?: string
  level?: number
}

const FIELD_CONFIG = {
  name: {
    label: "Name",
    color: "from-purple-400 to-purple-600",
    borderColor: "border-purple-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-purple-800",
    hex: "#a855f7",
    hexFrom: "#c084fc",
    hexTo: "#9333ea",
  },
  species: {
    label: "Species/Type",
    color: "from-blue-400 to-blue-600",
    borderColor: "border-blue-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-blue-800",
    hex: "#60a5fa",
    hexFrom: "#93c5fd",
    hexTo: "#2563eb",
  },
  age: {
    label: "Age",
    color: "from-green-400 to-green-600",
    borderColor: "border-green-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-green-800",
    hex: "#4ade80",
    hexFrom: "#86efac",
    hexTo: "#16a34a",
  },
  traits: {
    label: "Primary traits",
    color: "from-orange-400 to-orange-600",
    borderColor: "border-orange-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-orange-800",
    hex: "#fb923c",
    hexFrom: "#fdba74",
    hexTo: "#ea580c",
  },
  background: {
    label: "Background of the character",
    color: "from-pink-400 to-pink-600",
    borderColor: "border-pink-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-pink-800",
    hex: "#f472b6",
    hexFrom: "#f9a8d4",
    hexTo: "#db2777",
  },
  emotional: {
    label: "Emotional experiences",
    color: "from-indigo-400 to-indigo-600",
    borderColor: "border-indigo-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-indigo-800",
    hex: "#818cf8",
    hexFrom: "#a5b4fc",
    hexTo: "#4f46e5",
  },
  symbolic: {
    label: "Symbolic objects",
    color: "from-cyan-400 to-cyan-600",
    borderColor: "border-cyan-400",
    bgColor: "bg-amber-50/95",
    textColor: "text-cyan-800",
    hex: "#22d3ee",
    hexFrom: "#67e8f9",
    hexTo: "#0891b2",
  },
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

type FlyingItem = { fieldId: string; text: string; color: string; hex: string }

export default function CharacterCreation({ language, onCharacterCreate, onBack, userId, level = 1 }: CharacterCreationProps) {
  const [name, setName] = useState("")
  const [species, setSpecies] = useState("")
  const [customSpecies, setCustomSpecies] = useState("")
  const [age, setAge] = useState("")
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [customTraits, setCustomTraits] = useState("")
  const [showCustomTraits, setShowCustomTraits] = useState(false)
  const [background, setBackground] = useState("")
  const [emotional, setEmotional] = useState("")
  const [symbolic, setSymbolic] = useState("")

  const [imageUrl, setImageUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [cupShake, setCupShake] = useState(false)

  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())
  const [cupColors, setCupColors] = useState<Array<{ color: string; hexFrom: string; hexTo: string }>>([])
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])
  const [currentField, setCurrentField] = useState<string | null>(null) // 当前选中的字段
  const [showIngredientList, setShowIngredientList] = useState(true) // 是否显示配料表
  const [traitDialogOpen, setTraitDialogOpen] = useState(false)
  const [traitDialogTrait, setTraitDialogTrait] = useState<EobTrait | null>(null)

  const cupRef = useRef<HTMLDivElement>(null)

  const isHighLevel = level >= 4
  const baseFields = ["name", "species", "age", "traits"]
  const advancedFields = ["background", "emotional", "symbolic"]
  const allFields = isHighLevel ? [...baseFields, ...advancedFields] : baseFields

  const getFieldValue = (fieldId: string): string => {
    switch (fieldId) {
      case "name": return name.trim()
      case "species": return species === "Custom" ? customSpecies.trim() : species
      case "age": return age.trim()
      case "traits": {
        const traits = [...selectedTraits]
        if (showCustomTraits && customTraits.trim()) {
          traits.push(customTraits.trim())
        }
        return traits.join(", ")
      }
      case "background": return background.trim()
      case "emotional": return emotional.trim()
      case "symbolic": return symbolic.trim()
      default: return ""
    }
  }

  const canImport = (fieldId: string): boolean => {
    const v = getFieldValue(fieldId)
    if (fieldId === "traits") return selectedTraits.length > 0 || (showCustomTraits && customTraits.trim() !== "")
    return v !== ""
  }

  const handleImportToDish = useCallback((fieldId: string) => {
    if (completedFields.has(fieldId)) return
    const value = getFieldValue(fieldId)
    if (!canImport(fieldId)) {
      toast.error("Please fill in this field first.")
      return
    }
    const cfg = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
    if (!cfg) return

    setCompletedFields((prev) => new Set(prev).add(fieldId))
    setFlyingItems((prev: FlyingItem[]) => [...prev, { fieldId, text: value, color: cfg.color, hex: cfg.hex }])
    setCurrentField(null) // 倒入后隐藏box

    setTimeout(() => {
      setFlyingItems((prev: FlyingItem[]) => prev.filter((f: FlyingItem) => f.fieldId !== fieldId))
      setCupColors((prev) => [...prev, { color: cfg.color, hexFrom: cfg.hexFrom, hexTo: cfg.hexTo }])
    }, 1200)
  }, [name, species, customSpecies, age, selectedTraits, background, emotional, symbolic, completedFields])

  const toggleTrait = (traitName: string) => {
    if (completedFields.has("traits")) return
    setSelectedTraits((prev: string[]) =>
      prev.includes(traitName) ? prev.filter((t: string) => t !== traitName) : [...prev, traitName].slice(0, 3)
    )
  }

  const allFieldsComplete = allFields.every((id) => completedFields.has(id))
  const totalFields = allFields.length
  const fillPercent = totalFields === 0 ? 0 : (cupColors.length / totalFields) * 100
  const liquidHeightPercent = Math.min(65, fillPercent * 0.65)

  const generateImage = async () => {
    const finalSpecies = species === "Custom" ? customSpecies.trim() : species
    if (!finalSpecies) {
      toast.error("Please select or enter a species first")
      return
    }

    setCupShake(true)
    setIsGenerating(true)
    toast.info("Generating character image...")

    try {
      let prompt = `A charming cartoon illustration of ${species === "Boy" || species === "Girl" ? `a young ${species.toLowerCase()}` : `a ${finalSpecies.toLowerCase()}`} character named ${name}.`
      if (age.trim()) prompt += ` The character is ${age} years old.`
      const allTraits = [...selectedTraits]
      if (showCustomTraits && customTraits.trim()) {
        allTraits.push(customTraits.trim())
      }
      if (allTraits.length > 0) prompt += ` The character looks ${allTraits.join(", ")}.`
      if (background.trim()) prompt += ` Background: ${background}.`
      if (emotional.trim()) prompt += ` Emotional experiences: ${emotional}.`
      if (symbolic.trim()) prompt += ` Symbolic objects: ${symbolic}.`
      prompt += " Fun and colorful style suitable for children's stories."

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, user_id: userId, stage: "character" }),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error || "Failed to generate image, please try again")
        return
      }
      if (data.imageUrl) {
        setImageUrl(data.imageUrl)
        setCupShake(false) // 图片生成完成后停止抖动
        toast.success("Image generated successfully!")
      } else {
        toast.error("Failed to generate image, please try again")
        setCupShake(false)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image, please try again")
      setCupShake(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartGenerate = () => {
    setShowIngredientList(false) // 隐藏配料表
    // 延迟一点再开始生成，让动画更流畅
    setTimeout(() => {
      generateImage()
    }, 300)
  }

  const finalSpecies = species === "Custom" ? customSpecies.trim() : species

  const handleCreate = () => {
    if (allFieldsComplete && imageUrl) {
      const defaultAge = age.trim() ? parseInt(age, 10) : (finalSpecies === "Boy" || finalSpecies === "Girl" ? 8 : 0)
      onCharacterCreate({
        name,
        age: defaultAge,
        traits: selectedTraits,
        description: background || "",
        imageUrl,
        species: finalSpecies,
      })
    }
  }

  const boxClass = "font-ancient rounded-lg border-2 p-6 shadow-lg transition-all duration-300 text-xl min-w-0 break-words overflow-visible relative"
  const labelClass = "block text-lg font-bold mb-4 font-ancient whitespace-normal break-words text-amber-600"
  const inputClass = "font-ancient text-xl rounded border bg-white/95 px-5 py-3 w-full min-w-0 text-amber-900 font-semibold"

  const renderField = (
    fieldId: string,
    label: string,
    borderColor: string,
    textColor: string,
    children: React.ReactNode,
    importDisabled: boolean
  ) => (
    <div 
      className={`${boxClass} ${borderColor}`}
      style={{
        background: `
          linear-gradient(135deg, rgba(139, 90, 43, 0.95) 0%, rgba(101, 67, 33, 0.95) 50%, rgba(139, 90, 43, 0.95) 100%),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(101, 67, 33, 0.3) 2px,
            rgba(101, 67, 33, 0.3) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(101, 67, 33, 0.2) 2px,
            rgba(101, 67, 33, 0.2) 4px
          )
        `,
        borderColor: '#8B5A2B',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.4)',
      }}
    >
      <label className={`${labelClass} text-amber-200`} style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(255, 215, 0, 0.5)' }}>{label}</label>
      {children}
      <Button
        type="button"
        size="sm"
        onClick={() => handleImportToDish(fieldId)}
        disabled={importDisabled}
        className="mt-4 w-full font-ancient text-lg py-3 bg-amber-900/90 hover:bg-amber-950 text-amber-200 border-2 border-amber-800 shadow-lg"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        Import to culture dish
      </Button>
    </div>
  )

  return (
    <div
      className="flex flex-col relative overflow-hidden font-ancient"
      style={{
        paddingTop: "80px",
        paddingBottom: "120px",
        minHeight: "100vh",
        height: "100vh",
        maxHeight: "100vh",
      }}
    >
      {/* 背景：宽度铺满左右，高度自适应，不随缩放变化 */}
      <div
        className="fixed inset-0 bg-no-repeat bg-center"
        style={{
          backgroundImage: "url(/magictable.png)",
          backgroundSize: "100% auto",
          backgroundColor: "rgb(253, 246, 236)",
          backgroundAttachment: "fixed",
          zIndex: 0,
        }}
      />
      <div className="absolute inset-0 bg-black/5 z-[1]" />

      <Dialog open={traitDialogOpen} onOpenChange={(open) => { setTraitDialogOpen(open); if (!open) setTraitDialogTrait(null) }}>
        <DialogContent className="sm:max-w-md font-ancient">
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

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 px-4 pt-12 pb-4">
          <StageHeader 
            stage={1} 
            title="Create Your Character" 
            onBack={onBack}
            className="[&_h1]:text-white [&_.text-muted-foreground]:text-white/80"
          />
        </div>

        <div className="flex-1 flex items-stretch justify-center gap-4 px-8 min-h-0">
          {/* Left: 配料表 */}
          {showIngredientList && (
            <div className="flex flex-col items-center w-[300px] flex-shrink-0 py-4 relative">
              {/* Paper背景 */}
              <div 
                className="relative w-full h-full min-h-[500px] flex flex-col items-center p-8 pb-12"
                style={{
                  backgroundImage: 'url(/paper.png)',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {/* 配料列表 */}
                <div className="flex flex-col gap-6 w-full mt-20">
                  {allFields.map((fieldId, index) => {
                    const cfg = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
                    if (!cfg) return null
                    const isCompleted = completedFields.has(fieldId)
                    
                    return (
                      <div
                        key={fieldId}
                        className="flex items-center justify-between cursor-pointer group transition-all duration-300"
                        onClick={() => !isCompleted && setCurrentField(fieldId)}
                        style={{
                          pointerEvents: isCompleted ? 'none' : 'auto',
                          opacity: isCompleted ? 0.6 : 1,
                        }}
                      >
                        <span
                          className="font-handwriting text-2xl font-bold text-amber-900 group-hover:text-3xl transition-all duration-300"
                          style={{
                            fontFamily: '"Kalam", "Comic Sans MS", cursive',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                          }}
                        >
                          {cfg.label}
                        </span>
                        {isCompleted && (
                          <span className="text-3xl text-green-600 font-bold ml-2">✓</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 生成按钮 - 所有字段完成后显示在单词下面 */}
                {allFieldsComplete && (
                  <div className="mt-6 w-full">
                    <Button
                      onClick={handleStartGenerate}
                      className="w-full font-ancient text-lg py-4 shadow-lg"
                      style={{
                        background: `
                          linear-gradient(135deg, rgba(139, 90, 43, 0.95) 0%, rgba(101, 67, 33, 0.95) 50%, rgba(139, 90, 43, 0.95) 100%),
                          repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(101, 67, 33, 0.3) 2px,
                            rgba(101, 67, 33, 0.3) 4px
                          )
                        `,
                        borderColor: '#8B5A2B',
                        borderWidth: '2px',
                        color: '#fbbf24',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      Generate Character
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Center: cup 靠下，固定宽度 */}
          <div className="flex flex-col items-center justify-end w-[260px] flex-shrink-0 relative pb-4">
            <div
              ref={cupRef}
              className={`relative flex items-end justify-center transition-transform origin-center ${cupShake || isGenerating ? "animate-shake-and-grow-cup" : ""}`}
              style={{ width: "220px", height: "240px", transform: cupShake || isGenerating ? "scale(1.35)" : "scale(1)" }}
            >
              {/* Cup image (behind liquid) */}
              <img
                src="/cup.png"
                alt="Culture dish"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ zIndex: 10 }}
              />

              {/* Liquid layer ON TOP of cup */}
              {cupColors.length > 0 && liquidHeightPercent > 0 && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    width: "52%",
                    bottom: "24%",
                    height: `${liquidHeightPercent}%`,
                    zIndex: 20,
                    borderRadius: "8px 8px 20px 20px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column-reverse",
                  }}
                >
                  {cupColors.map((seg: { color: string; hexFrom: string; hexTo: string }, i: number) => (
                    <div
                      key={i}
                      className="flex-1 min-h-[4px] transition-all duration-700"
                      style={{
                        background: `linear-gradient(to top, ${seg.hexTo}, ${seg.hexFrom})`,
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Flying text particles */}
              {flyingItems.map((item: FlyingItem, idx: number) => (
                <div
                  key={`${item.fieldId}-${idx}`}
                  className="absolute font-ancient text-xs font-bold whitespace-nowrap pointer-events-none fly-to-cup"
                  style={{
                    color: item.hex,
                    left: "50%",
                    top: "0%",
                    transform: "translate(-50%, 0)",
                    zIndex: 30,
                    textShadow: `0 0 4px ${item.hex}`,
                  }}
                >
                  {item.text.length > 12 ? item.text.slice(0, 12) + "…" : item.text}
                </div>
              ))}

              {/* Generated image overlays cup - 更大，但不遮挡按钮 */}
              {imageUrl && (
                <div
                  className="absolute flex items-center justify-center"
                  style={{ 
                    zIndex: 40,
                    width: '140%',
                    height: '120%',
                    left: '-20%',
                    top: '-25%',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Character"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}
                  />
                </div>
              )}
            </div>

            {/* Generate button when all imported - 只在配料表隐藏后显示 */}
            {!showIngredientList && allFieldsComplete && !imageUrl && (
              <div className="mt-2 w-full max-w-[220px]">
                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="w-full font-ancient bg-amber-800 hover:bg-amber-900 text-amber-100 border border-amber-900 py-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Character
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* After image: Back to Map + Regenerate */}
            {allFieldsComplete && imageUrl && (
              <div className="mt-16 flex flex-col gap-2 w-full max-w-[220px] relative z-50">
                <Button onClick={handleCreate} className="w-full font-ancient bg-blue-800 hover:bg-blue-900 text-white">
                  Back to Map →
                </Button>
                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full font-ancient border-amber-700 text-amber-800"
                >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Regenerate Image
                </Button>
              </div>
            )}
          </div>

          {/* Right: 动态显示当前选中的box，比现在大 */}
          {currentField && !completedFields.has(currentField) && (
            <div className="w-[500px] flex-shrink-0 flex items-center justify-center py-4">
              {(() => {
                const cfg = FIELD_CONFIG[currentField as keyof typeof FIELD_CONFIG]
                if (!cfg) return null

                if (currentField === "name") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <Input
                      placeholder="Enter name..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                    />,
                    !name.trim()
                  )
                }
                if (currentField === "species") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {SPECIES.slice(0, 6).map((spec) => (
                          <button
                            key={spec.name}
                            type="button"
                            onClick={() => setSpecies(spec.name)}
                            className={`p-3 rounded text-lg font-ancient border ${
                              species === spec.name ? "bg-blue-200 border-blue-600" : "bg-white/95 border-gray-400"
                            }`}
                            style={{ color: species === spec.name ? '#1e3a8a' : '#8B5A2B', fontWeight: 'bold' }}
                          >
                            {spec.icon} {spec.name}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpecies("Custom")}
                        className={`w-full p-3 rounded text-lg font-ancient border ${species === "Custom" ? "bg-blue-200 border-blue-600" : "bg-white/95 border-gray-400"}`}
                        style={{ color: species === "Custom" ? '#1e3a8a' : '#8B5A2B', fontWeight: 'bold' }}
                      >
                        Custom
                      </button>
                      {species === "Custom" && (
                        <Input
                          placeholder="Custom species..."
                          value={customSpecies}
                          onChange={(e) => setCustomSpecies(e.target.value)}
                          className={inputClass}
                        />
                      )}
                    </div>,
                    !canImport("species")
                  )
                }
                if (currentField === "age") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <Input
                      type="number"
                      placeholder="Age..."
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={inputClass}
                    />,
                    !age.trim()
                  )
                }
                if (currentField === "traits") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {EOB_TRAITS.map((t) => (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => {
                              setTraitDialogTrait(t)
                              setTraitDialogOpen(true)
                            }}
                            className={`p-3 rounded text-lg font-ancient border ${
                              selectedTraits.includes(t.name) ? "bg-orange-200 border-orange-600" : "bg-white/95 border-gray-400"
                            }`}
                            style={{ color: selectedTraits.includes(t.name) ? '#ea580c' : '#8B5A2B', fontWeight: 'bold' }}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomTraits(!showCustomTraits)}
                        className={`w-full p-3 rounded text-lg font-ancient border ${showCustomTraits ? "bg-orange-200 border-orange-600" : "bg-white/95 border-gray-400"}`}
                        style={{ color: showCustomTraits ? '#ea580c' : '#8B5A2B', fontWeight: 'bold' }}
                      >
                        Custom
                      </button>
                      {showCustomTraits && (
                        <Input
                          placeholder="Enter custom traits..."
                          value={customTraits}
                          onChange={(e) => setCustomTraits(e.target.value)}
                          className={inputClass}
                        />
                      )}
                    </div>,
                    selectedTraits.length === 0 && !(showCustomTraits && customTraits.trim())
                  )
                }
                if (currentField === "background") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <textarea
                      placeholder="Background..."
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className={`${inputClass} h-20 resize-none text-amber-900 font-semibold`}
                      rows={3}
                    />,
                    !background.trim()
                  )
                }
                if (currentField === "emotional") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <textarea
                      placeholder="Emotional..."
                      value={emotional}
                      onChange={(e) => setEmotional(e.target.value)}
                      className={`${inputClass} h-20 resize-none text-amber-900 font-semibold`}
                      rows={3}
                    />,
                    !emotional.trim()
                  )
                }
                if (currentField === "symbolic") {
                  return renderField(
                    currentField,
                    cfg.label,
                    cfg.borderColor,
                    cfg.textColor,
                    <textarea
                      placeholder="Symbolic..."
                      value={symbolic}
                      onChange={(e) => setSymbolic(e.target.value)}
                      className={`${inputClass} h-20 resize-none text-amber-900 font-semibold`}
                      rows={3}
                    />,
                    !symbolic.trim()
                  )
                }
                return null
              })()}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .font-ancient {
          font-family: Georgia, "Times New Roman", "Palatino Linotype", serif;
        }
        .font-handwriting {
          font-family: "Kalam", "Comic Sans MS", "Comic Neue", cursive;
        }
        @keyframes flyToCup {
          0% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
          70% {
            transform: translate(-50%, 180px) scale(0.4);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, 180px) scale(0);
            opacity: 0;
          }
        }
        .fly-to-cup {
          animation: flyToCup 1.2s ease-in forwards;
        }
        @keyframes shakeCupContinuous {
          0%, 100% { transform: translateX(0) scale(1.35); }
          5% { transform: translateX(-6px) scale(1.35); }
          10% { transform: translateX(6px) scale(1.35); }
          15% { transform: translateX(-5px) scale(1.35); }
          20% { transform: translateX(5px) scale(1.35); }
          25% { transform: translateX(-4px) scale(1.35); }
          30% { transform: translateX(4px) scale(1.35); }
          35% { transform: translateX(-5px) scale(1.35); }
          40% { transform: translateX(5px) scale(1.35); }
          45% { transform: translateX(-6px) scale(1.35); }
          50% { transform: translateX(6px) scale(1.35); }
          55% { transform: translateX(-4px) scale(1.35); }
          60% { transform: translateX(4px) scale(1.35); }
          65% { transform: translateX(-5px) scale(1.35); }
          70% { transform: translateX(5px) scale(1.35); }
          75% { transform: translateX(-6px) scale(1.35); }
          80% { transform: translateX(6px) scale(1.35); }
          85% { transform: translateX(-4px) scale(1.35); }
          90% { transform: translateX(4px) scale(1.35); }
          95% { transform: translateX(-5px) scale(1.35); }
        }
        .animate-shake-and-grow-cup {
          animation: shakeCupContinuous 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
