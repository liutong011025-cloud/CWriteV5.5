/**
 * Writing level definitions (1–5) for display and Dify prompt tuning.
 * Level is set after Plan Test / Journey Ticket.
 */

export interface LevelDetail {
  level: number
  title: string
  subtitle: string
  scoreRange: string
  gradeRange: string
  goals: string
  canDo: string[]
  teachingTips: string
  assessmentFocus?: string
  theory?: string
}

export const LEVEL_DETAILS: LevelDetail[] = [
  {
    level: 1,
    title: "Level 1",
    subtitle: "A2.1 — 入門低段",
    scoreRange: "Score 0–20",
    gradeRange: "P1–P2",
    goals:
      "能以單句或短語表達個人信息與簡單日常活動；能理解並寫出常見詞彙與固定句型。",
    canDo: [
      "能寫簡單句回答「我叫什麼／我來自哪裡／我喜歡什麼」之類問題。",
      "能描述日常活動（I eat breakfast. I go to school.）。",
      "能根據圖片或關鍵詞寫 1–3 句簡短描述。",
    ],
    teachingTips:
      "支架量高：使用圖片提示、句型填空、選項提示（multiple-choice sentence starters）、詞庫建議。核心維度重點：Task Fulfillment、Mechanics（簡單拼寫/單詞正確）。",
    assessmentFocus: "Task Fulfillment, Mechanics",
    theory:
      "CEFR A2：能用簡單語言表達熟悉主題的基本信息。支架教學（ZPD）：學生需要大量外在支援（圖片、範句）。6+1 Traits：Ideas & Word Choice、Conventions，以引導詞彙與句型為主。",
  },
  {
    level: 2,
    title: "Level 2",
    subtitle: "A2.2 — 入門高段",
    scoreRange: "Score 21–34",
    gradeRange: "P2–P3",
    goals:
      "能寫 3–5 句短段落描述近期經驗、計劃或簡單敘述，使用基礎連接詞（and, but, because）及常見時態（現在/過去）。",
    canDo: [
      "能用連接詞連接兩個簡單句（I like apples because they are sweet.）。",
      "能寫短段描述一次活動（I went to the park. I played with my friend.）。",
      "能在提示下完成簡單的段落框架（topic + 2 supporting sentences）。",
    ],
    teachingTips:
      "支架減少但仍明顯：給段落框架、提供常用連接詞與短語表、示範句型。",
    assessmentFocus:
      "段落完整度（3–5 句）、連接詞使用、基本時態正確率、拼寫錯誤率。維度重點：Organization、Grammar、Vocabulary。",
    theory:
      "CEFR A2 段落延伸能力。支架式逐步撤除（scaffolding）。SLA 輸入/輸出假設。",
  },
  {
    level: 3,
    title: "Level 3",
    subtitle: "B1.1 + B1.2 — 中級",
    scoreRange: "Score 35–64",
    gradeRange: "P3–P4",
    goals:
      "能較完整敘述事件或經驗，開始使用從屬子句（when/if/that）、能提供簡單理由與例子，段落與篇章的連貫性顯著提升。",
    canDo: [
      "能寫一篇 5–8 句的描述性或敘事性文章，包含時間順序與原因說明。",
      "能使用至少一種從屬連接（when/because/if/that）來複合句。",
      "能在提示下組織段落（topic sentence + supporting details + concluding sentence）。",
    ],
    teachingTips:
      "支架進一步減少：使用發想問題（Why? How? When?）引導段落擴展；提供句子合併練習與段落重組任務。",
    assessmentFocus:
      "從句比例、連接詞種類數、段落結構完整度、詞彙多樣性（TTR/MTLD）。維度重點：Grammar/Complexity、Organization、Vocabulary。",
    theory:
      "CEFR B1：較清楚文本，語法多樣性與段落組織。Syntactic Complexity 區分 B1 與 A2。6+1 Traits：Organization, Sentence Fluency。",
  },
  {
    level: 4,
    title: "Level 4",
    subtitle: "B1.3 + B2.1 — 中高級",
    scoreRange: "Score 65–79",
    gradeRange: "P4–P5",
    goals:
      "能寫較詳盡的說明或簡單論述，表達觀點並提供理由/例子，句法與詞彙使用更穩定，篇章結構控制能力接近中等水平。",
    canDo: [
      "能針對一個觀點寫出清晰的段落並提供 2–3 個支持理由或例子。",
      "能使用多種連接詞（however, therefore, although）來表達對比、因果與轉折。",
      "能在寫作中採取較合適的語體（formal/informal）並注意讀者。",
    ],
    teachingTips:
      "支架主要是策略層面：篇章組織策略（PEEL）、修辭手法、段落過渡。提示範例：Plan an opinion paragraph: State your opinion, give two reasons with examples, conclude. Use however or therefore where appropriate.",
    assessmentFocus:
      "論點發展、連接詞複雜度、句法多樣性與正確率、詞彙精確度。維度重點：Content Development、Organization、Style/Register。",
    theory:
      "CEFR B1/B2 過渡；語篇能力（discourse competence）；Writing-as-process（計劃、草擬、修訂）。",
  },
  {
    level: 5,
    title: "Level 5",
    subtitle: "B2.2 + B2.3 — 進階",
    scoreRange: "Score 80–100",
    gradeRange: "P5–P6",
    goals:
      "能寫清晰、詳盡且組織良好的文章（說明性或簡單論說性），語言多樣性高，能控制篇章與風格，錯誤較少且不影響整體理解。",
    canDo: [
      "能撰寫一篇結構清晰、有論證的短文（約 150–250 字），展示連貫性與語法多樣性。",
      "能針對題目調整語體，並適當使用修辭或例證強化觀點。",
      "能自我檢查並進行基本的修改改善（句子合併、詞彙替換、消除重複）。",
    ],
    teachingTips:
      "支架為高層次編輯反饋與同儕/教師回饋：強調構思深度、論據強度與語言精煉。",
    assessmentFocus:
      "篇章長度與結構、高級句法結構比例、詞彙多樣性與精確度、修訂次數。維度重點：Content Development、Organization、Vocabulary、Grammar Accuracy。",
    theory:
      "CEFR B2；高層次編輯與反饋。",
  },
]

