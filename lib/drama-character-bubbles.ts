/**
 * Toy box 悬停短语气泡：按图片文件名（无扩展名，即 species）配置。
 * 未在映射表中的角色不显示气泡，之后在表里追加即可。
 */

function alienGibberish(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const syllables = ["Zy", "qop", "nar", "vul", "tri", "kex", "mno", "plu", "xai", "brr"];
  const pick = (n: number) => syllables[(h + n * 17) % syllables.length];
  const a = pick(1);
  const b = pick(2);
  const c = pick(3);
  const d = pick(4);
  const num = (h % 97) + 3;
  return `${a}${b}-${c}${d} (${num})`;
}

const BUBBLES: Record<string, string> = {
  "alchemist mage": "Hi! Want to brew a plot twist together?",
  "armored knight": "Hello, knight! Ready to charge into our dialogue?",
  barber: "Hi! Fresh look, fresh lines - ready to perform?",
  "bear guard": "Greetings, guard! Did you secure the scene?",
  "bird scholar": "Hi! Have you studied today's storyline?",
  bussinessman: "Hello! Ready to invest in a dramatic outcome?",
  "cat server": "Mrow! Ready to serve some dialogue?",
  "court musician": "Hi! Can we play the scene's theme now?",
  "dark hunter": "Shh... are you ready to hunt down tension?",
  "deer noble": "Good day, noble friend. Shall we write something elegant?",
  designer: "Hey designer! Ready to craft our characters?",
  educationexpert: "你好！我是教育专家，一起把这段写得更好吧。",
  "elephant trader": "Welcome, trader! Do you have supplies for the story?",
  engineeree: "Hi! Do you have a blueprint for our next scene?",
  farmer: "Howdy, farmer! Ready to sow dialogue seeds?",
  fireman: "Hi, fireman! Let's rescue the plot from trouble.",
  "fox vendor": "Hello! Want to trade ideas for drama?",
  frog: "Ribbit! Ready for a funny line?",
  "glyph walker": "Hi! Walk the symbols - ready to write?",
  "medieval archer": "Greetings! Aim your words - ready to shoot a line?",
  "monkey mechanic": "Ooh ooh! Need a tune-up for your plot?",
  "neon servo": "Hi! Systems online - ready for the next scene?",
  nurse: "Hello! Feeling okay? Let's make it gentle.",
  "orb culler": "Hi! Ready to prune the plot into something sharp?",
  "penguin police": "Waddle waddle! Are the characters following the rules?",
  photographer: "Cheese! Did you catch the perfect moment?",
  "pirate sailor": "Ahoy! Ready to plunder some dialogue?",
  police: "Hello officer! Ready to investigate this scene?",
  principle: "你好！校长在这儿，咱们把情节理顺。",
  professor: "Hi, have you finished writing the article?",
  "rabbit postman": "Hi! Letters delivered - ready to send dialogue?",
  singer: "Hi! Ready to sing your lines?",
  softwareengineer: "Hi! Mind if we debug the drama script together?",
  student: "Hey! Are you ready to write your part?",
  teacher: "Hello, teacher! Are students ready to begin?",
  "victorian explorer": "Hello, explorer! Any clues for our next plot?",
  "victorian gentleman": "Good day, sir. Ready to proceed with the story?",
  "wolf hunter": "Hello, hunter! Ready to track down the twist?",
  "wuxia swordswoman": "Hi! Sword-fighting ready - are you?",
  yogateacher: "Namaste! Ready to breathe life into the scene?",
};

export function getToyBoxBubbleText(species: string): string | null {
  const lower = species.toLowerCase();
  if (lower.includes("alien")) return alienGibberish(species);

  if (BUBBLES[lower]) return BUBBLES[lower];

  return null;
}
