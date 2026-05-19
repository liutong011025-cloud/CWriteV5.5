"use client";

import { useState, useRef } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import {
  POETRY_FORMS,
  countLineSyllables,
  countLineWords,
} from "@/lib/poetry-types";
import { InspirationPanel } from "./inspiration-panel";
import { ToolPanel } from "./tool-panel";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  BookOpen,
  Info,
  Sparkles,
  Star,
} from "lucide-react";

interface PoetryEditorProps {
  onBack?: () => void;
}

export function PoetryEditor({ onBack }: PoetryEditorProps) {
  const store = usePoetryStore();
  const { form, topic, lines } = store;
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const formDef = form ? POETRY_FORMS[form] : null;
  const haikuTargets = [5, 7, 5];

  const activeWord = () => {
    const line = lines[activeLineIndex];
    if (!line) return "";
    const words = line.text.trim().split(/\s+/);
    return words[words.length - 1] || "";
  };

  const canAddLine =
    form === "freeverse" &&
    formDef &&
    lines.length < (typeof formDef.lineCount === "number" ? formDef.lineCount : formDef.lineCount[1]);
  const canRemoveLine =
    form === "freeverse" &&
    formDef &&
    lines.length > (typeof formDef.lineCount === "number" ? formDef.lineCount : formDef.lineCount[0]);

  const handleInsertWord = (word: string) => {
    const line = lines[activeLineIndex];
    if (!line) return;
    const newText = line.text ? `${line.text} ${word}` : word;
    store.updateLine(line.id, newText);
    inputRefs.current[activeLineIndex]?.focus();
  };

  const handleInsertText = (text: string) => {
    const line = lines[activeLineIndex];
    if (!line) return;
    const newText = line.text ? `${line.text} ${text}` : text;
    store.updateLine(line.id, newText);
    inputRefs.current[activeLineIndex]?.focus();
  };

  const handleReplaceLine = (text: string) => {
    const line = lines[activeLineIndex];
    if (!line) return;
    store.updateLine(line.id, text);
    inputRefs.current[activeLineIndex]?.focus();
  };

  const handleFinish = () => {
    store.saveSnapshot(false);
    store.setPhase("review");
  };

  const hasContent = lines.some((l) => l.text.trim().length > 0);

  if (!form || !formDef) return null;

  return (
    <div className="relative flex min-h-screen flex-col bg-transparent">
      {onBack && <BackButton onClick={onBack} variant="purple" />}
      <header className="relative z-20 border-b border-border/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => store.setPhase("setup-topic")}
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl font-hand text-xs text-muted-foreground bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center pixel-card" style={{ background: "#e8c547" }}>
                <BookOpen className="h-3.5 w-3.5" style={{ color: "#5a4a2a" }} />
              </div>
              <div>
                <p className="font-hand text-sm font-bold pixel-text" style={{ color: "#6b5210" }}>
                  {formDef.name}
                </p>
                <p className="font-hand text-sm pixel-text" style={{ color: "#5a4a2a" }}>{formDef.rules}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExample((p) => !p)}
              className="pixel-btn pixel-btn-wood px-4 py-2 font-hand text-sm"
            >
              {showExample ? "Hide" : "Show"} Example
            </button>
            <Button
              onClick={handleFinish}
              disabled={!hasContent}
              size="sm"
              className="gap-1.5 font-hand text-sm shadow-md pixel-btn pixel-btn-green"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finish & Review
            </Button>
          </div>
        </div>

        {showExample && (
          <div className="border-t border-border/30 px-4 py-3 animate-fade-in-up" style={{ background: "rgba(245,230,200,0.55)" }}>
            <div className="mx-auto max-w-7xl">
              <p className="mb-1 font-hand text-[10px] font-bold uppercase tracking-wider pixel-text" style={{ color: "#6b5210" }}>
                Example {formDef.example.title ? `-- ${formDef.example.title}` : ""}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-0.5">
                {formDef.example.lines.map((l, i) => (
                  <p key={i} className="font-hand text-xs italic pixel-text" style={{ color: "#5a4a2a" }}>{l}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:gap-6 lg:p-6">
        <aside className="hidden w-64 shrink-0 pixel-panel p-4 shadow-md lg:block xl:w-72">
          <InspirationPanel topic={topic} onInsertWord={handleInsertWord} />
        </aside>

        <section className="flex flex-1 flex-col">
          <div className="relative flex-1 pixel-panel p-5 shadow-lg sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 8px)" }} />

            <div className="relative z-10 mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-hand text-lg font-bold pixel-text" style={{ color: "#6b5210" }}>Your Poem</h2>
                <p className="font-hand text-xs pixel-text" style={{ color: "#5a4a2a" }}>Topic: {topic}</p>
              </div>

              {form === "freeverse" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => store.addLine()}
                    disabled={!canAddLine}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={() => {
                      const last = lines[lines.length - 1];
                      if (last && canRemoveLine) store.removeLine(last.id);
                    }}
                    disabled={!canRemoveLine}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-lg p-0 bg-transparent"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="relative z-10 space-y-3">
              {lines.map((line, i) => {
                const isActive = i === activeLineIndex;
                const syllables = form === "haiku" ? countLineSyllables(line.text) : 0;
                const target = form === "haiku" ? haikuTargets[i] : 0;
                const wordCount = form === "couplets" ? countLineWords(line.text) : 0;
                const isRhymeLine = form === "couplets" && (i % 2 === 1);

                return (
                  <div
                    key={line.id}
                    className={`relative border-2 transition-all pixel-card ${
                      isActive
                        ? "shadow-sm"
                        : ""
                    }`}
                    style={
                      isActive
                        ? { borderColor: "#5a9a32", background: "#d4e8b4" }
                        : { borderColor: "#8b6914", background: "#f5e6c8" }
                    }
                  >
                    <div className="flex items-center justify-between px-3 pt-2">
                      <span className="font-hand text-[10px] font-bold pixel-text" style={{ color: "#6b5210" }}>
                        Line {i + 1}
                        {isRhymeLine && (
                          <span className="ml-1 pixel-text" style={{ color: "#3a8aa3" }}>(rhymes with line {i})</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {form === "haiku" && (
                          <span className={`rounded-full px-2 py-0.5 font-hand text-[10px] font-bold ${
                            syllables === target ? "bg-accent/10 text-accent" :
                            syllables > target ? "bg-destructive/10 text-destructive" :
                            "bg-secondary/15 text-secondary-foreground"
                          }`}>
                            {syllables}/{target}
                          </span>
                        )}
                        {form === "couplets" && line.text.trim() && (
                          <span className={`rounded-full px-2 py-0.5 font-hand text-[10px] ${
                            wordCount > 8 ? "font-bold bg-destructive/10 text-destructive" : "text-muted-foreground"
                          }`}>
                            {wordCount} words
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      value={line.text}
                      onChange={(e) => store.updateLine(line.id, e.target.value)}
                      onFocus={() => setActiveLineIndex(i)}
                      placeholder={
                        form === "haiku" ? `${haikuTargets[i]} syllables...` :
                        form === "couplets" ? (isRhymeLine ? "Make it rhyme..." : "Start writing...") :
                        "Write freely..."
                      }
                      className="w-full bg-transparent px-3 pb-2.5 pt-1 font-hand text-base placeholder:text-muted-foreground/40 focus:outline-none pixel-text"
                      style={{ color: "#5a4a2a" }}
                    />
                  </div>
                );
              })}
            </div>

            {store.showedOriginalityNotice && store.aiUsageCount === 1 && (
              <div className="relative z-10 mt-4 flex items-start gap-2 pixel-card p-3 animate-fade-in-up" style={{ background: "#e8c547" }}>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#5a4a2a" }} />
                <p className="font-hand text-[11px] leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
                  AI suggestions are for inspiration only. Your final poem should be your own creation!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pixel-panel p-4 shadow-md lg:hidden">
            <InspirationPanel topic={topic} onInsertWord={handleInsertWord} />
          </div>
        </section>

        <aside className="hidden w-72 shrink-0 pixel-panel p-4 shadow-md md:block xl:w-80">
          <ToolPanel
            form={form}
            topic={topic}
            activeLineIndex={activeLineIndex}
            activeWord={activeWord()}
            onInsertText={handleInsertText}
            onReplaceLine={handleReplaceLine}
          />
        </aside>
      </main>

      <Star className="pointer-events-none absolute top-24 right-[10%] h-4 w-4 text-secondary/15 animate-float" />
      <Sparkles className="pointer-events-none absolute bottom-20 left-[8%] h-4 w-4 text-primary/10 animate-float-delayed" />
    </div>
  );
}
