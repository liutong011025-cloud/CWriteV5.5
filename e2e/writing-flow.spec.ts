import { test, expect, type Page } from '@playwright/test'
import { loginAsStudent } from './helpers'

/**
 * Step 1: Login and click "Start a new journey"
 */
async function step1_loginAndStart(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Check if we're already logged in (Home page)
  const startBtn = page.locator('button:has-text("Start a new journey")')
  const isLoggedIn = await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)
  console.log('[DEBUG step1] Already logged in:', isLoggedIn)

  if (!isLoggedIn) {
    await loginAsStudent(page)
    await page.waitForTimeout(1500)
  }

  // Now navigate to planTest by triggering "Start a new journey"
  // Use React props to call onClick handler
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.includes('Start a new journey')) {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) {
            props.onClick({ stopPropagation: () => {}, preventDefault: () => {} })
          }
        }
        break
      }
    }
  })

  // Wait for stage to change to planTest (or journeyMap if planTestResult exists)
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    const s = main?.getAttribute('data-stage')
    return s && s !== 'home' && s !== 'login'
  }, { timeout: 15_000 })

  const stage = await getStage(page)
  console.log('[DEBUG step1] Stage after start:', stage)
}

/**
 * Step 2: Complete the 7-question assessment
 * Each question has 4 option buttons (A/B/C/D). Clicking one auto-advances.
 * After all 7, a "Continue" button appears.
 */
async function step2_completeAssessment(page: Page) {
  // Wait for planTest stage
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    return main?.getAttribute('data-stage') === 'planTest'
  }, { timeout: 10_000 })

  const title = page.locator('text=Start with a Plan')
  await expect(title).toBeVisible({ timeout: 10_000 })

  for (let i = 0; i < 7; i++) {
    await page.waitForTimeout(500)

    // Click option A using React props (avoids animation stability issues)
    await page.evaluate(() => {
      // Find the option buttons in the question area
      const optionBtns = document.querySelectorAll('.space-y-4 button, .space-y-4 > button')
      if (optionBtns.length > 0) {
        const btn = optionBtns[0] as HTMLElement
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) props.onClick()
        }
      }
    })
    await page.waitForTimeout(300)
  }

  // Wait for "Great job" and "Continue" button
  await page.waitForTimeout(1000)

  // Click Continue using React props
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.includes('Continue')) {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) props.onClick()
        }
        break
      }
    }
  })
  await page.waitForTimeout(3000)
}

/**
 * Step 3: Journey Map — pick pin, place, start writing
 */
async function step3_navigateJourneyMap(page: Page) {
  await page.screenshot({ path: '/tmp/e2e-journey-map.png' })

  // The journey map uses Three.js canvas. There should be a "Pick up pin" button
  const pickPin = page.locator('button:has-text("Pick up pin"), button:has-text("Pick")')
  if (await pickPin.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await pickPin.click()
    await page.waitForTimeout(1000)

    // Click on the main area to place the pin
    await page.locator('canvas').first().click({ position: { x: 400, y: 200 } })
    await page.waitForTimeout(1500)

    // Click "Start writing from here"
    const startWriting = page.locator('button:has-text("Start writing"), button:has-text("Start Writing")')
    if (await startWriting.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startWriting.click()
      await page.waitForTimeout(2000)
    }
  } else {
    // Maybe we went to writeTypeSelection instead — skip to journey ticket
    const storyBtn = page.locator('button:has-text("Story")')
    if (await storyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await storyBtn.click()
      await page.waitForTimeout(2000)
    }
  }
  await page.screenshot({ path: '/tmp/e2e-after-journey-map.png' })
}

/**
 * Step 4: Journey Ticket — select Story type and difficulty
 */
async function step4_selectJourneyTicket(page: Page) {
  await page.screenshot({ path: '/tmp/e2e-ticket.png' })

  // Wait for journeyTicket stage
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    return main?.getAttribute('data-stage') === 'journeyTicket'
  }, { timeout: 10_000 })

  // Select "Story" card using React props click (card has animation that makes it "not stable")
  await page.evaluate(() => {
    const divs = document.querySelectorAll('div[draggable]')
    for (const div of divs) {
      if (div.textContent?.includes('Story')) {
        const propsKey = Object.keys(div).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (div as any)[propsKey]
          if (props?.onClick) props.onClick()
        }
        break
      }
    }
  })
  await page.waitForTimeout(500)

  // Select difficulty 3
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.trim() === '3') {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) props.onClick()
        }
        break
      }
    }
  })
  await page.waitForTimeout(500)

  // Click Start button
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.includes('Start') && !btn.textContent?.includes('a new journey')) {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick && !btn.hasAttribute('disabled')) {
            props.onClick()
          }
        }
        break
      }
    }
  })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/e2e-after-ticket.png' })
}

