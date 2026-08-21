/**
 * Story-writing UI + AI language helpers.
 * Header `siteLanguage` drives this. Student story drafts stay in English;
 * chrome, chat, and coaching copy may switch to Simplified Chinese.
 */

export type StoryUiLang = "en" | "zh"

export function isZh(lang: string | undefined | null): boolean {
  return lang === "zh"
}

const SPECIES_ZH: Record<string, string> = {
  Boy: "男孩",
  Girl: "女孩",
  Cat: "猫",
  Dog: "狗",
  Rabbit: "兔子",
  Bear: "熊",
  Fox: "狐狸",
  Dragon: "龙",
  Robot: "机器人",
  Unicorn: "独角兽",
  Lion: "狮子",
  Tiger: "老虎",
  Panda: "熊猫",
  Elephant: "大象",
  Penguin: "企鹅",
  Owl: "猫头鹰",
  Custom: "自定义",
}

const TRAIT_LABEL_ZH: Record<string, string> = {
  Kind: "善良",
  Helpful: "乐于助人",
  Brave: "勇敢",
  Honest: "诚实",
  Responsible: "有责任感",
  "Team-player": "善于合作",
  "Obeys rules": "遵守规则",
  Hardworking: "勤奋",
  Empathetic: "有同理心",
}

const TRAIT_EXPLAIN_ZH: Record<string, string> = {
  Kind: "善良表示 {{name}} 喜欢关心别人，对人温暖温柔。",
  Helpful: "乐于助人表示 {{name}} 喜欢帮助别人，尤其是家人和长辈。",
  Brave: "勇敢表示 {{name}} 面对困难也有勇气，不容易放弃。",
  Honest: "诚实表示 {{name}} 说真话，别人可以信任。",
  Responsible: "有责任感表示 {{name}} 会把事情做完，也会守承诺。",
  "Team-player": "善于合作表示 {{name}} 喜欢和别人一起做事、愿意分享。",
  "Obeys rules": "遵守规则表示 {{name}} 会遵守课堂和家里的规则，让大家更安全、更公平。",
  Hardworking: "勤奋表示 {{name}} 会尽力学，不怕付出努力。",
  Empathetic: "有同理心表示 {{name}} 能理解别人的心情，也在乎别人的感受。",
}

const TRAIT_TIPS_ZH: Record<string, string[]> = {
  Kind: ["对别人很善良、很关心", "用温暖的话让别人好受一点"],
  Helpful: ["尊重并关心爷爷奶奶", "帮长辈做一些简单的日常事情"],
  Brave: ["有勇气面对挑战", "就算害怕也会继续试"],
  Honest: ["总是说真话、守信用", "承认错误并承担责任"],
  Responsible: ["做事有始有终，也会守承诺", "不用提醒也会做好自己的事"],
  "Team-player": ["和队友配合得好，也会一起分担", "愿意听朋友的话、支持大家"],
  "Obeys rules": ["自己守规则，也鼓励别人一起守", "尊重界限、公平玩耍", "明白规则能让大家相处得更好"],
  Hardworking: ["做什么都会尽力", "一直试到做对为止"],
  Empathetic: ["能理解别人的感受，也愿意安慰", "会站在别人的角度看问题", "发现别人难过时会去关心"],
}

/** Internal English outline names stay as data keys. These are display-only. */
export const SECTION_LABEL_ZH: Record<string, string> = {
  Exposition: "开端",
  "Rising Action": "发展",
  Climax: "高潮",
  "Falling Action": "回落",
  Resolution: "结局",
  Setup: "铺垫",
  Confrontation: "冲突",
  "First Crisis": "第一次危机",
  "Second Crisis": "第二次危机",
  "Third Crisis": "第三次危机",
}

export const STRUCTURE_LABEL_ZH: Record<string, string> = {
  freytag: "弗雷塔格金字塔",
  threeAct: "三幕结构",
  fichtean: "费希特曲线",
}

const STRUCTURE_DESC_ZH: Record<string, string> = {
  freytag: "五个部分：开端、发展、高潮、回落、结局。",
  threeAct: "简单的三步：铺垫、冲突、结局。",
  fichtean: "几次小危机把紧张感推到最后的高潮。",
}

const SCORE_DIM_ZH: Record<string, string> = {
  Vocabulary: "词汇",
  Grammar: "语法",
  Coherence: "连贯",
  Creativity: "创意",
  Structure: "结构",
}

