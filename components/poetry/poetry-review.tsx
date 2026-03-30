"use client";

import { useState, useCallback } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { POETRY_FORMS, countLineSyllables } from "@/lib/poetry-types";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Star,
  Loader2,
  BookOpen,
  BarChart3,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { getCurrentLevel } from "@/lib/current-level";

interface PoetryReviewProps {
  onBack?: () => void;
  onComplete?: () => void;
  userId?: string;
}

export function PoetryReview({ onBack, onComplete, userId }: PoetryReviewProps) {
  const store = usePoetryStore();
  const form = store.form;
  const { topic, lines, aiLog } = store;
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const haikuTargets = [5, 7, 5];
  const haikuOk =
    form === "haiku" &&
    lines
      .slice(0, 3)
      .every((l, i) => countLineSyllables(l.text) === haikuTargets[i]);

  const formDef = form ? POETRY_FORMS[form] : null;

  const fetchReview = useCallback(async () => {
    if (!formDef) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          form: formDef.name,
          topic,
          lines: lines.map((l) => l.text),
          level: getCurrentLevel(),
        }),
      });
      const data = await res.json();
      setFeedback(data.result || "Great poem! Keep writing!");
    } catch {
      setFeedback(
        "---FEEDBACK---\nWonderful effort on your poem! Keep expressing yourself.\n---TIPS---\n* Try reading aloud\n* Add more descriptive words\n* Think about the last line\n---SCORE---\nForm: 3/5\nLanguage: 3/5\nCreativity: 4/5",
      );
    } finally {
      setLoading(false);
    }
  }, [formDef, topic, lines]);

  if (!form || !formDef) return null;

  const parseFeedback = (raw: string) => {
    const fb = raw.match(/---FEEDBACK---([\s\S]*?)(?=---TIPS---|$)/);
    const tips = raw.match(/---TIPS---([\s\S]*?)(?=---SCORE---|$)/);
    const score = raw.match(/---SCORE---([\s\S]*?)$/);
    return {
      feedback: fb ? fb[1].trim() : raw,
      tips: tips
        ? tips[1]
            .trim()
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => l.replace(/^\*\s*/, "").trim())
        : [],
      scores: score ? score[1].trim() : null,
    };
  };

  const parsed = feedback ? parseFeedback(feedback) : null;

  const handleComplete = useCallback(async () => {
    if (userId && formDef) {
      setSaving(true);
      try {
        const content = lines.map((l) => l.text).join("\n");
        await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            stage: "poetryReview",
            poetry: content,
            poetryForm: formDef.name,
            poetryTopic: topic ?? undefined,
            poetryLines: lines.map((l) => ({ id: l.id, text: l.text })),
          }),
        });
      } catch (e) {
        console.error("Save poetry failed:", e);
      } finally {
        setSaving(false);
      }
    }
    onComplete?.();
  }, [userId, formDef, topic, lines, onComplete]);

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/6 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/6 blur-3xl" />

      {onBack && <BackButton onClick={onBack} variant="purple" />}
      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up pl-16 lg:pl-20">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => store.setPhase("editor")}
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl font-hand text-xs text-muted-foreground bg-transparent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Edit More
          </Button>
        </div>

        <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-hand text-xl font-bold text-foreground">
                Your Poem
              </h2>
              <p className="font-hand text-xs text-muted-foreground">
                {formDef.name} -- {topic}
              </p>
            </div>
          </div>

          <div className="my-6 rounded-2xl border-2 border-border/60 bg-muted/20 p-5">
            {lines.map((line, i) => (
              <div key={line.id} className="flex items-baseline gap-3 py-1">
                <span className="shrink-0 font-hand text-[10px] text-muted-foreground/50">
                  {i + 1}
                </span>
                <p className="font-hand text-base leading-relaxed text-foreground">
                  {line.text || (
                    <span className="italic text-muted-foreground/40">
                      (empty line)
                    </span>
                  )}
                </p>
                {form === "haiku" && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-hand text-[9px] font-bold ${
                      countLineSyllables(line.text) === haikuTargets[i]
                        ? "bg-accent/10 text-accent"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {countLineSyllables(line.text)}/{haikuTargets[i]}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="font-hand text-[11px] text-muted-foreground">
                AI suggestions used: {aiLog.filter((l) => l.accepted).length}/{aiLog.length}
              </span>
            </div>
            {form === "haiku" && (
              <div
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${
                  haikuOk
                    ? "border-accent/20 bg-accent/5"
                    : "border-destructive/20 bg-destructive/5"
                }`}
              >
                <span
                  className={`font-hand text-[11px] font-bold ${haikuOk ? "text-accent" : "text-destructive"}`}
                >
                  Syllables: {haikuOk ? "OK" : "Needs adjustment"}
                </span>
              </div>
            )}
          </div>

          {!feedback && (
            <Button
              onClick={fetchReview}
              disabled={loading}
              className="w-full gap-2 rounded-2xl py-3 font-hand text-sm shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? "Getting Feedback..." : "Get AI Feedback"}
            </Button>
          )}

          {parsed && (
            <div className="mt-4 space-y-4 animate-fade-in-up">
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <h4 className="font-hand text-sm font-bold text-foreground">
                    Teacher Feedback
                  </h4>
                </div>
                <p className="font-hand text-sm leading-relaxed text-foreground">
                  {parsed.feedback}
                </p>
              </div>

              {parsed.tips.length > 0 && (
                <div className="rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-secondary-foreground" />
                    <h4 className="font-hand text-sm font-bold text-foreground">
                      Tips to Improve
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {parsed.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2"
                      >
                        <Star className="mt-0.5 h-3 w-3 shrink-0 text-primary/40" />
                        <p className="font-hand text-xs leading-relaxed text-foreground">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsed.scores && (
                <div className="rounded-2xl border-2 border-accent/20 bg-accent/5 p-4">
                  <h4 className="mb-2 font-hand text-sm font-bold text-foreground">
                    Scores
                  </h4>
                  <div className="space-y-1">
                    {parsed.scores.split("\n").filter((l) => l.trim()).map((line, i) => (
                      <p key={i} className="font-hand text-xs text-foreground">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => store.setPhase("editor")}
                  variant="outline"
                  className="flex-1 gap-2 rounded-2xl font-hand text-sm bg-transparent"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Keep Editing
                </Button>
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 gap-2 rounded-2xl font-hand text-sm bg-transparent"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Back to Map
                  </Button>
                )}
                {onComplete ? (
                  <Button
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex-1 gap-2 rounded-2xl font-hand text-sm shadow-lg"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {saving ? "Saving..." : "Save"}
                  </Button>
                ) : (
                  <Link href="/" className="flex-1">
                    <Button className="w-full gap-2 rounded-2xl font-hand text-sm shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
