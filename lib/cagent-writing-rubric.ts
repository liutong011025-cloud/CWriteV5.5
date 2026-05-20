const STOPWORDS = new Set([
  "a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "with", "and", "or", "but", "so", "if",
  "then", "that", "this", "it", "he", "she", "they", "we", "i", "you", "my",
  "our", "your", "his", "her", "their", "me", "us", "them",
])

const STORY_ACTIONS = [
  "go", "went", "find", "found", "help", "helped", "save", "saved", "run", "ran",
  "look", "looked", "say", "said", "hold", "held", "climb", "climbed", "read",
  "remember", "decide", "decided", "try", "tried", "solve", "solved",
]

const DANGEROUS_TERMS = [
  "kill",
  "murder",
  "suicide",
  "bomb",
  "gun",
  "knife",
  "fuck",
  "shit",
  "asshole",
]

const PASS_SIGNAL_PATTERNS = [
  /you can move on to the next part of your writing!/gi,
  /you can move to the next part/gi,
  /move to the next section/gi,
  /ready to move to the next part/gi,
]

export const GOOD_ENOUGH_CODE = process.env.CAGENT_GOOD_ENOUGH_CODE || "CAGENTGOODENOUGH"
export const PASS_SENTENCE = "You can move on to the next part of your writing!"

type BaseMetrics = {
  text: string
  textLower: string
  words: string[]
  wordCount: number
  sentenceCount: number
  uniqueRatio: number
  contentWordCount: number
  gibberishRatio: number
  dangerousTerms: string[]
  hasSentenceEnding: boolean
  hasConnector: boolean
}

type Thresholds = {
  fluency: number
  vocabulary: number
  structureAlignment: number
}

type RubricInput = {
  level: number
  sectionName: string
  thresholds?: Partial<Thresholds>
  fluency: number
  vocabulary: number
  structureAlignment: number
  dangerousTerms: string[]
  gibberishRatio: number
  failTips: string[]
  customReasons?: string[]
}

