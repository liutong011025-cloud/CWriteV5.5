"use client";

import { useEffect, useState, useCallback } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { DramaBuilder } from "@/components/drama/drama-builder";
import { DramaBook } from "@/components/drama/drama-book";
import type { Language } from "@/app/page";
import { toast } from "sonner";

interface DramaWritingProps {
  language?: Language;
  userId?: string;
  initialView?: "builder" | "book";
  onBack?: () => void;
  backLabel?: string;
  onBackToMap?: () => void;
  onDramaGenerated?: (payload: { title: string; topic: string }) => void;
}

export default function DramaWriting({
  language = "en",
  userId,
  initialView: initialViewProp,
  onBack,
  backLabel,
  onBackToMap,
  onDramaGenerated,
}: DramaWritingProps) {
  const dramaBook = useDramaStore((s) => s.dramaBook);
  const [view, setView] = useState<"builder" | "book">(() => {
    if (initialViewProp === "book" && dramaBook) return "book";
    return "builder";
  });

  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const title = useDramaStore((s) => s.title);
  const setDramaBook = useDramaStore((s) => s.setDramaBook);
  const setGeneratingBook = useDramaStore((s) => s.setGeneratingBook);

  useEffect(() => {
    if (initialViewProp === "book") {
      if (dramaBook) setView("book");
      return;
    }
    useDramaStore.getState().reset();
  }, [initialViewProp]);

  const handleGenerateDrama = useCallback(async () => {
    setGeneratingBook(true);
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "drama_generate",
          scenes: scenes.map((s) => ({
            backgroundPrompt: s.backgroundPrompt,
            notes: s.notes,
            characters: s.characters.map((pc) => ({
              characterId: pc.characterId,
              dialogue: pc.dialogue || "",
              thought: pc.thought || "",
            })),
          })),
          characters: characters.map((c) => ({
            id: c.id,
            name: c.name,
            species: c.species || "",
            appearance: c.appearance || "",
          })),
          title,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error("生成剧本失败，请重试");
        setGeneratingBook(false);
        return;
      }
      setDramaBook({
        summary: data.summary ?? "",
        script: data.script ?? "",
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      });
      onDramaGenerated?.({
        title: title || "My Drama",
        topic: scenes.map((s) => s.backgroundPrompt).filter(Boolean).join(", ") || "drama scene",
      })
      setView("book");
      // 保存到数据库，供 Luminai Library 展示
      if (userId && data.script) {
        fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            stage: "dramaBook",
            drama: data.script,
            dramaTitle: title || undefined,
            dramaSummary: data.summary ?? undefined,
          }),
        }).catch((e) => console.error("Save drama failed:", e));
      }
    } catch (err) {
      console.error("Error generating drama:", err);
      toast.error("生成剧本失败，请重试");
    } finally {
      setGeneratingBook(false);
    }
  }, [scenes, characters, title, setDramaBook, setGeneratingBook]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const content =
    view === "book" && dramaBook ? (
      <DramaBook
        onBack={() => setView("builder")}
        onBackToMap={onBackToMap}
        onSave={() => {
          // 数据在生成时已保存到 interactions，这里只做显式操作入口
          toast.success("Drama saved")
        }}
      />
    ) : (
      <DramaBuilder onBack={onBack} backLabel={backLabel} onGenerateDrama={handleGenerateDrama} />
    );

  return (
    <div
      className="relative min-h-screen"
      style={{ paddingTop: "128px", paddingBottom: "120px" }}
    >
      {content}
    </div>
  );
}
