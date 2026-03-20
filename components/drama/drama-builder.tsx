"use client";

import { useDramaStore } from "@/lib/drama-store";
import { SceneTabs } from "./scene-tabs";
import { SceneCanvas } from "./scene-canvas";
import { CharacterPanel } from "./character-panel";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  BookOpen,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";

interface DramaBuilderProps {
  onBack?: () => void;
  backLabel?: string;
  onGenerateDrama: () => void;
}

export function DramaBuilder({ onBack, backLabel, onGenerateDrama }: DramaBuilderProps) {
  const title = useDramaStore((s) => s.title);
  const setTitle = useDramaStore((s) => s.setTitle);
  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const isGeneratingBook = useDramaStore((s) => s.isGeneratingBook);
  const reset = useDramaStore((s) => s.reset);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasContent =
    scenes.some(
      (s) => s.backgroundPrompt || s.characters.length > 0 || s.notes,
    ) || characters.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 bg-gradient-to-b from-slate-100/80 via-white to-transparent" />

      {onBack && <BackButton onClick={onBack} variant="indigo" aria-label={backLabel ?? "Back"} />}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 pl-28 lg:pl-32">
          <div className="flex flex-col">
              <span className="font-hand text-[10px] uppercase tracking-widest text-primary/70">
                Drama Builder
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent font-hand text-xl font-bold leading-tight text-foreground focus:outline-none"
                placeholder="Name your drama..."
              />
          </div>

          <div className="flex items-center gap-2">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-destructive/30 bg-card px-3 py-1.5 shadow-lg animate-fade-in-up">
                <span className="font-hand text-xs text-foreground">
                  Start over?
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    reset();
                    setShowResetConfirm(false);
                  }}
                  className="h-7 rounded-lg font-hand text-xs"
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowResetConfirm(false)}
                  className="h-7 rounded-lg font-hand text-xs"
                >
                  No
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative z-30 border-b border-slate-100 bg-slate-50/90">
        <div className="mx-auto max-w-7xl">
          <SceneTabs onTriggerReset={() => setShowResetConfirm(true)} />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SceneCanvas />
        </div>
        <div className="w-full shrink-0 lg:w-72 xl:w-80">
          <CharacterPanel />
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0">
        <div className="relative">
          {hasContent && !isGeneratingBook && (
            <div className="absolute -inset-1 animate-pulse-glow rounded-2xl bg-primary/20 blur-md" />
          )}
          <Button
            onClick={onGenerateDrama}
            disabled={!hasContent || isGeneratingBook}
            size="lg"
            className="relative gap-2.5 rounded-2xl px-8 py-6 font-hand text-lg shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {isGeneratingBook ? (
              <>
                <Wand2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5" />
                <span>Make My Drama!</span>
                <Sparkles className="h-4 w-4 text-secondary" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
