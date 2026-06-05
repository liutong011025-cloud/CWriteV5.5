"use client"

import { useState } from "react"
import Link from "next/link"
import type { StoryState } from "@/app/page"
import CharacterCreationNoAi from "@/components/stages/character-creation-no-ai"
import StoryCollab from "@/components/stages/story-collab"
import { Button } from "@/components/ui/button"

type TestStage = "setup" | "character" | "writing" | "done"

const LEVEL_OPTIONS = [1, 2, 3, 4, 5] as const

export default function StoryTestPage() {
  const [stage, setStage] = useState<TestStage>("setup")
  const [level, setLevel] = useState<number>(3)
  const [storyState, setStoryState] = useState<StoryState>({
    character: null,
    plot: null,
    structure: null,
    story: "",
  })
  const [finishedStory, setFinishedStory] = useState("")

  const resetAll = () => {
    setStage("setup")
    setStoryState({ character: null, plot: null, structure: null, story: "" })
    setFinishedStory("")
  }

  if (stage === "setup") {
    return (
      <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg, #87ceeb 0%, #e8f4e8 100%)" }}>
        <div className="max-w-lg mx-auto pixel-panel p-8 mt-12">
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#3d5a1f" }}>
            Story 提示词测试
          </h1>
          <p className="text-sm mb-6" style={{ color: "#5a4a2a" }}>
            此页面用于验证 <code className="text-xs">lib/story-test-prompts.ts</code> 中的提示词。
            写作过程不会写入数据库。
          </p>

          <label className="block text-sm font-bold mb-2" style={{ color: "#5a4a2a" }}>
            测试等级 (Level 1–5)
          </label>
          <div className="flex gap-2 mb-8">
            {LEVEL_OPTIONS.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className="flex-1 py-2 font-bold text-sm transition-all"
                style={{
                  background: level === lv ? "#7ec850" : "#f5e6c8",
                  border: `3px solid ${level === lv ? "#5a9a32" : "#8b6914"}`,
                  color: level === lv ? "#fff" : "#5a4a2a",
                }}
              >
                L{lv}
              </button>
            ))}
          </div>

          <Button
            className="w-full mb-3"
            onClick={() => setStage("character")}
          >
            开始测试 →
          </Button>
          <Link href="/" className="block text-center text-sm underline" style={{ color: "#6b5210" }}>
            返回主页
          </Link>
        </div>
      </div>
    )
  }

  if (stage === "character") {
    return (
      <CharacterCreationNoAi
        language="en"
        onCharacterCreate={(character) => {
          setStoryState({ character, plot: null, structure: null, story: "" })
          setStage("writing")
        }}
        onBack={() => setStage("setup")}
      />
    )
  }

  if (stage === "writing" && storyState.character) {
    return (
      <StoryCollab
        language="en"
        storyState={storyState}
        writingLevel={level}
        mode="ai"
        apiEndpoint="/api/story-collab-test"
        promptTestMode
        onPlotCreate={(plot) => {
          setStoryState((prev) => ({ ...prev, plot, structure: null, story: prev.story }))
        }}
        onStructureSelect={(structure) => {
          setStoryState((prev) => ({ ...prev, structure, story: prev.story }))
        }}
        onStoryWrite={(story) => {
          setFinishedStory(story)
          setStoryState((prev) => ({ ...prev, story }))
          setStage("done")
        }}
        onBack={() => setStage("character")}
        onDraftChange={(draft) => {
          setStoryState((prev) => ({ ...prev, story: draft }))
        }}
      />
    )
  }

  if (stage === "done") {
    return (
      <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg, #87ceeb 0%, #e8f4e8 100%)" }}>
        <div className="max-w-2xl mx-auto pixel-panel p-8 mt-12">
          <h1 className="text-2xl font-extrabold mb-4" style={{ color: "#3d5a1f" }}>
            测试完成
          </h1>
          <p className="text-sm mb-4" style={{ color: "#5a4a2a" }}>
            以下故事仅保存在浏览器内存中，未写入数据库。
          </p>
          <pre
            className="whitespace-pre-wrap text-sm p-4 mb-6 max-h-96 overflow-y-auto"
            style={{ background: "#f5e6c8", border: "3px solid #8b6914" }}
          >
            {finishedStory || storyState.story || "(empty)"}
          </pre>
          <div className="flex gap-3">
            <Button onClick={resetAll}>重新测试</Button>
            <Link href="/">
              <Button variant="outline">返回主页</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
