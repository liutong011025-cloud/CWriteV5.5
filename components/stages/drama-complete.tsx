"use client"

import { useEffect } from "react"
import { useDramaStore } from "@/lib/drama-store"
import { DramaBook } from "@/components/drama/drama-book"
import type { Language } from "@/app/page"

interface DramaCompleteProps {
  background: { prompt?: string; imageUrl?: string }
  scenes: Array<{
    id: string
    backgroundPrompt?: string
    backgroundImageUrl?: string
    characters: Array<{
      characterId: string
      position: { x: number; y: number }
      dialogues: Array<{
        characterId: string
        type: "dialogue" | "thought"
        text: string
        position: { x: number; y: number }
      }>
    }>
    sceneInfo?: string
  }>
  characters: Array<{
    id: string
    name: string
    species?: string
    appearance?: string
    imageUrl?: string
    prompt?: string
  }>
  onReset?: () => void
  onBack?: () => void
  userId?: string
  workId?: string
}

export default function DramaComplete({
  background,
  scenes,
  characters,
  onReset,
  onBack,
  userId,
  workId,
}: DramaCompleteProps) {
  const setDramaBook = useDramaStore((s) => s.setDramaBook)
  const reset = useDramaStore((s) => s.reset)

  // Load data into store when component mounts
  useEffect(() => {
    // Convert scenes format
    const storeScenes = scenes.map((s, index) => ({
      id: s.id || `scene-${index}`,
      backgroundPrompt: s.backgroundPrompt || background.prompt || "",
      backgroundImageUrl: s.backgroundImageUrl || background.imageUrl || null,
      isGeneratingBg: false,
      characters: s.characters.map((sc) => ({
        characterId: sc.characterId,
        x: sc.position.x,
        y: sc.position.y,
        dialogue: sc.dialogues.find(d => d.type === "dialogue")?.text || "",
        thought: sc.dialogues.find(d => d.type === "thought")?.text || "",
      })),
      notes: s.sceneInfo || "",
    }))

    // Convert characters format
    const storeCharacters = characters.map((c) => ({
      id: c.id,
      name: c.name,
      species: c.species || "",
      appearance: c.appearance || "",
      imageUrl: c.imageUrl || null,
      isGenerating: false,
    }))

    // Update store
    useDramaStore.setState({
      scenes: storeScenes,
      characters: storeCharacters,
      activeSceneIndex: 0,
    })

    // If we have drama book data, set it (this would come from the API)
    // For now, we'll generate it if needed
  }, [scenes, characters, background])

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  return (
    <div className="relative">
      <DramaBook onBack={handleBack} />
    </div>
  )
}