/**
 * Step 5: Character creation
 */
async function step5_createCharacter(page: Page) {
  // Wait for character stage
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    return main?.getAttribute('data-stage') === 'character'
  }, { timeout: 15_000 })

  await page.screenshot({ path: '/tmp/e2e-character.png' })

  // Select Fox using React props
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.includes('Fox')) {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) props.onClick()
        }
        break
      }
    }
  })
  await page.waitForTimeout(500)

  // Fill name
  const nameInput = page.locator('input[placeholder="e.g., Lumi"]')
  await nameInput.fill('Lumi')
  await page.waitForTimeout(300)

  // Fill age
  const ageInput = page.locator('input[placeholder="e.g., 8"]')
  await ageInput.fill('10')
  await page.waitForTimeout(300)

  // Select a trait (e.g., "Brave") — click trait button, then confirm in dialog
  const traitResult = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.trim() === 'Brave') {
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick) {
            props.onClick()
            return 'clicked Brave trait'
          }
          return 'no onClick on Brave'
        }
        return 'no reactProps on Brave, keys: ' + Object.keys(btn).filter(k => k.startsWith('__react')).join(',')
      }
    }
    return 'Brave button not found'
  })
  console.log('[DEBUG step5] Trait result:', traitResult)
  await page.waitForTimeout(1000)

  // Confirm trait in dialog — click "Select this trait"
  const selectTraitBtn = page.locator('button:has-text("Select this trait")')
  const dialogVisible = await selectTraitBtn.isVisible({ timeout: 3_000 }).catch(() => false)
  console.log('[DEBUG step5] Trait dialog visible:', dialogVisible)
  if (dialogVisible) {
    await selectTraitBtn.click({ force: true })
    await page.waitForTimeout(500)
  }

  // Click "Continue →" button using React props (it might be disabled)
  const continueResult = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent?.includes('Continue') && !btn.textContent?.includes('past')) {
        const disabled = btn.hasAttribute('disabled')
        const propsKey = Object.keys(btn).find(k => k.startsWith('__reactProps$'))
        if (propsKey) {
          const props = (btn as any)[propsKey]
          if (props?.onClick && !disabled) {
            props.onClick()
            return 'clicked Continue, disabled=' + disabled
          }
          return 'Continue found but disabled=' + disabled
        }
        return 'no reactProps on Continue'
      }
    }
    return 'Continue button not found'
  })
  console.log('[DEBUG step5] Continue result:', continueResult)
  await page.waitForTimeout(3000)
  const stageAfter = await getStage(page)
  console.log('[DEBUG step5] Stage after continue:', stageAfter)
  await page.screenshot({ path: '/tmp/e2e-after-character.png' })
}

/**
 * Step 6: Plot brainstorm
 */
async function step6_plotBrainstorm(page: Page) {
  await page.screenshot({ path: '/tmp/e2e-plot.png' })

  const textarea = page.locator('textarea').first()
  if (!(await textarea.isVisible({ timeout: 5_000 }).catch(() => false))) return

  await textarea.fill('A brave fox named Lumi goes on an adventure to find a magical crystal hidden in an ancient forest')
  await page.waitForTimeout(300)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(8000)
  await page.screenshot({ path: '/tmp/e2e-after-plot.png' })

  // Click Continue to structure
  const continueBtn = page.locator('button:has-text("Continue To Structure"), button:has-text("Continue to Structure")')
  if (await continueBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await continueBtn.click({ force: true })
    await page.waitForTimeout(3000)
  }
}

/**
 * Step 7: Structure — select Three Act Structure
 */
