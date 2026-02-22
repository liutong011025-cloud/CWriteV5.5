"use client";

import { useEffect } from "react";
import { usePoetryStore } from "@/lib/poetry-store";
import { FormChooser } from "@/components/poetry/form-chooser";
import { TopicSetup } from "@/components/poetry/topic-setup";
import { PoetryEditor } from "@/components/poetry/poetry-editor";
import { PoetryReview } from "@/components/poetry/poetry-review";

interface PoetryWritingProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export default function PoetryWriting({ onBack, onComplete }: PoetryWritingProps) {
  const phase = usePoetryStore((s) => s.phase);

  useEffect(() => {
    usePoetryStore.getState().reset();
  }, []);

  switch (phase) {
    case "choose-form":
      return <FormChooser onBack={onBack} />;
    case "setup-topic":
      return <TopicSetup />;
    case "editor":
      return <PoetryEditor />;
    case "review":
      return <PoetryReview onComplete={onComplete} />;
    default:
      return <FormChooser onBack={onBack} />;
  }
}
