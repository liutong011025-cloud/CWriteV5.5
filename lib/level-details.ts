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
    subtitle: "A2.1 — Beginner (low)",
    scoreRange: "Score 0–20",
    gradeRange: "P1–P2",
    goals:
      "Can express personal information and simple daily activities in single sentences or short phrases; can understand and write common vocabulary and fixed sentence patterns.",
    canDo: [
      "Can write simple sentences to answer questions like ‘What’s my name? / Where am I from? / What do I like?’",
      "Can describe daily activities (e.g. I eat breakfast. I go to school.).",
      "Can write 1–3 short sentences from pictures or key words.",
    ],
    teachingTips:
      "High scaffolding: use picture prompts, sentence frames, multiple-choice starters, word banks. Focus: Task Fulfillment, Mechanics (spelling, word accuracy).",
    assessmentFocus: "Task Fulfillment, Mechanics",
    theory:
      "CEFR A2: basic information on familiar topics. ZPD: strong external support (pictures, model sentences). 6+1 Traits: Ideas & Word Choice, Conventions.",
  },
  {
    level: 2,
    title: "Level 2",
    subtitle: "A2.2 — Beginner (high)",
    scoreRange: "Score 21–34",
    gradeRange: "P2–P3",
    goals:
      "Can write short paragraphs of 3–5 sentences about recent experience, plans or simple narratives, using basic conjunctions (and, but, because) and common tenses (present/past).",
    canDo: [
      "Can join two simple sentences with conjunctions (e.g. I like apples because they are sweet.).",
      "Can write a short paragraph describing an activity (e.g. I went to the park. I played with my friend.).",
      "Can complete a simple paragraph frame with support (topic + 2 supporting sentences).",
    ],
    teachingTips:
      "Scaffolding reduced but still clear: give paragraph frames, common conjunctions and phrase lists, model sentences.",
    assessmentFocus:
      "Paragraph completeness (3–5 sentences), use of conjunctions, basic tense accuracy, spelling. Focus: Organization, Grammar, Vocabulary.",
    theory:
      "CEFR A2 paragraph extension. Gradual removal of scaffolding. SLA input/output hypotheses.",
  },
  {
    level: 3,
    title: "Level 3",
    subtitle: "B1.1 + B1.2 — Intermediate",
    scoreRange: "Score 35–64",
    gradeRange: "P3–P4",
    goals:
      "Can narrate events or experiences more fully; begins to use subordinate clauses (when/if/that), give simple reasons and examples; paragraph and text coherence improve clearly.",
    canDo: [
      "Can write a 5–8 sentence descriptive or narrative text with time order and cause.",
      "Can use at least one type of subordination (when/because/if/that) in complex sentences.",
      "Can organize a paragraph with support (topic sentence + supporting details + concluding sentence).",
    ],
    teachingTips:
      "Further reduced scaffolding: use guiding questions (Why? How? When?) to expand paragraphs; sentence-combining and paragraph-reordering tasks.",
    assessmentFocus:
      "Clause ratio, variety of conjunctions, paragraph structure, lexical diversity (TTR/MTLD). Focus: Grammar/Complexity, Organization, Vocabulary.",
    theory:
      "CEFR B1: clearer text, grammatical variety and paragraph organization. Syntactic complexity distinguishes B1 from A2. 6+1 Traits: Organization, Sentence Fluency.",
  },
  {
    level: 4,
    title: "Level 4",
    subtitle: "B1.3 + B2.1 — Upper intermediate",
    scoreRange: "Score 65–79",
    gradeRange: "P4–P5",
    goals:
      "Can write more detailed explanation or simple argument, state a view with reasons/examples; more stable syntax and vocabulary; text structure control near mid-level.",
    canDo: [
      "Can write a clear paragraph for one opinion with 2–3 supporting reasons or examples.",
      "Can use a range of conjunctions (however, therefore, although) for contrast, cause and concession.",
      "Can choose a suitable register (formal/informal) and consider the reader.",
    ],
    teachingTips:
      "Scaffolding mainly strategic: text organization (e.g. PEEL), rhetorical devices, paragraph transitions. Example: Plan an opinion paragraph: state opinion, two reasons with examples, conclusion; use however or therefore where appropriate.",
    assessmentFocus:
      "Argument development, conjunction complexity, syntactic variety and accuracy, lexical precision. Focus: Content Development, Organization, Style/Register.",
    theory:
      "CEFR B1/B2 transition; discourse competence; writing as process (plan, draft, revise).",
  },
  {
    level: 5,
    title: "Level 5",
    subtitle: "B2.2 + B2.3 — Advanced",
    scoreRange: "Score 80–100",
    gradeRange: "P5–P6",
    goals:
      "Can write clear, detailed and well-organized texts (explanatory or simple argumentative); high language variety, control of text and style; few errors that do not affect understanding.",
    canDo: [
      "Can write a clear, structured short essay (about 150–250 words) with coherent argument and grammatical variety.",
      "Can adjust register to the task and use rhetoric or examples to support views.",
      "Can self-check and make basic revisions (sentence combining, word choice, reducing repetition).",
    ],
    teachingTips:
      "Scaffolding as high-level editing and peer/teacher feedback: focus on depth of ideas, strength of evidence and language polish.",
    assessmentFocus:
      "Text length and structure, proportion of advanced syntax, lexical variety and precision, revision. Focus: Content Development, Organization, Vocabulary, Grammar Accuracy.",
    theory:
      "CEFR B2; high-level editing and feedback.",
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

/**
 * Level-specific prompt suffixes for different writing supports.
 * IMPORTANT: Only adjusts vocabulary difficulty, sentence length, and tone.
 * Does NOT add or change output structure — each API's main prompt defines the format.
 */
export function getLevelPromptSuffix(level: number, context: "story" | "book" | "letter" | "general"): string {
  const d = getLevelDetail(level)
  if (!d) return ""
  const preserve = " Do NOT change the output format or structure. Only adapt vocabulary and sentence complexity for this level."
  switch (level) {
    case 1:
      return " Use very simple words and short sentences (P1–P2). Be extra encouraging." + preserve
    case 2:
      return " Use simple vocabulary and short, clear sentences (P2–P3). Be encouraging." + preserve
    case 3:
      return " Use age-appropriate vocabulary and varied sentences (P3–P4). Be supportive." + preserve
    case 4:
      return " Use richer vocabulary and clearer structure (P4–P5). Be constructive." + preserve
    case 5:
      return " Use precise vocabulary and well-structured feedback (P5–P6). Be concise and polished." + preserve
    default:
      return " " + preserve
  }
}
