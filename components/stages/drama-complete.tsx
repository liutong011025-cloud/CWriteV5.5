"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"

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

interface DramaCompleteProps {
  background: { prompt?: string; imageUrl?: string }
  scenes: Scene[]
  characters: Character[]
  onReset?: () => void
  onBack?: () => void
  userId?: string
  workId?: string
}

// Dify API配置在API路由中处理

export default function DramaComplete({
  background,
  scenes,
  characters,
  onReset,
  onBack,
  userId,
  workId,
}: DramaCompleteProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [dramaSummary, setDramaSummary] = useState("")
  const [suggestions, setSuggestions] = useState("")
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    generateDramaSummary()
  }, [])

  const generateDramaSummary = async () => {
    setIsGenerating(true)
    try {
      // 构建总结内容
      let summaryContent = "背景介绍：\n"
      summaryContent += background.prompt || "未设置背景\n"
      if (background.imageUrl) {
        summaryContent += `背景图片提示词：${background.prompt}\n\n`
      }

      summaryContent += "角色信息：\n"
      characters.forEach((char) => {
        summaryContent += `- ${char.name}`
        if (char.species) summaryContent += `（${char.species}）`
        if (char.appearance) summaryContent += `：${char.appearance}`
        if (char.prompt) summaryContent += `\n  角色提示词：${char.prompt}`
        summaryContent += "\n"
      })

      summaryContent += "\n场景内容：\n"
      scenes.forEach((scene, index) => {
        summaryContent += `场景 ${index + 1}：\n`
        if (scene.sceneInfo) {
          summaryContent += `场景信息：${scene.sceneInfo}\n`
        }
        scene.characters.forEach((sceneChar) => {
          const character = characters.find(c => c.id === sceneChar.characterId)
          if (character) {
            summaryContent += `- ${character.name}：\n`
            sceneChar.dialogues.forEach((dialogue) => {
              if (dialogue.type === "dialogue") {
                summaryContent += `  说："${dialogue.text}"\n`
              } else {
                summaryContent += `  想："${dialogue.text}"\n`
              }
            })
          }
        })
        summaryContent += "\n"
      })

      const prompt = `请总结以下drama内容，用小学生口吻，不要添加任何新内容，只总结已知信息。内容如下：\n\n${summaryContent}\n\n请用简单易懂的语言，以小学生口吻总结这个drama故事。`

      const response = await fetch("/api/dify-drama-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: summaryContent,
          userId: userId || "default-user",
        }),
      })

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      setDramaSummary(data.summary || summaryContent)
      
      // 生成修改建议
      const suggestionPrompt = `请用适合小学生的语气，为以下drama内容提出修改建议，包含一些emoji。内容：\n\n${summaryContent}\n\n请给出友好、鼓励性的建议，用小学生能理解的语言。`

      const suggestionResponse = await fetch("/api/dify-drama-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: suggestionPrompt,
          userId: userId || "default-user",
          isSuggestion: true,
        }),
      })

      const suggestionData = await suggestionResponse.json()
      if (!suggestionData.error) {
        setSuggestions(suggestionData.summary || "")
      }
    } catch (error) {
      console.error("Error generating summary:", error)
      toast.error("生成总结失败，请重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const renderScenePage = (scene: Scene, index: number) => {
    return (
      <div
        key={scene.id}
        className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden relative"
        style={{
          backgroundImage: scene.backgroundImageUrl || background.imageUrl
            ? `url(${scene.backgroundImageUrl || background.imageUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* 场景背景遮罩 */}
        {!scene.backgroundImageUrl && !background.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100"></div>
        )}
        
        <div className="absolute inset-0 p-8">
          {/* 场景标题 */}
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg bg-black/30 px-4 py-2 rounded-lg inline-block">
              场景 {index + 1}
            </h3>
          </div>

          {/* 角色和对话 */}
          <div className="relative w-full h-full">
            {scene.characters.map((sceneChar) => {
              const character = characters.find(c => c.id === sceneChar.characterId)
              if (!character) return null

              return (
                <div
                  key={sceneChar.characterId}
                  className="absolute"
                  style={{
                    left: `${sceneChar.position.x}%`,
                    top: `${sceneChar.position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {character.imageUrl && (
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-32 h-32 object-contain drop-shadow-lg"
                    />
                  )}
                  
                  {/* 对话和思考气泡 */}
                  {sceneChar.dialogues.map((dialogue, idx) => (
                    <div
                      key={idx}
                      className={`absolute text-sm p-3 rounded-lg max-w-48 shadow-lg ${
                        dialogue.type === "dialogue"
                          ? "bg-blue-100 border-2 border-blue-400"
                          : "bg-purple-100 border-2 border-purple-400"
                      }`}
                      style={{
                        left: `${dialogue.position.x}%`,
                        top: `${dialogue.position.y}%`,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <div className="font-semibold text-xs mb-1">
                        {dialogue.type === "dialogue" ? "💬" : "🧠"} {character.name}
                      </div>
                      <div>{dialogue.text}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* 场景信息 */}
          {scene.sceneInfo && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 border-2 border-gray-300">
              <p className="text-sm text-gray-700">{scene.sceneInfo}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalPages = scenes.length + 2 // 场景页面 + 总结页面 + 建议页面

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-6 bg-white/80 backdrop-blur-lg"
          >
            <ArrowLeft size={16} className="mr-2" />
            返回
          </Button>
        )}

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 animate-scale-in" />
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎉 你的Drama完成了！ 🎉
            </h1>
            <Sparkles className="w-16 h-16 text-purple-600 animate-pulse" />
          </div>
        </div>

        {/* 翻页书容器 */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 border-4 border-indigo-300 shadow-2xl mb-8">
          <div className="relative" style={{ height: "600px" }}>
            {/* 场景页面 */}
            {currentPage < scenes.length && renderScenePage(scenes[currentPage], currentPage)}

            {/* 总结页面 */}
            {currentPage === scenes.length && (
              <div className="w-full h-full bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-lg p-8 border-4 border-indigo-200 shadow-xl overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">
                  ✨ 完整Drama ✨
                </h2>
                {isGenerating ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在生成总结...</p>
                  </div>
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <div className="bg-white/80 rounded-xl p-6 border-2 border-indigo-200 shadow-lg whitespace-pre-wrap">
                      {dramaSummary || "暂无总结"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 建议页面 */}
            {currentPage === scenes.length + 1 && (
              <div className="w-full h-full bg-gradient-to-br from-white via-pink-50 to-yellow-50 rounded-lg p-8 border-4 border-pink-200 shadow-xl overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6 text-center text-pink-700">
                  💡 修改建议 💡
                </h2>
                {isGenerating ? (
                  <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在生成建议...</p>
                  </div>
                ) : (
                  <div className="prose prose-lg max-w-none">
                    <div className="bg-white/80 rounded-xl p-6 border-2 border-pink-200 shadow-lg whitespace-pre-wrap">
                      {suggestions || "暂无建议"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 翻页控制 */}
          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              variant="outline"
              className="bg-white/80"
            >
              <ArrowLeft size={16} className="mr-2" />
              上一页
            </Button>
            <div className="text-gray-600 font-semibold">
              {currentPage + 1} / {totalPages}
            </div>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              variant="outline"
              className="bg-white/80"
            >
              下一页
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          {onReset && (
            <Button
              onClick={onReset}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg"
            >
              重新开始
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
