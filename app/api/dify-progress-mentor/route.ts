import { NextRequest, NextResponse } from "next/server"
import { logApiCall } from "@/lib/log-api-call"
import { chat, isConfigured, DeepSeekError } from "@/lib/deepseek"

export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const { action, stage, context, user_id } = await request.json()

    if (!isConfigured()) {
      return NextResponse.json({ error: "DeepSeek API not configured" }, { status: 500 })
    }

    const contextInfo = context || {}

    let contextDescription = ""
    let nextStepGuidance = ""

    if (stage === "character") {
      const hasName = contextInfo.name && contextInfo.name.trim() !== ""
      const hasSpecies = contextInfo.species && contextInfo.species.trim() !== ""
      const hasImage = contextInfo.hasImage === true
      const hasTraits = contextInfo.traits && contextInfo.traits.length > 0

      contextDescription = `Student is creating a character. Character name: ${contextInfo.name || "not set"}, Species: ${contextInfo.species || "not set"}, Traits: ${contextInfo.traits?.join(", ") || "none"}, Has image: ${hasImage ? "yes" : "no"}.`

      if (!hasName) {
        nextStepGuidance = "The next step is to enter a character name."
      } else if (!hasSpecies) {
        nextStepGuidance = "The next step is to select or enter a species for the character."
      } else if (!hasTraits) {
        nextStepGuidance = "The next step is to select some traits that describe the character's personality."
      } else if (!hasImage) {
        nextStepGuidance = "The next step is to click 'Create My Character' button to generate the character image."
      } else {
        nextStepGuidance = "Character creation is complete! The next step is to click 'Continue to Plot' button to start brainstorming the story plot."
      }
    } else if (stage === "plot") {
      const setting = contextInfo.plotData?.setting || ""
      const conflict = contextInfo.plotData?.conflict || ""
      const goal = contextInfo.plotData?.goal || ""
      const isComplete = contextInfo.summaryDone === true

      contextDescription = `Student is brainstorming plot. Character: ${contextInfo.character || "unknown"}, Messages exchanged: ${contextInfo.messagesCount || 0}, Plot progress - Setting: ${setting || "not set"}, Conflict: ${conflict || "not set"}, Goal: ${goal || "not set"}. Plot complete: ${isComplete ? "yes" : "no"}.`

      if (!setting) {
        nextStepGuidance = "The next step is to discuss where the story takes place (the setting) with the AI."
      } else if (!conflict) {
        nextStepGuidance = "The next step is to discuss what problem or challenge the character faces (the conflict)."
      } else if (!goal) {
        nextStepGuidance = "The next step is to discuss what the character wants to achieve (the goal)."
      } else if (!isComplete) {
        nextStepGuidance = "Keep discussing with the AI until all plot elements (setting, conflict, and goal) are clear. Then the 'Continue' button will appear."
      } else {
        nextStepGuidance = "Plot brainstorming is complete! The next step is to click 'Continue to Story Structure' button to choose how to structure your story."
      }
    } else if (stage === "structure") {
      const hasSelected = contextInfo.selectedStructure && contextInfo.selectedStructure !== "none"

      contextDescription = `Student is choosing story structure. Currently viewing page: ${contextInfo.currentPage || 0}, Selected structure: ${contextInfo.selectedStructure || "none"}, Examples generated: ${contextInfo.examplesGenerated ? "yes" : "no"}.`

      if (!contextInfo.examplesGenerated) {
        nextStepGuidance = "The next step is to click 'See Structures in Detail' to view example stories for each structure type."
      } else if (!hasSelected) {
        nextStepGuidance = "The next step is to choose one of the three story structures (Freytag's Pyramid, Three Act Structure, or Fichtean Curve) that you like best."
      } else {
        nextStepGuidance = "Story structure is selected! The next step is to start writing your story using the chosen structure."
      }
    } else if (stage === "writing") {
      const currentSection = contextInfo.currentSection || 0
      const totalSections = contextInfo.structure?.outline?.length || 0
      const sectionsDone = contextInfo.sectionsDone || 0
      const wordCount = contextInfo.wordCount || 0

      contextDescription = `Student is writing the story. Word count: ${wordCount || 0}, Current section: ${contextInfo.currentSection || "unknown"}, Story structure: ${contextInfo.structure || "unknown"}, Sections completed: ${sectionsDone}/${totalSections}, Story length: ${contextInfo.storyLength || 0} characters.`

      if (sectionsDone < totalSections) {
        nextStepGuidance = `The next step is to continue writing section ${currentSection + 1} of ${totalSections}. Write at least a few sentences for each section.`
      } else if (wordCount < 50) {
        nextStepGuidance = "You need at least 50 words total. Keep writing to add more details to your story!"
      } else {
        nextStepGuidance = "Your story is complete! The next step is to click 'Finish Story' button to review your completed story."
      }
    } else {
      nextStepGuidance = "Continue working on the current task."
    }

    const isQuestion =
      action &&
      (action.toLowerCase().includes("?") ||
        action.toLowerCase().includes("what") ||
        action.toLowerCase().includes("how") ||
        action.toLowerCase().includes("why") ||
        action.toLowerCase().includes("when") ||
        action.toLowerCase().includes("where") ||
        action.toLowerCase().includes("should") ||
        action.toLowerCase().includes("next") ||
        action.toLowerCase().includes("help"))

    let prompt = ""

    if (isQuestion) {
      prompt = `You are Luna, a friendly writing assistant robot helping elementary school students write stories. The student is asking you a question and needs your help.

Current stage: ${stage}
Student's question: ${action}
${contextDescription}

Next step guidance: ${nextStepGuidance}

Please answer the student's question directly and helpfully. If they ask "what should I do next" or similar questions, tell them: "${nextStepGuidance}"

For other questions, give specific, actionable advice based on the current stage and what they've done so far. Keep your answer concise (2-3 sentences), friendly, and suitable for elementary school students. Always be encouraging and clear about what they need to do.`
    } else {
      prompt = `You are Luna, a friendly writing assistant robot helping elementary school students write stories. You're monitoring the student's progress.

Current stage: ${stage}
Student's action: ${action}
${contextDescription}

Based on the student's action and current progress, provide brief, encouraging guidance in English suitable for elementary school students. Keep it very short (1-2 sentences), friendly, and motivating. Focus on what they should do next or acknowledge their progress.`
    }

    const message = await chat({
      messages: [{ role: "user", content: prompt }],
    })

    if (user_id) {
      try {
        await logApiCall(user_id, stage, "/api/dify-progress-mentor", { action, stage, context }, { message })
      } catch (logError) {
        console.error("Failed to log API call:", logError)
      }
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error calling Progress Mentor API:", error)
    if (error instanceof DeepSeekError && error.isTimeout) {
      return NextResponse.json({ error: "timeout" }, { status: 504 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