const SUGGESTION_CHIP_ZH: Record<string, string> = {
  Adventure: "冒险",
  Magic: "魔法",
  Mystery: "神秘",
  Funny: "搞笑",
  "Pick Three Act": "选三幕结构",
  "Pick Freytag": "选金字塔结构",
  "Pick Fichtean": "选费希特曲线",
  "Sunny village": "阳光小镇",
  "School yard": "学校操场",
  "By the sea": "海边",
  "Mountain path": "山路",
  "Spooky forest": "阴森森林",
  "Old house": "老房子",
  "Hidden cave": "隐秘山洞",
  "Quiet attic": "安静阁楼",
  "Magic forest": "魔法森林",
  "Floating school": "漂浮学校",
  "Crystal cave": "水晶山洞",
  "Cloud city": "云中城市",
  Playground: "游乐场",
  Cafeteria: "食堂",
  "Under the slide": "滑梯下面",
  "Soccer field": "足球场",
  "Town square": "小镇广场",
  "Bakery corner": "面包店转角",
  "River bridge": "河上的桥",
  "Market path": "市场小路",
  "Sandy shore": "沙滩",
  "Rocky pier": "岩石码头",
  "Tide pools": "潮水坑",
  Boardwalk: "木栈道",
  "Mossy path": "长满青苔的路",
  "Sunny clearing": "阳光空地",
  "Old stump": "老树桩",
  "Creek side": "小溪边",
  "Trail overlook": "小路观景处",
  "Cabin porch": "小屋门廊",
  "Alpine meadow": "高山草地",
  "Cave mouth": "洞口",
  "Warm kitchen": "温暖厨房",
  "Quiet basement": "安静地下室",
  "Windy rooftop": "刮风的屋顶",
  "Dusty attic": "积灰阁楼",
  "Crystal hall": "水晶大厅",
  "Floating bridge": "悬浮桥",
  "Star balcony": "星星阳台",
  "Glow garden": "发光花园",
  "Main area": "主要区域",
  "Hidden corner": "隐蔽角落",
  "Busy path": "热闹小路",
  "Quiet spot": "安静的地方",
  "Talking slide": "会说话的滑梯",
  "Bird steals snack": "鸟偷走点心",
  "Banana peel trip": "踩到香蕉皮摔倒",
  "Friend becomes frog": "朋友变成青蛙",
  "Strange sound": "奇怪的声音",
  "Missing object": "东西不见了",
  "Weird shadow": "奇怪的影子",
  "Locked door": "锁着的门",
  "Glowing door": "发光的门",
  "Spell gone wrong": "咒语出错了",
  "Floating object": "漂浮的东西",
  "Whispering book": "会低语的书",
  "Someone needs help": "有人需要帮助",
  "Near lunch tables": "午餐桌附近",
  "By the bench": "长椅旁边",
  "On the grass": "草地上",
  "At the fence": "篱笆边",
  "On the playground": "在操场上",
  "By the classroom": "教室旁边",
  "Near the gate": "大门附近",
  "Under a tree": "树下面",
  "Near the table": "桌子附近",
  "By the window": "窗户旁边",
  "On the path": "在小路上",
  "At the gate": "在门口",
  "Right there": "就在那里",
  "Around the corner": "转角处",
  "At the doorway": "门口",
  "In the open": "空旷的地方",
  "At school": "在学校",
  "In a forest": "在森林里",
  "A magic problem": "一个魔法麻烦",
}

export function getSpeciesLabel(name: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return name
  return SPECIES_ZH[name] || name
}

export function getTraitLabel(name: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return name
  return TRAIT_LABEL_ZH[name] || name
}

export function getTraitExplanation(name: string, englishTemplate: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return englishTemplate
  return TRAIT_EXPLAIN_ZH[name] || englishTemplate
}

export function getTraitTips(name: string, englishTips: string[], lang: StoryUiLang): string[] {
  if (!isZh(lang)) return englishTips
  return TRAIT_TIPS_ZH[name] || englishTips
}

export function getSectionLabel(englishName: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return englishName
  return SECTION_LABEL_ZH[englishName] || englishName
}

export function getStructureLabel(type: string | undefined | null, lang: StoryUiLang, englishFallback?: string): string {
  if (!type) return isZh(lang) ? "—" : "—"
  if (!isZh(lang)) return englishFallback || type
  return STRUCTURE_LABEL_ZH[type] || englishFallback || type
}

