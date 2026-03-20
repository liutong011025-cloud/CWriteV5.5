"use client";

import { useRef, useState } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { PlacedCharacterComponent } from "./placed-character";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Sparkles, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlowCard } from "@/components/ui/glow-card";

export function SceneCanvas() {
  const scenes = useDramaStore((s) => s.scenes);
  const activeSceneIndex = useDramaStore((s) => s.activeSceneIndex);
  const characters = useDramaStore((s) => s.characters);
  const updateSceneBgPrompt = useDramaStore((s) => s.updateSceneBgPrompt);
  const setSceneBgImage = useDramaStore((s) => s.setSceneBgImage);
  const setSceneBgGenerating = useDramaStore((s) => s.setSceneBgGenerating);
  const updateSceneNotes = useDramaStore((s) => s.updateSceneNotes);

  const containerRef = useRef<HTMLDivElement>(null);
  const [bgInputValue, setBgInputValue] = useState("");

  const scene = scenes[activeSceneIndex];
  if (!scene) return null;

  const handleGenerateBg = async () => {
    const prompt = bgInputValue || scene.backgroundPrompt;
    if (!prompt.trim()) return;

    updateSceneBgPrompt(scene.id, prompt);
    setSceneBgGenerating(scene.id, true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          type: "background",
          aspect_ratio: "16:9",
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setSceneBgImage(scene.id, data.imageUrl);
      } else {
        setSceneBgGenerating(scene.id, false);
      }
    } catch {
      setSceneBgGenerating(scene.id, false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <GlowCard
        className="rounded-2xl"
        innerClassName="rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-sky-50/70"
        borderSize={0.012}
        circleSize={0.18}
        circleEdge={0.4}
      >
        <div className="flex items-center gap-2 p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={bgInputValue || scene.backgroundPrompt}
            onChange={(e) => {
              setBgInputValue(e.target.value);
              updateSceneBgPrompt(scene.id, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerateBg();
            }}
            placeholder="Describe the scene... (e.g. A forest at night with fireflies)"
            className="flex-1 bg-transparent font-hand text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button
            onClick={handleGenerateBg}
            disabled={scene.isGeneratingBg || !scene.backgroundPrompt.trim()}
            size="sm"
            className="shrink-0 rounded-lg font-hand shadow-md transition-transform hover:scale-105"
          >
            {scene.isGeneratingBg ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            Create!
          </Button>
        </div>
      </GlowCard>

      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            "relative rounded-2xl border-2 shadow-xl transition-all",
            "min-h-[420px] md:min-h-[520px]",
            scene.backgroundImageUrl
              ? "border-slate-200"
              : "border-dashed border-slate-300 bg-gradient-to-br from-amber-50/60 via-fuchsia-50/45 to-emerald-50/60"
          )}
          style={
            scene.backgroundImageUrl
              ? {
                  backgroundImage: `url(${scene.backgroundImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!scene.backgroundImageUrl && !scene.isGeneratingBg && (
            <>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.06]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgb(148 163 184) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50/90 via-sky-50/80 to-fuchsia-50/80 text-primary shadow-sm animate-float">
                  <ImageIcon className="h-10 w-10" />
                </div>
                <p className="font-hand text-lg text-muted-foreground">
                  Describe your scene above and click Create!
                </p>
                <p className="font-hand text-xs text-muted-foreground/60">
                  Then add characters from the panel on the right
                </p>
              </div>
            </>
          )}

          {scene.isGeneratingBg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card/90 backdrop-blur-sm">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary" />
              </div>
              <p className="font-hand text-lg text-foreground">
                Painting your scene...
              </p>
            </div>
          )}

          {scene.characters.map((pc) => {
            const char = characters.find((c) => c.id === pc.characterId);
            if (!char) return null;
            return (
              <PlacedCharacterComponent
                key={pc.characterId}
                placed={pc}
                character={char}
                sceneId={scene.id}
                containerRef={containerRef}
              />
            );
          })}
        </div>
      </div>

      <GlowCard
        className="rounded-2xl"
        innerClassName="rounded-2xl bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/60"
        borderSize={0.012}
        circleSize={0.18}
        circleEdge={0.4}
      >
        <div className="flex items-start gap-2 p-2">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary-foreground">
            <StickyNote className="h-4 w-4" />
          </div>
          <textarea
            value={scene.notes}
            onChange={(e) => updateSceneNotes(scene.id, e.target.value)}
            placeholder="Director's notes: What else is happening in this scene?"
            rows={2}
            className="flex-1 resize-none bg-transparent font-hand text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </GlowCard>
    </div>
  );
}