export function getLevelDetail(level: number): LevelDetail | undefined {
  return LEVEL_DETAILS.find((d) => d.level === level)
}

/**
 * Returns a short instruction string to append to Dify prompts so responses match the student's level.
 * Use in API routes: query or inputs.level_instruction = getLevelInstruction(level)
 */
export function getLevelInstruction(level: number): string {
  const d = getLevelDetail(level)
  if (!d) return ""
  const tips = d.teachingTips.slice(0, 200)
  return ` [Student level: ${d.title} ${d.subtitle} (${d.scoreRange}). Teaching focus: ${tips}. Keep suggestions and language appropriate for this level.]`
}

/** Level-specific prompt suffixes for different writing supports (story, book review, letter, etc.) */
export function getLevelPromptSuffix(level: number, context: "story" | "book" | "letter" | "general"): string {
  const d = getLevelDetail(level)
  if (!d) return ""
  switch (level) {
    case 1:
      return " Use very simple sentences and high scaffolding: picture prompts, sentence frames, word banks. Focus on task completion and basic mechanics."
    case 2:
      return " Use short paragraphs (3–5 sentences), common conjunctions (and, but, because), and simple past/present. Provide paragraph frames and phrase lists."
    case 3:
      return " Support 5–8 sentence texts with when/because/if/that. Use Why/How/When questions to expand. Focus on organization and sentence variety."
    case 4:
      return " Support opinion paragraphs with reasons and examples. Encourage however/therefore/although. Focus on PEEL structure and register."
    case 5:
      return " Support clear, well-organized 150–250 word texts. Give high-level editing feedback on ideas, evidence, and language polish."
    default:
      return getLevelInstruction(level)
  }
}
