"use client";

import { useState } from "react";
import { useDramaStore } from "@/lib/drama-store";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Lightbulb,
  Scroll,
  User,
  MessageCircle,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DramaBookProps {
  onBack: () => void;
}

export function DramaBook({ onBack }: DramaBookProps) {
  const scenes = useDramaStore((s) => s.scenes);
  const characters = useDramaStore((s) => s.characters);
  const title = useDramaStore((s) => s.title);
  const dramaBook = useDramaStore((s) => s.dramaBook);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");

  const totalPages = scenes.length;

  const goToPage = (direction: "left" | "right") => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);

    setTimeout(() => {
      if (direction === "right" && currentPage < totalPages - 1) {
        setCurrentPage((p) => p + 1);
      } else if (direction === "left" && currentPage > 0) {
        setCurrentPage((p) => p - 1);
      }
      setIsFlipping(false);
    }, 400);
  };

  const scene = scenes[currentPage];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-lg font-hand bg-transparent"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Builder
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-hand text-xl font-bold text-foreground">
              {title}
            </h1>
          </div>
          <div className="w-32" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-4 pb-12">
        {/* Story summary */}
        {dramaBook && (
          <div className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-md">
            <div className="flex items-center gap-2 pb-3">
              <Scroll className="h-5 w-5 text-primary" />
              <h2 className="font-hand text-lg font-bold text-foreground">
                Your Story
              </h2>
            </div>
            <p className="font-hand text-base leading-relaxed text-card-foreground">
              {dramaBook.summary}
            </p>
          </div>
        )}

        {/* Storybook viewer */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-3xl">
            {/* Book container */}
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border-4 border-primary/20 bg-card shadow-2xl transition-all duration-400",
                "min-h-[350px] md:min-h-[450px]",
                isFlipping &&
                  flipDirection === "right" &&
                  "animate-[flipRight_0.4s_ease-in-out]",
                isFlipping &&
                  flipDirection === "left" &&
                  "animate-[flipLeft_0.4s_ease-in-out]"
              )}
            >
              {/* Scene background */}
              {scene?.backgroundImageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${scene.backgroundImageUrl})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/60" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-muted" />
              )}

              {/* Scene number */}
              <div className="absolute left-4 top-4 rounded-lg bg-primary/90 px-3 py-1 shadow-md">
                <span className="font-hand text-sm font-bold text-primary-foreground">
                  Scene {currentPage + 1}
                </span>
              </div>

              {/* Characters with bubbles */}
              <div className="absolute inset-0">
                {scene?.characters.map((pc) => {
                  const char = characters.find(
                    (c) => c.id === pc.characterId
                  );
                  if (!char) return null;
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
                      {/* Thought */}
                      {pc.thought && (
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1 font-hand text-xs text-card-foreground shadow-md">
                          <Cloud className="absolute -bottom-2.5 left-1/2 h-3 w-3 -translate-x-1/2 text-border" />
                          {pc.thought}
                        </div>
                      )}

                      {/* Dialogue */}
                      {pc.dialogue && (
                        <div className="absolute -top-8 left-[calc(50%+16px)] whitespace-nowrap rounded-xl border-2 border-primary/30 bg-primary/10 px-3 py-1 font-hand text-xs text-foreground shadow-md">
                          <MessageCircle className="absolute -bottom-2.5 left-2 h-3 w-3 text-primary/30" />
                          {pc.dialogue}
                        </div>
                      )}

                      {/* Character */}
                      <div className="flex flex-col items-center">
                        {char.imageUrl ? (
                          <img
                            src={char.imageUrl || "/placeholder.svg"}
                            alt={char.name}
                            crossOrigin="anonymous"
                            className="h-14 w-14 rounded-xl border-2 border-card object-cover shadow-lg md:h-18 md:w-18"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-card bg-muted text-primary shadow-lg md:h-18 md:w-18">
                            <User className="h-7 w-7" />
                          </div>
                        )}
                        <span className="mt-0.5 rounded-md bg-card/90 px-1.5 py-0.5 font-hand text-[10px] font-bold text-foreground shadow-sm">
                          {char.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scene notes overlay */}
              {scene?.notes && (
                <div className="absolute bottom-0 left-0 right-0 bg-card/80 px-5 py-3 backdrop-blur-sm">
                  <p className="font-hand text-sm italic text-card-foreground">
                    {scene.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <Button
                onClick={() => goToPage("left")}
                disabled={currentPage === 0 || isFlipping}
                variant="outline"
                size="sm"
                className="rounded-lg font-hand"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {scenes.map((_, idx) => (
                  <button
                    key={`page-dot-${idx}`}
                    type="button"
                    onClick={() => {
                      if (!isFlipping) setCurrentPage(idx);
                    }}
                    className={cn(
                      "h-3 w-3 rounded-full transition-all",
                      idx === currentPage
                        ? "bg-primary scale-125"
                        : "bg-border hover:bg-primary/40"
                    )}
                    aria-label={`Go to scene ${idx + 1}`}
                  />
                ))}
              </div>
              <Button
                onClick={() => goToPage("right")}
                disabled={currentPage === totalPages - 1 || isFlipping}
                variant="outline"
                size="sm"
                className="rounded-lg font-hand"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Full drama script */}
        {dramaBook && (
          <div className="rounded-xl border-2 border-border bg-card p-5 shadow-md">
            <div className="flex items-center gap-2 pb-3">
              <Scroll className="h-5 w-5 text-secondary" />
              <h2 className="font-hand text-lg font-bold text-foreground">
                Your Drama Script
              </h2>
            </div>
            <pre className="whitespace-pre-wrap font-hand text-sm leading-relaxed text-card-foreground">
              {dramaBook.script}
            </pre>
          </div>
        )}

        {/* AI suggestions */}
        {dramaBook && dramaBook.suggestions.length > 0 && (
          <div className="rounded-xl border-2 border-secondary/30 bg-secondary/5 p-5 shadow-md">
            <div className="flex items-center gap-2 pb-3">
              <Lightbulb className="h-5 w-5 text-secondary" />
              <h2 className="font-hand text-lg font-bold text-foreground">
                Tips to Make it Even Better!
              </h2>
            </div>
            <ul className="flex flex-col gap-2">
              {dramaBook.suggestions.map((suggestion, idx) => (
                <li
                  key={`suggestion-${idx}`}
                  className="rounded-lg bg-card px-4 py-2.5 font-hand text-sm text-card-foreground shadow-sm"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
