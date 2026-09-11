/** Research coding catalog. 7 categories are analysis-layer labels, not UI stages. */

export type ProcessCategory =
  | "planning"
  | "independent_writing"
  | "ai_help_seeking"
  | "ai_output_evaluation"
  | "revision"
  | "completion"
  | "pause_temporal"

export type ProcessWorkType = "story" | "review" | "letter" | "drama" | "poetry"

export type ProcessEventDef = {
  eventId: string
  workType: ProcessWorkType
  functionalCode: string
  category: ProcessCategory
  rawType?: string
  trigger?: string
}

const CATEGORY_LABELS: Record<ProcessCategory, { name: string; definition: string }> = {
  planning: {
    name: "Planning",
    definition:
      "Pre-writing conception without composing the product text (option clicks, resource viewing, structure choice, platform-gated planning stages).",
  },
  independent_writing: {
    name: "Independent Writing",
    definition: "Student-authored product text (writing pad, review/letter sections, drama dialogue, poem lines).",
  },
  ai_help_seeking: {
    name: "AI Help-seeking",
    definition: "Student explicitly requests or takes up AI support (Help Me, suggestion chips, send-to-AI, rhyme/rhetoric tools).",
  },
  ai_output_evaluation: {
    name: "AI Output Evaluation",
    definition: "Student is exposed to or inspects an AI reply (chat answer, grammar highlight, feedback view). Accept/reject is in payload.",
  },
  revision: {
    name: "Revision",
    definition: "Checking, deleting, replacing, applying corrections, or self-editing existing text/sketch.",
  },
  completion: {
    name: "Completion",
    definition: "Committing a unit or ending the task (Next Section, Finish, Save, Upload, return to map).",
  },
  pause_temporal: {
    name: "Pause and Temporal Behaviour",
    definition:
      "No input 2–10s (micro), 10–60s (meso), >60s (macro); pause-before-help/commit/complete/revise derived from pause + next event.",
  },
}

export const PROCESS_CODING_LEGEND = {
  platformConstraint:
    "CWrite is a fixed stage pipeline. NAV_*, section gates, and required structure choices are platform-constrained, not fully free self-regulation.",
  categories: CATEGORY_LABELS,
}

function e(
  eventId: string,
  workType: ProcessWorkType,
  functionalCode: string,
  category: ProcessCategory,
  trigger?: string,
  rawType?: string,
): ProcessEventDef {
  return { eventId, workType, functionalCode, category, trigger, rawType }
}