export function getStructureDesc(type: string, englishDesc: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return englishDesc
  return STRUCTURE_DESC_ZH[type] || englishDesc
}

export function getScoreDimLabel(key: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return key
  return SCORE_DIM_ZH[key] || key
}

export function localizeSuggestionChip(text: string, lang: StoryUiLang): string {
  if (!isZh(lang)) return text
  return SUGGESTION_CHIP_ZH[text] || text
}

export function localizeSuggestionChips(chips: string[] | undefined, lang: StoryUiLang): string[] {
  if (!chips?.length) return []
  return chips.map((chip) => localizeSuggestionChip(chip, lang))
}

/** Keep English trigger phrases even when the UI is Chinese. */
export const PASS_NEXT_SECTION = "You can move to the next section."
export const PASS_LAST_SECTION = "Great job!"
export const PASS_GUIDED_WRITING = "You can move on to the next part of your writing!"

export function wantsStartWriting(raw: string): boolean {
  const t = raw.toLowerCase().trim()
  if (!t) return false
  if (t === "start writing") return true
  if (/^start\s+writing[!.\s]*$/i.test(t)) return true
  if (/^let['']?s\s+(start\s+)?writing\b/i.test(t)) return true
  if (/^begin\s+writing\b/i.test(t)) return true
  const compact = raw.replace(/\s+/g, "")
  return /^(开始写(作|故事)?|我要开始写(作|故事)?|开始写作吧|我们开始写(作|吧)?)[！!。.]?$/.test(compact)
}

export function matchStructureType(raw: string): "freytag" | "threeAct" | "fichtean" | null {
  const t = raw.toLowerCase()
  const compact = raw.replace(/\s+/g, "")
  if (t.includes("freytag") || compact.includes("弗雷塔格") || compact.includes("金字塔")) return "freytag"
  if (t.includes("fichtean") || compact.includes("费希特") || compact.includes("危機曲線") || compact.includes("危机曲线")) {
    return "fichtean"
  }
  if (
    t.includes("three") ||
    compact.includes("三幕") ||
    compact.includes("三幕式")
  ) {
    return "threeAct"
  }
  return null
}

export function detectAdvanceNextSectionSignal(answer: string): boolean {
  if (!answer || typeof answer !== "string") return false
  const t = answer.trim()
  if (!t) return false
  return (
    /\byou can move on to the next part of your writing!/i.test(t) ||
    /\byou can move to the next section\b/i.test(t) ||
    /\byou may move to the next section\b/i.test(t) ||
    /\byou'?re ready to move to the next section\b/i.test(t) ||
    /\bready for the next section\b/i.test(t) ||
    /可以进入下一节/.test(t) ||
    /可以进入下一部分/.test(t) ||
    /可以進入下一節/.test(t) ||
    /可以进入下一段/.test(t)
  )
}

export function detectLastSectionGreatJobSignal(answer: string): boolean {
  if (!answer || typeof answer !== "string") return false
  const t = answer.trim()
  if (!t) return false
  return /\bgreat job\b/i.test(t) || /太棒了/.test(t) || /做得好/.test(t)
}

export function stripAdvanceNextSectionPhrases(text: string): string {
  let t = text
  const removals: RegExp[] = [
    /\n*You can move on to the next part of your writing!\.?\s*$/i,
    /\n*You can move to the next section\.?\s*$/i,
    /\n*You may move to the next section\.?\s*$/i,
    /\n*You'?re ready to move to the next section\.?\s*$/i,
    /\n*Ready for the next section\.?\s*$/i,
    /\n*可以进入下一节[。.]?\s*$/,
    /\n*可以进入下一部分[。.]?\s*$/,
    /\n*可以進入下一節[。.]?\s*$/,
    /\n*可以进入下一段[。.]?\s*$/,
  ]
  for (const re of removals) t = t.replace(re, "")
  return t.replace(/\s{2,}/g, " ").trim()
}

