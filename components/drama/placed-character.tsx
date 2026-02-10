"use client";

import React from "react"

import { useState, useRef, useCallback } from "react";
import { useDramaStore } from "@/lib/drama-store";
import type { PlacedCharacter, Character } from "@/lib/drama-types";
import { cn } from "@/lib/utils";
import { MessageCircle, Cloud, X, Loader2, User, Maximize2, Minimize2 } from "lucide-react";

interface PlacedCharacterProps {
  placed: PlacedCharacter;
  character: Character;
  sceneId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function PlacedCharacterComponent({
  placed,
  character,
  sceneId,
  containerRef,
}: PlacedCharacterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showDialogueInput, setShowDialogueInput] = useState(false);
  const [showThoughtInput, setShowThoughtInput] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef(placed.size || 1.0);
  const resizeStartY = useRef(0);

  const moveCharacterInScene = useDramaStore((s) => s.moveCharacterInScene);
  const updatePlacedCharacter = useDramaStore((s) => s.updatePlacedCharacter);
  const removeCharacterFromScene = useDramaStore(
    (s) => s.removeCharacterFromScene
  );

  const characterSize = placed.size || 1.0;
  const characterSizePx = 64 * characterSize; // base size is 64px (h-16)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 如果点击的是调整大小按钮，不触发拖拽
      if ((e.target as HTMLElement).closest('.resize-handle')) {
        return;
      }
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
        const x = ((ev.clientX - r.left - dragOffset.current.x) / r.width) * 100;
        const y = ((ev.clientY - r.top - dragOffset.current.y) / r.height) * 100;
        moveCharacterInScene(
          sceneId,
          character.id,
          Math.max(5, Math.min(95, x)),
          Math.max(5, Math.min(95, y))
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
    [containerRef, placed.x, placed.y, moveCharacterInScene, sceneId, character.id]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartSize.current = placed.size || 1.0;
      resizeStartY.current = e.clientY;

      const handleMouseMove = (ev: MouseEvent) => {
        const deltaY = resizeStartY.current - ev.clientY; // 向上拖动增大
        const deltaSize = deltaY / 100; // 每100px改变1.0倍大小
        const newSize = Math.max(0.5, Math.min(2.0, resizeStartSize.current + deltaSize));
        updatePlacedCharacter(sceneId, character.id, { size: newSize });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [placed.size, updatePlacedCharacter, sceneId, character.id]
  );

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
        const x = ((t.clientX - r.left - dragOffset.current.x) / r.width) * 100;
        const y = ((t.clientY - r.top - dragOffset.current.y) / r.height) * 100;
        moveCharacterInScene(
          sceneId,
          character.id,
          Math.max(5, Math.min(95, x)),
          Math.max(5, Math.min(95, y))
        );
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    },
    [containerRef, placed.x, placed.y, moveCharacterInScene, sceneId, character.id]
  );

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging || isResizing ? 50 : (showPanel || showDialogueInput || showThoughtInput ? 40 : 10),
      }}
    >
      {/* Thought bubble - 调整位置避免遮挡弹窗 */}
      {placed.thought && !showPanel && !showDialogueInput && !showThoughtInput && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-purple-300 bg-purple-50 px-3 py-1.5 font-hand text-sm text-purple-900 shadow-lg z-20">
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="h-2 w-2 rounded-full border-2 border-purple-300 bg-purple-50" />
          </div>
          <div className="absolute -bottom-5 left-[calc(50%+6px)] -translate-x-1/2">
            <div className="h-1.5 w-1.5 rounded-full border border-purple-300 bg-purple-50" />
          </div>
          {placed.thought}
        </div>
      )}

      {/* Dialogue bubble - 调整位置避免遮挡弹窗 */}
      {placed.dialogue && !showPanel && !showDialogueInput && !showThoughtInput && (
        <div className="absolute -top-14 left-[calc(50%+24px)] whitespace-nowrap rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-1.5 font-hand text-sm text-blue-900 shadow-lg z-20">
          <div className="absolute -bottom-2 left-4 h-0 w-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-blue-400" />
          {placed.dialogue}
        </div>
      )}

      {/* Character avatar */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setShowPanel(true)}
        onMouseLeave={() => {
          if (!showDialogueInput && !showThoughtInput && !isResizing) setShowPanel(false);
        }}
        className={cn(
          "relative cursor-grab rounded-xl transition-transform",
          isDragging && "scale-110 cursor-grabbing",
          isResizing && "cursor-ns-resize"
        )}
        style={{
          transform: `scale(${characterSize})`,
          transformOrigin: "center center",
        }}
      >
        <div className="flex flex-col items-center">
          {character.isGenerating ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-gradient-to-br from-purple-100 to-pink-100">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : character.imageUrl ? (
            <img
              src={character.imageUrl || "/placeholder.svg"}
              alt={character.name}
              crossOrigin="anonymous"
              className="h-16 w-16 rounded-xl border-2 border-primary/30 object-contain shadow-lg bg-transparent"
              style={{ imageRendering: "auto" }}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-gradient-to-br from-indigo-100 to-purple-100 text-primary shadow-md">
              <User className="h-8 w-8" />
            </div>
          )}
          <span className="mt-1 max-w-20 truncate rounded-md bg-gradient-to-r from-purple-100 to-pink-100 px-2 py-0.5 font-hand text-xs font-bold text-purple-900 shadow-sm border border-purple-200">
            {character.name}
          </span>
        </div>

        {/* Resize handle */}
        {showPanel && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 resize-handle cursor-ns-resize z-50" onMouseDown={handleResizeStart}>
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 shadow-lg border-2 border-white">
              <Minimize2 className="h-3 w-3 text-white" />
              <span className="font-hand text-xs text-white font-bold">{Math.round(characterSize * 100)}%</span>
              <Maximize2 className="h-3 w-3 text-white" />
            </div>
          </div>
        )}

        {/* Hover panel - 调整位置确保不被遮挡 */}
        {showPanel && (
          <div className="absolute left-full top-0 z-50 ml-3 flex flex-col gap-1 rounded-lg border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50 p-2 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDialogueInput(!showDialogueInput);
                setShowThoughtInput(false);
                setShowPanel(false);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 font-hand text-xs text-blue-700 transition-colors hover:bg-blue-100 bg-blue-50 border border-blue-200"
              aria-label="Add dialogue"
            >
              <MessageCircle className="h-4 w-4 text-blue-600" />
              Say
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowThoughtInput(!showThoughtInput);
                setShowDialogueInput(false);
                setShowPanel(false);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 font-hand text-xs text-purple-700 transition-colors hover:bg-purple-100 bg-purple-50 border border-purple-200"
              aria-label="Add thought"
            >
              <Cloud className="h-4 w-4 text-purple-600" />
              Think
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCharacterFromScene(sceneId, character.id);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 font-hand text-xs text-red-700 transition-colors hover:bg-red-100 bg-red-50 border border-red-200"
              aria-label="Remove from scene"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Dialogue input - 调整位置确保不被遮挡 */}
      {showDialogueInput && (
        <div className="absolute left-full top-20 z-50 ml-3 w-56">
          <div className="rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-2 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="font-hand text-xs font-bold text-blue-700">What do they say?</span>
            </div>
            <input
              type="text"
              placeholder="Enter dialogue..."
              value={placed.dialogue}
              onChange={(e) =>
                updatePlacedCharacter(sceneId, character.id, {
                  dialogue: e.target.value,
                })
              }
              onBlur={() => {
                setShowDialogueInput(false);
                setShowPanel(false);
              }}
              autoFocus
              className="w-full rounded-lg border-2 border-blue-300 bg-white px-3 py-2 font-hand text-sm text-foreground shadow-md placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      )}

      {/* Thought input - 调整位置确保不被遮挡 */}
      {showThoughtInput && (
        <div className="absolute left-full top-20 z-50 ml-3 w-56">
          <div className="rounded-lg border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-white p-2 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="h-4 w-4 text-purple-600" />
              <span className="font-hand text-xs font-bold text-purple-700">What do they think?</span>
            </div>
            <input
              type="text"
              placeholder="Enter thought..."
              value={placed.thought}
              onChange={(e) =>
                updatePlacedCharacter(sceneId, character.id, {
                  thought: e.target.value,
                })
              }
              onBlur={() => {
                setShowThoughtInput(false);
                setShowPanel(false);
              }}
              autoFocus
              className="w-full rounded-lg border-2 border-purple-300 bg-white px-3 py-2 font-hand text-sm text-foreground shadow-md placeholder:text-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
