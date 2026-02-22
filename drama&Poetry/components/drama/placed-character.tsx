"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDramaStore } from "@/lib/drama-store";
import type { PlacedCharacter, Character } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MessageCircle,
  Cloud,
  X,
  Loader2,
  User,
  Minus,
  Plus,
  GripVertical,
} from "lucide-react";

interface PlacedCharacterProps {
  placed: PlacedCharacter;
  character: Character;
  sceneId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const BASE_SIZE = 80;
const NAME_TAG_H = 22; // approximate height of the name tag below the image

export function PlacedCharacterComponent({
  placed,
  character,
  sceneId,
  containerRef,
}: PlacedCharacterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dialogueVal, setDialogueVal] = useState(placed.dialogue);
  const [thoughtVal, setThoughtVal] = useState(placed.thought);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const moveCharacterInScene = useDramaStore((s) => s.moveCharacterInScene);
  const updatePlacedCharacter = useDramaStore((s) => s.updatePlacedCharacter);
  const removeCharacterFromScene = useDramaStore(
    (s) => s.removeCharacterFromScene,
  );
  const resizeCharacterInScene = useDramaStore(
    (s) => s.resizeCharacterInScene,
  );

  const scale = placed.scale ?? 1;
  const size = BASE_SIZE * scale;

  // Bubble sizing: font, padding, max-width all scale with character
  const bFont = Math.max(10, Math.min(18, 12 * scale));
  const bPadX = Math.max(8, Math.round(12 * scale));
  const bPadY = Math.max(4, Math.round(6 * scale));
  const bMaxW = Math.max(120, Math.round(220 * scale));

  // Bubble positioning: the root div is translate(-50%,-50%) so its own
  // natural height = character image (size) + name tag (NAME_TAG_H) + margin (4px).
  // CSS `bottom` is measured from the parent's bottom edge (bottom of name tag).
  // To place bubble bottom at the image's top edge:
  //   bottom = size + NAME_TAG_H + 4(mt) + gap
  const aboveTop = size + NAME_TAG_H + 10;
  // When BOTH bubbles exist, stagger thought higher so they don't overlap
  const hasBoth = !!placed.dialogue && !!placed.thought;
  const bubbleH = bFont + bPadY * 2 + 10; // approximate single bubble height
  const thoughtAboveTop = hasBoth ? aboveTop + bubbleH : aboveTop;

  useEffect(() => {
    setDialogueVal(placed.dialogue);
  }, [placed.dialogue]);
  useEffect(() => {
    setThoughtVal(placed.thought);
  }, [placed.thought]);

