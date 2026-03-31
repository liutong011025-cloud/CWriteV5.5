"use client";

import { useState } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { POETRY_FORMS, TOPIC_PRESETS } from "@/lib/poetry-types";
import { ArrowLeft, ArrowRight, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";

interface TopicSetupProps {
  onBack?: () => void;
  onTopicSelected?: (topic: string) => void;
}

export function TopicSetup({ onBack, onTopicSelected }: TopicSetupProps) {
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
    onTopicSelected?.(topic);
    initLines(lineCount);
    setPhase("editor");
  };

  const activeTopic = selectedPreset || customTopic.trim();

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-transparent px-4 py-8">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />

      {onBack && <BackButton onClick={onBack} variant="purple" />}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up pl-16 lg:pl-20">
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
        </div>

        <div className="pixel-panel p-6 shadow-xl sm:p-8">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center shadow-sm pixel-card" style={{ background: "#e8c547" }}>
              <Palette className="h-5 w-5" style={{ color: "#5a4a2a" }} />
            </div>
            <div>
              <h2 className="font-hand text-xl font-bold pixel-title" style={{ color: "#6b5210" }}>
                Pick a Topic
              </h2>
              <p className="font-hand text-xs pixel-text" style={{ color: "#5a4a2a" }}>
                {formDef.name}
              </p>
            </div>
          </div>

          <p className="mt-3 mb-5 font-hand text-sm leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
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
                className={`pixel-btn px-4 py-2 font-hand text-sm transition-all ${
                  selectedPreset === t.label
                    ? "pixel-btn-green font-bold"
                    : "pixel-btn-wood"
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
              className="rounded-2xl border-2 px-4 py-3 font-hand text-sm"
              style={{ background: "#f5e6c8", borderColor: "#8b6914" }}
            />
          </div>

          <Button
            onClick={handleStart}
            disabled={!activeTopic}
            className="w-full gap-2 py-3 font-hand text-base shadow-lg disabled:opacity-40 pixel-btn pixel-btn-green"
          >
            Start Writing
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
