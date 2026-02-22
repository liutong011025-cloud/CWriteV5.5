export interface Character {
  id: string;
  name: string;
  species: string;
  appearance: string;
  imageUrl: string | null;
  isGenerating: boolean;
}

export interface PlacedCharacter {
  characterId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  dialogue: string;
  thought: string;
  size?: number; // character size multiplier, default 1.0 (100%)
}

export interface Scene {
  id: string;
  backgroundPrompt: string;
  backgroundImageUrl: string | null;
  isGeneratingBg: boolean;
  characters: PlacedCharacter[];
  notes: string;
}

export interface DramaProject {
  scenes: Scene[];
  characters: Character[];
  title: string;
}

export interface DramaBookData {
  summary: string;
  script: string;
  suggestions: string[];
}
