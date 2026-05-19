"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { SENSORY_WORDS } from "@/lib/poetry-types";
import { getCurrentLevel } from "@/lib/current-level";
import { Eye, Ear, Wind, Hand, CookingPot, Lightbulb, Loader2, RefreshCw } from "lucide-react";

const SENSE_ICONS: Record<string, React.ElementType> = {
  sight: Eye,
  sound: Ear,
  smell: Wind,
  touch: Hand,
  taste: CookingPot,
};

const SENSE_COLORS: Record<string, string> = {
  sight: "bg-[#5c4d8a] text-white border-[#4a3d72] hover:bg-[#4a3d72]",
  sound: "bg-[#2d5f8a] text-white border-[#245078] hover:bg-[#245078]",
  smell: "bg-[#4a6b3a] text-white border-[#3a5530] hover:bg-[#3a5530]",
  touch: "bg-[#6b5210] text-white border-[#5a4210] hover:bg-[#5a4210]",
  taste: "bg-[#8a4538] text-white border-[#703830] hover:bg-[#703830]",
};

interface InspirationPanelProps {
  topic: string;
  onInsertWord: (word: string) => void;
}

function parseSensoryResponse(text: string): Record<string, string[]> | null {
  const result: Record<string, string[]> = {};
  const senses = ["sight", "sound", "smell", "touch", "taste"];
  let matched = 0;

  for (const sense of senses) {
    const regex = new RegExp(`${sense}\\s*:\\s*(.+)`, "i");
    const match = text.match(regex);
    if (match) {
      const words = match[1]
        .split(",")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0 && w.length < 25);
      if (words.length >= 3) {
        result[sense] = words.slice(0, 6);
        matched++;
      }
    }
  }

  return matched >= 3 ? result : null;
}

export function InspirationPanel({ topic, onInsertWord }: InspirationPanelProps) {
  const [words, setWords] = useState<Record<string, string[]>>(SENSORY_WORDS);
  const [loading, setLoading] = useState(false);
  const [isTopicSpecific, setIsTopicSpecific] = useState(false);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspiration", topic, level: getCurrentLevel() }),
      });
      const data = await res.json();
      const parsed = parseSensoryResponse(data.result || "");
      if (parsed) {
        setWords(parsed);
        setIsTopicSpecific(true);
      }
    } catch {
      // Keep default words on error
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    if (topic) {
      fetchWords();
    }
  }, [topic, fetchWords]);

  return (
    <div className="styled-scrollbar flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5e6c8] shadow-sm">
          <Lightbulb className="h-5 w-5 text-[#6b5210]" />
        </div>
        <div className="flex-1">
          <h3 className="font-hand text-base font-bold text-[#6b5210]">Inspiration</h3>
          <p className="font-hand text-sm text-[#5a4a2a]">
            {isTopicSpecific ? `Words for "${topic}"` : `Topic: ${topic}`}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWords}
          disabled={loading}
          title="Refresh words for this topic"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5a4a2a] transition-colors hover:bg-[#f5e6c8] hover:text-[#6b5210] disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="font-hand text-sm leading-relaxed text-[#5a4a2a]">
        Click any word to add it to your current line.
      </p>

      {loading && !isTopicSpecific && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#8b6914]/40 bg-[#f5e6c8] py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#6b5210]" />
          <span className="font-hand text-sm text-[#5a4a2a]">
            Finding words about {topic}...
          </span>
        </div>
      )}

      {Object.entries(words).map(([sense, senseWords]) => {
        const Icon = SENSE_ICONS[sense] || Eye;
        const color = SENSE_COLORS[sense] || "bg-[#5a4210] text-white border-[#4a3510] hover:bg-[#4a3510]";
        return (
          <div key={sense}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-[#6b5210]" />
              <span className="font-hand text-sm font-bold uppercase tracking-wider text-[#6b5210]">
                {sense}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {senseWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onInsertWord(w)}
                  className={`rounded-full border px-3 py-1 font-hand text-sm font-semibold transition-all hover:scale-105 ${color}`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
