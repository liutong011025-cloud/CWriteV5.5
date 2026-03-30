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
  "Alchemist Mage.png",
  "Armored Knight.png",
  "barber.png",
  "Bear Guard.png",
  "Bird Scholar.png",
  "bussinessman.png",
  "Cat Server.png",
  "Court Musician.png",
  "Dark Hunter.png",
  "Deer Noble.png",
  "designer.png",
  "educationexpert.png",
  "Elephant Trader.png",
  "engineeree.png",
  "farmer.png",
  "fireman.png",
  "Fox Vendor.png",
  "frog.png",
  "Glyph Walker.png",
  "Medieval Archer.png",
  "Monkey Mechanic.png",
  "Neon Servo.png",
  "nurse.png",
  "Orb Culler.png",
  "penguin police.png",
  "photographer.png",
  "Pirate Sailor.png",
  "Plant Alien.png",
  "police.png",
  "principle.png",
  "professor.png",
  "Rabbit Postman.png",
  "singer.png",
  "SoftAlien Scientist.png",
  "softwareengineer.png",
  "student.png",
  "teacher.png",
  "Victorian Explorer.png",
  "Victorian Gentleman.png",
  "Wolf Hunter.png",
  "Wuxia Swordswoman.png",
  "yogateacher.png",
] as const;

function filenameToSpecies(filename: string): string {
  return filename.replace(/\.(png|jpe?g|webp)$/i, "");
}

export const DRAMA_PRESET_CHARACTERS: DramaPresetCharacter[] =
  PRESET_FILENAMES.map((filename) => ({
    species: filenameToSpecies(filename),
    imageUrl: `/dramacharacter/${encodeURIComponent(filename)}`,
  }));