  // Click outside to deselect
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target as Node) &&
        (!popoverRef.current || !popoverRef.current.contains(e.target as Node))
      ) {
        if (dialogueVal !== placed.dialogue) {
          updatePlacedCharacter(sceneId, character.id, {
            dialogue: dialogueVal,
          });
        }
        if (thoughtVal !== placed.thought) {
          updatePlacedCharacter(sceneId, character.id, { thought: thoughtVal });
        }
        setIsSelected(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [
    isSelected,
    dialogueVal,
    thoughtVal,
    placed.dialogue,
    placed.thought,
    sceneId,
    character.id,
    updatePlacedCharacter,
  ]);

  const commitDialogue = () => {
    updatePlacedCharacter(sceneId, character.id, { dialogue: dialogueVal });
  };
  const commitThought = () => {
    updatePlacedCharacter(sceneId, character.id, { thought: thoughtVal });
  };

  // ---- Drag: mouse ----
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const charX = (placed.x / 100) * rect.width;
      const charY = (placed.y / 100) * rect.height;
      dragOffset.current = {
        x: e.clientX - rect.left - charX,
        y: e.clientY - rect.top - charY,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!container) return;
        const r = container.getBoundingClientRect();
        const x =
          ((ev.clientX - r.left - dragOffset.current.x) / r.width) * 100;
        const y =
          ((ev.clientY - r.top - dragOffset.current.y) / r.height) * 100;
        moveCharacterInScene(
          sceneId,
          character.id,
          Math.max(5, Math.min(95, x)),
          Math.max(5, Math.min(95, y)),
        );
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [
      containerRef,
      placed.x,
      placed.y,
      moveCharacterInScene,
      sceneId,
      character.id,
    ],
  );

  // ---- Drag: touch ----
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const charX = (placed.x / 100) * rect.width;
      const charY = (placed.y / 100) * rect.height;
      dragOffset.current = {
        x: touch.clientX - rect.left - charX,
        y: touch.clientY - rect.top - charY,
      };

      const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        if (!container) return;
        const r = container.getBoundingClientRect();
        const t = ev.touches[0];
        const x =
          ((t.clientX - r.left - dragOffset.current.x) / r.width) * 100;
        const y =
          ((t.clientY - r.top - dragOffset.current.y) / r.height) * 100;
        moveCharacterInScene(
          sceneId,
          character.id,
          Math.max(5, Math.min(95, x)),
          Math.max(5, Math.min(95, y)),
        );
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [
      containerRef,
      placed.x,
      placed.y,
      moveCharacterInScene,
      sceneId,
      character.id,
    ],
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      setIsSelected((prev) => !prev);
    }
  };

  // Popover position: avoid going off canvas edges
  const getPopoverSide = (): "right" | "left" | "bottom" => {
    if (placed.x > 65) return "left";
    if (placed.x < 35) return "right";
    return "bottom";
  };
  const popoverSide = getPopoverSide();
  const popoverStyle: React.CSSProperties = (() => {
    switch (popoverSide) {
      case "right":
        return {
          left: `${size / 2 + 14}px`,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          right: `${size / 2 + 14}px`,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          top: `${size / 2 + NAME_TAG_H + 10}px`,
          left: "50%",
          transform: "translateX(-50%)",
        };
    }
  })();

  // Tail dot size for thought bubble
  const dotSize1 = Math.max(6, 8 * scale);
  const dotSize2 = Math.max(4, 5 * scale);

  return (
    <div
      ref={rootRef}
      className="absolute select-none"
      style={{
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 50 : isSelected ? 40 : 10,
      }}
    >
      {/* ======== Thought bubble: upper-LEFT of the character image ======== */}
      {placed.thought && !isSelected && (
        <div
          className="bubble-thought pointer-events-none absolute z-30 rounded-2xl font-hand animate-fade-in-up"
          style={{
            // Anchor: right edge aligns near center, positioned above image
            // Uses thoughtAboveTop which is staggered higher when dialogue also exists
            right: `${Math.round(size * 0.1)}px`,
            bottom: `${thoughtAboveTop}px`,
            fontSize: `${bFont}px`,
            padding: `${bPadY}px ${bPadX}px`,
            maxWidth: `${bMaxW}px`,
          }}
        >
          {/* Cloud trail dot 1 */}
          <div
            className="absolute rounded-full"
            style={{
              width: dotSize1,
              height: dotSize1,
              right: `-${Math.round(4 * scale)}px`,
              bottom: `-${Math.round(dotSize1 + 2)}px`,
              background: "white",
              border: "2px dashed hsl(270 30% 72%)",
            }}
          />
          {/* Cloud trail dot 2 */}
          <div
            className="absolute rounded-full"
            style={{
              width: dotSize2,
              height: dotSize2,
              right: `-${Math.round(8 * scale)}px`,
              bottom: `-${Math.round(dotSize1 + dotSize2 + 6)}px`,
              background: "white",
              border: "1.5px dashed hsl(270 30% 78%)",
            }}
          />
          <span className="flex items-start gap-1">
            <Cloud
              className="mt-0.5 shrink-0"
              style={{
                width: bFont,
                height: bFont,
                color: "hsl(270 40% 60%)",
              }}
            />
            <span className="break-words leading-snug">{placed.thought}</span>
          </span>
        </div>
      )}

      {/* ======== Dialogue bubble: upper-RIGHT of the character image ======== */}
      {placed.dialogue && !isSelected && (
        <div
          className="bubble-dialogue pointer-events-none absolute z-30 rounded-2xl font-hand animate-fade-in-up"
          style={{
            // Anchor: left edge aligns near center, positioned above image
            left: `${Math.round(size * 0.1)}px`,
            bottom: `${aboveTop}px`,
            fontSize: `${bFont}px`,
            padding: `${bPadY}px ${bPadX}px`,
            maxWidth: `${bMaxW}px`,
          }}
        >
          {/* Speech triangle tail pointing down-left toward character */}
          <svg
            className="absolute"
            style={{
              left: `${Math.round(4 * scale)}px`,
              bottom: `-${Math.round(10 * scale)}px`,
              width: Math.max(12, 14 * scale),
              height: Math.max(10, 12 * scale),
            }}
            viewBox="0 0 14 12"
            fill="none"
          >
            <path
              d="M2 0 L14 0 L6 12 Z"
              fill="white"
              stroke="hsl(264, 70%, 65%)"
              strokeWidth="2.5"
            />
            <path d="M3 0 L13 0 L6 10 Z" fill="white" />
          </svg>
          <span className="flex items-start gap-1">
            <MessageCircle
              className="mt-0.5 shrink-0"
              style={{
                width: bFont,
                height: bFont,
                color: "hsl(264 70% 55%)",
              }}
            />
            <span className="break-words leading-snug">{placed.dialogue}</span>
          </span>
        </div>
      )}

      {/* ======== Character image ======== */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={cn(
          "relative cursor-grab transition-all duration-150",
          isDragging && "cursor-grabbing scale-105 opacity-90",
          isSelected &&
            "rounded-2xl ring-[3px] ring-primary/80 ring-offset-2 ring-offset-transparent",
        )}
      >
        <div className="flex flex-col items-center">
          {character.isGenerating ? (
            <div
              className="flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-card/80 backdrop-blur-sm"
              style={{ width: size, height: size }}
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : character.imageUrl ? (
            <img
              src={character.imageUrl || "/placeholder.svg"}
              alt={character.name}
              crossOrigin="anonymous"
              className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)]"
              style={{ width: size, height: size }}
              draggable={false}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-2xl border-2 border-dashed border-primary/50 bg-card/80 text-primary shadow-md backdrop-blur-sm"
              style={{ width: size, height: size }}
            >
              <User className="h-8 w-8" />
            </div>
          )}
          <span
            className="mt-1 max-w-32 truncate rounded-full bg-foreground/80 px-2.5 py-0.5 font-hand font-bold text-background shadow-md"
            style={{ fontSize: `${Math.max(9, 11 * scale)}px` }}
          >
            {character.name}
          </span>
        </div>

        {isSelected && (
          <div className="absolute -top-1.5 -left-1.5 rounded-lg bg-primary p-0.5 text-primary-foreground shadow-md">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* ======== Popover editor ======== */}
      {isSelected && (
        <div
          ref={popoverRef}
          className="animate-slide-in-right absolute z-50 w-60 rounded-2xl border-2 border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur-md"
          style={popoverStyle}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-2.5 flex items-center justify-between border-b border-border pb-2">
            <span className="font-hand text-sm font-bold text-foreground">
              {character.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCharacterFromScene(sceneId, character.id);
              }}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove from scene"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Size controls */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/60 px-2.5 py-2">
            <span className="font-hand text-xs font-bold text-muted-foreground">
              Size
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resizeCharacterInScene(sceneId, character.id, scale - 0.15);
                }}
                disabled={scale <= 0.3}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm transition-colors hover:bg-primary/10 hover:text-foreground disabled:opacity-30"
                aria-label="Smaller"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-10 text-center font-hand text-xs font-bold text-foreground">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resizeCharacterInScene(sceneId, character.id, scale + 0.15);
                }}
                disabled={scale >= 3.0}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm transition-colors hover:bg-primary/10 hover:text-foreground disabled:opacity-30"
                aria-label="Bigger"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Dialogue input */}
          <div className="mb-2.5">
            <label className="mb-1 flex items-center gap-1 font-hand text-xs font-bold text-foreground">
              <MessageCircle className="h-3 w-3 text-primary" />
              Says
            </label>
            <input
              type="text"
              placeholder={'e.g. "Hello friend!"'}
              value={dialogueVal}
              onChange={(e) => setDialogueVal(e.target.value)}
              onBlur={commitDialogue}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDialogue();
              }}
              className="w-full rounded-xl border-2 border-primary/20 bg-background px-3 py-2 font-hand text-sm text-foreground shadow-inner placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Thought input */}
          <div>
            <label className="mb-1 flex items-center gap-1 font-hand text-xs font-bold text-foreground">
              <Cloud className="h-3 w-3 text-muted-foreground" />
              Thinks
            </label>
            <input
              type="text"
              placeholder={'e.g. "I wonder if..."'}
              value={thoughtVal}
              onChange={(e) => setThoughtVal(e.target.value)}
              onBlur={commitThought}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitThought();
              }}
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-hand text-sm text-foreground shadow-inner placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
