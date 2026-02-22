export type PoetryForm = "couplets" | "haiku" | "freeverse";

export interface PoetryLine {
  id: string;
  text: string;
}

export interface AISuggestionLog {
  id: string;
  type: "rhyme" | "syllable" | "rhetoric" | "synonym" | "general";
  suggestion: string;
  accepted: boolean;
  timestamp: number;
}

export interface PoetrySnapshot {
  id: string;
  lines: PoetryLine[];
  timestamp: number;
  usedAI: boolean;
}

export interface PoetryProject {
  form: PoetryForm;
  topic: string;
  lines: PoetryLine[];
  aiLog: AISuggestionLog[];
  snapshots: PoetrySnapshot[];
  aiUsageCount: number;
  maxAIUsage: number;
  showedOriginalityNotice: boolean;
}

// Form definitions with rules
export const POETRY_FORMS: Record<
  PoetryForm,
  {
    name: string;
    rules: string;
    lineCount: number | [number, number]; // fixed or [min, max]
    example: { lines: string[]; author?: string; title?: string };
  }
> = {
  couplets: {
    name: "Rhyming Couplets",
    rules: "Pairs of lines that rhyme at the end. Keep each line under 8 words.",
    lineCount: 4,
    example: {
      lines: [
        "My little kite",
        "Flies high at night",
        "Above the trees so tall",
        "It never seems to fall",
      ],
      title: "My Kite",
    },
  },
  haiku: {
    name: "Haiku",
    rules: "3 lines with 5-7-5 syllable pattern. Capture a single moment.",
    lineCount: 3,
    example: {
      lines: [
        "Autumn moonlight --",
        "a worm digs silently",
        "into the chestnut",
      ],
      author: "Matsuo Basho",
    },
  },
  freeverse: {
    name: "Free Verse",
    rules: "No fixed rules -- express yourself freely! 4-8 lines recommended.",
    lineCount: [4, 8],
    example: {
      lines: [
        "Walking home from school",
        "The puddles mirror the sky",
        "My shoes are muddy",
        "But my heart is light",
        "Because tomorrow is Saturday",
      ],
      title: "After School",
    },
  },
};

export const TOPIC_PRESETS = [
  { label: "School" },
  { label: "Harbour" },
  { label: "Festivals" },
  { label: "Food" },
  { label: "Animals" },
  { label: "Nature" },
  { label: "Family" },
  { label: "Dreams" },
] as const;

// Sensory word cards for inspiration panel
export const SENSORY_WORDS: Record<string, string[]> = {
  sight: ["bright", "golden", "shadowy", "sparkling", "misty", "glowing"],
  sound: ["whisper", "roar", "echo", "hum", "rustle", "crackle"],
  smell: ["fragrant", "fresh", "smoky", "sweet", "salty", "earthy"],
  touch: ["soft", "rough", "warm", "cool", "silky", "prickly"],
  taste: ["sweet", "bitter", "tangy", "spicy", "savory", "crisp"],
};

// Simple syllable counter (heuristic)
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return w.length > 0 ? 1 : 0;
  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith("e") && count > 1) count--;
  if (w.endsWith("le") && !vowels.includes(w[w.length - 3])) count++;
  return Math.max(1, count);
}

export function countLineSyllables(line: string): number {
  return line
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .reduce((sum, word) => sum + countSyllables(word), 0);
}

export function countLineWords(line: string): number {
  return line
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
