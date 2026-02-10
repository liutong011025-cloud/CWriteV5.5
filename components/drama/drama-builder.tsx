"use client";

import { useDramaStore } from "@/lib/drama-store";
import { SceneTabs } from "./scene-tabs";
import { SceneCanvas } from "./scene-canvas";
import { CharacterPanel } from "./character-panel";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Pencil,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

interface DramaBuilderProps {
  onGenerateDrama: () => void;
}

export function DramaBuilder({ onGenerateDrama }: DramaBuilderProps) {
  const title = useDramaStore((s) => s.title);
  const setTitle = useDramaStore((s) => s.setTitle);
  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const isGeneratingBook = useDramaStore((s) => s.isGeneratingBook);
  const reset = useDramaStore((s) => s.reset);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasContent =
    scenes.some(
      (s) =>
        s.backgroundPrompt ||
        s.characters.length > 0 ||
        s.notes
    ) || characters.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-purple-300 bg-gradient-to-r from-white via-purple-50 to-pink-50/95 backdrop-blur-sm shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-hand text-xs uppercase tracking-wide bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                🎭 Drama Builder
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent font-hand text-lg font-bold leading-tight bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent placeholder:text-purple-400 focus:outline-none"
                placeholder="Name your drama..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 rounded-lg border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1.5 shadow-md">
                <span className="font-hand text-xs text-red-700 font-bold">
                  Start over?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    reset();
                    setShowResetConfirm(false);
                  }}
                  className="h-7 rounded-md font-hand text-xs bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  className="h-7 rounded-md font-hand text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  No
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="rounded-lg font-hand border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 shadow-md"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Scene tabs */}
      <div className="border-b-2 border-purple-200 bg-gradient-to-r from-indigo-100/80 via-purple-100/80 to-pink-100/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <SceneTabs />
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 lg:flex-row">
        {/* Canvas area */}
        <div className="flex-1">
          <SceneCanvas />
        </div>

        {/* Right sidebar - character panel */}
        <div className="w-full lg:w-72">
          <CharacterPanel />
        </div>
      </main>

      {/* Generate button - floating bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onGenerateDrama}
          disabled={!hasContent || isGeneratingBook}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 animate-pulse-glow rounded-xl px-6 py-6 font-hand text-lg shadow-2xl transition-transform hover:scale-110 disabled:animate-none border-2 border-white/30"
        >
          {isGeneratingBook ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              Creating your drama...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-5 w-5" />
              Make My Drama!
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
