"use client";

import { usePoetryStore } from "@/lib/poetry-store";
import { FormChooser } from "@/components/poetry/form-chooser";
import { TopicSetup } from "@/components/poetry/topic-setup";
import { PoetryEditor } from "@/components/poetry/poetry-editor";
import { PoetryReview } from "@/components/poetry/poetry-review";

export default function PoetryPage() {
  const phase = usePoetryStore((s) => s.phase);

  switch (phase) {
    case "choose-form":
      return <FormChooser />;
    case "setup-topic":
      return <TopicSetup />;
    case "editor":
      return <PoetryEditor />;
    case "review":
      return <PoetryReview />;
    default:
      return <FormChooser />;
  }
}