const DEFS: ProcessEventDef[] = [
  // ── Story ──────────────────────────────────────────────
  e("STORY_001", "story", "PW_CHAR_PLAN", "planning", "Click species option", "Click"),
  e("STORY_002", "story", "PW_CHAR_PLAN", "planning", "Type custom species", "Input"),
  e("STORY_003", "story", "PW_CHAR_PLAN", "planning", "Type character name", "Input"),
  e("STORY_004", "story", "PW_CHAR_PLAN", "planning", "Type character age", "Input"),
  e("STORY_005", "story", "PW_CHAR_PLAN", "planning", "Click trait card", "Click"),
  e("STORY_006", "story", "RS_RESOURCE_VIEW", "planning", "Click trait explanation dialog", "Click"),
  e("STORY_007", "story", "PW_CHAR_PLAN", "planning", "Type background / description", "Input"),
  e("STORY_008", "story", "PW_DRAW_SKETCH", "planning", "First drawing stroke", "Draw"),
  e("STORY_009", "story", "PW_DRAW_SKETCH", "planning", "Continue pen strokes", "Draw"),
  e("STORY_010", "story", "PW_DRAW_REVISE", "revision", "Click eraser mode", "Click"),
  e("STORY_011", "story", "PW_DRAW_REVISE", "revision", "Eraser stroke", "Draw"),
  e("STORY_012", "story", "PW_DRAW_REVISE", "revision", "Click clear sketch", "Click"),
  e("STORY_013", "story", "PW_DRAW_TOOL_ADJUST", "planning", "Click color picker / brush tool", "Click"),
  e("STORY_014", "story", "PW_AI_VISUALIZE", "ai_help_seeking", "Click Generate Image", "Click"),
  e("STORY_015", "story", "NAV_STAGE_ADVANCE", "completion", "Click Continue from character page", "Click"),
  e("STORY_016", "story", "PW_PLOT_EXPLORE", "ai_help_seeking", "Type exploratory message in Story Collab", "Input"),
  e("STORY_017", "story", "RS_SUGGEST_UPTAKE", "ai_help_seeking", "Click suggestion chip", "Click"),
  e("STORY_018", "story", "RS_HELP_SEEK", "ai_help_seeking", "Click Help Me", "Click"),
  e("STORY_019", "story", "PW_STRUCT_PLAN", "planning", "Click Choose Story Structure", "Click"),
  e("STORY_020", "story", "PW_STRUCT_PLAN", "planning", "Click structure card", "Click"),
  e("STORY_021", "story", "PROD_SECTION_DRAFT", "independent_writing", "Type in Writing Pad", "Input"),
  e("STORY_022", "story", "PROD_SECTION_EXPAND", "independent_writing", "Consecutive text growth", "Key/Input"),
  e("STORY_023", "story", "REV_LOCAL_REVISE", "revision", "Delete text in Writing Pad", "Input"),
  e("STORY_024", "story", "PROD_IDEA_EXTERNALIZE", "ai_help_seeking", "Click Finish! send to AI", "Click"),
  e("STORY_025", "story", "PROD_IDEA_EXTERNALIZE", "ai_help_seeking", "Ctrl/Cmd+Enter to send", "Shortcut"),
  e("STORY_026", "story", "PROD_SECTION_COMMIT", "completion", "Click Next Section", "Click"),
  e("STORY_027", "story", "PROD_SECTION_COMMIT", "completion", "Click Continue on last section", "Click"),
  e("STORY_028", "story", "NAV_SECTION_MOVE", "completion", "Current section index changes", "Auto/State"),
  e("STORY_029", "story", "PROD_DRAFT_COMPLETE", "completion", "Click Finish Story", "Click"),
  e("STORY_030", "story", "REV_SURFACE_REVIEW", "ai_output_evaluation", "Enter Story Review page", "Auto"),
  e("STORY_031", "story", "REV_FEEDBACK_INSPECT", "ai_output_evaluation", "Click highlighted grammar issue", "Click"),
  e("STORY_032", "story", "REV_CORR_ACCEPT", "revision", "Click apply correction", "Click"),
  e("STORY_033", "story", "REV_SELF_EDIT_ENTRY", "revision", "Click Edit Story", "Click"),
  e("STORY_034", "story", "REV_SELF_EDIT", "revision", "Type in Story Edit textarea", "Input"),
  e("STORY_035", "story", "REV_AI_REV_SUPPORT", "ai_help_seeking", "Edit inactivity triggers AI suggestion", "Auto/Timer"),
  e("STORY_036", "story", "REV_COMMIT_EDIT", "completion", "Click Save Changes", "Click"),
  e("STORY_037", "story", "NAV_DEFER_SUBMIT", "completion", "Click Maybe Later in upload dialog", "Click"),
  e("STORY_038", "story", "REV_SUBMIT", "completion", "Click Yes, Upload", "Click"),
  e("STORY_039", "story", "NAV_RESOURCE_SEEK", "planning", "Click Need inspiration?", "Click"),
  e("STORY_040", "story", "NAV_BACKTRACK", "planning", "Click Back", "Click"),
  e("STORY_041", "story", "NAV_EXPORT", "completion", "Click download story", "Download"),
  e("STORY_042", "story", "PAUSE_MICRO", "pause_temporal", "No input >2s and <=10s", "Pause"),
  e("STORY_043", "story", "PAUSE_MESO", "pause_temporal", "No input >10s and <=60s", "Pause"),
  e("STORY_044", "story", "PAUSE_MACRO", "pause_temporal", "No input >60s", "Pause"),
  e("STORY_045", "story", "PAUSE_PRE_HELP", "pause_temporal", "Pause before Help Me", "Pause + Click"),
  e("STORY_046", "story", "PAUSE_PRE_COMMIT", "pause_temporal", "Pause before Next Section / Continue", "Pause + Click"),
  e("STORY_047", "story", "PAUSE_PRE_COMPLETE", "pause_temporal", "Pause before Finish Story", "Pause + Click"),
  e("STORY_048", "story", "PAUSE_PRE_REVISE", "pause_temporal", "Pause before correction apply or manual edit", "Pause + Revision"),
  e("STORY_AI_OUTPUT", "story", "RS_AI_OUTPUT_VIEW", "ai_output_evaluation", "Receive Story Collab AI reply", "Auto"),

  // ── Book review ────────────────────────────────────────
  e("BOOK_001", "review", "BR_TASK_INIT", "completion", "Click Start Book Review", "Click"),
  e("BOOK_002", "review", "BR_BOOK_IDENTIFY", "planning", "Type book title", "Input"),
  e("BOOK_003", "review", "BR_BOOK_QUERY", "ai_help_seeking", "Press Enter to send book title", "Key"),
  e("BOOK_004", "review", "BR_BOOK_QUERY", "ai_help_seeking", "Click Send in book selection", "Click"),
  e("BOOK_005", "review", "BR_BOOK_FEEDBACK_VIEW", "ai_output_evaluation", "Receive AI book suitability response", "Auto"),
  e("BOOK_006", "review", "BR_BOOK_COMMIT", "completion", "Click Choose This Book", "Click"),
  e("BOOK_007", "review", "BR_RESOURCE_PREP", "planning", "Background book cover generation", "Auto"),
  e("BOOK_008", "review", "BR_RESOURCE_PREP", "planning", "Background book summary generation", "Auto"),
  e("BOOK_009", "review", "BR_TYPE_EXPLORE", "planning", "Enter review type selection page", "Auto"),
  e("BOOK_010", "review", "BR_TYPE_FEEDBACK_VIEW", "ai_output_evaluation", "Display AI recommended review type", "Auto"),
  e("BOOK_011", "review", "BR_TYPE_SELECT", "planning", "Click review type card", "Click"),
  e("BOOK_012", "review", "BR_TYPE_COMMIT", "completion", "Click Choose This Style", "Click"),
  e("BOOK_013", "review", "BR_NAV_BACKTRACK", "planning", "Click Back in type selection", "Click"),
  e("BOOK_014", "review", "BR_ENV_PREP", "planning", "Enter loading page", "Auto"),
  e("BOOK_015", "review", "BR_OUTLINE_READY", "planning", "Outline generated", "Auto"),
  e("BOOK_016", "review", "BR_WRITING_ENTRY", "independent_writing", "Enter book review writing page", "Auto"),
  e("BOOK_017", "review", "BR_SECTION_NAV", "completion", "Click review section tab", "Click"),
  e("BOOK_018", "review", "BR_SECTION_DRAFT", "independent_writing", "Type in current section textarea", "Input"),
  e("BOOK_019", "review", "BR_SECTION_EXPAND", "independent_writing", "Continue typing in same section", "Input"),
  e("BOOK_020", "review", "BR_LOCAL_REVISE", "revision", "Delete or replace text in section", "Input"),
  e("BOOK_021", "review", "BR_AI_WRITE_SUPPORT", "ai_help_seeking", "AI writing aid after inactivity", "Auto"),
  e("BOOK_022", "review", "BR_SECTION_COMPLETE", "completion", "Section marked complete by AI", "Auto"),
  e("BOOK_023", "review", "BR_RESOURCE_SEEK", "planning", "Click Forgot what this book is about", "Click"),
  e("BOOK_024", "review", "BR_RESOURCE_CLOSE", "planning", "Click close book summary modal", "Click"),
  e("BOOK_025", "review", "BR_AGENT_ATTEND", "planning", "Click Cagent mascot", "Click"),
  e("BOOK_026", "review", "PAUSE_MACRO", "pause_temporal", "Long idle mascot hang", "Stop"),
  e("BOOK_027", "review", "BR_DRAFT_COMPLETE", "completion", "Click Finish Review", "Click"),
  e("BOOK_028", "review", "BR_REVIEW_ENTRY", "ai_output_evaluation", "Enter complete page", "Auto"),
  e("BOOK_029", "review", "BR_GRAMMAR_SCAN", "ai_output_evaluation", "Automatic grammar review request", "Auto"),
  e("BOOK_030", "review", "BR_FEEDBACK_INSPECT", "ai_output_evaluation", "Click highlighted grammar issue", "Click"),
  e("BOOK_031", "review", "BR_CORR_ACCEPT", "revision", "Click apply correction icon", "Click"),
  e("BOOK_032", "review", "BR_TEXT_EXPORT", "completion", "Click Copy Review", "Click"),
  e("BOOK_033", "review", "BR_SAVE_REVIEW", "completion", "Click Save Review", "Click"),
  e("BOOK_034", "review", "BR_SUBMIT_EXIT", "completion", "Click Back to Map", "Click"),
  e("BOOK_035", "review", "BR_SELF_EDIT_ENTRY", "revision", "Click Edit Review", "Click"),
  e("BOOK_036", "review", "BR_SELF_EDIT", "revision", "Type in review edit textarea", "Input"),
  e("BOOK_037", "review", "BR_AI_REV_SUPPORT", "ai_help_seeking", "AI edit suggestions after delay", "Auto"),
  e("BOOK_038", "review", "BR_RESOURCE_SEEK", "planning", "Click Need inspiration?", "Click"),
  e("BOOK_039", "review", "BR_EDIT_COMMIT", "completion", "Click Save Changes in edit page", "Click"),
  e("BOOK_040", "review", "BR_NAV_BACKTRACK", "planning", "Click Back in edit page", "Click"),
  e("BOOK_041", "review", "BR_AUTO_PERSIST", "completion", "Automatic save on complete page load", "Auto"),
  e("BOOK_042", "review", "PAUSE_MICRO", "pause_temporal", "No input >2s and <=10s", "Pause"),
  e("BOOK_043", "review", "PAUSE_MESO", "pause_temporal", "No input >10s and <=60s", "Pause"),
  e("BOOK_044", "review", "PAUSE_MACRO", "pause_temporal", "No input >60s", "Pause"),
  e("BOOK_045", "review", "PAUSE_PRE_RESOURCE", "pause_temporal", "Pause before Forgot what this book is about", "Pause + Click"),
  e("BOOK_046", "review", "PAUSE_PRE_COMPLETE", "pause_temporal", "Pause before Finish Review", "Pause + Click"),
  e("BOOK_047", "review", "PAUSE_PRE_REVISE", "pause_temporal", "Pause before apply correction or manual edit", "Pause + Revision"),

  // ── Letter ─────────────────────────────────────────────
  e("LETTER_001", "letter", "LE_TASK_INIT", "completion", "Click Start Letter Adventure", "Click"),
  e("LETTER_002", "letter", "LE_RECIPIENT_PLAN", "planning", "Type recipient name", "Input"),
  e("LETTER_003", "letter", "LE_PURPOSE_PLAN", "planning", "Type occasion or purpose", "Input"),
  e("LETTER_004", "letter", "LE_SETUP_SUBMIT", "completion", "Press Enter to start after both fields filled", "Key"),
  e("LETTER_005", "letter", "LE_SETUP_SUBMIT", "completion", "Click Start Your Letter Adventure", "Click"),
  e("LETTER_006", "letter", "LE_GUIDE_REQUEST", "ai_help_seeking", "AI guidance request to letter setup API", "Auto"),
  e("LETTER_007", "letter", "LE_RESOURCE_PREP", "planning", "Reader image generation request", "Auto"),
  e("LETTER_008", "letter", "LE_GUIDE_VIEW", "ai_output_evaluation", "Display AI writing guide", "Auto"),
  e("LETTER_009", "letter", "LE_GUIDE_ACCEPT", "completion", "Click Continue to Writing", "Click"),
  e("LETTER_010", "letter", "LE_WRITING_ENTRY", "independent_writing", "Enter letter writing page", "Auto"),
  e("LETTER_011", "letter", "LE_SECTION_NAV", "completion", "Click section progress button", "Click"),
  e("LETTER_012", "letter", "LE_SECTION_DRAFT", "independent_writing", "Type in current letter section", "Input"),
  e("LETTER_013", "letter", "LE_SECTION_EXPAND", "independent_writing", "Continue typing in same section", "Input"),
  e("LETTER_014", "letter", "LE_LOCAL_REVISE", "revision", "Delete or replace text in current section", "Input"),
  e("LETTER_015", "letter", "LE_AI_WRITE_SUPPORT", "ai_help_seeking", "AI letter guide after inactivity", "Auto"),
  e("LETTER_016", "letter", "LE_SECTION_COMPLETE", "completion", "AI marks section done", "Auto"),
  e("LETTER_017", "letter", "LE_SECTION_BACK", "planning", "Click previous button", "Click"),
  e("LETTER_018", "letter", "LE_SECTION_ADVANCE", "completion", "Click next button", "Click"),
  e("LETTER_019", "letter", "LE_AGENT_ATTEND", "planning", "Click bear or mascot", "Click"),
  e("LETTER_020", "letter", "PAUSE_MACRO", "pause_temporal", "Mascot hang after long idle", "Stop"),
  e("LETTER_021", "letter", "LE_DRAFT_COMPLETE", "completion", "Click Finish Letter", "Click"),
  e("LETTER_022", "letter", "LE_PUZZLE_ENTRY", "planning", "Enter letter puzzle page", "Auto"),
  e("LETTER_023", "letter", "LE_REORDER_ATTEMPT", "planning", "Drag available section card", "Drag"),
  e("LETTER_024", "letter", "LE_REORDER_PLACE", "planning", "Drop section into target zone", "Drop"),
  e("LETTER_025", "letter", "LE_REORDER_REVISE", "revision", "Drag section from zone to another zone", "Drag"),
  e("LETTER_026", "letter", "LE_REORDER_RESET", "revision", "Click Reset Order", "Click"),
  e("LETTER_027", "letter", "LE_STRUCTURE_CONFIRMED", "completion", "Correct order achieved", "Auto"),
  e("LETTER_028", "letter", "LE_STRUCTURE_COMMIT", "completion", "Click Continue to Final Letter", "Click"),
  e("LETTER_029", "letter", "LE_REVIEW_ENTRY", "ai_output_evaluation", "Enter letter complete page", "Auto"),
  e("LETTER_030", "letter", "LE_GRAMMAR_SCAN", "ai_output_evaluation", "Automatic grammar review", "Auto"),
  e("LETTER_031", "letter", "LE_FEEDBACK_INSPECT", "ai_output_evaluation", "Click highlighted grammar issue", "Click"),
  e("LETTER_032", "letter", "LE_CORR_ACCEPT", "revision", "Click apply correction", "Click"),
  e("LETTER_033", "letter", "LE_SUBMIT_LIBRARY", "completion", "Upload letter to library", "Click"),
  e("LETTER_034", "letter", "LE_SUBMIT_DEFER", "completion", "Dismiss or postpone upload", "Click"),
  e("LETTER_035", "letter", "LE_AUTO_PERSIST", "completion", "Auto-save edited letter", "Auto"),
  e("LETTER_036", "letter", "LE_TEXT_EXPORT", "completion", "Click Copy Letter", "Click"),
  e("LETTER_037", "letter", "LE_FILE_EXPORT", "completion", "Click Download Letter", "Click"),
  e("LETTER_038", "letter", "LE_EMAIL_TARGET_PLAN", "planning", "Type recipient email", "Input"),
  e("LETTER_039", "letter", "LE_EMAIL_SEND", "completion", "Click Send Letter by Email", "Click"),
  e("LETTER_040", "letter", "LE_SELF_EDIT_ENTRY", "revision", "Click Edit Letter", "Click"),
  e("LETTER_041", "letter", "LE_SELF_EDIT", "revision", "Type in letter edit textarea", "Input"),
  e("LETTER_042", "letter", "LE_AI_REV_SUPPORT", "ai_help_seeking", "AI suggestions after manual editing", "Auto"),
  e("LETTER_043", "letter", "LE_RESOURCE_SEEK", "planning", "Click Need inspiration?", "Click"),
  e("LETTER_044", "letter", "LE_EDIT_COMMIT", "completion", "Save manually revised letter", "Click"),
  e("LETTER_045", "letter", "LE_NAV_BACKTRACK", "planning", "Leave edit mode without saving", "Click"),
  e("LETTER_046", "letter", "LE_TASK_EXIT", "completion", "Click Back to map", "Click"),
  e("LETTER_047", "letter", "PAUSE_MICRO", "pause_temporal", "No input >2s and <=10s", "Pause"),
  e("LETTER_048", "letter", "PAUSE_MESO", "pause_temporal", "No input >10s and <=60s", "Pause"),
  e("LETTER_049", "letter", "PAUSE_MACRO", "pause_temporal", "No input >60s", "Pause"),
  e("LETTER_050", "letter", "PAUSE_PRE_ADVANCE", "pause_temporal", "Pause before next section", "Pause + Click"),
  e("LETTER_051", "letter", "PAUSE_PRE_COMPLETE", "pause_temporal", "Pause before Finish Letter", "Pause + Click"),
  e("LETTER_052", "letter", "PAUSE_PRE_REVISE", "pause_temporal", "Pause before revision", "Pause + Revision"),

  // ── Drama ──────────────────────────────────────────────
  e("DRAMA_001", "drama", "DR_TASK_INIT", "completion", "Click Drama from write type selection", "Click"),
  e("DRAMA_002", "drama", "DR_BUILDER_ENTRY", "planning", "Enter drama builder view", "Auto"),
  e("DRAMA_003", "drama", "DR_SCENE_NAV", "planning", "Click scene tab", "Click"),
  e("DRAMA_004", "drama", "DR_SCENE_ADD", "planning", "Click Add Scene", "Click"),
  e("DRAMA_005", "drama", "DR_SCENE_ADD_REUSE", "planning", "Click Add Scene with reused background", "Click"),
  e("DRAMA_006", "drama", "DR_SCENE_DELETE", "revision", "Click remove scene", "Click"),
  e("DRAMA_007", "drama", "DR_PROJECT_RESET_PROMPT", "revision", "Click Reset in scene tabs", "Click"),
  e("DRAMA_008", "drama", "DR_PROJECT_RESET", "revision", "Click Yes in reset confirmation", "Click"),
  e("DRAMA_009", "drama", "DR_RESET_CANCEL", "planning", "Click No in reset confirmation", "Click"),
  e("DRAMA_010", "drama", "DR_BG_PLAN", "planning", "Type background prompt", "Input"),
  e("DRAMA_011", "drama", "DR_BG_GENERATE_REQUEST", "ai_help_seeking", "Press Enter in background prompt", "Key"),
  e("DRAMA_012", "drama", "DR_BG_UPLOAD", "planning", "Click Upload background", "Click"),
  e("DRAMA_013", "drama", "DR_BG_GENERATE_REQUEST", "ai_help_seeking", "Click Create background", "Click"),
  e("DRAMA_014", "drama", "DR_BG_CLEAR", "revision", "Click Clear bg", "Click"),
  e("DRAMA_015", "drama", "DR_NOTES_PLAN", "planning", "Type director notes", "Input"),
  e("DRAMA_016", "drama", "DR_CHAR_CREATE", "planning", "Click Create Character", "Click"),
  e("DRAMA_017", "drama", "DR_CHAR_PRESET_BROWSE", "planning", "Click Toy Box open", "Click"),
  e("DRAMA_018", "drama", "DR_CHAR_PRESET_PICK", "planning", "Click preset character in Toy Box", "Click"),
  e("DRAMA_019", "drama", "DR_CHAR_NAME", "planning", "Type Toy Box character name", "Input"),
  e("DRAMA_020", "drama", "DR_CHAR_CREATE_PRESET", "planning", "Click confirm Toy Box character", "Click"),
  e("DRAMA_021", "drama", "DR_CHAR_ADD_TO_SCENE", "planning", "Click existing available character", "Click"),
  e("DRAMA_022", "drama", "DR_CHAR_INSPECT", "planning", "Click character card to expand/collapse", "Click"),
  e("DRAMA_023", "drama", "DR_CHAR_SPECIFY", "planning", "Type or select species", "Input"),
  e("DRAMA_024", "drama", "DR_CHAR_APPEARANCE", "planning", "Type appearance description", "Input"),
  e("DRAMA_025", "drama", "DR_CHAR_IMAGE_REQUEST", "ai_help_seeking", "Click Generate Look", "Click"),
  e("DRAMA_026", "drama", "DR_CHAR_DELETE", "revision", "Click delete character", "Click"),
  e("DRAMA_027", "drama", "DR_SCENE_CHAR_SELECT", "planning", "Click character on canvas", "Click"),
  e("DRAMA_028", "drama", "DR_BLOCK_MOVE", "planning", "Drag character on canvas", "Drag"),
  e("DRAMA_029", "drama", "DR_BLOCK_RESIZE", "planning", "Click smaller button for character size", "Click"),
  e("DRAMA_030", "drama", "DR_BLOCK_RESIZE", "planning", "Click bigger button for character size", "Click"),
  e("DRAMA_031", "drama", "DR_SCENE_CHAR_REMOVE", "revision", "Click remove from scene", "Click"),
  e("DRAMA_032", "drama", "DR_DIALOGUE_WRITE", "independent_writing", "Type dialogue in Says field", "Input"),
  e("DRAMA_033", "drama", "DR_THOUGHT_WRITE", "independent_writing", "Type thought in Thinks field", "Input"),
  e("DRAMA_034", "drama", "DR_DIALOGUE_COMMIT", "completion", "Press Enter or blur after dialogue edit", "Input"),
  e("DRAMA_035", "drama", "DR_THOUGHT_COMMIT", "completion", "Press Enter or blur after thought edit", "Input"),
  e("DRAMA_036", "drama", "DR_SCRIPT_GENERATE", "ai_help_seeking", "Click Make My Drama", "Click"),
  e("DRAMA_037", "drama", "DR_SCRIPT_REQUEST", "ai_help_seeking", "Drama generation request to API", "Auto"),
  e("DRAMA_038", "drama", "DR_AUTO_PERSIST", "completion", "Drama script saved after generation", "Auto"),
  e("DRAMA_039", "drama", "DR_BOOK_ENTRY", "ai_output_evaluation", "Enter drama book view", "Auto"),
  e("DRAMA_040", "drama", "DR_BOOK_PAGE_NAV", "ai_output_evaluation", "Click Previous page", "Click"),
  e("DRAMA_041", "drama", "DR_BOOK_PAGE_NAV", "ai_output_evaluation", "Click Next page", "Click"),
  e("DRAMA_042", "drama", "DR_BOOK_PAGE_JUMP", "ai_output_evaluation", "Click page dot", "Click"),
  e("DRAMA_043", "drama", "DR_SELF_EDIT_ENTRY", "revision", "Click Edit Script", "Click"),
  e("DRAMA_044", "drama", "DR_SCRIPT_REVISE", "revision", "Type in script textarea", "Input"),
  e("DRAMA_045", "drama", "DR_EDIT_MODE_EXIT", "completion", "Click Done after editing", "Click"),
  e("DRAMA_046", "drama", "DR_AI_REV_SUPPORT", "ai_help_seeking", "Click Get AI Feedback", "Click"),
  e("DRAMA_047", "drama", "DR_AI_FEEDBACK_VIEW", "ai_output_evaluation", "AI feedback returned for revised script", "Auto"),
  e("DRAMA_048", "drama", "DR_SAVE_DRAMA", "completion", "Click Save in drama book", "Click"),
  e("DRAMA_049", "drama", "DR_TASK_EXIT", "completion", "Leave drama workflow", "Click"),
  e("DRAMA_050", "drama", "DR_VIEW_BACKTRACK", "planning", "Click Back from drama book to builder", "Click"),
  e("DRAMA_051", "drama", "PAUSE_MICRO", "pause_temporal", "No input >2s and <=10s", "Pause"),
  e("DRAMA_052", "drama", "PAUSE_MESO", "pause_temporal", "No input >10s and <=60s", "Pause"),
  e("DRAMA_053", "drama", "PAUSE_MACRO", "pause_temporal", "No input >60s", "Pause"),
  e("DRAMA_054", "drama", "PAUSE_PRE_GENERATE", "pause_temporal", "Pause before Make My Drama", "Pause + Click"),
  e("DRAMA_055", "drama", "PAUSE_PRE_REVISE", "pause_temporal", "Pause before Edit Script or Get AI Feedback", "Pause + Click"),
  e("DRAMA_056", "drama", "PAUSE_PRE_NAV", "pause_temporal", "Pause before page turn or jump", "Pause + Navigation"),

  // ── Poetry ─────────────────────────────────────────────
  e("POETRY_001", "poetry", "PO_TASK_INIT", "completion", "Click Poetry from write type selection", "Click"),
  e("POETRY_002", "poetry", "PO_FORM_ENTRY", "planning", "Enter choose-form phase", "Auto"),
  e("POETRY_003", "poetry", "PO_FORM_SELECT", "planning", "Click Choose on poetry form card", "Click"),
  e("POETRY_004", "poetry", "PO_TOPIC_ENTRY", "planning", "Enter setup-topic phase", "Auto"),
  e("POETRY_005", "poetry", "PO_FORM_REVISE", "revision", "Click Choose Another Form", "Click"),
  e("POETRY_006", "poetry", "PO_TOPIC_SELECT", "planning", "Click preset topic chip", "Click"),
  e("POETRY_007", "poetry", "PO_TOPIC_CREATE", "planning", "Type custom topic", "Input"),
  e("POETRY_008", "poetry", "PO_TOPIC_COMMIT", "completion", "Click Start Writing", "Click"),
  e("POETRY_009", "poetry", "PO_STRUCTURE_INIT", "planning", "Initialize poem lines for chosen form", "Auto"),
  e("POETRY_010", "poetry", "PO_EDITOR_ENTRY", "independent_writing", "Enter poetry editor phase", "Auto"),
  e("POETRY_011", "poetry", "PO_TOPIC_REVISE", "revision", "Click Back from editor to topic setup", "Click"),
  e("POETRY_012", "poetry", "PO_EXAMPLE_VIEW", "planning", "Click Show Example", "Click"),
  e("POETRY_013", "poetry", "PO_EXAMPLE_CLOSE", "planning", "Click Hide Example", "Click"),
  e("POETRY_014", "poetry", "PO_LINE_SELECT", "independent_writing", "Click line input field", "Click"),
  e("POETRY_015", "poetry", "PO_LINE_DRAFT", "independent_writing", "Type in poem line", "Input"),
  e("POETRY_016", "poetry", "PO_LINE_EXPAND", "independent_writing", "Continue typing in same line", "Input"),
  e("POETRY_017", "poetry", "PO_LOCAL_REVISE", "revision", "Delete or replace text in line", "Input"),
  e("POETRY_018", "poetry", "PO_LINE_ADD", "independent_writing", "Click plus button in free verse", "Click"),
  e("POETRY_019", "poetry", "PO_LINE_REMOVE", "revision", "Click minus button in free verse", "Click"),
  e("POETRY_020", "poetry", "PO_ORIGINALITY_NOTICE", "ai_output_evaluation", "Show originality notice after first AI use", "Auto"),
  e("POETRY_021", "poetry", "PO_INSPIRATION_REQUEST", "ai_help_seeking", "Topic-specific inspiration request", "Auto"),
  e("POETRY_022", "poetry", "PO_INSPIRATION_REFRESH", "ai_help_seeking", "Click refresh inspiration words", "Click"),
  e("POETRY_023", "poetry", "PO_WORD_INSERT", "ai_help_seeking", "Click sensory word in inspiration panel", "Click"),
  e("POETRY_024", "poetry", "PO_AI_RHYME_REQUEST", "ai_help_seeking", "Click Get Rhyme Suggestions", "Click"),
  e("POETRY_025", "poetry", "PO_AI_RHYME_ACCEPT", "revision", "Click Use on rhyme suggestion", "Click"),
  e("POETRY_026", "poetry", "PO_AI_SYLLABLE_REQUEST", "ai_help_seeking", "Click Suggest Alternatives in haiku", "Click"),
  e("POETRY_027", "poetry", "PO_AI_SYLLABLE_ACCEPT", "revision", "Click Use on haiku alternative", "Click"),
  e("POETRY_028", "poetry", "PO_AI_RHETORIC_REQUEST", "ai_help_seeking", "Click rhetoric device button", "Click"),
  e("POETRY_029", "poetry", "PO_AI_RHETORIC_ACCEPT", "revision", "Click Use on rhetoric suggestion", "Click"),
  e("POETRY_030", "poetry", "PO_AI_SUGGEST_LOG", "ai_output_evaluation", "Log AI suggestion as presented", "Auto"),
  e("POETRY_031", "poetry", "PO_AI_ACCEPT_LOG", "revision", "Log AI suggestion as accepted", "Auto"),
  e("POETRY_032", "poetry", "PO_SNAPSHOT_SAVE", "completion", "Save snapshot with usedAI=false", "Auto"),
  e("POETRY_033", "poetry", "PO_SNAPSHOT_SAVE_AI", "completion", "Save snapshot with usedAI=true", "Auto"),
  e("POETRY_034", "poetry", "PO_DRAFT_COMPLETE", "completion", "Click Finish and Review", "Click"),
  e("POETRY_035", "poetry", "PO_REVIEW_ENTRY", "ai_output_evaluation", "Enter poetry review phase", "Auto"),
  e("POETRY_036", "poetry", "PO_EDIT_MORE", "revision", "Click Edit More", "Click"),
  e("POETRY_037", "poetry", "PO_AI_FEEDBACK_REQUEST", "ai_help_seeking", "Request holistic AI feedback", "Click"),
  e("POETRY_038", "poetry", "PO_AI_FEEDBACK_VIEW", "ai_output_evaluation", "AI feedback returned for poem", "Auto"),
  e("POETRY_039", "poetry", "PO_KEEP_EDITING", "revision", "Click Keep Editing", "Click"),
  e("POETRY_040", "poetry", "PO_TASK_EXIT", "completion", "Click Back to Map from review", "Click"),
  e("POETRY_041", "poetry", "PO_SAVE_POEM", "completion", "Click Save on review page", "Click"),
  e("POETRY_042", "poetry", "PO_AUTO_PERSIST", "completion", "Save poetry to interactions", "Auto"),
  e("POETRY_043", "poetry", "PO_FORM_MONITOR", "planning", "Show haiku syllable count badge", "Auto"),
  e("POETRY_044", "poetry", "PO_FORM_MONITOR", "planning", "Show couplet word count badge", "Auto"),
  e("POETRY_045", "poetry", "PAUSE_MICRO", "pause_temporal", "No input >2s and <=10s", "Pause"),
  e("POETRY_046", "poetry", "PAUSE_MESO", "pause_temporal", "No input >10s and <=60s", "Pause"),
  e("POETRY_047", "poetry", "PAUSE_MACRO", "pause_temporal", "No input >60s", "Pause"),
  e("POETRY_048", "poetry", "PAUSE_PRE_AI_HELP", "pause_temporal", "Pause before Get Rhyme Suggestions", "Pause + Click"),
  e("POETRY_049", "poetry", "PAUSE_PRE_AI_HELP", "pause_temporal", "Pause before Suggest Alternatives", "Pause + Click"),
  e("POETRY_050", "poetry", "PAUSE_PRE_AI_HELP", "pause_temporal", "Pause before rhetoric device request", "Pause + Click"),
  e("POETRY_051", "poetry", "PAUSE_PRE_COMPLETE", "pause_temporal", "Pause before Finish and Review", "Pause + Click"),
  e("POETRY_052", "poetry", "PAUSE_PRE_REVISE", "pause_temporal", "Pause before Edit More or Keep Editing", "Pause + Click"),
]

