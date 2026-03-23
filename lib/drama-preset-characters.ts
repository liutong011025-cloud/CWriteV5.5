/**
 * 预设角色类型。具体列表由服务端扫描 `public/dramacharacter/` 返回（见 `/api/drama-presets`），
 * 往该文件夹添加 png/jpg/webp 即可出现在 Toy box，无需改这份文件。
 */
export interface DramaPresetCharacter {
  species: string;
  imageUrl: string;
}
