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
  x: number;
  y: number;
  scale: number;
  dialogue: string;
  thought: string;
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
