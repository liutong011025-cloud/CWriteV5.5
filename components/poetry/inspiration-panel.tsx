"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { SENSORY_WORDS } from "@/lib/poetry-types";
import { Eye, Ear, Wind, Hand, CookingPot, Lightbulb, Loader2, RefreshCw } from "lucide-react";

const SENSE_ICONS: Record<string, React.ElementType> = {
  sight: Eye,
  sound: Ear,
  smell: Wind,
  touch: Hand,
  taste: CookingPot,
};

const SENSE_COLORS: Record<string, string> = {
  sight: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  sound: "bg-primary/10 text-primary border-primary/20",
  smell: "bg-accent/10 text-accent border-accent/20",
  touch: "bg-secondary/15 text-secondary-foreground border-secondary/20",
  taste: "bg-chart-4/10 text-chart-4 border-chart-4/20",
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
        body: JSON.stringify({ action: "inspiration", topic }),
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
    <div className="styled-scrollbar flex h-full flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/15 shadow-sm">
          <Lightbulb className="h-4 w-4 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-hand text-sm font-bold text-foreground">Inspiration</h3>
          <p className="font-hand text-[10px] text-muted-foreground">
            {isTopicSpecific ? `Words for "${topic}"` : `Topic: ${topic}`}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchWords}
          disabled={loading}
          title="Refresh words for this topic"
          className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </button>
      </div>

      <p className="font-hand text-[11px] leading-relaxed text-muted-foreground">
        Click any word to add it to your current line.
      </p>

      {loading && !isTopicSpecific && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-hand text-xs text-muted-foreground">
            Finding words about {topic}...
          </span>
        </div>
      )}

      {Object.entries(words).map(([sense, senseWords]) => {
        const Icon = SENSE_ICONS[sense] || Eye;
        const color = SENSE_COLORS[sense] || "bg-muted text-foreground border-border";
        return (
          <div key={sense}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="font-hand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {sense}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {senseWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onInsertWord(w)}
                  className={`rounded-full border px-2.5 py-0.5 font-hand text-[11px] transition-all hover:scale-105 hover:shadow-sm ${color}`}
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
