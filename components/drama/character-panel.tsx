"use client";

import { useState } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User,
  Loader2,
  Sparkles,
  UserPlus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CharacterPanel() {
  const scenes = useDramaStore((s) => s.scenes);
  const activeSceneIndex = useDramaStore((s) => s.activeSceneIndex);
  const characters = useDramaStore((s) => s.characters);
  const addCharacter = useDramaStore((s) => s.addCharacter);
  const updateCharacter = useDramaStore((s) => s.updateCharacter);
  const removeCharacter = useDramaStore((s) => s.removeCharacter);
  const addCharacterToScene = useDramaStore((s) => s.addCharacterToScene);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const scene = scenes[activeSceneIndex];
  if (!scene) return null;

  const sceneCharIds = scene.characters.map((c) => c.characterId);
  const availableChars = characters.filter(
    (c) => !sceneCharIds.includes(c.id)
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    const char = addCharacter(newName.trim());
    addCharacterToScene(scene.id, char.id);
    setNewName("");
    setIsCreating(false);
    setEditingId(char.id);
  };

  const handleGenerateCharImage = async (charId: string) => {
    const char = characters.find((c) => c.id === charId);
    if (!char) return;

    const prompt = `${char.species || "human"} character, ${char.appearance || char.name}, character portrait only, no background, transparent background, isolated character, white background, clean cutout, no people in background, character only, PNG with transparency`;
    updateCharacter(charId, { isGenerating: true });

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          aspect_ratio: "1:1",
          user_id: "drama-user",
          stage: "dramaCharacter"
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        updateCharacter(charId, { imageUrl: data.imageUrl, isGenerating: false });
      } else {
        updateCharacter(charId, { isGenerating: false });
      }
    } catch {
      updateCharacter(charId, { isGenerating: false });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-white via-purple-50 to-pink-50 p-5 shadow-lg">
      <h3 className="font-hand text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        👤 Characters
      </h3>

      {/* Characters in current scene */}
      <div className="flex flex-col gap-2">
        {scene.characters.map((pc) => {
          const char = characters.find((c) => c.id === pc.characterId);
          if (!char) return null;
          const isEditing = editingId === char.id;

          return (
            <div
              key={char.id}
              className="rounded-lg border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 p-2 transition-all hover:border-purple-400 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                {char.isGenerating ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : char.imageUrl ? (
                  <img
                    src={char.imageUrl || "/placeholder.svg"}
                    alt={char.name}
                    crossOrigin="anonymous"
                    className="h-10 w-10 rounded-lg border-2 border-purple-300 object-contain bg-transparent"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-purple-300 bg-gradient-to-br from-indigo-100 to-purple-100 text-purple-600">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <button
                  type="button"
                  className="flex-1 text-left font-hand text-sm font-bold text-purple-900 hover:text-purple-700"
                  onClick={() => setEditingId(isEditing ? null : char.id)}
                >
                  {char.name}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharacter(char.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${char.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="mt-2 flex flex-col gap-2 border-t-2 border-purple-200 pt-2">
                  <select
                    value={char.species}
                    onChange={(e) =>
                      updateCharacter(char.id, { species: e.target.value })
                    }
                    className="rounded-md border-2 border-purple-300 bg-white px-2 py-1.5 font-hand text-xs text-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="">What kind?</option>
                    <option value="human">Human</option>
                    <option value="animal">Animal</option>
                    <option value="robot">Robot</option>
                    <option value="fairy">Fairy</option>
                    <option value="monster">Friendly Monster</option>
                    <option value="dragon">Dragon</option>
                    <option value="alien">Alien</option>
                  </select>
                  <input
                    type="text"
                    value={char.appearance}
                    onChange={(e) =>
                      updateCharacter(char.id, { appearance: e.target.value })
                    }
                    placeholder="How do they look? (hair, clothes, colors...)"
                    className="rounded-md border-2 border-purple-300 bg-white px-2 py-1.5 font-hand text-xs text-foreground placeholder:text-purple-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleGenerateCharImage(char.id)}
                    disabled={char.isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-md font-hand text-xs shadow-md"
                  >
                    {char.isGenerating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    Generate Look!
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add existing character to scene */}
      {availableChars.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="font-hand text-xs text-muted-foreground">
            Add existing character:
          </p>
          <div className="flex flex-wrap gap-1">
            {availableChars.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => addCharacterToScene(scene.id, char.id)}
                className="flex items-center gap-1 rounded-md border-2 border-purple-300 bg-gradient-to-r from-white to-purple-50 px-2 py-1 font-hand text-xs text-purple-700 transition-all hover:scale-105 hover:border-purple-500 hover:bg-purple-100 hover:shadow-md"
              >
                <UserPlus className="h-3 w-3 text-primary" />
                {char.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create new character */}
      {isCreating ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Character name..."
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            className="flex-1 rounded-md border-2 border-purple-300 bg-white px-2 py-1.5 font-hand text-sm text-foreground placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <Button size="sm" onClick={handleCreate} className="rounded-md font-hand bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md">
            Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsCreating(false);
              setNewName("");
            }}
            className="rounded-md font-hand border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            Cancel
          </Button>
        </div>
      ) : (
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className={cn(
              "rounded-lg border-2 border-dashed border-purple-400 font-hand text-purple-700 transition-transform hover:scale-105 hover:border-purple-600",
              "bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 shadow-md"
            )}
          >
          <Plus className="mr-1 h-4 w-4" />
          New Character
        </Button>
      )}
    </div>
  );
}
