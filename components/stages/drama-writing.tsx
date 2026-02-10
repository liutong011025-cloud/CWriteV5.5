"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, MessageSquare, Brain, Check } from "lucide-react"
import { toast } from "sonner"
import type { Language } from "@/app/page"

interface Character {
  id: string
  name: string
  species?: string
  appearance?: string
  imageUrl?: string
  prompt?: string
}

interface Dialogue {
  characterId: string
  type: "dialogue" | "thought"
  text: string
  position: { x: number; y: number }
}

interface Scene {
  id: string
  backgroundPrompt?: string
  backgroundImageUrl?: string
  characters: Array<{
    characterId: string
    position: { x: number; y: number }
    dialogues: Dialogue[]
  }>
  sceneInfo?: string
}

interface DramaWritingProps {
  language?: Language
  userId?: string
  onComplete: (dramaData: {
    background: { prompt?: string; imageUrl?: string }
    scenes: Scene[]
    characters: Character[]
  }) => void
  onBack?: () => void
}

// 使用API路由而不是直接调用FAL API

export default function DramaWriting({
  language = "en",
  userId,
  onComplete,
  onBack
}: DramaWritingProps) {
  const [backgroundPrompt, setBackgroundPrompt] = useState("")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null)
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false)
  
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([{ id: "scene-1", characters: [] }])
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null)
  const [characterName, setCharacterName] = useState("")
  const [characterSpecies, setCharacterSpecies] = useState("")
  const [characterAppearance, setCharacterAppearance] = useState("")
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false)
  
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null)
  const [editingDialogue, setEditingDialogue] = useState<{ characterId: string; type: "dialogue" | "thought"; position: { x: number; y: number } } | null>(null)
  const [dialogueText, setDialogueText] = useState("")
  
  const [sceneInfo, setSceneInfo] = useState<Record<string, string>>({})
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingCharacter, setDraggingCharacter] = useState<{ characterId: string; offset: { x: number; y: number } } | null>(null)

  const generateBackground = async () => {
    if (!backgroundPrompt.trim()) {
      toast.error("请输入背景描述")
      return
    }

    setIsGeneratingBackground(true)
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: backgroundPrompt,
          aspect_ratio: "16:9",
          user_id: userId,
          stage: "dramaBackground",
        }),
      })

      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
        return
      }

      setBackgroundImageUrl(data.imageUrl)
      toast.success("背景生成成功！")
    } catch (error) {
      console.error("Error generating background:", error)
      toast.error("生成背景失败，请重试")
    } finally {
      setIsGeneratingBackground(false)
    }
  }

  const addCharacter = () => {
    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      name: "",
    }
    setCharacters([...characters, newCharacter])
    setEditingCharacter(newCharacter.id)
    setCharacterName("")
    setCharacterSpecies("")
    setCharacterAppearance("")
  }

  const saveCharacter = async () => {
    if (!characterName.trim()) {
      toast.error("请输入角色名字")
      return
    }

    if (!editingCharacter) return

    const character = characters.find(c => c.id === editingCharacter)
    if (!character) return

    const updatedCharacter: Character = {
      ...character,
      name: characterName,
      species: characterSpecies,
      appearance: characterAppearance,
    }

    // 生成角色图片（无背景）
    if (characterSpecies || characterAppearance) {
      setIsGeneratingCharacter(true)
      try {
        const prompt = `A character portrait of ${characterName}${characterSpecies ? `, a ${characterSpecies}` : ""}${characterAppearance ? `. ${characterAppearance}` : ""}. Character only, no background, transparent background, isolated on white background, clean cutout style`
        
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            aspect_ratio: "1:1",
            user_id: userId,
            stage: "dramaCharacter",
          }),
        })

        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }

        if (data.imageUrl) {
          updatedCharacter.imageUrl = data.imageUrl
          updatedCharacter.prompt = prompt
          
          // 更新所有场景中相同角色的图片
          setScenes(prevScenes => 
            prevScenes.map(scene => ({
              ...scene,
              characters: scene.characters.map(char => 
                char.characterId === editingCharacter 
                  ? { ...char } 
                  : char
              )
            }))
          )
        }
      } catch (error) {
        console.error("Error generating character image:", error)
        toast.error("生成角色图片失败，但角色信息已保存")
      } finally {
        setIsGeneratingCharacter(false)
      }
    }

    setCharacters(characters.map(c => c.id === editingCharacter ? updatedCharacter : c))
    setEditingCharacter(null)
    toast.success("角色保存成功！")
  }

  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      characters: [],
    }
    setScenes([...scenes, newScene])
    setCurrentSceneIndex(scenes.length)
  }

  const addCharacterToScene = (characterId: string) => {
    const currentScene = scenes[currentSceneIndex]
    if (!currentScene) return

    const exists = currentScene.characters.some(c => c.characterId === characterId)
    if (exists) {
      toast.info("角色已在此场景中")
      return
    }

    const newScene = {
      ...currentScene,
      characters: [
        ...currentScene.characters,
        {
          characterId,
          position: { x: 50, y: 50 },
          dialogues: [],
        },
      ],
    }

    setScenes(scenes.map((s, i) => i === currentSceneIndex ? newScene : s))
  }

  const handleCharacterDragStart = (characterId: string, e: React.MouseEvent) => {
    const currentScene = scenes[currentSceneIndex]
    const sceneChar = currentScene?.characters.find(c => c.characterId === characterId)
    if (!sceneChar || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const offset = {
      x: e.clientX - rect.left - (sceneChar.position.x * rect.width / 100),
      y: e.clientY - rect.top - (sceneChar.position.y * rect.height / 100),
    }

    setDraggingCharacter({ characterId, offset })
  }

  const handleCharacterDrag = (e: React.MouseEvent) => {
    if (!draggingCharacter || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left - draggingCharacter.offset.x) / rect.width) * 100
    const y = ((e.clientY - rect.top - draggingCharacter.offset.y) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    const currentScene = scenes[currentSceneIndex]
    const updatedScene = {
      ...currentScene,
      characters: currentScene.characters.map(c =>
        c.characterId === draggingCharacter.characterId
          ? { ...c, position: { x: clampedX, y: clampedY } }
          : c
      ),
    }

    setScenes(scenes.map((s, i) => i === currentSceneIndex ? updatedScene : s))
  }

  const handleCharacterDragEnd = () => {
    setDraggingCharacter(null)
  }

  useEffect(() => {
    if (draggingCharacter) {
      document.addEventListener("mousemove", handleCharacterDrag as any)
      document.addEventListener("mouseup", handleCharacterDragEnd)
      return () => {
        document.removeEventListener("mousemove", handleCharacterDrag as any)
        document.removeEventListener("mouseup", handleCharacterDragEnd)
      }
    }
  }, [draggingCharacter])

  const addDialogue = (characterId: string, type: "dialogue" | "thought") => {
    const currentScene = scenes[currentSceneIndex]
    const sceneChar = currentScene?.characters.find(c => c.characterId === characterId)
    if (!sceneChar) return

    setEditingDialogue({
      characterId,
      type,
      position: { x: sceneChar.position.x, y: sceneChar.position.y - 10 },
    })
    setDialogueText("")
  }

  const saveDialogue = () => {
    if (!editingDialogue || !dialogueText.trim()) return

    const currentScene = scenes[currentSceneIndex]
    const updatedScene = {
      ...currentScene,
      characters: currentScene.characters.map(c =>
        c.characterId === editingDialogue.characterId
          ? {
              ...c,
              dialogues: [
                ...c.dialogues,
                {
                  characterId: editingDialogue.characterId,
                  type: editingDialogue.type,
                  text: dialogueText,
                  position: editingDialogue.position,
                },
              ],
            }
          : c
      ),
    }

    setScenes(scenes.map((s, i) => i === currentSceneIndex ? updatedScene : s))
    setEditingDialogue(null)
    setDialogueText("")
  }

  const handleComplete = () => {
    if (scenes.length === 0 || scenes.every(s => s.characters.length === 0)) {
      toast.error("请至少添加一个场景和角色")
      return
    }

    onComplete({
      background: {
        prompt: backgroundPrompt,
        imageUrl: backgroundImageUrl || undefined,
      },
      scenes: scenes.map(s => ({
        ...s,
        backgroundPrompt: s.backgroundPrompt || backgroundPrompt,
        backgroundImageUrl: s.backgroundImageUrl || backgroundImageUrl || undefined,
        sceneInfo: sceneInfo[s.id] || "",
      })),
      characters,
    })
  }

  const currentScene = scenes[currentSceneIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-6 bg-white/80 backdrop-blur-lg"
          >
            ← 返回
          </Button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：背景和角色管理 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 背景输入 */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">🎬 背景设置</h3>
              <textarea
                value={backgroundPrompt}
                onChange={(e) => setBackgroundPrompt(e.target.value)}
                placeholder="输入drama的背景描述..."
                className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={generateBackground}
                disabled={isGeneratingBackground || !backgroundPrompt.trim()}
                className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGeneratingBackground ? "生成中..." : "生成背景"}
              </Button>
              {backgroundImageUrl && (
                <img
                  src={backgroundImageUrl}
                  alt="Background"
                  className="mt-4 w-full rounded-lg border-2 border-indigo-300"
                />
              )}
            </div>

            {/* 角色管理 */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-purple-700">👤 角色</h3>
                <Button
                  onClick={addCharacter}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{char.name || "未命名角色"}</span>
                      <Button
                        onClick={() => {
                          setEditingCharacter(char.id)
                          setCharacterName(char.name)
                          setCharacterSpecies(char.species || "")
                          setCharacterAppearance(char.appearance || "")
                        }}
                        size="sm"
                        variant="outline"
                      >
                        编辑
                      </Button>
                    </div>
                    {char.imageUrl && (
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="mt-2 w-full rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 场景列表 */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-pink-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-pink-700">🎬 场景</h3>
                <Button
                  onClick={addScene}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {scenes.map((scene, index) => (
                  <Button
                    key={scene.id}
                    onClick={() => setCurrentSceneIndex(index)}
                    variant={currentSceneIndex === index ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    场景 {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 中间：画布区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border-2 border-gray-300 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-center">
                场景 {currentSceneIndex + 1}
              </h3>
              
              {/* 画布 */}
              <div
                ref={canvasRef}
                className="relative w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-400 overflow-hidden"
                style={{
                  backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onMouseMove={handleCharacterDrag}
                onMouseUp={handleCharacterDragEnd}
              >
                {currentScene?.characters.map((sceneChar) => {
                  const character = characters.find(c => c.id === sceneChar.characterId)
                  if (!character) return null

                  return (
                    <div
                      key={sceneChar.characterId}
                      className="absolute cursor-move"
                      style={{
                        left: `${sceneChar.position.x}%`,
                        top: `${sceneChar.position.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseDown={(e) => handleCharacterDragStart(sceneChar.characterId, e)}
                      onMouseEnter={() => setHoveredCharacter(sceneChar.characterId)}
                      onMouseLeave={() => setHoveredCharacter(null)}
                    >
                      {character.imageUrl && (
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-24 h-24 object-contain"
                          draggable={false}
                        />
                      )}
                      
                      {/* 对话和思考气泡按钮 */}
                      {hoveredCharacter === sceneChar.characterId && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/90 rounded-lg p-2 shadow-lg border-2 border-gray-300">
                          <button
                            onClick={() => addDialogue(sceneChar.characterId, "dialogue")}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="添加对话"
                          >
                            <MessageSquare size={20} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => addDialogue(sceneChar.characterId, "thought")}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="添加思考"
                          >
                            <Brain size={20} className="text-purple-600" />
                          </button>
                        </div>
                      )}

                      {/* 显示对话和思考 */}
                      {sceneChar.dialogues.map((dialogue, idx) => (
                        <div
                          key={idx}
                          className={`absolute text-xs p-2 rounded-lg max-w-32 ${
                            dialogue.type === "dialogue"
                              ? "bg-blue-100 border-2 border-blue-300"
                              : "bg-purple-100 border-2 border-purple-300"
                          }`}
                          style={{
                            left: `${dialogue.position.x}%`,
                            top: `${dialogue.position.y}%`,
                            transform: "translate(-50%, -100%)",
                          }}
                        >
                          {dialogue.text}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* 添加角色到场景 */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2">添加角色到此场景：</h4>
                <div className="flex flex-wrap gap-2">
                  {characters.map((char) => (
                    <Button
                      key={char.id}
                      onClick={() => addCharacterToScene(char.id)}
                      size="sm"
                      variant="outline"
                      disabled={currentScene?.characters.some(c => c.characterId === char.id)}
                    >
                      {char.name || "未命名"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 场景信息输入 */}
              <div className="mt-4">
                <textarea
                  value={sceneInfo[currentScene?.id || ""] || ""}
                  onChange={(e) => setSceneInfo({ ...sceneInfo, [currentScene?.id || ""]: e.target.value })}
                  placeholder="输入此场景的背景信息和其他描述..."
                  className="w-full h-20 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 完成按钮 */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleComplete}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl"
              >
                <Check size={20} className="mr-2" />
                生成完整Drama
              </Button>
            </div>
          </div>
        </div>

        {/* 角色编辑对话框 */}
        {editingCharacter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4">编辑角色</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">角色名字 *</label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="输入角色名字"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">物种</label>
                  <input
                    type="text"
                    value={characterSpecies}
                    onChange={(e) => setCharacterSpecies(e.target.value)}
                    placeholder="例如：人类、精灵、机器人等"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">外貌特点</label>
                  <textarea
                    value={characterAppearance}
                    onChange={(e) => setCharacterAppearance(e.target.value)}
                    placeholder="描述角色的外貌特点..."
                    className="w-full h-24 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={saveCharacter}
                    disabled={isGeneratingCharacter || !characterName.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isGeneratingCharacter ? "生成中..." : "保存"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCharacter(null)
                      setCharacterName("")
                      setCharacterSpecies("")
                      setCharacterAppearance("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 对话编辑对话框 */}
        {editingDialogue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4">
                {editingDialogue.type === "dialogue" ? "💬 添加对话" : "🧠 添加思考"}
              </h3>
              <textarea
                value={dialogueText}
                onChange={(e) => setDialogueText(e.target.value)}
                placeholder={editingDialogue.type === "dialogue" ? "输入角色说的话..." : "输入角色的想法..."}
                className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-purple-500 mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={saveDialogue}
                  disabled={!dialogueText.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  保存
                </Button>
                <Button
                  onClick={() => {
                    setEditingDialogue(null)
                    setDialogueText("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
