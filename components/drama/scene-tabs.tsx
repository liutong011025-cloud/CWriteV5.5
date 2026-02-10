"use client";

import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SceneTabs() {
  const scenes = useDramaStore((s) => s.scenes);
  const activeSceneIndex = useDramaStore((s) => s.activeSceneIndex);
  const setActiveScene = useDramaStore((s) => s.setActiveScene);
  const addScene = useDramaStore((s) => s.addScene);
  const removeScene = useDramaStore((s) => s.removeScene);

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {scenes.map((scene, index) => (
        <button
          key={scene.id}
          type="button"
          onClick={() => setActiveScene(index)}
          className={cn(
            "group relative flex items-center gap-2 rounded-lg border-2 px-4 py-2 font-hand text-base transition-all hover:scale-105",
            activeSceneIndex === index
              ? "border-purple-500 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl"
              : "border-purple-200 bg-gradient-to-r from-white to-purple-50 text-purple-700 hover:border-purple-400 hover:shadow-md"
          )}
        >
          <span>Scene {index + 1}</span>
          {scenes.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeScene(scene.id);
              }}
              className={cn(
                "ml-1 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                activeSceneIndex === index
                  ? "hover:bg-primary-foreground/20"
                  : "hover:bg-muted"
              )}
              aria-label={`Remove scene ${index + 1}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
      ))}
      <Button
        onClick={addScene}
        variant="outline"
        size="sm"
        className="rounded-lg border-2 border-dashed border-purple-400 font-hand text-purple-700 hover:scale-105 hover:border-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 bg-gradient-to-r from-purple-50 to-pink-50 shadow-md"
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Scene
      </Button>
    </div>
  );
}
