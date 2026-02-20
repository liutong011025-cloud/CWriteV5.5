"use client"

import { useState, useEffect, useRef } from "react"
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
  level?: number // 添加level参数，默认为1
}

// 字段配置，每个字段有不同的颜色
const FIELD_CONFIG = {
  name: {
    label: "Name",
    color: "from-purple-400 to-purple-600",
    borderColor: "border-purple-300",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
  },
  species: {
    label: "Species/Type",
    color: "from-blue-400 to-blue-600",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  age: {
    label: "Age",
    color: "from-green-400 to-green-600",
    borderColor: "border-green-300",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
  traits: {
    label: "Primary traits",
    color: "from-orange-400 to-orange-600",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
  },
  background: {
    label: "Background of the character",
    color: "from-pink-400 to-pink-600",
    borderColor: "border-pink-300",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
  },
  emotional: {
    label: "Emotional experiences",
    color: "from-indigo-400 to-indigo-600",
    borderColor: "border-indigo-300",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
  },
  symbolic: {
    label: "Symbolic objects",
    color: "from-cyan-400 to-cyan-600",
    borderColor: "border-cyan-300",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
  },
}

const TRAITS = [
  { name: "Brave", color: "from-red-400 to-red-600" },
  { name: "Smart", color: "from-blue-400 to-blue-600" },
  { name: "Funny", color: "from-yellow-400 to-yellow-600" },
  { name: "Kind", color: "from-green-400 to-green-600" },
  { name: "Curious", color: "from-purple-400 to-purple-600" },
  { name: "Strong", color: "from-orange-400 to-orange-600" },
  { name: "Creative", color: "from-pink-400 to-pink-600" },
  { name: "Loyal", color: "from-indigo-400 to-indigo-600" },
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
  
  // 跟踪每个字段的完成状态和动画状态
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set())
  const [animatingFields, setAnimatingFields] = useState<Set<string>>(new Set())
  const [cupFillLevel, setCupFillLevel] = useState(0) // 0-100，表示杯子填充百分比
  const [cupColors, setCupColors] = useState<string[]>([]) // 杯子中累积的颜色（按完成顺序）
  
  const cupRef = useRef<HTMLDivElement>(null)
  
  // 根据level确定需要显示的字段
  const isHighLevel = level >= 4
  const baseFields = ["name", "species", "age", "traits"]
  const advancedFields = ["background", "emotional", "symbolic"]
  const allFields = isHighLevel ? [...baseFields, ...advancedFields] : baseFields
  
  // 检查字段是否完成
  const isFieldComplete = (fieldId: string): boolean => {
    switch (fieldId) {
      case "name":
        return name.trim() !== ""
      case "species":
        return species !== "" || (species === "Custom" && customSpecies.trim() !== "")
      case "age":
        return age.trim() !== ""
      case "traits":
        return selectedTraits.length > 0
      case "background":
        return background.trim() !== ""
      case "emotional":
        return emotional.trim() !== ""
      case "symbolic":
        return symbolic.trim() !== ""
      default:
        return false
    }
  }
  
  // 当字段完成时触发动画
  useEffect(() => {
    allFields.forEach((fieldId) => {
      const isComplete = isFieldComplete(fieldId)
      const wasComplete = completedFields.has(fieldId)
      
      if (isComplete && !wasComplete) {
        // 字段刚完成，触发动画
        setAnimatingFields((prev) => new Set(prev).add(fieldId))
        setCompletedFields((prev) => new Set(prev).add(fieldId))
        
        // 添加颜色到杯子
        const fieldConfig = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
        setCupColors((prev) => [...prev, fieldConfig.color])
        
        // 更新杯子填充高度
        const completedCount = completedFields.size + 1
        const totalFields = allFields.length
        const newFillLevel = (completedCount / totalFields) * 100
        setCupFillLevel(newFillLevel)
        
        // 动画完成后移除动画状态
        setTimeout(() => {
          setAnimatingFields((prev) => {
            const next = new Set(prev)
            next.delete(fieldId)
            return next
          })
        }, 1000)
      } else if (!isComplete && wasComplete) {
        // 字段被清空，移除完成状态
        setCompletedFields((prev) => {
          const next = new Set(prev)
          next.delete(fieldId)
          return next
        })
        
        // 移除对应的颜色
        const fieldConfig = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
        setCupColors((prev) => prev.filter((color) => color !== fieldConfig.color))
        
        // 重新计算填充高度
        const completedCount = completedFields.size - 1
        const totalFields = allFields.length
        const newFillLevel = Math.max(0, (completedCount / totalFields) * 100)
        setCupFillLevel(newFillLevel)
      }
    })
  }, [name, species, customSpecies, age, selectedTraits, background, emotional, symbolic, completedFields, allFields])
  
  const toggleTrait = (traitName: string) => {
    setSelectedTraits((prev) => {
      const newTraits = prev.includes(traitName) ? prev.filter((t) => t !== traitName) : [...prev, traitName].slice(0, 3)
      return newTraits
    })
  }
  
  const generateImage = async () => {
    const finalSpecies = species === "Custom" ? customSpecies.trim() : species
    if (!finalSpecies) {
      toast.error("Please select or enter a species first")
      return
    }
    
    setIsGenerating(true)
    toast.info("Generating character image...")
    
    try {
      // 构建prompt
      let prompt = `A charming cartoon illustration of ${species === "Boy" || species === "Girl" ? `a young ${species.toLowerCase()}` : `a ${finalSpecies.toLowerCase()}`} character named ${name}.`
      
      if (age.trim()) {
        prompt += ` The character is ${age} years old.`
      }
      
      if (selectedTraits.length > 0) {
        prompt += ` The character looks ${selectedTraits.join(', ')}.`
      }
      
      if (background.trim()) {
        prompt += ` Background: ${background}.`
      }
      
      if (emotional.trim()) {
        prompt += ` Emotional experiences: ${emotional}.`
      }
      
      if (symbolic.trim()) {
        prompt += ` Symbolic objects: ${symbolic}.`
      }
      
      prompt += " Fun and colorful style suitable for children's stories."
      
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          user_id: userId,
          stage: 'character'
        }),
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
    }
  }
  
  const finalSpecies = species === "Custom" ? customSpecies.trim() : species
  
  // 检查所有字段是否完成
  const allFieldsComplete = allFields.every((fieldId) => isFieldComplete(fieldId))
  
  const handleCreate = () => {
    if (allFieldsComplete && imageUrl) {
      const defaultAge = age.trim() ? parseInt(age) : (finalSpecies === "Boy" || finalSpecies === "Girl" ? 8 : 0)
      onCharacterCreate({
        name,
        age: defaultAge,
        traits: selectedTraits,
        description: background || "",
        imageUrl: imageUrl,
        species: finalSpecies,
      })
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col relative" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      {/* 背景图片 */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/magictable.png)',
          zIndex: 0
        }}
      />
      
      {/* 遮罩层，确保内容可读 */}
      <div className="absolute inset-0 bg-black/10 z-10" />
      
      <div className="relative z-20 flex-1 flex flex-col">
        <div className="px-8 lg:px-12 py-4">
          <StageHeader stage={1} title="Create Your Character" onBack={onBack} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-12 pb-6">
          {/* 输入框区域 - 上方 */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Name 字段 */}
            <div 
              className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                FIELD_CONFIG.name.borderColor
              } ${FIELD_CONFIG.name.bgColor} ${
                animatingFields.has("name") ? "animate-pulse scale-95" : ""
              } ${
                completedFields.has("name") ? "opacity-60" : ""
              }`}
            >
              <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.name.textColor}`}>
                {FIELD_CONFIG.name.label}
              </label>
              <Input
                placeholder="Enter name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border-2 ${FIELD_CONFIG.name.borderColor} focus:border-purple-500 rounded-xl bg-white/90`}
                disabled={completedFields.has("name")}
              />
            </div>
            
            {/* Species/Type 字段 */}
            <div 
              className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                FIELD_CONFIG.species.borderColor
              } ${FIELD_CONFIG.species.bgColor} ${
                animatingFields.has("species") ? "animate-pulse scale-95" : ""
              } ${
                completedFields.has("species") ? "opacity-60" : ""
              }`}
            >
              <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.species.textColor}`}>
                {FIELD_CONFIG.species.label}
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {SPECIES.slice(0, 6).map((spec) => {
                  const isSelected = species === spec.name
                  return (
                    <button
                      key={spec.name}
                      onClick={() => !completedFields.has("species") && setSpecies(spec.name)}
                      disabled={completedFields.has("species")}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-lg flex flex-col items-center gap-1 ${
                        isSelected
                          ? `bg-gradient-to-r ${FIELD_CONFIG.species.color} text-white transform scale-105`
                          : "bg-white/80 hover:bg-white border-2 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{spec.icon}</span>
                      <span>{spec.name}</span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => !completedFields.has("species") && setSpecies("Custom")}
                disabled={completedFields.has("species")}
                className={`w-full p-2 rounded-xl text-xs font-semibold transition-all shadow-lg mb-2 ${
                  species === "Custom"
                    ? `bg-gradient-to-r ${FIELD_CONFIG.species.color} text-white transform scale-105`
                    : "bg-white/80 hover:bg-white border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                Custom
              </button>
              {species === "Custom" && !completedFields.has("species") && (
                <Input
                  placeholder="Enter custom species..."
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  className={`border-2 ${FIELD_CONFIG.species.borderColor} focus:border-blue-500 rounded-xl bg-white/90`}
                />
              )}
            </div>
            
            {/* Age 字段 */}
            <div 
              className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                FIELD_CONFIG.age.borderColor
              } ${FIELD_CONFIG.age.bgColor} ${
                animatingFields.has("age") ? "animate-pulse scale-95" : ""
              } ${
                completedFields.has("age") ? "opacity-60" : ""
              }`}
            >
              <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.age.textColor}`}>
                {FIELD_CONFIG.age.label}
              </label>
              <Input
                type="number"
                placeholder="Enter age..."
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`border-2 ${FIELD_CONFIG.age.borderColor} focus:border-green-500 rounded-xl bg-white/90`}
                disabled={completedFields.has("age")}
              />
            </div>
            
            {/* Primary traits 字段 */}
            <div 
              className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                FIELD_CONFIG.traits.borderColor
              } ${FIELD_CONFIG.traits.bgColor} ${
                animatingFields.has("traits") ? "animate-pulse scale-95" : ""
              } ${
                completedFields.has("traits") ? "opacity-60" : ""
              }`}
            >
              <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.traits.textColor}`}>
                {FIELD_CONFIG.traits.label}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TRAITS.map((trait) => {
                  const isSelected = selectedTraits.includes(trait.name)
                  return (
                    <button
                      key={trait.name}
                      onClick={() => !completedFields.has("traits") && toggleTrait(trait.name)}
                      disabled={completedFields.has("traits")}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all shadow-lg ${
                        isSelected
                          ? `bg-gradient-to-r ${trait.color} text-white transform scale-105`
                          : "bg-white/80 hover:bg-white border-2 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {trait.name}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Level 4-5 额外字段 */}
            {isHighLevel && (
              <>
                {/* Background of the character */}
                <div 
                  className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                    FIELD_CONFIG.background.borderColor
                  } ${FIELD_CONFIG.background.bgColor} ${
                    animatingFields.has("background") ? "animate-pulse scale-95" : ""
                  } ${
                    completedFields.has("background") ? "opacity-60" : ""
                  }`}
                >
                  <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.background.textColor}`}>
                    {FIELD_CONFIG.background.label}
                  </label>
                  <textarea
                    placeholder="Describe background..."
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className={`w-full h-20 p-3 rounded-xl border-2 ${FIELD_CONFIG.background.borderColor} focus:border-pink-500 bg-white/90 text-foreground resize-none text-sm`}
                    disabled={completedFields.has("background")}
                  />
                </div>
                
                {/* Emotional experiences */}
                <div 
                  className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                    FIELD_CONFIG.emotional.borderColor
                  } ${FIELD_CONFIG.emotional.bgColor} ${
                    animatingFields.has("emotional") ? "animate-pulse scale-95" : ""
                  } ${
                    completedFields.has("emotional") ? "opacity-60" : ""
                  }`}
                >
                  <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.emotional.textColor}`}>
                    {FIELD_CONFIG.emotional.label}
                  </label>
                  <textarea
                    placeholder="Describe emotional experiences..."
                    value={emotional}
                    onChange={(e) => setEmotional(e.target.value)}
                    className={`w-full h-20 p-3 rounded-xl border-2 ${FIELD_CONFIG.emotional.borderColor} focus:border-indigo-500 bg-white/90 text-foreground resize-none text-sm`}
                    disabled={completedFields.has("emotional")}
                  />
                </div>
                
                {/* Symbolic objects */}
                <div 
                  className={`rounded-2xl p-4 border-2 shadow-xl backdrop-blur-sm transition-all duration-300 ${
                    FIELD_CONFIG.symbolic.borderColor
                  } ${FIELD_CONFIG.symbolic.bgColor} ${
                    animatingFields.has("symbolic") ? "animate-pulse scale-95" : ""
                  } ${
                    completedFields.has("symbolic") ? "opacity-60" : ""
                  }`}
                >
                  <label className={`block text-sm font-bold mb-2 ${FIELD_CONFIG.symbolic.textColor}`}>
                    {FIELD_CONFIG.symbolic.label}
                  </label>
                  <textarea
                    placeholder="Describe symbolic objects..."
                    value={symbolic}
                    onChange={(e) => setSymbolic(e.target.value)}
                    className={`w-full h-20 p-3 rounded-xl border-2 ${FIELD_CONFIG.symbolic.borderColor} focus:border-cyan-500 bg-white/90 text-foreground resize-none text-sm`}
                    disabled={completedFields.has("symbolic")}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* 杯子区域 - 正中间偏下方 */}
          <div className="relative flex items-center justify-center mb-8" style={{ minHeight: '300px' }}>
            {/* 杯子容器 */}
            <div ref={cupRef} className="relative w-64 h-80 flex items-end justify-center">
              {/* 杯子图片 */}
              <img
                src="/cup.png"
                alt="Magic Cup"
                className="absolute inset-0 w-full h-full object-contain z-20"
                style={{ 
                  filter: cupColors.length > 0 ? 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.6))' : undefined,
                  transition: 'filter 0.5s ease-in-out'
                }}
              />
              
              {/* 液体填充层 - 多层渐变，每层代表一个完成的字段 */}
              {cupFillLevel > 0 && cupColors.length > 0 && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10" style={{ width: '60%', height: `${Math.min(cupFillLevel * 0.75, 75)}%`, maxHeight: '75%' }}>
                  {cupColors.map((color, index) => {
                    const totalHeight = Math.min(cupFillLevel * 0.75, 75)
                    const segmentHeight = totalHeight / cupColors.length
                    const segmentBottom = index * segmentHeight
                    const colorMap: Record<string, { from: string; to: string }> = {
                      'from-purple-400 to-purple-600': { from: '#a855f7', to: '#9333ea' },
                      'from-blue-400 to-blue-600': { from: '#60a5fa', to: '#2563eb' },
                      'from-green-400 to-green-600': { from: '#4ade80', to: '#16a34a' },
                      'from-orange-400 to-orange-600': { from: '#fb923c', to: '#ea580c' },
                      'from-pink-400 to-pink-600': { from: '#f472b6', to: '#db2777' },
                      'from-indigo-400 to-indigo-600': { from: '#818cf8', to: '#4f46e5' },
                      'from-cyan-400 to-cyan-600': { from: '#22d3ee', to: '#0891b2' },
                    }
                    const colors = colorMap[color] || { from: '#a855f7', to: '#9333ea' }
                    
                    return (
                      <div
                        key={index}
                        className="absolute left-0 right-0 transition-all duration-1000 ease-out"
                        style={{
                          bottom: `${segmentBottom}%`,
                          height: `${segmentHeight}%`,
                          background: `linear-gradient(to top, ${colors.to}, ${colors.from})`,
                          opacity: 0.85,
                          borderRadius: index === cupColors.length - 1 ? '20px 20px 0 0' : '0',
                          zIndex: cupColors.length - index,
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* 动画粒子效果 - 当字段完成时 */}
            {animatingFields.size > 0 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from(animatingFields).map((fieldId, index) => {
                  const fieldConfig = FIELD_CONFIG[fieldId as keyof typeof FIELD_CONFIG]
                  const colorMap: Record<string, string> = {
                    'from-purple-400 to-purple-600': '#a855f7',
                    'from-blue-400 to-blue-600': '#60a5fa',
                    'from-green-400 to-green-600': '#4ade80',
                    'from-orange-400 to-orange-600': '#fb923c',
                    'from-pink-400 to-pink-600': '#f472b6',
                    'from-indigo-400 to-indigo-600': '#818cf8',
                    'from-cyan-400 to-cyan-600': '#22d3ee',
                  }
                  const color = colorMap[fieldConfig.color] || '#a855f7'
                  
                  return (
                    <div
                      key={`${fieldId}-${index}`}
                      className="absolute w-6 h-6 rounded-full"
                      style={{
                        backgroundColor: color,
                        left: `${20 + index * 15}%`,
                        top: '10%',
                        animation: 'flyToCup 1s ease-out forwards',
                        boxShadow: `0 0 10px ${color}`,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>
          
          {/* 生成按钮 - 所有字段完成后显示 */}
          {allFieldsComplete && (
            <div className="w-full max-w-md">
              {!imageUrl ? (
                <Button
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-xl py-6 text-base font-bold animate-pulse"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Character...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Character
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* 生成的图片预览 */}
                  <div className="relative bg-white/90 rounded-2xl p-4 shadow-2xl">
                    <img
                      src={imageUrl}
                      alt="Character"
                      className="w-full h-auto object-contain rounded-xl max-h-[400px]"
                    />
                  </div>
                  
                  {/* 继续按钮 */}
                  <Button
                    onClick={handleCreate}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 shadow-xl py-6 text-base font-bold"
                  >
                    Back to Map →
                  </Button>
                  
                  {/* 重新生成按钮 */}
                  <Button
                    onClick={generateImage}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full border-2 border-purple-300 shadow-lg py-4 text-sm font-bold text-purple-700 hover:bg-purple-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Regenerate Image
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* CSS动画 */}
      <style jsx global>{`
        @keyframes flyToCup {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(calc(50vw - 50% - 128px), calc(50vh - 50% + 100px)) scale(0.8);
            opacity: 0.9;
          }
          100% {
            transform: translate(calc(50vw - 50% - 128px), calc(50vh - 50% + 100px)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