export type CagentRubricResult = {
  fluency: number
  vocabulary: number
  structureAlignment: number
  safety: number
  gibberishRatio: number
  dangerousTerms: string[]
  thresholds: Thresholds
  pass: boolean
  reasons: string[]
  tips: string[]
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const tokenizeWords = (text: string) => (text.toLowerCase().match(/[a-z']+/g) || [])

const getMeaningfulTokens = (text: string) =>
  tokenizeWords(text).filter((word) => word.length >= 3 && !STOPWORDS.has(word))

const countTokenMatches = (textLower: string, tokens: string[]) =>
  new Set(tokens.filter((token) => textLower.includes(token))).size

const normalizeLine = (text: string) => text.replace(/\r/g, "").trim()

const buildBaseMetrics = (rawText: string): BaseMetrics => {
  const text = String(rawText || "").trim()
  const words = tokenizeWords(text)
  const wordCount = words.length
  const sentenceCount = text
    .split(/[.!?。！？\n]+/)
    .map((part) => part.trim())
    .filter(Boolean).length
  const uniqueRatio = wordCount > 0 ? new Set(words).size / wordCount : 0
  const contentWordCount = words.filter((word) => word.length >= 4 && !STOPWORDS.has(word)).length
  const gibberishWords = words.filter((word) => word.length >= 4 && !/[aeiou]/i.test(word))
  const gibberishRatio = wordCount > 0 ? gibberishWords.length / wordCount : 1
  const textLower = text.toLowerCase()
  const dangerousTerms = DANGEROUS_TERMS.filter((term) =>
    new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(textLower)
  )

  return {
    text,
    textLower,
    words,
    wordCount,
    sentenceCount,
    uniqueRatio,
    contentWordCount,
    gibberishRatio,
    dangerousTerms,
    hasSentenceEnding: /[.!?。！？]/.test(text),
    hasConnector: /\b(and|but|because|so|when|after|before|then|finally|next|however|therefore)\b/i.test(text),
  }
}

const getLevelThresholds = (level: number): Thresholds => {
  const safeLevel = Math.min(5, Math.max(1, level || 1))
  return {
    fluency: 30 + safeLevel * 5,
    vocabulary: 15 + safeLevel * 5,
    structureAlignment: 25 + safeLevel * 5,
  }
}

const scoreFluency = (metrics: BaseMetrics, minWords: number, minSentences: number) => {
  if (!metrics.text) return 0
  let score = 0
  score += 35 * clamp(metrics.wordCount / Math.max(minWords, 1))
  score += 25 * clamp(metrics.sentenceCount / Math.max(minSentences, 1))
  score += metrics.hasSentenceEnding ? 15 : 5
  score += metrics.hasConnector ? 10 : 0
  score += 15 * clamp(1 - metrics.gibberishRatio / 0.35)
  return Math.round(Math.min(100, score))
}

const scoreVocabulary = (metrics: BaseMetrics, level: number, minContentWords: number) => {
  if (!metrics.text) return 0
  const targetUniqueRatio = level <= 2 ? 0.45 : level === 3 ? 0.5 : 0.55
  let score = 0
  score += 45 * clamp(metrics.uniqueRatio / targetUniqueRatio)
  score += 35 * clamp(metrics.contentWordCount / Math.max(minContentWords, 1))
  score += 20 * clamp(metrics.wordCount / Math.max(minContentWords + 2, 1))
  return Math.round(Math.min(100, score))
}

const buildRubricResult = ({
  level,
  sectionName,
  thresholds: thresholdOverrides,
  fluency,
  vocabulary,
  structureAlignment,
  dangerousTerms,
  gibberishRatio,
  failTips,
  customReasons,
}: RubricInput): CagentRubricResult => {
  const thresholds = { ...getLevelThresholds(level), ...thresholdOverrides }
  const safety = dangerousTerms.length > 0 ? 0 : 100
  const reasons: string[] = [...(customReasons || [])]

  if (dangerousTerms.length > 0) {
    reasons.push(`unsafe words found: ${dangerousTerms.join(", ")}`)
  }
  if (gibberishRatio >= 0.35) {
    reasons.push("too many unclear or random-looking words")
  }
  if (fluency < thresholds.fluency) {
    reasons.push("grammar and sentence flow are not clear enough yet")
  }
  if (vocabulary < thresholds.vocabulary) {
    reasons.push("word choice is too repetitive or too thin")
  }
  if (structureAlignment < thresholds.structureAlignment) {
    reasons.push(`${sectionName} is not aligned enough with the current part`)
  }

  const pass =
    safety === 100 &&
    gibberishRatio < 0.35 &&
    fluency >= thresholds.fluency &&
    vocabulary >= thresholds.vocabulary &&
    structureAlignment >= thresholds.structureAlignment

  return {
    fluency,
    vocabulary,
    structureAlignment,
    safety,
    gibberishRatio,
    dangerousTerms,
    thresholds,
    pass,
    reasons,
    tips: failTips.slice(0, 3),
  }
}

export const stripPassSignals = (message: string) => {
  let cleaned = normalizeLine(message)
  for (const pattern of PASS_SIGNAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, "")
  }
  cleaned = cleaned.replace(new RegExp(GOOD_ENOUGH_CODE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "")
  return cleaned.replace(/\n{3,}/g, "\n\n").trim()
}

export const detectPassSignal = (message: string) =>
  new RegExp(GOOD_ENOUGH_CODE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(message)

export const buildPassPromptRule = (sectionName: string, level: number) =>
  [
    `Use level ${level} only as a light guide. Do NOT be too strict in testing.`,
    `Pass the section if it is real writing, not too short for "${sectionName}", clearly related to this part, and safe.`,
    "Reject only when it is gibberish, clearly too short, clearly off-topic, or unsafe.",
    `If the writing passes, include the exact sentence "${PASS_SENTENCE}" and add "${GOOD_ENOUGH_CODE}" on a new line.`,
    `If the writing does NOT pass, do NOT include "${PASS_SENTENCE}" and do NOT include "${GOOD_ENOUGH_CODE}".`,
  ].join("\n")

export const finalizeEvaluationMessage = (
  rawMessage: string,
  rubric: CagentRubricResult,
  fallbackMessage: string
) => {
  const base = stripPassSignals(rawMessage) || fallbackMessage
  if (rubric.pass) {
    return base.includes(PASS_SENTENCE) ? base : `${base}\n${PASS_SENTENCE}`
  }

  const reasonText =
    rubric.reasons.length > 0 ? rubric.reasons.slice(0, 2).join("; ") : "the writing still needs revision"
  const tipText =
    rubric.tips.length > 0 ? rubric.tips.slice(0, 2).join("; ") : "rewrite with clearer sentences and stronger details"
  return `${base}\nNot passed yet: ${reasonText}.\nPlease revise: ${tipText}.`
}

export const evaluateLetterWriting = (
  text: string,
  sectionName: string,
  level: number,
  recipient?: string,
  occasion?: string
) => {
  const metrics = buildBaseMetrics(text)
  const section = sectionName.toLowerCase()
  const shortSection = section.includes("greeting") || section.includes("signature") || section.includes("closing")
  const minWords = shortSection ? 2 : level <= 2 ? 4 : level === 3 ? 5 : 6
  const minSentences = shortSection ? 1 : level <= 2 ? 1 : 2
  const fluency = scoreFluency(metrics, minWords, minSentences)
  const vocabulary = scoreVocabulary(metrics, level, shortSection ? 1 : 2)
  const recipientTokens = getMeaningfulTokens(recipient || "")
  const occasionTokens = getMeaningfulTokens(occasion || "")
  const recipientMatchCount = countTokenMatches(metrics.textLower, recipientTokens)
  const occasionMatchCount = countTokenMatches(metrics.textLower, occasionTokens)
  const hasLetterVoice = /\b(i|my|me|we|our|you|your)\b/i.test(text)

  let structureAlignment = 0
  if (section.includes("greeting")) {
    if (/\b(dear|hi|hello|hey)\b/i.test(text)) structureAlignment += 70
    if (recipientMatchCount > 0) structureAlignment += 15
    if (/[,!]/.test(text)) structureAlignment += 15
    if (metrics.wordCount >= minWords) structureAlignment += 10
  } else if (section.includes("opening")) {
    if (/\b(i am writing|i'm writing|i want to|because|today|dear)\b/i.test(text)) structureAlignment += 45
    if (recipientMatchCount > 0 || occasionMatchCount > 0) structureAlignment += 20
    if (hasLetterVoice) structureAlignment += 10
    if (metrics.sentenceCount >= 1) structureAlignment += 20
    if (metrics.wordCount >= minWords) structureAlignment += 15
  } else if (section.includes("body")) {
    if (metrics.sentenceCount >= minSentences) structureAlignment += 20
    if (metrics.wordCount >= minWords) structureAlignment += 20
    if (metrics.hasConnector) structureAlignment += 10
    if (/\b(feel|think|hope|want|share|tell|remember|because|thank|miss)\b/i.test(text)) structureAlignment += 20
    if (recipientMatchCount > 0 || occasionMatchCount > 0) structureAlignment += 20
    if (hasLetterVoice) structureAlignment += 10
  } else if (section.includes("closing")) {
    if (/\b(hope|see you|take care|best wishes|thank you|miss you|love)\b/i.test(text)) structureAlignment += 70
    if (metrics.sentenceCount >= 1) structureAlignment += 15
    if (metrics.wordCount >= 3) structureAlignment += 15
  } else if (section.includes("signature")) {
    if (/\b(from|love|yours|sincerely|best)\b/i.test(text)) structureAlignment += 75
    if (metrics.wordCount >= 1) structureAlignment += 25
  } else {
    if (metrics.sentenceCount >= minSentences) structureAlignment += 50
    if (metrics.wordCount >= minWords) structureAlignment += 25
    if (metrics.hasConnector) structureAlignment += 25
  }

  const tooShort = shortSection ? metrics.wordCount < minWords : metrics.wordCount < minWords || metrics.sentenceCount < minSentences
  const irrelevant =
    !section.includes("greeting") &&
    !section.includes("closing") &&
    !section.includes("signature") &&
    structureAlignment < 45
  const lowVocabularyOkay = shortSection ? 0 : 10 + Math.max(0, level - 1) * 2

  return buildRubricResult({
    level,
    sectionName,
    thresholds: {
      fluency: shortSection ? 20 : 24 + Math.max(0, level - 1) * 2,
      vocabulary: lowVocabularyOkay,
      structureAlignment: shortSection ? 25 : 45 + Math.max(0, level - 1) * 2,
    },
    fluency,
    vocabulary,
    structureAlignment: Math.min(100, structureAlignment),
    dangerousTerms: metrics.dangerousTerms,
    gibberishRatio: metrics.gibberishRatio,
    customReasons: [
      ...(tooShort ? ["the writing is too short for this part"] : []),
      ...(irrelevant ? ["this does not match the current letter part clearly enough"] : []),
    ],
    failTips: [
      `rewrite the ${sectionName} part with clearer English sentences`,
      shortSection
        ? `make sure this ${sectionName} part uses the correct letter form`
        : `add one more detail that fits the ${sectionName} purpose`,
      "replace any unsafe or random words with kind and meaningful wording",
    ],
  })
}

export const evaluateBookWriting = (
  text: string,
  sectionName: string,
  level: number,
  bookTitle: string
) => {
  const metrics = buildBaseMetrics(text)
  const section = sectionName.toLowerCase()
  const isShortSection =
    section.includes("intro") || section.includes("opening") || section.includes("conclusion") || section.includes("ending")
  const minWords = isShortSection ? (level <= 2 ? 4 : 5) : level <= 2 ? 6 : level === 3 ? 7 : 8
  const minSentences = isShortSection ? 1 : level <= 2 ? 1 : 2
  const fluency = scoreFluency(metrics, minWords, minSentences)
  const vocabulary = scoreVocabulary(metrics, level, isShortSection ? 1 : 2)

  const bookTitleWords = getMeaningfulTokens(bookTitle)
  const bookMatchCount = countTokenMatches(metrics.textLower, bookTitleWords)
  const mentionsBook = bookMatchCount > 0 || /\b(book|story|author|character|main character|review)\b/i.test(text)
  const hasReviewCue = /\b(book|story|author|character|plot|review|favorite|interesting|boring|good|bad|because|recommend|lesson|theme)\b/i.test(text)

  let structureAlignment = 0
  if (mentionsBook) structureAlignment += 35
  if (hasReviewCue) structureAlignment += 15
  if (metrics.wordCount >= minWords) structureAlignment += 20
  if (metrics.sentenceCount >= minSentences) structureAlignment += 15

  if (section.includes("intro") || section.includes("opening") || section.includes("begin")) {
    if (/\b(book|story|author|about)\b/i.test(text)) structureAlignment += 35
  } else if (section.includes("conclusion") || section.includes("ending")) {
    if (/\b(recommend|overall|in conclusion|finally|i think|i learned)\b/i.test(text)) structureAlignment += 35
  } else {
    if (/\b(because|favorite|interesting|important|character|theme|lesson|example)\b/i.test(text)) {
      structureAlignment += 35
    }
  }

  const tooShort = metrics.wordCount < minWords || metrics.sentenceCount < minSentences
  const irrelevant = !mentionsBook && !hasReviewCue

  return buildRubricResult({
    level,
    sectionName,
    thresholds: {
      fluency: 24 + Math.max(0, level - 1) * 2,
      vocabulary: 10 + Math.max(0, level - 1) * 2,
      structureAlignment: 45 + Math.max(0, level - 1) * 2,
    },
    fluency,
    vocabulary,
    structureAlignment: Math.min(100, structureAlignment),
    dangerousTerms: metrics.dangerousTerms,
    gibberishRatio: metrics.gibberishRatio,
    customReasons: [
      ...(tooShort ? ["the writing is too short for this review part"] : []),
      ...(irrelevant ? ["this writing does not seem related to the book review"] : []),
    ],
    failTips: [
      `add details that clearly fit the ${sectionName} part of the review`,
      "mention the book, character, event, or lesson more clearly",
      "use a few more varied words instead of repeating the same idea",
    ],
  })
}

export const evaluateStoryWriting = (
  text: string,
  sectionName: string,
  level: number,
  character: any,
  plot: any
) => {
  const metrics = buildBaseMetrics(text)
  const minWords = 15
  const minSentences = level <= 2 ? 1 : 2
  const fluency = scoreFluency(metrics, minWords, minSentences)
  const vocabulary = scoreVocabulary(metrics, level, level <= 2 ? 3 : 4)

  const section = sectionName.toLowerCase()
  const characterName = String(character?.name || "").toLowerCase().trim()
  const settingTokens = tokenizeWords(String(plot?.setting || "")).filter((word) => !STOPWORDS.has(word))
  const conflictTokens = tokenizeWords(String(plot?.conflict || "")).filter((word) => !STOPWORDS.has(word))
  const goalTokens = tokenizeWords(String(plot?.goal || "")).filter((word) => !STOPWORDS.has(word))

  let structureAlignment = 0
  if (characterName && metrics.textLower.includes(characterName)) structureAlignment += 20
  if (settingTokens.some((word) => metrics.textLower.includes(word))) structureAlignment += 15
  if (metrics.wordCount >= minWords) structureAlignment += 15
  if (metrics.sentenceCount >= minSentences) structureAlignment += 15
  if (STORY_ACTIONS.some((word) => new RegExp(`\\b${word}\\b`, "i").test(text))) structureAlignment += 15
  if (metrics.hasConnector) structureAlignment += 10

  if (section.includes("setup") || section.includes("exposition")) {
    if (/\b(in|at|on|inside|near|one day)\b/i.test(text)) structureAlignment += 10
  } else if (section.includes("confront") || section.includes("rising") || section.includes("crisis")) {
    if (conflictTokens.some((word) => metrics.textLower.includes(word))) structureAlignment += 15
    if (/\b(problem|danger|trouble|hard|difficult|afraid|worried|but|however)\b/i.test(text)) {
      structureAlignment += 10
    }
  } else if (section.includes("resol") || section.includes("falling") || section.includes("climax")) {
    if (goalTokens.some((word) => metrics.textLower.includes(word))) structureAlignment += 15
    if (/\b(finally|solved|saved|learned|ended)\b/i.test(text)) structureAlignment += 10
  }

  const baseThresholds = getLevelThresholds(level)
  return buildRubricResult({
    level,
    sectionName,
    thresholds: {
      fluency: Math.max(28, baseThresholds.fluency - 12),
      vocabulary: Math.max(14, baseThresholds.vocabulary - 10),
      structureAlignment: Math.max(22, baseThresholds.structureAlignment - 12),
    },
    fluency,
    vocabulary,
    structureAlignment: Math.min(100, structureAlignment),
    dangerousTerms: metrics.dangerousTerms,
    gibberishRatio: metrics.gibberishRatio,
    failTips: [
      `add a little more action or detail for ${sectionName}`,
      "connect this part to your character or plot when you can",
      "smooth any unclear sentences so the story is easy to follow",
    ],
  })
}
