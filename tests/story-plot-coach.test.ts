import assert from "node:assert/strict"
import test from "node:test"
import {
  finalizePlotFromConversation,
  type PlotConversationProgress,
  type PlotState,
} from "../lib/story-plot-coach"

const finishTurn = (
  plot: PlotState,
  progress: PlotConversationProgress,
  message: string,
  priorMessages: string[],
) =>
  finalizePlotFromConversation(
    plot,
    progress,
    null,
    message,
    priorMessages,
    "Melody",
    [],
  )

test("the reply question and buttons advance to the same next plot step", () => {
  const theme = finishTurn({}, {}, "Adventure", [])
  assert.equal(theme.microStep, "setting_place")
  assert.deepEqual(theme.suggestions, ["Sunny village", "School yard", "By the sea", "Mountain path"])

  const place = finishTurn(theme.plot, theme.plot_progress, "School yard", ["Adventure"])
  assert.equal(place.microStep, "setting_detail")
  assert.ok(place.suggestions.includes("Playground"))

  const trouble = finishTurn(
    place.plot,
    place.plot_progress,
    "Someone needs help",
    ["Adventure", "School yard"],
  )
  assert.equal(trouble.plot.setting, "School yard")
  assert.equal(trouble.plot_progress.conflictBroad, "Someone needs help")
  assert.equal(trouble.microStep, "conflict_detail")
  assert.ok(trouble.suggestions.includes("By the classroom"))
})

test("a free-form first answer is kept as the theme, not mistaken for the setting", () => {
  const result = finishTurn({}, {}, "A story about friendship and courage", [])

  assert.equal(result.plot_progress.theme, "A story about friendship and courage")
  assert.equal(result.plot_progress.settingBroad, undefined)
  assert.equal(result.microStep, "setting_place")
})

test("goal suggestions are related to a help or injury conflict", () => {
  const result = finishTurn(
    { setting: "in the classroom" },
    { conflictBroad: "girls get hurt" },
    "cut by the cutter",
    ["Adventure", "School", "Classroom", "girls get hurt"],
  )

  assert.equal(result.plot.conflict, "girls get hurt — cut by the cutter")
  assert.equal(result.microStep, "goal_wish")
  assert.ok(result.suggestions.includes("Sing a brave song together"))
})

test("a relevant custom goal is saved, while a passive conflict sentence is rejected", () => {
  const plot = {
    setting: "in the classroom",
    conflict: "girls get hurt — cut by the cutter",
  }
  const history = ["Adventure", "School", "Classroom", "girls get hurt", "cut by the cutter"]

  const accepted = finishTurn(plot, {}, "Singing a brave song together", history)
  assert.equal(accepted.plot.goal, "Singing a brave song together")
  assert.equal(accepted.plot_complete, true)

  const rejected = finishTurn(plot, {}, "cut by the cutter", history)
  assert.equal(rejected.plot.goal, undefined)
  assert.equal(rejected.microStep, "goal_wish")
})

test("goal detail enriches the existing goal instead of replacing it", () => {
  const result = finishTurn(
    {
      setting: "in the classroom",
      conflict: "someone needs help",
      goal: "Sing a brave song together",
    },
    {},
    "with her classmates",
    ["Adventure", "School", "Classroom", "Someone needs help"],
  )

  assert.equal(result.plot.goal, "Sing a brave song together — with her classmates")
})
