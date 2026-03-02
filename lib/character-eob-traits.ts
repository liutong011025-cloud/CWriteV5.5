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
      "Kindness is a good trait. It means in life, {{name}} is someone who cares for others and shows warmth and compassion.",
    writingTips: [
      "shows warmth and care for others",
      "always has a gentle word for those in need",
      "goes out of their way to help someone feel better",
    ],
  },
  {
    name: "Helpful",
    explanationTemplate:
      "Caring for elders is a good trait. It means in life, {{name}} is someone who knows how to care for the elderly and shows respect for grandparents and older people.",
    writingTips: [
      "shows respect and care for grandparents",
      "helps elders with daily tasks",
      "always thinks of the elderly and lends a helping hand",
    ],
  },
  {
    name: "Brave",
    explanationTemplate:
      "Being brave is a good trait. It means in life, {{name}} is someone who faces difficulties with courage and does not give up easily.",
    writingTips: [
      "faces challenges with courage",
      "stands up for what is right even when it is hard",
      "never gives up when things get difficult",
    ],
  },
  {
    name: "Honest",
    explanationTemplate:
      "Honesty is a good trait. It means in life, {{name}} is someone who tells the truth and can be trusted by others.",
    writingTips: [
      "always tells the truth and keeps their word",
      "admits mistakes and takes responsibility",
      "is trusted by everyone because they are sincere",
    ],
  },
  {
    name: "Responsible",
    explanationTemplate:
      "Being responsible is a good trait. It means in life, {{name}} is someone who completes tasks and keeps their promises.",
    writingTips: [
      "finishes what they start and keeps promises",
      "takes care of their duties without being reminded",
      "others can rely on them to do the right thing",
    ],
  },
  {
    name: "Team-player",
    explanationTemplate:
      "Being a team player is a good trait. It means in life, {{name}} is someone who works well with others and values cooperation.",
    writingTips: [
      "works well with others and shares the load",
      "listens to teammates and supports the group",
      "puts the team's success before personal glory",
    ],
  },
  {
    name: "Obeys rules",
    explanationTemplate:
      "Obeying rules is a good trait. It means in life, {{name}} is someone who follows rules and respects order, which keeps everyone safe and fair.",
    writingTips: [
      "follows rules and encourages others to do the same",
      "respects boundaries and plays fair",
      "understands that rules help everyone get along",
    ],
  },
  {
    name: "Hardworking",
    explanationTemplate:
      "Being hardworking is a good trait. It means in life, {{name}} is someone who tries their best and does not shy away from effort.",
    writingTips: [
      "gives their best effort in everything they do",
      "keeps trying until they get it right",
      "believes that practice and effort lead to success",
    ],
  },
  {
    name: "Empathetic",
    explanationTemplate:
      "Being empathetic is a good trait. It means in life, {{name}} is someone who understands how others feel and cares about their emotions.",
    writingTips: [
      "understands how others feel and shows compassion",
      "puts themselves in someone else's shoes",
      "notices when others are upset and offers comfort",
    ],
  },
]
