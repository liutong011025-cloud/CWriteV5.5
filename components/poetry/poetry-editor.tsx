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
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="relative z-20 border-b border-border/30 bg-card/50 backdrop-blur-sm">
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
            {onBack && (
              <Button
                onClick={onBack}
                variant="ghost"
                className="transition-transform duration-200 hover:scale-110 bg-transparent p-0 h-auto w-auto"
                title="Back"
              >
                <img src="/back.png" alt="Back" className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
              </Button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="font-hand text-xs font-bold text-foreground">
                  {formDef.name}
                </p>
                <p className="font-hand text-[10px] text-muted-foreground">{formDef.rules}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExample((p) => !p)}
              className="rounded-xl border border-border bg-card px-3 py-1.5 font-hand text-[11px] text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
            >
              {showExample ? "Hide" : "Show"} Example
            </button>
            <Button
              onClick={handleFinish}
              disabled={!hasContent}
              size="sm"
              className="gap-1.5 rounded-xl font-hand text-xs shadow-md"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finish & Review
            </Button>
          </div>
        </div>

        {showExample && (
          <div className="border-t border-border/30 bg-muted/30 px-4 py-3 animate-fade-in-up">
            <div className="mx-auto max-w-7xl">
              <p className="mb-1 font-hand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Example {formDef.example.title ? `-- ${formDef.example.title}` : ""}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-0.5">
                {formDef.example.lines.map((l, i) => (
                  <p key={i} className="font-hand text-xs italic text-foreground/70">{l}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:gap-6 lg:p-6">
        <aside className="hidden w-56 shrink-0 rounded-3xl border-2 border-border bg-card/60 p-4 shadow-md backdrop-blur-sm lg:block">
          <InspirationPanel topic={topic} onInsertWord={handleInsertWord} />
        </aside>

        <section className="flex flex-1 flex-col">
          <div className="relative flex-1 rounded-3xl border-2 border-border bg-card/70 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="pointer-events-none absolute inset-0 pattern-dots-dense opacity-30 rounded-3xl" />

            <div className="relative z-10 mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-hand text-lg font-bold text-foreground">Your Poem</h2>
                <p className="font-hand text-xs text-muted-foreground">Topic: {topic}</p>
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
                    className={`relative rounded-2xl border-2 transition-all ${
                      isActive
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between px-3 pt-2">
                      <span className="font-hand text-[10px] font-bold text-muted-foreground">
                        Line {i + 1}
                        {isRhymeLine && (
                          <span className="ml-1 text-primary">(rhymes with line {i})</span>
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
                      className="w-full bg-transparent px-3 pb-2.5 pt-1 font-hand text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {store.showedOriginalityNotice && store.aiUsageCount === 1 && (
              <div className="relative z-10 mt-4 flex items-start gap-2 rounded-xl border border-secondary/30 bg-secondary/5 p-3 animate-fade-in-up">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary-foreground" />
                <p className="font-hand text-[11px] leading-relaxed text-secondary-foreground">
                  AI suggestions are for inspiration only. Your final poem should be your own creation!
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl border-2 border-border bg-card/60 p-4 shadow-md backdrop-blur-sm lg:hidden">
            <InspirationPanel topic={topic} onInsertWord={handleInsertWord} />
          </div>
        </section>

        <aside className="hidden w-64 shrink-0 rounded-3xl border-2 border-border bg-card/60 p-4 shadow-md backdrop-blur-sm md:block">
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
