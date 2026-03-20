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
  const scenes = useDramaStore((s) => s.scenes);
  const activeSceneIndex = useDramaStore((s) => s.activeSceneIndex);
  const activeScene = scenes[activeSceneIndex];
  const isGeneratingBook = useDramaStore((s) => s.isGeneratingBook);
  const reset = useDramaStore((s) => s.reset);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const backgroundOk =
    !!activeScene &&
    (!!activeScene.backgroundImageUrl || !!activeScene.backgroundPrompt.trim());
  const charactersOk = !!activeScene && activeScene.characters.length > 0;
  const directorNotesOk = !!activeScene && !!activeScene.notes.trim();
  const canGenerateDrama = backgroundOk && charactersOk && directorNotesOk;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 10% 10%, rgba(244,63,94,0.20) 0, transparent 35%)",
            "radial-gradient(circle at 90% 15%, rgba(59,130,246,0.22) 0, transparent 38%)",
            "radial-gradient(circle at 20% 85%, rgba(16,185,129,0.14) 0, transparent 45%)",
            "radial-gradient(circle at 85% 80%, rgba(245,158,11,0.16) 0, transparent 42%)",
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 22px)",
          ].join(","),
          backgroundBlendMode: "normal",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 bg-gradient-to-b from-amber-50/80 via-white to-transparent" />

      {onBack && <BackButton onClick={onBack} variant="indigo" aria-label={backLabel ?? "Back"} />}

      <div className="relative z-10 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-sky-50/60 to-emerald-50/60">
        <div className="mx-auto max-w-7xl px-4 md:px-0">
          <div className="relative py-3 md:py-4">
            <SceneTabs onTriggerReset={() => setShowResetConfirm(true)} />

            {showResetConfirm && (
              <div className="absolute right-0 top-[-8px] z-50 flex items-center gap-2 rounded-xl border-2 border-destructive/30 bg-card px-3 py-1.5 shadow-lg animate-fade-in-up">
                <span className="font-hand text-xs text-foreground">Start over?</span>
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
            )}
          </div>
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <SceneCanvas />
        </div>
        <div className="w-full shrink-0 lg:w-72 xl:w-80">
          <div className="flex flex-col gap-4">
            <CharacterPanel />
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/75 via-fuchsia-50/45 to-sky-50/75 p-3 shadow-sm backdrop-blur-sm">
              <div className="relative">
                {canGenerateDrama && !isGeneratingBook && (
                  <div className="absolute -inset-1 animate-pulse-glow rounded-2xl bg-primary/20 blur-md" />
                )}
                <Button
                  onClick={onGenerateDrama}
                  disabled={!canGenerateDrama || isGeneratingBook}
                  size="lg"
                  className="relative w-full gap-2.5 rounded-2xl px-6 py-5 font-hand text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
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
              <p className="mt-2 text-center font-hand text-[10px] text-muted-foreground">
                Add background, characters, and director notes to enable.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
