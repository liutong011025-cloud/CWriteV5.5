/**
 * 预设角色：public/dramacharacter/ 下的静态图。
 * `species` = 文件名去掉扩展名，会随角色一并传给剧本生成 AI。
 * `imageUrl` 已编码，适配文件名中的空格等字符。
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
