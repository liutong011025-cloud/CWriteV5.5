"use client";

import { useState, useRef, useEffect } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User,
  Loader2,
  Sparkles,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Palette,
  Wand2,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SPECIES_PRESETS = [
  "Human",
  "Animal",
  "Robot",
  "Fairy",
  "Friendly Monster",
  "Dragon",
  "Alien",
  "Wizard",
  "Pirate",
  "Superhero",
  "Mermaid",
  "Elf",
  "Ghost",
  "Unicorn",
  "Cat",
  "Dog",
  "Dinosaur",
];

function SpeciesInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = SPECIES_PRESETS.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase()),
  );
  const showCustom =
    search.trim() !== "" &&
    !SPECIES_PRESETS.some((s) => s.toLowerCase() === search.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-xl border-2 bg-card px-2.5 py-1.5 transition-colors",
          open ? "border-primary" : "border-border",
        )}
      >
        <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={open ? search : value}
          onChange={(e) => {
            if (!open) setOpen(true);
            setSearch(e.target.value);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch(value);
          }}
          placeholder="Type or pick species..."
          className="w-full bg-transparent font-hand text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {value && !open && (
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 font-hand text-[10px] font-bold text-primary">
            {value}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border-2 border-border bg-card py-1 shadow-xl">
          {showCustom && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-hand text-xs text-foreground hover:bg-primary/10"
              onClick={() => {
                onChange(search.trim());
                setOpen(false);
              }}
            >
              <Plus className="h-3 w-3 text-primary" />
              <span>
                Use &quot;{search.trim()}&quot;
              </span>
            </button>
          )}
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left font-hand text-xs transition-colors hover:bg-primary/10",
                value === s
                  ? "bg-primary/5 text-primary font-bold"
                  : "text-foreground",
              )}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              {value === s ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <span className="h-3 w-3" />
              )}
              {s}
            </button>
          ))}
          {filtered.length === 0 && !showCustom && (
            <p className="px-3 py-2 font-hand text-xs text-muted-foreground">
              No matches found
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
    (c) => !sceneCharIds.includes(c.id),
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

    const prompt = `${char.species || "human"} character, ${char.appearance || char.name}`;
    updateCharacter(charId, { isGenerating: true });

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "character" }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        updateCharacter(charId, {
          imageUrl: data.imageUrl,
          isGenerating: false,
        });
      } else {
        updateCharacter(charId, { isGenerating: false });
      }
    } catch {
      updateCharacter(charId, { isGenerating: false });
    }
  };

  return (
    <div className="styled-scrollbar sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto rounded-2xl border-2 border-border bg-card p-4 shadow-lg">
      {/* Panel header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent">
          <User className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-hand text-lg font-bold leading-tight text-foreground">
            Characters
          </h3>
          <span className="font-hand text-[10px] text-muted-foreground">
            {scene.characters.length} in scene &middot; {characters.length}{" "}
            total
          </span>
        </div>
      </div>

      {/* Characters in current scene */}
      <div className="flex flex-col gap-2">
        {scene.characters.length === 0 && !isCreating && (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-border py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/40">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-hand text-sm text-muted-foreground">
                No characters yet!
              </p>
              <p className="font-hand text-[10px] text-muted-foreground/60">
                Create one below to get started
              </p>
            </div>
          </div>
        )}

        {scene.characters.map((pc) => {
          const char = characters.find((c) => c.id === pc.characterId);
          if (!char) return null;
          const isEditing = editingId === char.id;

          return (
            <div
              key={char.id}
              className={cn(
                "rounded-xl border-2 bg-background transition-all",
                isEditing
                  ? "border-primary/50 shadow-lg shadow-primary/5"
                  : "border-border hover:border-primary/20 hover:shadow-sm",
              )}
            >
              {/* Character row */}
              <div className="flex items-center gap-2.5 p-2.5">
                {char.isGenerating ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : char.imageUrl ? (
                  <img
                    src={char.imageUrl || "/placeholder.svg"}
                    alt={char.name}
                    crossOrigin="anonymous"
                    className="h-12 w-12 shrink-0 rounded-xl border border-border bg-muted/30 object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-muted text-primary">
                    <User className="h-5 w-5" />
                  </div>
                )}

                <button
                  type="button"
                  className="flex flex-1 items-center gap-1 text-left"
                  onClick={() => setEditingId(isEditing ? null : char.id)}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="font-hand text-sm font-bold text-foreground">
                      {char.name}
                    </span>
                    {char.species && (
                      <span className="font-hand text-[10px] text-muted-foreground">
                        {char.species}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharacter(char.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${char.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Expanded edit panel */}
              {isEditing && (
                <div className="flex flex-col gap-3 border-t border-border px-3 pb-3.5 pt-3">
                  {/* Species -- custom combobox */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 font-hand text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Palette className="h-3 w-3" />
                      Species / Type
                    </label>
                    <SpeciesInput
                      value={char.species}
                      onChange={(val) =>
                        updateCharacter(char.id, { species: val })
                      }
                    />
                  </div>

                  {/* Appearance */}
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 font-hand text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      Appearance
                    </label>
                    <input
                      type="text"
                      value={char.appearance}
                      onChange={(e) =>
                        updateCharacter(char.id, {
                          appearance: e.target.value,
                        })
                      }
                      placeholder="Hair, clothes, colors..."
                      className="w-full rounded-xl border-2 border-border bg-card px-2.5 py-1.5 font-hand text-xs text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Generate button */}
                  <Button
                    size="sm"
                    onClick={() => handleGenerateCharImage(char.id)}
                    disabled={char.isGenerating}
                    className="rounded-xl font-hand text-xs shadow-md transition-transform hover:scale-[1.02]"
                  >
                    {char.isGenerating ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
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
        <div className="flex flex-col gap-2">
          <p className="font-hand text-[10px] uppercase tracking-wider text-muted-foreground">
            Add existing character
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableChars.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => addCharacterToScene(scene.id, char.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 font-hand text-xs text-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
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
        <div className="flex flex-col gap-2.5 rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5">
          <label className="font-hand text-xs font-bold text-foreground">
            Character name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Princess Luna"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            className="w-full rounded-xl border-2 border-primary/30 bg-background px-3 py-2 font-hand text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 rounded-xl font-hand text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setNewName("");
              }}
              className="rounded-xl font-hand text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsCreating(true)}
          className={cn(
            "rounded-xl border-2 border-dashed border-accent/50 font-hand transition-all hover:scale-[1.02] hover:border-accent hover:shadow-md",
            "bg-accent/5 text-foreground hover:bg-accent/10",
          )}
        >
          <Plus className="mr-1.5 h-4 w-4 text-accent" />
          New Character
        </Button>
      )}
    </div>
  );
}
