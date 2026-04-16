import { test, expect } from '@playwright/test'
import { loginAsStudent } from './helpers'

test.describe('Login Flow', () => {
  test('should login as student and reach home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Login
    await loginAsStudent(page)

    // After login, should show home page (not login page)
    // Check that the login page is no longer visible
    const loginPage = page.locator('[data-login-page]')
    await expect(loginPage).not.toBeVisible({ timeout: 10_000 })

    // Take screenshot for debugging
    await page.screenshot({ path: '/tmp/e2e-login-success.png' })
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const inputs = page.locator('input')
    await inputs.nth(0).fill('wronguser')
    await inputs.nth(1).fill('wrongpass')

    const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("登入")').first()
    await loginBtn.click()

    // Should stay on login page (error toast shown)
    await page.waitForTimeout(2000)
    const loginPage = page.locator('[data-login-page]')
    await expect(loginPage).toBeVisible()
  })
})