export function stripLastSectionGreatJobPhrases(text: string): string {
  return text
    .replace(/\n*Great job!?\.?\s*$/i, "")
    .replace(/\n*太棒了[！!。.]?\s*$/, "")
    .replace(/\n*做得好[！!。.]?\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function stripPassSignalsFromAnswer(answer: string): string {
  return stripLastSectionGreatJobPhrases(stripAdvanceNextSectionPhrases(answer))
}

const THEME_NORMALIZE: Record<string, string> = {
  adventure: "adventure",
  magic: "magic",
  mystery: "mystery",
  funny: "funny",
  冒险: "adventure",
  冒险故事: "adventure",
  魔法: "magic",
  魔法故事: "magic",
  神秘: "mystery",
  推理: "mystery",
  搞笑: "funny",
  有趣: "funny",
  好玩: "funny",
}

export function normalizeThemeWord(raw: string): string | undefined {
  const t = raw.trim().toLowerCase()
  if (THEME_NORMALIZE[t]) return THEME_NORMALIZE[t]
  const compact = raw.replace(/\s+/g, "")
  return THEME_NORMALIZE[compact]
}

/** System rules injected into story AI prompts. Trigger phrases stay English. */
export function buildStoryAiLanguageRules(lang: StoryUiLang | string | undefined): string {
  if (!isZh(lang)) {
    return [
      "\n[LANGUAGE]",
      "Reply in English.",
      "The student writes the story in English.",
      `When a section is good enough, end with the exact English sentence "${PASS_NEXT_SECTION}" or "${PASS_LAST_SECTION}" (last section).`,
      "Do not translate those trigger sentences.",
    ].join("\n")
  }

  return [
    "\n[LANGUAGE — Simplified Chinese UI, English student writing]",
    "Speak to the student in Simplified Chinese for chat, coaching, praise, and revision_tags.",
    "The student's STORY DRAFT in the Writing Pad MUST stay in English. Remind them in Chinese to write English sentences there. Do not write the story for them in Chinese.",
    "Plot chat answers and suggestion chips may be in Chinese.",
    "META JSON keys stay English. structure_suggestion must be exactly one of: freytag, threeAct, fichtean.",
    `When a non-last section is good enough, you MUST still end with this exact English trigger on its own line: ${PASS_NEXT_SECTION}`,
    `When the last section is good enough, you MUST still end with this exact English trigger: ${PASS_LAST_SECTION}`,
    "Never translate those trigger sentences. They are system signals, not story text.",
    "You may also use this exact English trigger: " + PASS_GUIDED_WRITING,
  ].join("\n")
}

export function getStoryCopy(lang: StoryUiLang) {
  const zh = isZh(lang)
  return {
    stageOf: zh ? (n: number) => `第 ${n} 步，共 5 步` : (n: number) => `Stage ${n} of 5`,
    back: zh ? "返回" : "Back",

    characterTitle: zh ? "创建你的角色" : "Create Your Character",
    sketchBoard: zh ? "素描板" : "Sketch Board",
    sketchSteps: zh ? "1）选物种  2）画画  3）生成" : "1) Choose species, 2) Draw, 3) Generate",
    speciesRequired: zh ? "物种（请先选择）" : "Species (Required first)",
    custom: zh ? "自定义" : "Custom",
    customSpeciesPlaceholder: zh ? "输入自定义物种…" : "Enter custom species...",
    pen: zh ? "画笔" : "Pen",
    eraser: zh ? "橡皮" : "Eraser",
    size: zh ? "粗细" : "Size",
    clearBoard: zh ? "清空画板" : "Clear Board",
    generateFromSketch: zh ? "根据素描生成" : "Generate from Sketch",
    generating: zh ? "生成中…" : "Generating...",
    mascotHint:
      zh
        ? "先选定故事角色的物种，再在画板上把 TA 画出来。\n比比看谁画得更像真的！"
        : "After determining the species of your story characters, you can draw them on the drawing board.\nLet's see who can draw it more Realistic !",
    characterDetails: zh ? "角色资料" : "Character Details",
    name: zh ? "名字 *" : "Name *",
    namePlaceholder: zh ? "例如：Lumi" : "e.g., Lumi",
    age: zh ? "年龄 *" : "Age *",
    agePlaceholder: zh ? "例如：8" : "e.g., 8",
    traits: zh ? "性格 *（最多选 3 个）" : "Traits * (choose up to 3)",
    writingTips: zh ? "写作时可以这样写：" : "When writing, you can use:",
    unselect: zh ? "取消选择" : "Unselect",
    selectTrait: zh ? "选择这个性格" : "Select this trait",
    close: zh ? "关闭" : "Close",
    backgroundReq: zh ? "背景 *" : "Background *",
    backgroundPh: zh ? "这个角色从哪里来？" : "Where does this character come from?",
    emotionalReq: zh ? "情感经历 *" : "Emotional Experience *",
    emotionalPh: zh ? "这个角色常常面对什么心情？" : "What feelings does this character often face?",
    symbolicReq: zh ? "象征物品 *" : "Symbolic Objects *",
    symbolicPh: zh ? "有没有代表这个角色的物品？" : "Any object that represents your character?",
    backgroundOpt: zh ? "背景（可选）" : "Background (optional)",
    backgroundOptPh: zh ? "可以写一点角色的故事细节…" : "Optional story details about your character...",
    generationPreview: zh ? "生成预览" : "Generation Preview",
    generatingImage: zh ? "正在生成图片…" : "Generating image...",
    regenerate: zh ? "重新生成图片" : "Regenerate Image",
    continueHint: zh ? "填完所有必填项后，才能继续。" : "Continue is unlocked only when all required details are complete.",
    continue: zh ? "继续 →" : "Continue →",
    toastNeedSpecies: zh ? "请先选择物种，AI 才能跟着你的设计走。" : "Choose a species first so AI can follow your design.",
    toastNeedSketch: zh ? "请先画一画你的角色。" : "Please draw your character sketch first.",
    toastBoardNotReady: zh ? "画板还没准备好。" : "Drawing board is not ready yet.",
    toastGenerating: zh ? "正在生成图片…可能要等一会儿。你可以先填写资料。" : "Generating image... This can take some time. You can continue filling details while waiting.",
    toastGenFail: zh ? "生成图片失败，请再试一次。" : "Failed to generate image. Please try again.",
    toastGenOk: zh ? "角色图片生成好了！" : "Character image generated!",
    toastNoImage: zh ? "没有返回图片，请再试一次。" : "No image returned. Please try again.",
    toastNeedDetails: zh ? "请先填完所有必填项再继续。" : "Complete all required details before continuing.",
    noAiName: zh ? "角色名字" : "Character Name",
    noAiNamePh: zh ? "例如：Sparky the Dragon" : "e.g., Sparky the Dragon",
    noAiSpecies: zh ? "物种" : "Species",
    noAiTraits: zh ? "性格（至少选一个）" : "Traits (Select at least one)",
    noAiDesc: zh ? "描述（可选）" : "Description (Optional)",
    noAiDescPh: zh ? "例如：A friendly dragon who loves to read books and help others." : "e.g., A friendly dragon who loves to read books and help others.",
    noAiPreviewEmpty: zh ? "填好表单，就能看到你的角色！" : "Fill in the form to see your character!",
    noAiDrawTitle: zh ? "角色画板" : "Character Drawing Board",
    brush: zh ? "画笔" : "Brush",

    writeTitle: zh ? "写下你的故事" : "Write Your Story",
    welcome: (name: string) =>
      zh
        ? `嗨！我们一起来给 ${name} 想一个故事吧。\n\n你今天想写哪种故事？`
        : `Hi! Let's dream up a story for ${name} together.\n\nWhat kind of story are you in the mood for?`,
    welcomeChips: ["Adventure", "Magic", "Mystery", "Funny"] as string[],
    nowWriting: zh ? "正在写：" : "Now writing:",
    allDone: zh ? "全部完成！" : "All done!",
    sectionLooksGood: zh ? "✓ 这一段已经可以了——准备好就可以继续！" : "✓ This part looks good — you can move on when you are ready!",
    writingPad: zh ? "写作板" : "Writing Pad",
    padLastPlaceholder: (section: string) =>
      zh
        ? `最后一段（${section}）：点「完成！」提交。按彩色标签修改，再点「完成！」。看到绿色勾后，点「继续」。`
        : `Last part (${section}): Finish! to submit. Fix the colored tags, then Finish! again. When you see the green check, tap Continue.`,
    padSectionPlaceholder: (section: string) =>
      zh
        ? `在写作板里写你的「${section}」… 点「完成！」获取修改标签（可悬停/点开）。改完再点「完成！」，直到可以进入下一段。`
        : `Write your ${section} in the pad… Tap Finish! to get revision tags (hover / tap each tag). Revise and Finish! again until you can go to the next section.`,
    padEndingPlaceholder: zh ? "给故事写一个收尾吧…" : "Write the ending touch for your story...",
    chooseStructure: zh ? "选择故事结构" : "Choose story structure",
    chatPlaceholder: zh ? "输入消息…（或点上面的按钮）" : "Type your message… (or tap the button above)",
    helpMeTitle: zh ? "来点创意点子！" : "Get a creative idea!",
    finish: zh ? "完成！" : "Finish!",
    nextSection: (name: string) => (zh ? `下一段：${name}` : `Next Section: ${name}`),
    continueSection: zh ? "继续" : "Continue",
    saferWords: zh ? "请用更安全、更友善的词再写一次。" : "Please rewrite with safer and kinder words.",
    planYourStory: zh ? "规划你的故事" : "Plan Your Story",
    fillThree: zh ? "先填好情节的三个要素：" : "Fill in the three elements of your plot:",
    settingLabel: zh ? "场景（在哪里、什么时候）" : "Setting (where & when)",
    settingPh: zh ? "例如：A magical forest at night" : "e.g. A magical forest at night",
    conflictLabel: zh ? "冲突（遇到的问题）" : "Conflict (the problem)",
    conflictPh: zh ? "例如：A dragon stole the village's water" : "e.g. A dragon stole the village's water",
    goalLabel: zh ? "目标（主角想做什么）" : "Goal (what the hero wants)",
    goalPh: zh ? "例如：Get the water back and befriend the dragon" : "e.g. Get the water back and befriend the dragon",
    confirmPlot: zh ? "确认情节" : "Confirm Plot",
    greatPlotChoose: zh ? "情节很棒！现在选一个故事结构：" : "Great plot! Now choose a story structure:",
    plotStructureReady: zh ? "情节和结构都准备好了！" : "Plot & structure ready!",
    writeOnRight:
      zh
        ? "在右边的编辑器里写故事。每一段都填好后，点「完成故事」。"
        : "Write your story in the editor on the right. Fill in each section and click “Finish Story” when you're done.",
    storyEditor: zh ? "故事编辑器" : "Story Editor",
    plotSummary: zh ? "情节摘要" : "Plot Summary",
    settingShort: zh ? "场景：" : "Setting:",
    problemShort: zh ? "问题：" : "Problem:",
    goalShort: zh ? "目标：" : "Goal:",
    writingNow: zh ? "正在写" : "writing now",
    reviseAgain: zh ? "再改一次？" : "Revise again?",
    padUntilNext:
      zh
        ? "完成故事只计算这里保存的文字。看到 Great job! 后，点「继续」把写作板内容移到这里。"
        : "Finish Story only counts text saved here. After Great job!, tap Continue to move your pad writing to this box.",
    padUntilNextMid: zh ? "文字会留在写作板，直到你点「下一段」。" : "Text stays in the Writing Pad until you tap Next Section.",
    notWritten: zh ? "还没写" : "Not written yet",
    writeSectionPh: (section: string) =>
      zh ? `写下故事的「${section}」…` : `Write the ${section.toLowerCase()} of your story...`,
    loadingSections: zh ? "正在加载段落…" : "Loading sections...",
    talkToSummarize: zh ? "先和 AI 聊聊，整理你的情节。" : "Talk with the AI to summarize your plot.",
    words: zh ? "字数：" : "Words:",
    sections: zh ? "段落：" : "Sections:",
    finishStory: zh ? "完成故事" : "Finish Story",
    toastNeedPlot: zh ? "请先和 AI 多聊几句，把场景、冲突和目标补齐！" : "Finish setting, conflict, and goal first — chat a bit more with the AI!",
    toastTapContinue: zh ? "请先点「继续」，把这一段保存到编辑器。" : "Tap Continue to save this part to the editor first.",
    toastNeedPad: zh ? "请先在写作板里写一点内容。" : "Write something in the Writing Pad first.",
    toastRevising: (section: string) =>
      zh ? `正在修改「${section}」。请在写作板里编辑。` : `Revising ${section}. Edit it in the Writing Pad.`,
    toastNeedWrite: zh ? "完成故事前请先写一点内容。" : "Please write something before finishing the story.",
    toastNeedEverySection: zh ? "每一段都写一点内容，才能完成故事。" : "Please write something in every structure section before finishing the story.",
    toastShortStory: zh ? "故事有点短哦！确定要完成吗？" : "Your story is quite short! Are you sure you want to finish?",
    toastYesFinish: zh ? "好，完成！" : "Yes, finish!",
    toastNeedThreeFields: zh ? "请把三个情节栏都填上。" : "Please fill in all three plot fields.",
    hiccup: zh ? "哎呀，出了点小状况！再说一次好吗？😊" : "Oops, I had a little hiccup! Could you try saying that again? 😊",
    chooseStructureChat: zh ? "太好了——为你的故事选一个结构吧：" : "Great — choose a story structure for your story:",
    networkError: zh ? "网络出错" : "Network error",
    somethingWrong: zh ? "出了点问题" : "Something went wrong",
    revisePadAgain:
      zh
        ? "请修改写作板——点每个标签看看原因，然后再次点「完成！」。"
        : "Revise your Writing Pad — tap each tag to see why, then tap Finish! again.",
    niceWorkOn: (section: string) => (zh ? `「${section}」写得不错！` : `Nice work on ${section}! `),
    plotReadyPick:
      zh
        ? "故事点子已经够清楚了——准备好就在下面选一个结构吧！"
        : "Your story idea sounds ready — pick a structure below when you like!",
    revisionTagHint: zh ? "点标签看原因 · 悬停可预览" : "Tap a tag to see why · hover to preview",

    reviewTitle: zh ? "你的故事完成了！" : "Your Story is Complete!",
    adventureOf: (name: string) => (zh ? `${name} 的冒险` : `${name}'s Adventure`),
    loadingArticle: zh ? "正在加载文章…" : "Loading article...",
    pleaseWait: zh ? "请稍等" : "Please wait",
    downloadStory: zh ? "下载故事" : "Download Story",
    editStory: zh ? "编辑故事" : "Edit Story",
    storySummary: zh ? "故事摘要" : "Story Summary",
    scoring: zh ? "评分中…" : "Scoring...",
    tipsToImprove: zh ? "可以这样改得更好" : "Tips to improve",
    character: zh ? "角色" : "Character",
    species: zh ? "物种" : "Species",
    setting: zh ? "场景" : "Setting",
    structure: zh ? "结构" : "Structure",
    backToMap: zh ? "返回地图" : "Back to Map",
    clickCorrection: zh ? "点击查看修改建议" : "Click to see correction",
    issue: zh ? "问题：" : "Issue:",
    original: zh ? "原文：" : "Original:",
    suggestion: zh ? "建议：" : "Suggestion:",
    applyCorrection: zh ? "采用这个修改？" : "Apply correction?",
    correctionApplied: zh ? "已采用修改！" : "Correction applied!",
    foundIssues: (n: number) => (zh ? `发现 ${n} 处可能的问题` : `Found ${n} potential issue(s)`),
    uploadTitle: zh ? "上传到 Luminai 图书馆？" : "Upload to Luminai Library?",
    uploadBody: zh ? "要把更新后的故事上传到 Luminai 图书馆吗？" : "Do you want to upload your updated story to Luminai Library?",
    uploading: zh ? "上传中…" : "Uploading...",
    yesUpload: zh ? "好，上传" : "Yes, Upload",
    maybeLater: zh ? "以后再说" : "Maybe Later",
    uploaded: zh ? "故事已上传到 Luminai 图书馆！✨" : "Story uploaded to Luminai Library! ✨",
    uploadFail: zh ? "上传失败" : "Failed to upload",

    editPageTitle: zh ? "编辑你的故事 ✏️" : "Edit Your Story ✏️",
    editPageHint: zh ? "修改你的故事。AI 会给你建议！学生正文请继续用英语写。" : "Make changes to your story. AI will provide helpful suggestions!",
    storyInfo: zh ? "故事信息" : "Story Info",
    type: zh ? "类型" : "Type",
    yourStory: zh ? "你的故事" : "Your Story",
    editPlaceholder: zh ? "在这里用英语修改你的故事…" : "Start editing your story here...",
    needInspiration: zh ? "需要灵感？去看看别人的作品！" : "Need inspiration? Check out others' works!",
    saveChanges: zh ? "保存修改" : "Save Changes",
    saving: zh ? "保存中…" : "Saving...",
    savedOk: zh ? "故事已更新！✨" : "Story updated successfully! ✨",
    saveFail: zh ? "保存失败" : "Failed to save story",
    savedLocal: zh ? "已保存在本地。你可以稍后上传。" : "Saved locally. You can upload later.",
    editHelpFallback: zh ? "我在这里帮你改。试着改一句，我会给你一个小提示！" : "I am here to help you edit. Try changing a sentence, and I will share a tip!",
  }
}

export type StoryCopy = ReturnType<typeof getStoryCopy>