export const PROCESS_EVENT_CATALOG: Record<string, ProcessEventDef> = Object.fromEntries(
  DEFS.map((item) => [item.eventId, item]),
)

export function lookupProcessEvent(eventId: unknown): ProcessEventDef | null {
  if (typeof eventId !== "string" || !eventId) return null
  return PROCESS_EVENT_CATALOG[eventId] ?? null
}

const DRAFT_TO_EXPAND: Record<string, string> = {
  STORY_021: "STORY_022",
  BOOK_018: "BOOK_019",
  LETTER_012: "LETTER_013",
  POETRY_015: "POETRY_016",
}

const DRAFT_TO_REVISE: Record<string, string> = {
  STORY_021: "STORY_023",
  STORY_022: "STORY_023",
  BOOK_018: "BOOK_020",
  BOOK_019: "BOOK_020",
  LETTER_012: "LETTER_014",
  LETTER_013: "LETTER_014",
  POETRY_015: "POETRY_017",
  POETRY_016: "POETRY_017",
}

export function resolveInputEventId(draftEventId: string, deltaChars: number, hadPriorText: boolean): string {
  if (deltaChars < 0) return DRAFT_TO_REVISE[draftEventId] ?? draftEventId
  if (hadPriorText && deltaChars > 0) return DRAFT_TO_EXPAND[draftEventId] ?? draftEventId
  return draftEventId
}

