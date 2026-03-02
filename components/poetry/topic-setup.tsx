"use client";

import { useState } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { POETRY_FORMS, TOPIC_PRESETS } from "@/lib/poetry-types";
import { ArrowLeft, ArrowRight, MapPin, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopicSetupProps {
  onBack?: () => void;
}

export function TopicSetup({ onBack }: TopicSetupProps) {
  const form = usePoetryStore((s) => s.form);
  const setTopic = usePoetryStore((s) => s.setTopic);
  const setPhase = usePoetryStore((s) => s.setPhase);
  const initLines = usePoetryStore((s) => s.initLines);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  if (!form) return null;
  const formDef = POETRY_FORMS[form];
  const lineCount = typeof formDef.lineCount === "number"
    ? formDef.lineCount
    : formDef.lineCount[0];

  const handleStart = () => {
    const topic = selectedPreset || customTopic.trim();
    if (!topic) return;
    setTopic(topic);
    initLines(lineCount);
    setPhase("editor");
  };

  const activeTopic = selectedPreset || customTopic.trim();

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-56 w-56 rounded-full bg-accent/6 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setPhase("choose-form")}
            variant="ghost"
            size="sm"
            className="gap-1.5 rounded-xl font-hand text-sm text-muted-foreground bg-transparent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Choose Another Form
          </Button>
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl font-hand text-sm text-muted-foreground bg-transparent"
            >
              <MapPin className="h-3.5 w-3.5" />
              Back to Map
            </Button>
          )}
        </div>

        <div className="rounded-3xl border-2 border-border bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-hand text-xl font-bold text-foreground">
                Pick a Topic
              </h2>
              <p className="font-hand text-xs text-muted-foreground">
                {formDef.name}
              </p>
            </div>
          </div>

          <p className="mt-3 mb-5 font-hand text-sm text-muted-foreground leading-relaxed">
            What do you want to write about? Choose a preset topic or type your own.
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {TOPIC_PRESETS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setSelectedPreset(
                    selectedPreset === t.label ? null : t.label,
                  );
                  setCustomTopic("");
                }}
                className={`rounded-2xl border-2 px-4 py-2 font-hand text-sm transition-all ${
                  selectedPreset === t.label
                    ? "border-primary bg-primary/10 font-bold text-primary shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span className="block text-sm">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="relative mb-6">
            <Input
              placeholder="Or type your own topic..."
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                setSelectedPreset(null);
              }}
              className="rounded-2xl border-2 border-border bg-background px-4 py-3 font-hand text-sm focus:border-primary"
            />
          </div>

          <Button
            onClick={handleStart}
            disabled={!activeTopic}
            className="w-full gap-2 rounded-2xl py-3 font-hand text-base shadow-lg disabled:opacity-40"
          >
            Start Writing
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
