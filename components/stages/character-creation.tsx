"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

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

const TRAITS = [
  { name: "Brave" },
  { name: "Smart" },
  { name: "Funny" },
  { name: "Kind" },
  { name: "Curious" },
  { name: "Strong" },
  { name: "Creative" },
  { name: "Loyal" },
]

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
  const [background, setBackground] = useState("")
  const [emotional, setEmotional] = useState("")
  const [symbolic, setSymbolic] = useState("")

  const [imageUrl, setImageUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [cupShake, setCupShake] = useState(false)

  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())
  const [cupColors, setCupColors] = useState<Array<{ color: string; hexFrom: string; hexTo: string }>>([])
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])

  const cupRef = useRef<HTMLDivElement>(null)
  const leftBoxRef = useRef<HTMLDivElement>(null)
  const rightBoxRef = useRef<HTMLDivElement>(null)

  const isHighLevel = level >= 4
  const baseFields = ["name", "species", "age", "traits"]
  const advancedFields = ["background", "emotional", "symbolic"]
  const allFields = isHighLevel ? [...baseFields, ...advancedFields] : baseFields

  const getFieldValue = (fieldId: string): string => {
    switch (fieldId) {
      case "name": return name.trim()
      case "species": return species === "Custom" ? customSpecies.trim() : species
      case "age": return age.trim()
      case "traits": return selectedTraits.join(", ")
      case "background": return background.trim()
      case "emotional": return emotional.trim()
      case "symbolic": return symbolic.trim()
      default: return ""
    }
  }

  const canImport = (fieldId: string): boolean => {
    const v = getFieldValue(fieldId)
    if (fieldId === "traits") return selectedTraits.length > 0
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
      if (selectedTraits.length > 0) prompt += ` The character looks ${selectedTraits.join(", ")}.`
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
        toast.success("Image generated successfully!")
      } else {
        toast.error("Failed to generate image, please try again")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image, please try again")
    } finally {
      setIsGenerating(false)
      setCupShake(false)
    }
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

  const boxClass = "font-ancient rounded-lg border-2 p-4 shadow-md transition-all duration-300 text-base min-w-0 break-words overflow-visible"
  const labelClass = "block text-sm font-bold mb-2 font-ancient whitespace-normal break-words"
  const inputClass = "font-ancient text-base rounded border bg-white/90 px-3 py-2 w-full min-w-0"

  const renderField = (
    fieldId: string,
    label: string,
    borderColor: string,
    textColor: string,
    children: React.ReactNode,
    importDisabled: boolean
  ) => (
    <div className={`${boxClass} ${borderColor} bg-amber-50/95`}>
      <label className={`${labelClass} ${textColor}`}>{label}</label>
      {children}
      <Button
        type="button"
        size="sm"
        onClick={() => handleImportToDish(fieldId)}
        disabled={importDisabled}
        className="mt-2 w-full font-ancient text-sm py-2 bg-amber-700/80 hover:bg-amber-800 text-amber-100 border border-amber-800"
      >
        Import to culture dish
      </Button>
    </div>
  )

  const leftFieldsAll = isHighLevel ? ["name", "species", "age", "traits"] : ["name", "species"]
  const rightFieldsAll = isHighLevel ? ["background", "emotional", "symbolic"] : ["age", "traits"]
  const leftFields = leftFieldsAll.filter((id) => !completedFields.has(id))
  const rightFields = rightFieldsAll.filter((id) => !completedFields.has(id))

  return (
    <div
      className="flex flex-col relative overflow-hidden font-ancient"
      style={{
        paddingTop: "80px",
        paddingBottom: "60px",
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

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 px-4 py-2">
          <StageHeader stage={1} title="Create Your Character" onBack={onBack} />
        </div>

        <div className="flex-1 flex items-stretch justify-center gap-1 px-8 min-h-0">
          {/* Left boxes: 两列、宽一些，紧挨杯子 */}
          <div ref={leftBoxRef} className="grid grid-cols-2 gap-3 content-start w-[420px] min-w-[420px] flex-shrink-0 overflow-hidden py-2">
            {leftFields.map((fieldId) => {
              const cfg = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
              if (!cfg) return null
              if (fieldId === "name") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
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
                    )}
                  </div>
                )
              }
              if (fieldId === "species") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <div className="space-y-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          {SPECIES.slice(0, 6).map((spec) => (
                            <button
                              key={spec.name}
                              type="button"
                              onClick={() => setSpecies(spec.name)}
                              className={`p-2 rounded text-sm font-ancient border ${
                                species === spec.name ? "bg-blue-200 border-blue-600" : "bg-white border-gray-300"
                              }`}
                            >
                              {spec.icon} {spec.name}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSpecies("Custom")}
                          className={`w-full p-2 rounded text-sm font-ancient border ${species === "Custom" ? "bg-blue-200 border-blue-600" : "bg-white border-gray-300"}`}
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
                    )}
                  </div>
                )
              }
              if (fieldId === "age") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
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
                    )}
                  </div>
                )
              }
              if (fieldId === "traits") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <div className="grid grid-cols-2 gap-1.5">
                        {TRAITS.map((t) => (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => toggleTrait(t.name)}
                            className={`p-2 rounded text-sm font-ancient border ${
                              selectedTraits.includes(t.name) ? "bg-orange-200 border-orange-600" : "bg-white border-gray-300"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>,
                      selectedTraits.length === 0
                    )}
                  </div>
                )
              }
              if (fieldId === "background") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <textarea
                        placeholder="Background..."
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className={`${inputClass} h-16 resize-none`}
                        rows={2}
                      />,
                      !background.trim()
                    )}
                  </div>
                )
              }
              return null
            })}
          </div>

          {/* Center: cup 靠下，固定宽度让左右 box 紧贴杯子 */}
          <div className="flex flex-col items-center justify-end w-[260px] flex-shrink-0 relative pb-4">
            <div
              ref={cupRef}
              className={`relative flex items-end justify-center transition-transform origin-center ${cupShake ? "animate-shake-and-grow-cup" : ""}`}
              style={{ width: "220px", height: "240px" }}
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

              {/* Generated image overlays cup */}
              {imageUrl && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ zIndex: 40 }}
                >
                  <img
                    src={imageUrl}
                    alt="Character"
                    className="max-w-full max-h-full object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Generate button when all imported */}
            {allFieldsComplete && !imageUrl && (
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
              <div className="mt-2 flex flex-col gap-2 w-full max-w-[220px]">
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

          {/* Right boxes */}
          <div ref={rightBoxRef} className="grid grid-cols-2 gap-3 content-start w-[420px] min-w-[420px] flex-shrink-0 overflow-hidden py-2">
            {rightFields.map((fieldId) => {
              const cfg = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
              if (!cfg) return null
              if (fieldId === "age") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
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
                    )}
                  </div>
                )
              }
              if (fieldId === "traits") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <div className="grid grid-cols-2 gap-1.5">
                        {TRAITS.map((t) => (
                          <button
                            key={t.name}
                            type="button"
                            onClick={() => toggleTrait(t.name)}
                            className={`p-2 rounded text-sm font-ancient border ${
                              selectedTraits.includes(t.name) ? "bg-orange-200 border-orange-600" : "bg-white border-gray-300"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>,
                      selectedTraits.length === 0
                    )}
                  </div>
                )
              }
              if (fieldId === "background") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <textarea
                        placeholder="Background..."
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className={`${inputClass} h-16 resize-none`}
                        rows={2}
                      />,
                      !background.trim()
                    )}
                  </div>
                )
              }
              if (fieldId === "emotional") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <textarea
                        placeholder="Emotional..."
                        value={emotional}
                        onChange={(e) => setEmotional(e.target.value)}
                        className={`${inputClass} h-16 resize-none`}
                        rows={2}
                      />,
                      !emotional.trim()
                    )}
                  </div>
                )
              }
              if (fieldId === "symbolic") {
                return (
                  <div key={fieldId}>
                    {renderField(
                      fieldId,
                      cfg.label,
                      cfg.borderColor,
                      cfg.textColor,
                      <textarea
                        placeholder="Symbolic..."
                        value={symbolic}
                        onChange={(e) => setSymbolic(e.target.value)}
                        className={`${inputClass} h-16 resize-none`}
                        rows={2}
                      />,
                      !symbolic.trim()
                    )}
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .font-ancient {
          font-family: Georgia, "Times New Roman", "Palatino Linotype", serif;
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
        @keyframes shakeAndGrowCup {
          0% { transform: translateX(0) scale(1); }
          5% { transform: translateX(-5px) scale(1.03); }
          10% { transform: translateX(5px) scale(1.06); }
          15% { transform: translateX(-5px) scale(1.09); }
          20% { transform: translateX(5px) scale(1.12); }
          25% { transform: translateX(-4px) scale(1.15); }
          30% { transform: translateX(4px) scale(1.18); }
          35% { transform: translateX(-4px) scale(1.21); }
          40% { transform: translateX(4px) scale(1.24); }
          45% { transform: translateX(-3px) scale(1.27); }
          50% { transform: translateX(3px) scale(1.29); }
          55% { transform: translateX(-3px) scale(1.31); }
          60% { transform: translateX(3px) scale(1.33); }
          65% { transform: translateX(-2px) scale(1.34); }
          70% { transform: translateX(2px) scale(1.34); }
          75% { transform: translateX(-2px) scale(1.35); }
          80% { transform: translateX(2px) scale(1.35); }
          85% { transform: translateX(-1px) scale(1.35); }
          90% { transform: translateX(1px) scale(1.35); }
          95% { transform: translateX(-1px) scale(1.35); }
          100% { transform: translateX(0) scale(1.35); }
        }
        .animate-shake-and-grow-cup {
          animation: shakeAndGrowCup 4s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