const PAUSE_IDS: Record<string, { micro: string; meso: string; macro: string }> = {
  STORY: { micro: "STORY_042", meso: "STORY_043", macro: "STORY_044" },
  BOOK: { micro: "BOOK_042", meso: "BOOK_043", macro: "BOOK_044" },
  LETTER: { micro: "LETTER_047", meso: "LETTER_048", macro: "LETTER_049" },
  DRAMA: { micro: "DRAMA_051", meso: "DRAMA_052", macro: "DRAMA_053" },
  POETRY: { micro: "POETRY_045", meso: "POETRY_046", macro: "POETRY_047" },
}

export function pauseEventIdFor(eventId: string, gapMs: number): string | null {
  if (gapMs <= 2000) return null
  const prefix = eventId.split("_")[0]
  const ids = PAUSE_IDS[prefix]
  if (!ids) return null
  if (gapMs <= 10000) return ids.micro
  if (gapMs <= 60000) return ids.meso
  return ids.macro
}

const PRE_PAUSE: Record<string, string> = {
  STORY_018: "STORY_045",
  STORY_026: "STORY_046",
  STORY_027: "STORY_046",
  STORY_029: "STORY_047",
  STORY_032: "STORY_048",
  STORY_034: "STORY_048",
  BOOK_023: "BOOK_045",
  BOOK_027: "BOOK_046",
  BOOK_031: "BOOK_047",
  BOOK_036: "BOOK_047",
  LETTER_018: "LETTER_050",
  LETTER_021: "LETTER_051",
  LETTER_032: "LETTER_052",
  LETTER_041: "LETTER_052",
  DRAMA_036: "DRAMA_054",
  DRAMA_043: "DRAMA_055",
  DRAMA_046: "DRAMA_055",
  DRAMA_040: "DRAMA_056",
  DRAMA_041: "DRAMA_056",
  DRAMA_042: "DRAMA_056",
  POETRY_024: "POETRY_048",
  POETRY_026: "POETRY_049",
  POETRY_028: "POETRY_050",
  POETRY_034: "POETRY_051",
  POETRY_036: "POETRY_052",
  POETRY_039: "POETRY_052",
}

export function derivedPrePauseEventId(followingEventId: string): string | null {
  return PRE_PAUSE[followingEventId] ?? null
}
