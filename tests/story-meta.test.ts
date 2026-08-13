import assert from "node:assert/strict"
import test from "node:test"
import { sanitizeStoryAssistantText, stripStoryMetaBlock } from "../lib/story-meta"

test("strips canonical ---META--- block", () => {
  const raw =
    'Sunny village sounds perfect!\n---META---\n{"phase":"plot","suggestions":["By the big tree"]}\n---END---'
  const { answer } = stripStoryMetaBlock(raw)
  assert.equal(answer, "Sunny village sounds perfect!")
  assert.equal(sanitizeStoryAssistantText(raw).includes("META"), false)
})

test("strips META when the model splits --- and META onto two lines", () => {
  const raw = [
    "Where in the sunny village does Nicole’s adventure start? By the big tree, near the ice cream stand, or somewhere else?",
    "---",
    "META---",
    '{"phase":"plot","suggestions":["By the big tree","At the ice cream stand","In the flower garden"],"story_snippet":null,"plot_update":null,"structure_suggestion":null,"revision_tags":[]}',
    "---END---",
  ].join("\n")
  const cleaned = sanitizeStoryAssistantText(raw)
  assert.equal(cleaned.includes("META"), false)
  assert.equal(cleaned.includes("plot_update"), false)
  assert.ok(cleaned.includes("ice cream stand"))
})

test("still hides META when the JSON is invalid", () => {
  const raw = 'Hello!\n---META---\n{phase:plot,}\n---END---'
  const cleaned = sanitizeStoryAssistantText(raw)
  assert.equal(cleaned, "Hello!")
})
