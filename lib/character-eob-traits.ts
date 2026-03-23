/**
 * EOB (Education on Values) traits for character creation.
 * Each trait has an explanation template ({{name}} replaced with character name)
 * and English writing tips for students.
 */

export interface EobTrait {
  name: string
  explanationTemplate: string
  writingTips: string[]
}

export const EOB_TRAITS: EobTrait[] = [
  {
    name: "Kind",
    explanationTemplate:
      "Kindness means {{name}} likes to care for others and be warm and gentle.",
    writingTips: [
      "is kind and caring to others",
      "uses warm words to make others feel better",
    ],
  },
  {
    name: "Helpful",
    explanationTemplate:
      "Helpful means {{name}} likes to help others, especially family and elders.",
    writingTips: [
      "shows respect and care for grandparents",
      "helps elders with simple daily tasks",
    ],
  },
  {
    name: "Brave",
    explanationTemplate:
      "Brave means {{name}} faces hard things with courage and does not give up easily.",
    writingTips: [
      "faces challenges with courage",
      "keeps trying even when it feels scary",
    ],
  },
  {
    name: "Honest",
    explanationTemplate:
      "Honest means {{name}} tells the truth and can be trusted by others.",
    writingTips: [
      "always tells the truth and keeps their word",
      "admits mistakes and takes responsibility",
    ],
  },
  {
    name: "Responsible",
    explanationTemplate:
      "Responsible means {{name}} finishes tasks and keeps promises.",
    writingTips: [
      "finishes what they start and keeps promises",
      "takes care of their own duties without being reminded",
    ],
  },
  {
    name: "Team-player",
    explanationTemplate:
      "Being a team player means {{name}} likes to work with others and share.",
    writingTips: [
      "works well with teammates and shares the work",
      "listens to friends and supports the group",
    ],
  },
  {
    name: "Obeys rules",
    explanationTemplate:
      "Obeying rules means {{name}} follows class and family rules to keep everyone safe and fair.",
    writingTips: [
      "follows rules and encourages others to do the same",
      "respects boundaries and plays fair",
      "understands that rules help everyone get along",
    ],
  },
  {
    name: "Hardworking",
    explanationTemplate:
      "Hardworking means {{name}} tries their best and does not shy away from effort.",
    writingTips: [
      "gives their best effort in everything they do",
      "keeps trying until they get it right",
    ],
  },
  {
    name: "Empathetic",
    explanationTemplate:
      "Empathetic means {{name}} understands how others feel and cares about their emotions.",
    writingTips: [
      "understands how others feel and shows compassion",
      "puts themselves in someone else's shoes",
      "notices when others are upset and offers comfort",
    ],
  },
]
