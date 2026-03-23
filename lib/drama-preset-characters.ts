/**
 * 预设角色类型。具体列表由服务端扫描 `public/dramacharacter/` 返回（见 `/api/drama-presets`），
 * 往该文件夹添加 png/jpg/webp 即可出现在 Toy box，无需改这份文件。
 */
export interface DramaPresetCharacter {
  species: string;
  imageUrl: string;
}

/**
 * 已废弃：角色列表由 `GET /api/drama-presets` 扫描 `public/dramacharacter/` 提供。
 * 保留空数组仅兼容仍 `import { DRAMA_PRESET_CHARACTERS }` 的旧代码，避免构建报错。
 * Toy box 请使用接口返回的数据（见 `components/drama/character-panel.tsx`）。
 */
export const DRAMA_PRESET_CHARACTERS: DramaPresetCharacter[] = [];
