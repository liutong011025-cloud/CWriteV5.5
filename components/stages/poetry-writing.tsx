"use client";

import { useEffect } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { FormChooser } from "@/components/poetry/form-chooser";
import { TopicSetup } from "@/components/poetry/topic-setup";
import { PoetryEditor } from "@/components/poetry/poetry-editor";
import { PoetryReview } from "@/components/poetry/poetry-review";
import PixelPage from "@/components/pixel/pixel-page";

export type PoetryPhase = "choose-form" | "setup-topic" | "editor" | "review";

interface PoetryWritingProps {
  initialPhase?: PoetryPhase;
  userId?: string;
  onBack?: () => void;
  onComplete?: () => void;
  backLabel?: string;
  onTopicSelected?: (topic: string) => void;
}

export default function PoetryWriting({ initialPhase, userId, onBack, onComplete, backLabel, onTopicSelected }: PoetryWritingProps) {
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
        return <TopicSetup onBack={onBack} onTopicSelected={onTopicSelected} />;
      case "editor":
        return <PoetryEditor onBack={onBack} />;
      case "review":
        return <PoetryReview onBack={onBack} onComplete={onComplete} userId={userId} />;
      default:
        return <FormChooser onBack={onBack} backLabel={backLabel} />;
    }
  })();

  return (
    <PixelPage style={{ paddingTop: "128px", paddingBottom: "120px" }}>
      {content}
    </PixelPage>
  );
}
