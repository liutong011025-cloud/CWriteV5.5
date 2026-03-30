import { create } from "zustand";
import type {
  PoetryForm,
  PoetryLine,
  AISuggestionLog,
  PoetrySnapshot,
} from "./poetry-types";

function genId() {
  return Math.random().toString(36).substring(2, 12);
}

interface PoetryState {
  // Current state
  form: PoetryForm | null;
  topic: string;
  lines: PoetryLine[];
  aiLog: AISuggestionLog[];
  snapshots: PoetrySnapshot[];
  aiUsageCount: number;
  maxAIUsage: number;
  showedOriginalityNotice: boolean;

  // Navigation
  phase: "choose-form" | "setup-topic" | "editor" | "review";

  // Actions
  setForm: (form: PoetryForm) => void;
  setTopic: (topic: string) => void;
  setPhase: (phase: PoetryState["phase"]) => void;

  // Lines
  initLines: (count: number) => void;
  updateLine: (id: string, text: string) => void;
  addLine: () => void;
  removeLine: (id: string) => void;

  // AI
  logAISuggestion: (
    type: AISuggestionLog["type"],
    suggestion: string,
    accepted: boolean,
  ) => void;
  incrementAIUsage: () => void;
  setShowedOriginalityNotice: () => void;

  // Snapshots
  saveSnapshot: (usedAI: boolean) => void;

  // Reset
  reset: () => void;
}

export const usePoetryStore = create<PoetryState>((set, get) => ({
  form: null,
  topic: "",
  lines: [],
  aiLog: [],
  snapshots: [],
  aiUsageCount: 0,
  maxAIUsage: 20,
  showedOriginalityNotice: false,
  phase: "choose-form",

  setForm: (form) => set({ form }),
  setTopic: (topic) => set({ topic }),
  setPhase: (phase) => set({ phase }),

  initLines: (count) =>
    set({
      lines: Array.from({ length: count }, () => ({
        id: genId(),
        text: "",
      })),
    }),

  updateLine: (id, text) =>
    set((s) => ({
      lines: s.lines.map((l) => (l.id === id ? { ...l, text } : l)),
    })),

  addLine: () =>
    set((s) => ({
      lines: [...s.lines, { id: genId(), text: "" }],
    })),

  removeLine: (id) =>
    set((s) => ({
      lines: s.lines.filter((l) => l.id !== id),
    })),

  logAISuggestion: (type, suggestion, accepted) =>
    set((s) => ({
      aiLog: [
        ...s.aiLog,
        { id: genId(), type, suggestion, accepted, timestamp: Date.now() },
      ],
    })),

  incrementAIUsage: () =>
    set((s) => ({ aiUsageCount: s.aiUsageCount + 1 })),

  setShowedOriginalityNotice: () =>
    set({ showedOriginalityNotice: true }),

  saveSnapshot: (usedAI) =>
    set((s) => ({
      snapshots: [
        ...s.snapshots,
        {
          id: genId(),
          lines: s.lines.map((l) => ({ ...l })),
          timestamp: Date.now(),
          usedAI,
        },
      ],
    })),

  reset: () =>
    set({
      form: null,
      topic: "",
      lines: [],
      aiLog: [],
      snapshots: [],
      aiUsageCount: 0,
      showedOriginalityNotice: false,
      phase: "choose-form",
    }),
}));
