import { type Page, expect } from '@playwright/test'

/**
 * Login as the test student user.
 * Assumes page is already at the login screen.
 */
export async function loginAsStudent(page: Page) {
  // Wait for the login page inputs to appear
  await page.waitForSelector('input', { timeout: 15_000 })

  // Fill username and password
  // The login form has two inputs: username and password
  const inputs = page.locator('input')
  const count = await inputs.count()
  if (count >= 2) {
    await inputs.nth(0).fill('student')
    await inputs.nth(1).fill('test123')
  }

  // Click login button
  const loginBtn = page.locator('button:has-text("Login"), button:has-text("登入"), button[type="submit"]').first()
  await loginBtn.click()

  // Wait for navigation away from login
  await page.waitForTimeout(3000)
}

/**
 * Navigate the full story writing pipeline to get to the GuidedWriting stage.
 * This goes: login → assessment (if shown) → journey map → journey ticket → character → plot → structure → writing
 */
export async function navigateToWriting(page: Page) {
  // Login first
  await loginAsStudent(page)

  // Take a screenshot to see where we landed
  const screenshotPath = `/tmp/e2e-after-login.png`
  await page.screenshot({ path: screenshotPath })

  // Check if we need to handle assessment
  // The app might show different stages depending on state
  // We'll handle this dynamically
  return screenshotPath
}

/**
 * Set a React controlled input's value properly.
 * Uses the native value setter + input event to trigger React's onChange.
 */
export async function setReactInputValue(page: Page, selector: string, value: string) {
  await page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null
      if (!el) return
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set
      if (nativeSetter) {
        nativeSetter.call(el, val)
      } else {
        el.value = val
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { sel: selector, val: value }
  )
}
