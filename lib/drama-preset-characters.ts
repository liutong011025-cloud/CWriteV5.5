/**
 * 预设角色类型。
 * - 优先：`GET /api/drama-presets` 扫描 `public/dramacharacter/`（有图则完全以文件夹为准）。
 * - 回退：读目录失败或接口异常时使用下方 `DRAMA_PRESET_CHARACTERS` 内置列表（路径仍为 `/dramacharacter/文件名`）。
 */
export interface DramaPresetCharacter {
  species: string;
  imageUrl: string;
}

const PRESET_FILENAMES = [
  "Alchemist Mage.webp",
  "Armored Knight.webp",
  "barber.webp",
  "Bear Guard.webp",
  "Bird Scholar.webp",
  "bussinessman.webp",
  "Cat Server.webp",
  "Court Musician.webp",
  "Dark Hunter.webp",
  "Deer Noble.webp",
  "designer.webp",
  "educationexpert.webp",
  "Elephant Trader.webp",
  "engineeree.webp",
  "farmer.webp",
  "fireman.webp",
  "Fox Vendor.webp",
  "frog.webp",
  "Glyph Walker.webp",
  "Medieval Archer.webp",
  "Monkey Mechanic.webp",
  "Neon Servo.webp",
  "nurse.webp",
  "Orb Culler.webp",
  "penguin police.webp",
  "photographer.webp",
  "Pirate Sailor.webp",
  "Plant Alien.webp",
  "police.webp",
  "principle.webp",
  "professor.webp",
  "Rabbit Postman.webp",
  "singer.webp",
  "SoftAlien Scientist.webp",
  "softwareengineer.webp",
  "student.webp",
  "teacher.webp",
  "Victorian Explorer.webp",
  "Victorian Gentleman.webp",
  "Wolf Hunter.webp",
  "Wuxia Swordswoman.webp",
  "yogateacher.webp",
] as const;

function filenameToSpecies(filename: string): string {
  return filename.replace(/\.(png|jpe?g|webp)$/i, "");
}

export const DRAMA_PRESET_CHARACTERS: DramaPresetCharacter[] =
  PRESET_FILENAMES.map((filename) => ({
    species: filenameToSpecies(filename),
    imageUrl: `/dramacharacter/${encodeURIComponent(filename)}`,
  }));
