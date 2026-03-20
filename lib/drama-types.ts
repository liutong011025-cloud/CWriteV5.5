export interface Character {
  id: string;
  name: string;
  species: string;
  appearance: string;
  imageUrl: string | null;
  isGenerating: boolean;
  /** 玩偶箱立绘：物种固定为图片文件名（无扩展名），勿与 AI 剧本描述冲突 */
  speciesIsFromPresetFile?: boolean;
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
