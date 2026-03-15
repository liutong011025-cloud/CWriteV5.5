"use client";

import { useDramaStore } from "@/lib/drama-store";
import { SceneTabs } from "./scene-tabs";
import { SceneCanvas } from "./scene-canvas";
import { CharacterPanel } from "./character-panel";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Sparkles,
  RotateCcw,
  Clapperboard,
  Theater,
  Users,
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />

      {onBack && <BackButton onClick={onBack} variant="indigo" aria-label={backLabel ?? "Back"} />}
      <header className="glass sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 pl-28 lg:pl-32">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Clapperboard className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 h-3 w-3 animate-bounce rounded-full bg-secondary shadow-sm" />
            </div>
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
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                <Theater className="h-3.5 w-3.5 text-primary" />
                <span className="font-hand text-xs font-bold text-primary">
                  {scenes.length}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1">
                <Users className="h-3.5 w-3.5 text-secondary-foreground" />
                <span className="font-hand text-xs font-bold text-secondary-foreground">
                  {characters.length}
                </span>
              </div>
            </div>

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
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="rounded-xl font-hand text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-30 border-b border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <SceneTabs />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 md:p-6 lg:flex-row">
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
