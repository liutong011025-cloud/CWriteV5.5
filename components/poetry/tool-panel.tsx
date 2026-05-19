"use client";

import { useState, useCallback } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import type { PoetryForm } from "@/lib/poetry-types";
import { countLineSyllables } from "@/lib/poetry-types";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  BookOpen,
  Hash,
  Wand2,
  Check,
  Info,
} from "lucide-react";
import { getCurrentLevel } from "@/lib/current-level";

interface ToolPanelProps {
  form: PoetryForm;
  topic: string;
  activeLineIndex: number;
  activeWord: string;
  onInsertText: (text: string) => void;
  onReplaceLine: (text: string) => void;
}

export function ToolPanel({ form, topic, activeLineIndex, activeWord, onInsertText, onReplaceLine }: ToolPanelProps) {
  if (form === "couplets") return <RhymePanel topic={topic} word={activeWord} onInsertText={onInsertText} />;
  if (form === "haiku") return <HaikuPanel topic={topic} activeLineIndex={activeLineIndex} onReplaceLine={onReplaceLine} />;
  return <FreeVersePanel topic={topic} activeLineIndex={activeLineIndex} onInsertText={onInsertText} onReplaceLine={onReplaceLine} />;
}

function RhymePanel({ topic, word, onInsertText }: { topic: string; word: string; onInsertText: (text: string) => void }) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedIdx, setUsedIdx] = useState<number | null>(null);
  const store = usePoetryStore();

  const fetchRhymes = useCallback(async () => {
    if (!word.trim()) return;
    if (store.aiUsageCount >= store.maxAIUsage) return;
    setLoading(true);
    store.incrementAIUsage();
    if (!store.showedOriginalityNotice) store.setShowedOriginalityNotice();
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rhyme", topic, word, level: getCurrentLevel() }),
      });
      const data = await res.json();
      const lines = (data.result || "").split("\n").filter((l: string) => l.trim());
      setResults(lines);
      lines.forEach((l: string) => store.logAISuggestion("rhyme", l, false));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [word, topic, store]);

  const handleUse = (line: string, idx: number) => {
    const clean = line.replace(/^\[(Simple|Medium|Fancy)\]\s*/i, "").trim();
    onInsertText(clean);
    setUsedIdx(idx);
    store.logAISuggestion("rhyme", clean, true);
    store.saveSnapshot(true);
    setTimeout(() => setUsedIdx(null), 1200);
  };

  return (
    <div className="styled-scrollbar flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-sm">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-hand text-base font-bold text-foreground">Rhyme Assistant</h3>
          <p className="font-hand text-sm text-muted-foreground">Find rhyming words</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="mb-2 font-hand text-sm text-muted-foreground">
          {word.trim() ? (
            <>Rhymes for: <span className="font-bold text-foreground">{word}</span></>
          ) : (
            "Type a word at the end of a line, then click below."
          )}
        </p>
        <Button
          onClick={fetchRhymes}
          disabled={loading || !word.trim() || store.aiUsageCount >= store.maxAIUsage}
          className="h-auto w-full gap-2 rounded-xl px-4 py-2.5 font-hand text-sm shadow-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Get Rhyme Suggestions
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((line, i) => {
            const match = line.match(/^\[(Simple|Medium|Fancy)\]\s*(.*)/i);
            const level = match ? match[1] : "Simple";
            const word_text = match ? match[2] : line.trim();
            return (
              <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-1.5 py-0.5 font-hand text-[9px] font-bold ${
                    level === "Fancy" ? "bg-chart-4/10 text-chart-4" :
                    level === "Medium" ? "bg-secondary/15 text-secondary-foreground" :
                    "bg-accent/10 text-accent"
                  }`}>{level}</span>
                  <span className="font-hand text-sm text-foreground">{word_text}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-hand text-[8px] text-muted-foreground/60">AI suggestion</span>
                  <button
                    type="button"
                    onClick={() => handleUse(line, i)}
                    className="rounded-lg bg-primary/10 px-2 py-0.5 font-hand text-[10px] font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    {usedIdx === i ? <Check className="inline h-2.5 w-2.5" /> : "Use"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-auto font-hand text-xs text-muted-foreground/50">
        AI suggestions: {store.aiUsageCount}/{store.maxAIUsage} used
      </p>
    </div>
  );
}

function HaikuPanel({ topic, activeLineIndex, onReplaceLine }: { topic: string; activeLineIndex: number; onReplaceLine: (text: string) => void }) {
  const lines = usePoetryStore((s) => s.lines);
  const store = usePoetryStore();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedIdx, setUsedIdx] = useState<number | null>(null);
  const targets = [5, 7, 5];

  const fetchSuggestions = useCallback(async () => {
    const line = lines[activeLineIndex];
    if (!line || !line.text.trim()) return;
    if (store.aiUsageCount >= store.maxAIUsage) return;
    setLoading(true);
    store.incrementAIUsage();
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syllable", topic, word: line.text, lineIndex: activeLineIndex, level: getCurrentLevel() }),
      });
      const data = await res.json();
      const items = (data.result || "").split("\n").filter((l: string) => l.trim());
      setSuggestions(items);
      items.forEach((s: string) => store.logAISuggestion("syllable", s, false));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [activeLineIndex, lines, topic, store]);

  return (
    <div className="styled-scrollbar flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 shadow-sm">
          <Hash className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-hand text-base font-bold text-foreground">Syllable Counter</h3>
          <p className="font-hand text-sm text-muted-foreground">Target: 5 / 7 / 5</p>
        </div>
      </div>

      <div className="space-y-2">
        {lines.slice(0, 3).map((line, i) => {
          const count = countLineSyllables(line.text);
          const target = targets[i];
          const ok = count === target;
          const over = count > target;
          return (
            <div key={line.id} className={`rounded-xl border-2 px-3.5 py-2.5 transition-colors ${
              i === activeLineIndex ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-hand text-sm font-semibold text-muted-foreground">Line {i + 1}</span>
                <span className={`rounded-full px-2.5 py-0.5 font-hand text-xs font-bold ${
                  ok ? "bg-accent/10 text-accent" : over ? "bg-destructive/10 text-destructive" : "bg-secondary/15 text-secondary-foreground"
                }`}>
                  {count} / {target} syllables
                </span>
              </div>
              <p className="mt-1 truncate font-hand text-sm text-foreground">
                {line.text || <span className="italic text-muted-foreground/50">empty</span>}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
        <p className="font-hand text-sm text-muted-foreground leading-relaxed">
          Syllable counts are estimates. Mixed-language text may be less accurate.
        </p>
      </div>

      <Button
        onClick={fetchSuggestions}
        disabled={loading || !lines[activeLineIndex]?.text.trim() || store.aiUsageCount >= store.maxAIUsage}
        className="h-auto gap-2 rounded-xl px-4 py-2.5 font-hand text-sm shadow-sm"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Suggest Alternatives
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((s, i) => {
            const headerMatch = s.match(/^(Shorter|Longer|Alt)\s*:?\s*$/i);
            const lineMatch = s.match(/^\[(Shorter|Longer|Alt)\]\s*(.*)/i);
            const clean = lineMatch ? lineMatch[2].trim() : s.replace(/^\[(Shorter|Longer|Alt)\]\s*/i, "").trim();
            const isSuggestionLine = !headerMatch && clean.length > 0;

            if (headerMatch) {
              return (
                <p key={i} className="mt-2 font-hand text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {headerMatch[1]} alternatives
                </p>
              );
            }

            return (
              <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
                <span className="font-hand text-sm text-foreground">{lineMatch ? clean : s}</span>
                {isSuggestionLine && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="font-hand text-[10px] text-muted-foreground/60">AI suggestion</span>
                    <button
                      type="button"
                      onClick={() => {
                        onReplaceLine(clean);
                        setUsedIdx(i);
                        store.logAISuggestion("syllable", clean, true);
                        store.saveSnapshot(true);
                        setTimeout(() => setUsedIdx(null), 1200);
                      }}
                      className="rounded-lg bg-primary/10 px-2.5 py-1 font-hand text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      {usedIdx === i ? <Check className="inline h-3 w-3" /> : "Use"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-auto font-hand text-xs text-muted-foreground/50">
        AI suggestions: {store.aiUsageCount}/{store.maxAIUsage} used
      </p>
    </div>
  );
}

function FreeVersePanel({ topic, activeLineIndex, onInsertText, onReplaceLine }: { topic: string; activeLineIndex: number; onInsertText: (text: string) => void; onReplaceLine: (text: string) => void }) {
  const lines = usePoetryStore((s) => s.lines);
  const store = usePoetryStore();
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [examples, setExamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedIdx, setUsedIdx] = useState<number | null>(null);

  const DEVICES = [
    { name: "Metaphor", desc: "Comparing two unlike things directly" },
    { name: "Simile", desc: "Comparing using 'like' or 'as'" },
    { name: "Personification", desc: "Giving human traits to non-human things" },
    { name: "Onomatopoeia", desc: "Words that sound like what they mean" },
    { name: "Alliteration", desc: "Repeating the same starting sound" },
  ];

  const fetchExamples = useCallback(async (device: string) => {
    setActiveDevice(device);
    if (store.aiUsageCount >= store.maxAIUsage) return;
    setLoading(true);
    store.incrementAIUsage();
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rhetoric",
          topic,
          lines: lines.map((l) => l.text),
          device,
          activeLine: lines[activeLineIndex]?.text || "",
          level: getCurrentLevel(),
        }),
      });
      const data = await res.json();
      const items = (data.result || "").split("\n").filter((l: string) => l.trim());
      setExamples(items);
      items.forEach((s: string) => store.logAISuggestion("rhetoric", s, false));
    } catch {
      setExamples([]);
    } finally {
      setLoading(false);
    }
  }, [topic, lines, activeLineIndex, store]);

  const handleUse = (text: string, idx: number) => {
    const clean = text.replace(/^[\d.)\-*]+\s*/, "").trim();
    onReplaceLine(clean);
    setUsedIdx(idx);
    store.logAISuggestion("rhetoric", clean, true);
    store.saveSnapshot(true);
    setTimeout(() => setUsedIdx(null), 1200);
  };

  return (
    <div className="styled-scrollbar flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 shadow-sm">
          <Wand2 className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div>
          <h3 className="font-hand text-base font-bold text-foreground">Rhetorical Devices</h3>
          <p className="font-hand text-sm text-muted-foreground">Add literary techniques</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {DEVICES.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => fetchExamples(d.name)}
            className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-2 text-left font-hand text-sm transition-all ${
              activeDevice === d.name
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-foreground hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <span>{d.name} <span className="text-[10px] text-muted-foreground">{d.desc}</span></span>
            {loading && activeDevice === d.name && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </button>
        ))}
      </div>

      {examples.length > 0 && activeDevice && (
        <div className="space-y-1.5">
          <p className="font-hand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {lines[activeLineIndex]?.text?.trim()
              ? `Rewriting Line ${activeLineIndex + 1} with ${activeDevice}`
              : `${activeDevice} suggestions for your poem`}
          </p>
          {lines[activeLineIndex]?.text?.trim() && (
            <div className="rounded-lg bg-muted/50 px-2.5 py-1.5">
              <p className="font-hand text-[10px] text-muted-foreground">
                Your line: <span className="font-bold text-foreground">{lines[activeLineIndex]?.text}</span>
              </p>
            </div>
          )}
          {examples.map((ex, i) => {
            const clean = ex.replace(/^[\d.)\-*]+\s*/, "").trim();
            return (
              <div key={i} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <p className="font-hand text-xs italic leading-relaxed text-foreground">{clean}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-hand text-[8px] text-muted-foreground/60">AI suggestion</span>
                  <button
                    type="button"
                    onClick={() => handleUse(ex, i)}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 font-hand text-[10px] font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    {usedIdx === i ? <Check className="h-2.5 w-2.5" /> : "Use"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-auto font-hand text-xs text-muted-foreground/50">
        AI suggestions: {store.aiUsageCount}/{store.maxAIUsage} used
      </p>
    </div>
  );
}
