"use client";

import { useState, useRef, useEffect } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import {
  Plus,
  User,
  Loader2,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronUp,
  Palette,
  Wand2,
  Search,
  Check,
  UserPlus,
  PackageOpen,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DramaPresetCharacter } from "@/lib/drama-preset-characters";
import { DRAMA_PRESET_CHARACTERS } from "@/lib/drama-preset-characters";

function PresetCharacterCell({
  preset,
  onPick,
}: {
  preset: DramaPresetCharacter;
  onPick: () => void;
  key?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "group relative aspect-[4/5] w-full overflow-hidden rounded-xl border-2 border-[#4a2a15] bg-[#7a4a1f] p-0 transition-all",
        "hover:z-10 hover:border-[#6b3e1e] hover:scale-[1.04] active:scale-95",
      )}
      title={preset.species}
    >
      <div className="absolute inset-0 flex items-center justify-center p-1">
        {failed ? (
          <span className="font-hand text-[16px] font-bold text-[#f7e6d0]">?</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preset.imageUrl}
            alt={preset.species}
            className="max-h-full max-w-full scale-[1.03] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.42)] transition-transform duration-150 group-hover:scale-[1.12]"
            onError={() => setFailed(true)}
            draggable={false}
          />
        )}
      </div>
    </button>
  );
}

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

  const [toyBoxOpen, setToyBoxOpen] = useState(false);
  const [toyBoxStep, setToyBoxStep] = useState<"pick" | "name">("pick");
  const [pickedPreset, setPickedPreset] = useState<DramaPresetCharacter | null>(
    null,
  );
  const [toyBoxName, setToyBoxName] = useState("");

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

  const handleToyBoxOpenChange = (open: boolean) => {
    setToyBoxOpen(open);
    if (!open) {
      setToyBoxStep("pick");
      setPickedPreset(null);
      setToyBoxName("");
    }
  };

  const handleConfirmToyBoxCharacter = () => {
    if (!pickedPreset || !toyBoxName.trim()) return;
    const char = addCharacter(toyBoxName.trim(), {
      imageUrl: pickedPreset.imageUrl,
      species: pickedPreset.species,
      speciesIsFromPresetFile: true,
    });
    addCharacterToScene(scene.id, char.id);
    setEditingId(char.id);
    handleToyBoxOpenChange(false);
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
          speciesIsFromPresetFile: false,
        });
      } else {
        updateCharacter(charId, { isGenerating: false });
      }
    } catch {
      updateCharacter(charId, { isGenerating: false });
    }
  };

  return (
    <div className="styled-scrollbar sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/70 via-white to-sky-50/60 p-4 shadow-sm">
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

              {isEditing && (
                <div className="flex flex-col gap-3 border-t border-border px-3 pb-3.5 pt-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 font-hand text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Palette className="h-3 w-3" />
                      Species / Type
                    </label>
                    {char.speciesIsFromPresetFile ? (
                      <div className="rounded-xl border-2 border-border bg-muted/30 px-2.5 py-2">
                        <p className="font-hand text-xs font-semibold text-foreground">
                          {char.species}
                        </p>
                        <p className="mt-1 font-hand text-[10px] text-muted-foreground">
                          From toy box image filename (sent to AI as species).
                        </p>
                      </div>
                    ) : (
                      <SpeciesInput
                        value={char.species}
                        onChange={(val) =>
                          updateCharacter(char.id, { species: val })
                        }
                      />
                    )}
                  </div>

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
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setToyBoxStep("pick");
              setPickedPreset(null);
              setToyBoxName("");
              setToyBoxOpen(true);
            }}
            className={cn(
              "rounded-xl border-2 border-amber-200/80 bg-amber-50/50 font-hand transition-all hover:scale-[1.01] hover:border-amber-300 hover:bg-amber-50",
            )}
          >
            <PackageOpen className="mr-1.5 h-4 w-4 text-amber-700" />
            Toy box — pick a character
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className={cn(
              "rounded-xl border-2 border-dashed border-slate-300 font-hand transition-all hover:border-primary/40 hover:bg-slate-50",
            )}
          >
            <Plus className="mr-1.5 h-4 w-4 text-primary" />
            New character (name first)
          </Button>
        </div>
      )}

      <Dialog open={toyBoxOpen} onOpenChange={handleToyBoxOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-y-auto sm:max-w-[min(74rem,calc(100%-2rem))] bg-gradient-to-br from-amber-100/70 via-white to-sky-100/60"
        >
          {toyBoxStep === "pick" ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-hand text-3xl">
                  Toy box — Pick a character
                </DialogTitle>
                <DialogDescription className="font-hand text-[17px] leading-relaxed">
                  Choose one character doll. You will name them on the next
                  step. Species/type is taken from the image file name.
                </DialogDescription>
              </DialogHeader>
              <div
                className="relative rounded-2xl border-4 border-[#4a2a15] bg-[#5a3116] p-4 shadow-inner"
                style={{
                  backgroundImage: [
                    "radial-gradient(circle at 10% 15%, rgba(244,63,94,0.35) 0, transparent 45%)",
                    "radial-gradient(circle at 90% 22%, rgba(59,130,246,0.32) 0, transparent 44%)",
                    "radial-gradient(circle at 18% 86%, rgba(16,185,129,0.22) 0, transparent 46%)",
                    "radial-gradient(circle at 86% 78%, rgba(245,158,11,0.25) 0, transparent 44%)",
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 3px, transparent 3px, transparent 22px)",
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.20) 0, rgba(0,0,0,0.20) 3px, transparent 3px, transparent 22px)",
                  ].join(","),
                  backgroundBlendMode: "normal",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="rounded-full bg-[#8b5a2b]/85 px-2 py-0.5 font-hand text-[10px] font-bold text-[#f7e6d0] shadow-[0_10px_22px_rgba(0,0,0,0.25)]">
                    40 slots
                  </div>
                </div>
                <div className="max-h-[700px] overflow-y-auto pr-1">
                  {/* 4 columns */}
                  <div className="relative grid grid-cols-4 gap-1.5">
                    {DRAMA_PRESET_CHARACTERS.map((preset) => (
                      <PresetCharacterCell
                        key={preset.imageUrl}
                        preset={preset}
                        onPick={() => {
                          setPickedPreset(preset);
                          setToyBoxStep("name");
                          setToyBoxName("");
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-hand text-3xl">
                  Name your &quot;{pickedPreset?.species}&quot;
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                {pickedPreset && (
                  <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pickedPreset.imageUrl}
                      alt={pickedPreset.species}
                      className="mx-auto h-52 w-52 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={toyBoxName}
                  onChange={(e) => setToyBoxName(e.target.value)}
                  placeholder="e.g. Captain Whiskers"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleConfirmToyBoxCharacter()
                  }
                  autoFocus
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 font-hand text-sm focus:border-primary focus:outline-none"
                />
                <div className="flex w-full gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-xl font-hand"
                    onClick={() => {
                      setToyBoxStep("pick");
                      setPickedPreset(null);
                      setToyBoxName("");
                    }}
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 rounded-xl font-hand"
                    disabled={!toyBoxName.trim()}
                    onClick={handleConfirmToyBoxCharacter}
                  >
                    Add to scene
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
