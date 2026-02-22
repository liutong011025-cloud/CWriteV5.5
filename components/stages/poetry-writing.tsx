"use client";

import { useEffect } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { FormChooser } from "@/components/poetry/form-chooser";
import { TopicSetup } from "@/components/poetry/topic-setup";
import { PoetryEditor } from "@/components/poetry/poetry-editor";
import { PoetryReview } from "@/components/poetry/poetry-review";

export type PoetryPhase = "choose-form" | "setup-topic" | "editor" | "review";

interface PoetryWritingProps {
  initialPhase?: PoetryPhase;
  onBack?: () => void;
  onComplete?: () => void;
  backLabel?: string;
}

export default function PoetryWriting({ initialPhase, onBack, onComplete, backLabel }: PoetryWritingProps) {
  const phase = usePoetryStore((s) => s.phase);
  const setPhase = usePoetryStore((s) => s.setPhase);

  useEffect(() => {
    if (initialPhase != null) {
      setPhase(initialPhase);
      return;
    }
    usePoetryStore.getState().reset();
  }, [initialPhase, setPhase]);

  const content = (() => {
    switch (phase) {
      case "choose-form":
        return <FormChooser onBack={onBack} backLabel={backLabel} />;
      case "setup-topic":
        return <TopicSetup onBack={onBack} />;
      case "editor":
        return <PoetryEditor onBack={onBack} />;
      case "review":
        return <PoetryReview onBack={onBack} onComplete={onComplete} />;
      default:
        return <FormChooser onBack={onBack} backLabel={backLabel} />;
    }
  })();

  return (
    <div
      className="relative min-h-screen"
      style={{ paddingTop: "128px", paddingBottom: "120px" }}
    >
      {content}
    </div>
  );
}
