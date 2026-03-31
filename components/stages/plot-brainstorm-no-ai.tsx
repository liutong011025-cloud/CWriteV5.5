"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Language, StoryState } from "@/app/page"
import StageHeader from "@/components/stage-header"

interface PlotBrainstormNoAiProps {
  language: Language
  character: StoryState["character"] | null
  onPlotCreate: (plot: StoryState["plot"]) => void
  onBack: () => void
  userId?: string
}

// 根据species返回对应的emoji图标
const getSpeciesIcon = (species: string): string => {
  const speciesMap: Record<string, string> = {
    "Boy": "👦",
    "Girl": "👧",
    "Dragon": "🐉",
    "Robot": "🤖",
    "Unicorn": "🦄",
    "Cat": "🐱",
    "Dog": "🐶",
    "Rabbit": "🐰",
    "Bear": "🐻",
    "Fox": "🦊",
    "Lion": "🦁",
    "Tiger": "🐯",
    "Panda": "🐼",
    "Elephant": "🐘",
    "Penguin": "🐧",
    "Owl": "🦉",
  }
  return speciesMap[species] || "👤"
}

export default function PlotBrainstormNoAi({ language, character, onPlotCreate, onBack, userId }: PlotBrainstormNoAiProps) {
  const [setting, setSetting] = useState("")
  const [conflict, setConflict] = useState("")
  const [goal, setGoal] = useState("")

  const handleContinue = () => {
    if (setting.trim() && conflict.trim() && goal.trim()) {
      const plot = {
        setting: setting.trim(),
        conflict: conflict.trim(),
        goal: goal.trim(),
      }
      
      // 保存到interactions
      if (userId) {
        fetch("/api/interactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            stage: "plot",
            input: { character },
            output: { plot },
          }),
        }).catch((error) => {
          console.error("Error saving plot:", error)
        })
      }
      
      if (onPlotCreate && typeof onPlotCreate === 'function') {
        onPlotCreate(plot)
      } else {
        console.error("onPlotCreate is not a function:", typeof onPlotCreate, onPlotCreate)
      }
    }
  }

  const canContinue = setting.trim() && conflict.trim() && goal.trim()

  return (
    <div className="min-h-screen py-8 px-6 relative overflow-hidden pixel-theme" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
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
        
        {/* Pixel grass at bottom */}
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
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <StageHeader stage={2} title="Brainstorm Your Plot" onBack={onBack} character={character?.name} />

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Character panel */}
          {character && (
            <div className="lg:col-span-1">
              <div className="pixel-panel p-6">
                <h3 className="text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>Your Character</h3>
                {/* Character icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-24 h-24 flex items-center justify-center text-5xl" style={{
                    background: "#f5e6c8",
                    border: "4px solid #8b6914",
                    boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.15), inset 3px 3px 0 rgba(255,255,255,0.2)"
                  }}>
                    {getSpeciesIcon(character.species || "")}
                  </div>
                </div>
                <p className="text-xl font-extrabold text-center" style={{ color: "#5a4a2a" }}>{character.name}</p>
                {character.species && (
                  <p className="text-sm font-bold mt-1 text-center" style={{ color: "#6b5210" }}>{character.species}</p>
                )}
                {character.traits && character.traits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {character.traits.map((trait) => (
                      <span
                        key={trait}
                        className="px-2 py-1 text-xs font-bold"
                        style={{
                          background: "#7ec850",
                          color: "#fff",
                          border: "2px solid #5a9a32"
                        }}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form area */}
          <div className={character ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="pixel-panel p-8">
              <h3 className="text-2xl font-extrabold mb-6" style={{ color: "#5a4a2a", textShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}>
                Tell Your Story!
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>
                    Setting
                  </label>
                  <p className="text-sm font-bold mb-2" style={{ color: "#6b5210" }}>Where does your story take place?</p>
                  <Input
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="e.g., A magical forest, a school, outer space..."
                    className="pixel-input text-base"
                  />
                </div>

                <div>
                  <label className="block text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>
                    Conflict
                  </label>
                  <p className="text-sm font-bold mb-2" style={{ color: "#6b5210" }}>What problem or challenge does your character face?</p>
                  <Input
                    value={conflict}
                    onChange={(e) => setConflict(e.target.value)}
                    placeholder="e.g., A dragon stole the magic crystal, bullies at school..."
                    className="pixel-input text-base"
                  />
                </div>

                <div>
                  <label className="block text-lg font-extrabold mb-3" style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}>
                    Goal
                  </label>
                  <p className="text-sm font-bold mb-2" style={{ color: "#6b5210" }}>What does your character want to achieve?</p>
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Save the village, make new friends, find the treasure..."
                    className="pixel-input text-base"
                  />
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  size="lg"
                  className="w-full py-6 text-lg font-bold pixel-btn pixel-btn-green disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

