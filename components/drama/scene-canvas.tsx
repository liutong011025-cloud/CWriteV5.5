"use client";

import { useRef, useState } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { PlacedCharacterComponent } from "./placed-character";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    const basePrompt = bgInputValue || scene.backgroundPrompt;
    if (!basePrompt.trim()) return;

    // 确保背景图片不包含人物或角色
    const prompt = `${basePrompt}, background only, no people, no characters, no persons, landscape or setting only, empty scene background`;
    
    updateSceneBgPrompt(scene.id, basePrompt);
    setSceneBgGenerating(scene.id, true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          aspect_ratio: "16:9",
          user_id: "drama-user",
          stage: "dramaBackground"
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
    <div className="flex flex-col gap-6">
      {/* Background prompt - 增大尺寸 */}
      <div className="flex items-center gap-3 px-2 bg-gradient-to-r from-indigo-100/50 to-purple-100/50 rounded-xl p-4 border-2 border-purple-200">
        <ImageIcon className="h-6 w-6 text-purple-600" />
        <input
          type="text"
          value={bgInputValue || scene.backgroundPrompt}
          onChange={(e) => {
            setBgInputValue(e.target.value);
            updateSceneBgPrompt(scene.id, e.target.value);
          }}
          placeholder="Describe the scene... (e.g. A forest at night)"
          className="flex-1 rounded-lg border-2 border-purple-300 bg-white px-4 py-3 font-hand text-base text-foreground shadow-sm transition-all placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <Button
          onClick={handleGenerateBg}
          disabled={scene.isGeneratingBg || !scene.backgroundPrompt.trim()}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-hand text-base font-bold transition-transform hover:scale-105 shadow-lg border-2 border-white/30 px-6 py-3"
        >
          {scene.isGeneratingBg ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          Create!
        </Button>
      </div>

      {/* Scene canvas area - 增大尺寸 */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-xl border-4 border-purple-300 shadow-2xl transition-all",
          "min-h-[500px] md:min-h-[600px] lg:min-h-[700px]",
          scene.backgroundImageUrl
            ? ""
            : "bg-gradient-to-br from-indigo-100 via-purple-100 via-pink-100 to-orange-100"
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
        {/* Empty state */}
        {!scene.backgroundImageUrl && !scene.isGeneratingBg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-purple-600">
            <div className="relative">
              <ImageIcon className="h-20 w-20 animate-float opacity-60" />
              <div className="absolute inset-0 bg-purple-200 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            </div>
            <p className="font-hand text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Describe your scene above and click Create! ✨
            </p>
          </div>
        )}

        {/* Loading state */}
        {scene.isGeneratingBg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-orange-100/90 backdrop-blur-sm">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
              <div className="absolute inset-0 bg-purple-300 rounded-full blur-xl opacity-40 animate-pulse"></div>
            </div>
            <p className="font-hand text-xl font-bold text-purple-700">
              🎨 Painting your scene...
            </p>
          </div>
        )}

        {/* Characters on canvas */}
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

      {/* Scene notes - 增大尺寸 */}
      <div className="px-1">
        <textarea
          value={scene.notes}
          onChange={(e) => updateSceneNotes(scene.id, e.target.value)}
          placeholder="What else is happening in this scene? Add your notes here..."
          rows={3}
          className="w-full resize-none rounded-lg border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50 px-4 py-3 font-hand text-base text-foreground shadow-sm transition-all placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </div>
    </div>
  );
}
