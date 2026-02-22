"use client";

import { useState, useRef, useEffect } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import { Plus, X, Film, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SceneTabs() {
  const scenes = useDramaStore((s) => s.scenes);
  const activeSceneIndex = useDramaStore((s) => s.activeSceneIndex);
  const setActiveScene = useDramaStore((s) => s.setActiveScene);
  const addScene = useDramaStore((s) => s.addScene);
  const removeScene = useDramaStore((s) => s.removeScene);
  const setSceneBgImage = useDramaStore((s) => s.setSceneBgImage);
  const updateSceneBgPrompt = useDramaStore((s) => s.updateSceneBgPrompt);

  const [showBgPicker, setShowBgPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const existingBgs = scenes
    .filter((s) => s.backgroundImageUrl)
    .map((s) => ({
      url: s.backgroundImageUrl!,
      prompt: s.backgroundPrompt,
      sceneIndex: scenes.indexOf(s),
    }));

  const uniqueBgs = existingBgs.filter(
    (bg, i, arr) => arr.findIndex((b) => b.url === bg.url) === i,
  );

  useEffect(() => {
    if (!showBgPicker) return;
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setShowBgPicker(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showBgPicker]);

  const handleAddBlankScene = () => {
    addScene();
    setShowBgPicker(false);
  };

  const handleAddWithBg = (url: string, prompt: string) => {
    addScene();
    const newSceneId = useDramaStore.getState().scenes.at(-1)?.id;
    if (newSceneId) {
      setSceneBgImage(newSceneId, url);
      updateSceneBgPrompt(newSceneId, prompt);
    }
    setShowBgPicker(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
      {/* Scene tab buttons */}
      {scenes.map((scene, index) => {
        const isActive = activeSceneIndex === index;
        const hasContent =
          scene.backgroundPrompt ||
          scene.characters.length > 0 ||
          scene.notes;
        return (
          <button
            key={scene.id}
            type="button"
            onClick={() => setActiveScene(index)}
            className={cn(
              "group relative flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-hand text-sm transition-all",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-transparent bg-muted/60 text-muted-foreground hover:border-primary/30 hover:bg-muted hover:text-foreground hover:shadow-sm",
            )}
          >
            {scene.backgroundImageUrl ? (
              <div
                className={cn(
                  "h-5 w-8 shrink-0 rounded border",
                  isActive
                    ? "border-primary-foreground/30"
                    : "border-border",
                )}
                style={{
                  backgroundImage: `url(${scene.backgroundImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <Film
                className={cn(
                  "h-3.5 w-3.5",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground/60",
                )}
              />
            )}
            <span className="font-bold">Scene {index + 1}</span>

            {hasContent && !isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            )}

            {scenes.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeScene(scene.id);
                }}
                className={cn(
                  "ml-0.5 rounded-full p-0.5 opacity-0 transition-all group-hover:opacity-100",
                  isActive
                    ? "text-primary-foreground hover:bg-primary-foreground/20"
                    : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                )}
                aria-label={`Remove scene ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        );
      })}

      {/* Add Scene button + dropdown background picker */}
      <div className="relative" ref={pickerRef}>
        <Button
          onClick={() => {
            if (uniqueBgs.length > 0) {
              setShowBgPicker((prev) => !prev);
            } else {
              handleAddBlankScene();
            }
          }}
          variant="ghost"
          size="sm"
          className="shrink-0 rounded-xl border-2 border-dashed border-primary/30 font-hand text-primary hover:border-primary hover:bg-primary/10"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Scene
          {uniqueBgs.length > 0 && (
            <ChevronRight
              className={cn(
                "ml-1 h-3 w-3 transition-transform",
                showBgPicker && "rotate-90",
              )}
            />
          )}
        </Button>

        {/* Dropdown picker -- opens below the Add Scene button */}
        {showBgPicker && (
          <div className="absolute top-full left-0 z-50 mt-1.5 min-w-[220px] rounded-2xl border-2 border-border bg-card p-2 shadow-xl animate-fade-in-up">
            <p className="mb-1.5 px-2 font-hand text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Choose background
            </p>

            <button
              type="button"
              onClick={handleAddBlankScene}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-hand text-sm text-foreground transition-colors hover:bg-primary/10"
            >
              <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span>Blank scene</span>
            </button>

            {uniqueBgs.map((bg) => (
              <button
                key={bg.url}
                type="button"
                onClick={() => handleAddWithBg(bg.url, bg.prompt)}
                title={bg.prompt || `Scene ${bg.sceneIndex + 1} background`}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-hand text-sm text-foreground transition-colors hover:bg-primary/10"
              >
                <div
                  className="h-8 w-12 shrink-0 rounded-lg border border-border/60"
                  style={{
                    backgroundImage: `url(${bg.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <span className="truncate text-left">
                  {bg.prompt
                    ? bg.prompt.length > 22
                      ? bg.prompt.slice(0, 22) + "..."
                      : bg.prompt
                    : `Scene ${bg.sceneIndex + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
