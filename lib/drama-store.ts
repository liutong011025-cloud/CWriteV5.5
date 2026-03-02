import { create } from "zustand";
import type { Character, DramaBookData, PlacedCharacter, Scene } from "./drama-types";

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

interface DramaState {
  scenes: Scene[];
  characters: Character[];
  title: string;
  activeSceneIndex: number;
  dramaBook: DramaBookData | null;
  isGeneratingBook: boolean;

  addScene: () => void;
  removeScene: (sceneId: string) => void;
  setActiveScene: (index: number) => void;
  updateSceneBgPrompt: (sceneId: string, prompt: string) => void;
  setSceneBgImage: (sceneId: string, url: string) => void;
  setSceneBgGenerating: (sceneId: string, generating: boolean) => void;
  updateSceneNotes: (sceneId: string, notes: string) => void;

  addCharacter: (name: string) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  addCharacterToScene: (sceneId: string, characterId: string) => void;
  removeCharacterFromScene: (sceneId: string, characterId: string) => void;
  updatePlacedCharacter: (
    sceneId: string,
    characterId: string,
    updates: Partial<PlacedCharacter>
  ) => void;
  moveCharacterInScene: (
    sceneId: string,
    characterId: string,
    x: number,
    y: number
  ) => void;
  resizeCharacterInScene: (
    sceneId: string,
    characterId: string,
    scale: number
  ) => void;

  setDramaBook: (data: DramaBookData | null) => void;
  setGeneratingBook: (generating: boolean) => void;
  setTitle: (title: string) => void;
  reset: () => void;
}

const createDefaultScene = (): Scene => ({
  id: generateId(),
  backgroundPrompt: "",
  backgroundImageUrl: null,
  isGeneratingBg: false,
  characters: [],
  notes: "",
});

export const useDramaStore = create<DramaState>((set, get) => ({
  scenes: [createDefaultScene()],
  characters: [],
  title: "My Amazing Drama",
  activeSceneIndex: 0,
  dramaBook: null,
  isGeneratingBook: false,

  addScene: () =>
    set((state) => ({
      scenes: [...state.scenes, createDefaultScene()],
      activeSceneIndex: state.scenes.length,
    })),

  removeScene: (sceneId) =>
    set((state) => {
      const newScenes = state.scenes.filter((s) => s.id !== sceneId);
      if (newScenes.length === 0) newScenes.push(createDefaultScene());
      return {
        scenes: newScenes,
        activeSceneIndex: Math.min(
          state.activeSceneIndex,
          newScenes.length - 1
        ),
      };
    }),

  setActiveScene: (index) => set({ activeSceneIndex: index }),

  updateSceneBgPrompt: (sceneId, prompt) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, backgroundPrompt: prompt } : s
      ),
    })),

  setSceneBgImage: (sceneId, url) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, backgroundImageUrl: url, isGeneratingBg: false }
          : s
      ),
    })),

  setSceneBgGenerating: (sceneId, generating) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, isGeneratingBg: generating } : s
      ),
    })),

  updateSceneNotes: (sceneId, notes) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId ? { ...s, notes } : s
      ),
    })),

  addCharacter: (name) => {
    const char: Character = {
      id: generateId(),
      name,
      species: "",
      appearance: "",
      imageUrl: null,
      isGenerating: false,
    };
    set((state) => ({ characters: [...state.characters, char] }));
    return char;
  },

  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      scenes: state.scenes.map((s) => ({
        ...s,
        characters: s.characters.filter((pc) => pc.characterId !== id),
      })),
    })),

  addCharacterToScene: (sceneId, characterId) =>
    set((state) => ({
      scenes: state.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        if (s.characters.find((c) => c.characterId === characterId)) return s;
        return {
          ...s,
          characters: [
            ...s.characters,
            {
              characterId,
              x: 30 + Math.random() * 40,
              y: 40 + Math.random() * 30,
              scale: 1.0,
              dialogue: "",
              thought: "",
            },
          ],
        };
      }),
    })),

  removeCharacterFromScene: (sceneId, characterId) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              characters: s.characters.filter(
                (c) => c.characterId !== characterId
              ),
            }
          : s
      ),
    })),

  updatePlacedCharacter: (sceneId, characterId, updates) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              characters: s.characters.map((c) =>
                c.characterId === characterId ? { ...c, ...updates } : c
              ),
            }
          : s
      ),
    })),

  moveCharacterInScene: (sceneId, characterId, x, y) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              characters: s.characters.map((c) =>
                c.characterId === characterId ? { ...c, x, y } : c
              ),
            }
          : s
      ),
    })),

  resizeCharacterInScene: (sceneId, characterId, scale) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              characters: s.characters.map((c) =>
                c.characterId === characterId
                  ? { ...c, scale: Math.max(0.3, Math.min(3.0, scale)) }
                  : c
              ),
            }
          : s
      ),
    })),

  setDramaBook: (data) => set({ dramaBook: data, isGeneratingBook: false }),
  setGeneratingBook: (generating) => set({ isGeneratingBook: generating }),
  setTitle: (title) => set({ title }),
  reset: () =>
    set({
      scenes: [createDefaultScene()],
      characters: [],
      title: "My Amazing Drama",
      activeSceneIndex: 0,
      dramaBook: null,
      isGeneratingBook: false,
    }),
}));