async function step7_selectStructure(page: Page) {
  await page.screenshot({ path: '/tmp/e2e-structure.png' })

  const stage = await getStage(page)
  console.log('[DEBUG step7] Current stage:', stage)

  // Wait for structure stage
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    const s = main?.getAttribute('data-stage')
    return s === 'structure'
  }, { timeout: 15_000 })

  // Click "Choose This Structure" button (detail view)
  const chooseBtn = page.locator('button:has-text("Choose This Structure")')
  if (await chooseBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    console.log('[DEBUG] Clicking "Choose This Structure"...')
    await chooseBtn.click({ force: true })
    await page.waitForTimeout(3000)
  } else {
    // Try "See Structures in Detail" to open the detail view
    const seeDetail = page.locator('button:has-text("See Structures in Detail")')
    if (await seeDetail.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('[DEBUG] Clicking "See Structures in Detail"...')
      await seeDetail.click({ force: true })
      await page.waitForTimeout(2000)
      // Now click "Choose This Structure"
      if (await chooseBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await chooseBtn.click({ force: true })
        await page.waitForTimeout(3000)
      }
    }
  }

  await page.screenshot({ path: '/tmp/e2e-after-structure.png' })
}

/**
 * Step 8: Guided Writing — complete all 3 sections using "test" shortcut
 */
async function step8_guidedWriting(page: Page) {
  // Wait for writing stage
  await page.waitForFunction(() => {
    const main = document.querySelector('main[data-stage]')
    return main?.getAttribute('data-stage') === 'writing'
  }, { timeout: 20_000 })

  for (let section = 0; section < 3; section++) {
    const textarea = page.locator('textarea')
    await expect(textarea.first()).toBeVisible({ timeout: 5_000 })

    await textarea.first().fill('test')
    await page.waitForTimeout(300)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `/tmp/e2e-writing-section-${section + 1}.png` })
  }

  await page.waitForTimeout(1000)
}

/**
 * Step 9: Click "Finish Story" and verify StoryReview
 */
async function step9_finishAndReview(page: Page) {
  const finishBtn = page.locator('button:has-text("Finish Story")')
  await expect(finishBtn).toBeVisible({ timeout: 5_000 })
  await expect(finishBtn).toBeEnabled()
  await finishBtn.click()

  await page.waitForTimeout(5000)
  await page.screenshot({ path: '/tmp/e2e-story-review.png' })

  // Check RSC request count (original bug: 163+ requests)
  const rscCount = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter(r => r.name.includes('_rsc')).length
  )
  console.log(`RSC requests after Finish Story: ${rscCount}`)
  expect(rscCount).toBeLessThan(20)

  // StoryReview should show content
  const reviewContent = page.locator('text=Review, text=Story, text=Setup, text=Confrontation, text=Resolution, text=review')
  await expect(reviewContent.first()).toBeVisible({ timeout: 15_000 })
}

/**
 * Get the current React stage from data-stage attribute.
 */
async function getStage(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector('main[data-stage]')
    return main?.getAttribute('data-stage') || 'unknown'
  })
}

test.describe('Full Story Flow (TDD)', () => {
  test('should complete the full story writing pipeline', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await step1_loginAndStart(page)
    console.log('[DEBUG] After step1, stage:', await getStage(page))

    await step2_completeAssessment(page)
    console.log('[DEBUG] After step2, stage:', await getStage(page))

    await step3_navigateJourneyMap(page)
    console.log('[DEBUG] After step3, stage:', await getStage(page))

    await step4_selectJourneyTicket(page)
    console.log('[DEBUG] After step4, stage:', await getStage(page))

    await step5_createCharacter(page)
    console.log('[DEBUG] After step5, stage:', await getStage(page))

    await step6_plotBrainstorm(page)
    console.log('[DEBUG] After step6, stage:', await getStage(page))

    await step7_selectStructure(page)
    console.log('[DEBUG] After step7, stage:', await getStage(page))

    await step8_guidedWriting(page)
    console.log('[DEBUG] After step8, stage:', await getStage(page))

    await step9_finishAndReview(page)
    console.log('[DEBUG] After step9, stage:', await getStage(page))

    const criticalErrors = errors.filter(e =>
      !e.includes('WebGL') && !e.includes('Shaders') && !e.includes('favicon') && !e.includes('404')
    )
    if (criticalErrors.length > 0) console.log('Critical errors:', criticalErrors)
  })
})
