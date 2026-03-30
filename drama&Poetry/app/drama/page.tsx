"use client";

import { useState } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { DramaBuilder } from "@/components/drama/drama-builder";
import { DramaBook } from "@/components/drama/drama-book";

type AppView = "builder" | "book";

export default function DramaPage() {
  const [view, setView] = useState<AppView>("builder");

  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const title = useDramaStore((s) => s.title);
  const setDramaBook = useDramaStore((s) => s.setDramaBook);
  const setGeneratingBook = useDramaStore((s) => s.setGeneratingBook);

  const handleGenerateDrama = async () => {
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
            characters: s.characters,
          })),
          characters: characters.map((c) => ({
            id: c.id,
            name: c.name,
            species: c.species,
            appearance: c.appearance,
          })),
          title,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setDramaBook({
          summary: `"${title}" is a wonderful drama with ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}! Great work!`,
          script: generateLocalScript(),
          suggestions: [
            "Try adding more dialogue between your characters!",
            "What feelings do your characters have? Add some emotion words!",
            "Can you describe what happens at the end?",
          ],
        });
      } else {
        setDramaBook(data);
      }

      setView("book");
    } catch {
      setDramaBook({
        summary: `"${title}" is a creative drama with ${scenes.length} scene${scenes.length > 1 ? "s" : ""} and ${characters.length} character${characters.length > 1 ? "s" : ""}!`,
        script: generateLocalScript(),
        suggestions: [
          "Try adding more dialogue between your characters!",
          "What feelings do your characters have?",
          "Can one character disagree with another?",
        ],
      });
      setView("book");
    }
  };

  const generateLocalScript = () => {
    let script = `${title}\nA Drama by a Creative Young Writer\n\n`;
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      script += `--- ACT ${i + 1} ---\n`;
      script += `[Setting: ${scene.backgroundPrompt || "A mysterious place"}]\n`;
      if (scene.notes) script += `[${scene.notes}]\n`;
      script += "\n";
      for (const pc of scene.characters) {
        const char = characters.find((c) => c.id === pc.characterId);
        if (char) {
          if (pc.dialogue) script += `${char.name}: "${pc.dialogue}"\n`;
          if (pc.thought)
            script += `[${char.name} thinks: "${pc.thought}"]\n`;
        }
      }
      script += "\n";
    }
    return script;
  };

  if (view === "book") {
    return <DramaBook onBack={() => setView("builder")} />;
  }

  return <DramaBuilder onGenerateDrama={handleGenerateDrama} />;
}
