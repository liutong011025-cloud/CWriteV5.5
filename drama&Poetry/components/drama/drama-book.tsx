"use client";

import { useState, useRef, useCallback } from "react";
import { useDramaStore } from "@/lib/drama-store";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  Star,
  Cloud,
  MessageCircle,
  User,
  Pencil,
  Loader2,
  Send,
  Lightbulb,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DramaBookProps {
  onBack: () => void;
}

function stripCharactersRoleDescriptions(script: string) {
  if (!script) return script;

  const lines = script.split(/\r?\n/);
  let inCharacters = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!inCharacters) {
      if (trimmed.includes("**Characters:**")) {
        inCharacters = true;
      }
      continue;
    }

    if (trimmed === "") continue;

    if (trimmed.startsWith("- ")) {
      const m = trimmed.match(/^- (.+?)\s*:\s*(.+)$/);
      if (m) {
        const leading = lines[i].match(/^\s*/)?.[0] ?? "";
        lines[i] = `${leading}- ${m[1].trim()}`;
      }
      continue;
    }

    inCharacters = false;
  }

  return lines.join("\n");
}

export function DramaBook({ onBack }: DramaBookProps) {
  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const dramaBook = useDramaStore((s) => s.dramaBook);
  const title = useDramaStore((s) => s.title);
  const generatingBook = useDramaStore((s) => s.generatingBook);

  const [currentPage, setCurrentPage] = useState(0);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState(() =>
    stripCharactersRoleDescriptions(dramaBook?.script || ""),
  );
  const [originalScript] = useState(() =>
    stripCharactersRoleDescriptions(dramaBook?.script || ""),
  );
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isSendingRevision, setIsSendingRevision] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pages: cover + scenes + script (with tips merged in)
  const totalPages = scenes.length + 2;

  const nextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 0));

  const sendRevisionToDify = useCallback(async () => {
    setIsSendingRevision(true);
    setAiFeedback(null);
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "drama_revise",
          originalScript,
          modifiedScript: editedScript,
          title,
        }),
      });
      const data = await res.json();
      setAiFeedback(data.feedback || "Great changes! Keep up the creative work!");
    } catch {
      setAiFeedback("Wonderful effort on your revisions! Keep writing!");
    } finally {
      setIsSendingRevision(false);
    }
  }, [editedScript, originalScript, title]);

  if (generatingBook) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background pattern-dots">
        <div className="flex flex-col items-center gap-5 rounded-3xl border-2 border-primary/20 bg-card/80 p-10 shadow-2xl backdrop-blur-sm">
          <div className="relative">
            <BookOpen className="h-16 w-16 animate-float text-primary" />
            <Sparkles
              className="absolute -top-2 -right-2 h-6 w-6 animate-sparkle text-secondary"
            />
          </div>
          <h2 className="font-hand text-2xl font-bold text-foreground">
            Creating your drama book...
          </h2>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="font-hand text-sm text-muted-foreground">
              Our AI is reading your story
            </p>
          </div>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full animate-shimmer rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
          </div>
        </div>
      </div>
    );
  }

  if (!dramaBook) return null;

  const renderCharacterBubbles = (sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    if (!scene) return null;
    return scene.characters.map((pc) => {
      const char = characters.find((c) => c.id === pc.characterId);
      if (!char) return null;
      const s = pc.scale ?? 1;
      const charSize = 56 * s;
      const nameTagH = 20;
      const bFont = Math.max(9, Math.min(14, 10 * s));
      const bPadX = Math.max(6, Math.round(8 * s));
      const bPadY = Math.max(3, Math.round(5 * s));
      const bMaxW = Math.max(100, Math.round(160 * s));
      // Position bubble ABOVE the character image top edge.
      // Parent height = charSize + nameTagH. Bottom of parent = bottom of name tag.
      // To place bubble bottom at image top: bottom = charSize + nameTagH + gap
      const aboveY = charSize + nameTagH + 6;
      // When both bubbles exist, push thought higher to avoid overlap
      const hasBoth = !!pc.dialogue && !!pc.thought;
      const bubbleH = bFont + bPadY * 2 + 10;
      const thoughtAboveY = hasBoth ? aboveY + bubbleH : aboveY;
      const sideX = Math.round(charSize * 0.1);

      return (
        <div
          key={pc.characterId}
          className="absolute"
          style={{
            left: `${pc.x}%`,
            top: `${pc.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Thought -- above-left, staggered higher when dialogue exists */}
          {pc.thought && (
            <div
              className="bubble-thought pointer-events-none absolute rounded-2xl font-hand"
              style={{
                right: `${sideX}px`,
                bottom: `${thoughtAboveY}px`,
                fontSize: `${bFont}px`,
                padding: `${bPadY}px ${bPadX}px`,
                maxWidth: `${bMaxW}px`,
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: Math.max(5, 6 * s),
                  height: Math.max(5, 6 * s),
                  right: `-${Math.round(4 * s)}px`,
                  bottom: `-${Math.round(7 * s)}px`,
                  background: "white",
                  border: "2px dashed hsl(270 30% 72%)",
                }}
              />
              <span className="flex items-start gap-0.5">
                <Cloud
                  className="mt-px shrink-0"
                  style={{
                    width: bFont,
                    height: bFont,
                    color: "hsl(270 40% 60%)",
                  }}
                />
                <span className="truncate">{pc.thought}</span>
              </span>
            </div>
          )}
          {/* Dialogue -- above-right */}
          {pc.dialogue && (
            <div
              className="bubble-dialogue pointer-events-none absolute rounded-2xl font-hand"
              style={{
                left: `${sideX}px`,
                bottom: `${aboveY}px`,
                fontSize: `${bFont}px`,
                padding: `${bPadY}px ${bPadX}px`,
                maxWidth: `${bMaxW}px`,
              }}
            >
              {/* tail outer */}
              <div
                className="absolute"
                style={{
                  left: `-${Math.round(3 * s)}px`,
                  bottom: `-${Math.round(9 * s)}px`,
                  width: 0,
                  height: 0,
                  borderLeft: `${Math.max(4, 5 * s)}px solid transparent`,
                  borderRight: `${Math.max(4, 5 * s)}px solid transparent`,
                  borderTop: `${Math.max(7, 9 * s)}px solid hsl(264 70% 65%)`,
                }}
              />
              {/* tail inner white */}
              <div
                className="absolute"
                style={{
                  left: `-${Math.round(1.5 * s)}px`,
                  bottom: `-${Math.round(6 * s)}px`,
                  width: 0,
                  height: 0,
                  borderLeft: `${Math.max(3, 4 * s)}px solid transparent`,
                  borderRight: `${Math.max(3, 4 * s)}px solid transparent`,
                  borderTop: `${Math.max(5, 7 * s)}px solid white`,
                }}
              />
              <span className="flex items-start gap-0.5">
                <MessageCircle
                  className="mt-px shrink-0"
                  style={{
                    width: bFont,
                    height: bFont,
                    color: "hsl(264 70% 55%)",
                  }}
                />
                <span className="truncate">{pc.dialogue}</span>
              </span>
            </div>
          )}
          {/* Character image */}
          <div className="flex flex-col items-center">
            {char.imageUrl ? (
              <img
                src={char.imageUrl || "/placeholder.svg"}
                alt={char.name}
                crossOrigin="anonymous"
                className="object-contain drop-shadow-lg"
                style={{ width: charSize, height: charSize }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-xl bg-muted text-primary"
                style={{ width: charSize, height: charSize }}
              >
                <User className="h-6 w-6" />
              </div>
            )}
            <span
              className="mt-0.5 truncate rounded-full bg-foreground/80 px-1.5 py-px font-hand font-bold text-background"
              style={{ fontSize: `${Math.max(8, 9 * s)}px` }}
            >
              {char.name}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Decorative top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />

      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b border-border/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-1.5 rounded-xl font-hand text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Builder
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-hand text-lg font-bold text-foreground">
              {title || "My Drama"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
            <Star className="h-3.5 w-3.5 text-secondary" />
            <span className="font-hand text-xs font-bold text-primary">
              {scenes.length} scene{scenes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </header>

      {/* Book */}
      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-8">
        {/* Book frame */}
        <div className="relative w-full">
          {/* Shadow / depth effect */}
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-sm" />

          <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-card shadow-2xl">
            {/* Decorative spine */}
            <div className="absolute top-0 bottom-0 left-0 z-10 w-2.5 bg-gradient-to-b from-primary/40 via-primary/20 to-primary/40" />
            <div className="absolute top-0 bottom-0 left-2.5 z-10 w-px bg-primary/10" />

            <div className="min-h-[440px] md:min-h-[520px]">
              {/* ===== COVER PAGE ===== */}
              {currentPage === 0 && (
                <div className="flex min-h-[440px] flex-col items-center justify-center p-8 md:min-h-[520px]">
                  {/* Decorative */}
                  <div className="absolute inset-0 pattern-dots opacity-60" />
                  <div className="absolute top-8 left-8 h-20 w-20 rounded-full bg-secondary/10 blur-2xl" />
                  <div className="absolute bottom-12 right-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-5 flex items-center gap-3">
                      <Sparkles
                        className="h-7 w-7 animate-sparkle text-secondary"
                      />
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg">
                        <BookOpen className="h-9 w-9 animate-float text-primary" />
                      </div>
                      <Sparkles
                        className="h-7 w-7 animate-sparkle text-secondary"
                        style={{ animationDelay: "0.6s" }}
                      />
                    </div>

                    <h2 className="mb-2 text-center font-hand text-4xl font-bold text-foreground text-balance md:text-5xl">
                      {title || "My Drama"}
                    </h2>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-0.5 w-10 rounded-full bg-primary/40" />
                      <Star className="h-4 w-4 text-secondary" />
                      <div className="h-0.5 w-10 rounded-full bg-primary/40" />
                    </div>
                    <p className="mb-6 text-center font-hand text-base text-muted-foreground">
                      A drama with {scenes.length} scene
                      {scenes.length !== 1 ? "s" : ""} and{" "}
                      {characters.length} character
                      {characters.length !== 1 ? "s" : ""}
                    </p>

                    {/* Cast */}
                    <div className="mb-6 flex flex-wrap justify-center gap-4">
                      {characters.map((c, i) => (
                        <div
                          key={c.id}
                          className="flex flex-col items-center gap-1.5 animate-fade-in-up"
                          style={{ animationDelay: `${i * 0.08}s` }}
                        >
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted shadow-lg">
                            {c.imageUrl ? (
                              <img
                                src={c.imageUrl || "/placeholder.svg"}
                                alt={c.name}
                                crossOrigin="anonymous"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-primary">
                                <User className="h-7 w-7" />
                              </div>
                            )}
                          </div>
                          <span className="font-hand text-xs font-bold text-muted-foreground">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {dramaBook.summary && (
                      <div className="max-w-md rounded-2xl border border-primary/15 bg-primary/5 px-6 py-4 shadow-inner">
                        <p className="text-center font-hand text-sm leading-relaxed text-foreground">
                          {dramaBook.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== SCENE PAGES ===== */}
              {currentPage >= 1 &&
                currentPage <= scenes.length &&
                (() => {
                  const si = currentPage - 1;
                  const scene = scenes[si];
                  if (!scene) return null;
                  return (
                    <div className="relative min-h-[440px] md:min-h-[520px]">
                      {/* Scene badge */}
                      <div className="absolute top-4 left-6 z-20 flex items-center gap-1.5 rounded-full bg-foreground/70 px-3.5 py-1 shadow-lg backdrop-blur-sm">
                        <span className="font-hand text-xs font-bold text-background">
                          Scene {si + 1} of {scenes.length}
                        </span>
                      </div>

                      {/* Background */}
                      <div className="relative h-[440px] w-full md:h-[520px]">
                        {scene.backgroundImageUrl ? (
                          <img
                            src={scene.backgroundImageUrl || "/placeholder.svg"}
                            alt="Scene"
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60 pattern-dots">
                            <span className="font-hand text-lg text-muted-foreground">
                              {scene.backgroundPrompt || "An empty stage"}
                            </span>
                          </div>
                        )}

                        {/* Notes overlay */}
                        {scene.notes && (
                          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-foreground/60 to-transparent px-6 pt-8 pb-4">
                            <p className="font-hand text-sm text-background italic">
                              {scene.notes}
                            </p>
                          </div>
                        )}

                        {/* Characters */}
                        <div className="absolute inset-0">
                          {renderCharacterBubbles(si)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* ===== SCRIPT PAGE (editable) ===== */}
              {currentPage === scenes.length + 1 && (
                <div className="relative flex min-h-[440px] flex-col p-6 md:min-h-[520px] md:p-8">
                  {/* Subtle bg */}
                  <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />

                  <div className="relative z-10 flex flex-1 flex-col">
                    {/* Header row */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
                          <Pencil className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-hand text-xl font-bold text-foreground">
                            Your Drama Script
                          </h3>
                          <p className="font-hand text-xs text-muted-foreground">
                            {isEditingScript
                              ? "Editing mode -- make your changes below"
                              : "Click Edit to rewrite your script"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingScript && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={sendRevisionToDify}
                            disabled={isSendingRevision || editedScript === originalScript}
                            title={editedScript === originalScript ? "Make some changes to your script first" : "Send your changes to the AI teacher"}
                            className="gap-1.5 rounded-xl border-secondary/40 font-hand text-xs text-secondary-foreground hover:bg-secondary/10 bg-transparent disabled:opacity-40"
                          >
                            {isSendingRevision ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            {isSendingRevision ? "Sending..." : "Get AI Feedback"}
                          </Button>
                        )}
                        <Button
                          variant={isEditingScript ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsEditingScript(!isEditingScript)}
                          className="gap-1.5 rounded-xl font-hand text-xs"
                        >
                          <Pencil className="h-3 w-3" />
                          {isEditingScript ? "Done" : "Edit Script"}
                        </Button>
                      </div>
                    </div>

                    {/* AI feedback */}
                    {aiFeedback && (
                      <div className="mb-4 rounded-2xl border-2 border-secondary/30 bg-secondary/5 p-4 shadow-sm animate-fade-in-up">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/20">
                            <Lightbulb className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <span className="font-hand text-sm font-bold text-secondary-foreground">
                            AI Teacher Feedback
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap font-hand text-sm leading-relaxed text-foreground">
                          {aiFeedback}
                        </p>
                      </div>
                    )}

                    {/* Script editor / viewer */}
                    <div className="flex flex-1 flex-col rounded-2xl border-2 border-border bg-background shadow-inner">
                      {isEditingScript ? (
                        <textarea
                          ref={textareaRef}
                          value={editedScript}
                          onChange={(e) => setEditedScript(e.target.value)}
                          className="styled-scrollbar h-full min-h-[260px] w-full flex-1 resize-none rounded-2xl bg-transparent px-5 py-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 md:min-h-[320px]"
                          placeholder="Write your drama script here..."
                        />
                      ) : (
                        <pre className="styled-scrollbar min-h-[260px] flex-1 overflow-auto whitespace-pre-wrap rounded-2xl px-5 py-4 font-mono text-sm leading-relaxed text-foreground md:min-h-[320px]">
                          {editedScript || dramaBook.script}
                        </pre>
                      )}
                    </div>

                    {isEditingScript && (
                      <p className="mt-3 text-center font-hand text-xs text-muted-foreground">
                        Edit your script freely, then click{" "}
                        <span className="font-bold text-secondary-foreground">
                          Get AI Feedback
                        </span>{" "}
                        to send your changes for review
                      </p>
                    )}

                    {/* === Tips section merged into script page === */}
                    {dramaBook.suggestions &&
                      dramaBook.suggestions.length > 0 && (
                        <div className="mt-6 rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-5">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/20 shadow-sm">
                              <Lightbulb className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div>
                              <h4 className="font-hand text-sm font-bold text-foreground">
                                Tips to Make It Even Better
                              </h4>
                              <p className="font-hand text-[11px] text-muted-foreground">
                                Ideas from our AI teacher to level up your story
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {dramaBook.suggestions.map((s, i) => (
                              <div
                                key={`sug-${i}`}
                                className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/80 px-3.5 py-2.5 shadow-sm animate-fade-in-up"
                                style={{ animationDelay: `${i * 0.08}s` }}
                              >
                                <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                  <Star className="h-3 w-3 text-primary" />
                                </div>
                                <p className="font-hand text-sm leading-relaxed text-foreground">
                                  {s}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-center">
                            <Button
                              onClick={onBack}
                              size="sm"
                              className="gap-2 rounded-xl font-hand text-sm shadow-md"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Keep Creating!
                            </Button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="mt-6 flex w-full items-center justify-between">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={currentPage === 0}
            className="gap-1.5 rounded-xl font-hand bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={`dot-${i}`}
                type="button"
                onClick={() => setCurrentPage(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentPage
                    ? "w-7 bg-primary shadow-sm"
                    : "w-2.5 bg-border hover:bg-primary/40"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="gap-1.5 rounded-xl font-hand bg-transparent"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Page label */}
        <p className="mt-2 font-hand text-xs text-muted-foreground">
          {currentPage === 0
            ? "Cover"
            : currentPage <= scenes.length
              ? `Scene ${currentPage}`
              : "Script & Tips"}
          {" -- "}
          Page {currentPage + 1} of {totalPages}
        </p>
      </main>
    </div>
  );
}
