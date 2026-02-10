"use client"

import { useEffect } from "react"
import { useDramaStore } from "@/lib/drama-store"
import { DramaBuilder } from "@/components/drama/drama-builder"
import type { Language } from "@/app/page"
import { toast } from "sonner"

interface DramaWritingProps {
  language?: Language
  userId?: string
  onComplete: (dramaData: {
    background: { prompt?: string; imageUrl?: string }
    scenes: any[]
    characters: any[]
  }) => void
  onBack?: () => void
}

export default function DramaWriting({
  language = "en",
  userId,
  onComplete,
  onBack
}: DramaWritingProps) {
  const scenes = useDramaStore((s) => s.scenes)
  const characters = useDramaStore((s) => s.characters)
  const title = useDramaStore((s) => s.title)
  const setDramaBook = useDramaStore((s) => s.setDramaBook)
  const setGeneratingBook = useDramaStore((s) => s.setGeneratingBook)

  // Reset store when component mounts
  useEffect(() => {
    useDramaStore.getState().reset()
  }, [])

  const handleGenerateDrama = async () => {
    setGeneratingBook(true)

    try {
      const res = await fetch("/api/generate-drama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: scenes.map((s) => ({
            backgroundPrompt: s.backgroundPrompt,
            notes: s.notes,
            characters: s.characters,
          })),
          characters: characters.map((c) => ({
            id: c.id,
            name: c.name,
            species: c.species,
            appearance: c.appearance,
          })),
          title,
          userId: userId || "default-user",
        }),
      })

      const data = await res.json()

      if (data.error) {
        // Use fallback
        setDramaBook({
          summary: `"${title}" is a wonderful drama with ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}! Great work!`,
          script: generateLocalScript(),
          suggestions: [
            "Try adding more dialogue between your characters!",
            "What feelings do your characters have? Add some emotion words!",
            "Can you describe what happens at the end?",
          ],
        })
      } else {
        setDramaBook(data)
      }

      // Convert to the format expected by onComplete
      const dramaData = {
        background: {
          prompt: scenes[0]?.backgroundPrompt || "",
          imageUrl: scenes[0]?.backgroundImageUrl || undefined,
        },
        scenes: scenes.map(s => ({
          id: s.id,
          backgroundPrompt: s.backgroundPrompt,
          backgroundImageUrl: s.backgroundImageUrl,
          characters: s.characters,
          sceneInfo: s.notes,
        })),
        characters: characters.map(c => ({
          id: c.id,
          name: c.name,
          species: c.species,
          appearance: c.appearance,
          imageUrl: c.imageUrl,
          prompt: `${c.species || "human"} character, ${c.appearance || c.name}`,
        })),
      }

      onComplete(dramaData)
    } catch (error) {
      console.error("Error generating drama:", error)
      toast.error("生成drama失败，请重试")
      // Fallback on error
      setDramaBook({
        summary: `"${title}" is a creative drama with ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}!`,
        script: generateLocalScript(),
        suggestions: [
          "Try adding more dialogue between your characters!",
          "What feelings do your characters have?",
          "Can one character disagree with another?",
        ],
      })
      setGeneratingBook(false)
    }
  }

  const generateLocalScript = () => {
    let script = `${title}\nA Drama by a Creative Young Writer\n\n`
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      script += `--- ACT ${i + 1} ---\n`
      script += `[Setting: ${scene.backgroundPrompt || "A mysterious place"}]\n`
      if (scene.notes) script += `[${scene.notes}]\n`
      script += "\n"
      for (const pc of scene.characters) {
        const char = characters.find((c) => c.id === pc.characterId)
        if (char) {
          if (pc.dialogue) script += `${char.name}: "${pc.dialogue}"\n`
          if (pc.thought) script += `[${char.name} thinks: "${pc.thought}"]\n`
        }
      }
      script += "\n"
    }
    return script
  }

  return (
    <div className="relative">
      {onBack && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={onBack}
            className="rounded-lg bg-card/90 backdrop-blur-sm border-2 border-border px-4 py-2 font-hand text-sm text-foreground hover:bg-card transition-colors"
          >
            ← 返回
          </button>
        </div>
      )}
      <DramaBuilder onGenerateDrama={handleGenerateDrama} />
    </div>
  )
}
