import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const OUT = './tutorial-screenshots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function shot(page, name, delay = 1000) {
  await sleep(delay);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`✓ ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // ── 01. Login page (blank) ──────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await shot(page, '01-login', 1500);

  // ── 02. Fill in credentials ─────────────────────────────────────
  await page.fill('input[type="text"]', 'Stark');
  await page.fill('input[type="password"]', '123321123');
  await shot(page, '02-login-filled', 600);

  // ── 03. Click Login button ──────────────────────────────────────
  await page.click('button:has-text("Login")');
  await sleep(3500); // wait for auth + dialog animation

  // ── 04. Welcome Back dialog ─────────────────────────────────────
  await shot(page, '03-welcome-back-dialog', 500);

  // ── 05. Click "Start New Writing Project" ──────────────────────
  await page.click('button:has-text("Start New Writing Project")');
  await sleep(2000);
  await shot(page, '04-home-page', 800);

  // ── 06. Click "Start Your Journey" on home page ────────────────
  // The home page has a big CTA button
  try {
    await page.click('button:has-text("Start Your Journey"), button:has-text("開始你的旅程")', { timeout: 5000 });
    await sleep(2500);
    await shot(page, '05-journey-ticket', 800);

    // Select "Story" on journey ticket (click the Story card)
    await page.click('text=Story', { timeout: 5000 });
    await sleep(600);
    // Select difficulty 3
    await page.click('button:has-text("3")', { timeout: 3000 });
    await sleep(600);
    await shot(page, '06-journey-ticket-filled', 600);

    // Click Start
    await page.click('button:has-text("Start")', { timeout: 5000 });
    await sleep(2500);
    await shot(page, '07-after-journey', 800);
  } catch (e) {
    console.log('  Journey Ticket path failed, trying New Writing nav...');
  }

  // ── Try header "New Writing" nav to reach writeTypeSelection ────
  const currentStage = await page.evaluate(() => {
    const el = document.querySelector('[data-stage]');
    return el?.getAttribute('data-stage') || 'unknown';
  });

  if (currentStage !== 'character' && currentStage !== 'storyCollab') {
    // Navigate via header
    try {
      await page.click('text=New Writing', { timeout: 5000 });
      await sleep(2000);
      await shot(page, '07-write-type-selection', 800);

      // Click Story Writing card
      await page.click('text=Story Writing', { timeout: 5000 });
      await sleep(2000);
      await shot(page, '08-character-creation', 800);
    } catch (e) {
      console.log('  Could not navigate to write type selection:', e.message);
    }
  } else {
    await shot(page, '08-character-creation', 500);
  }

  // ── Character Creation: fill and submit ─────────────────────────
  const stage = await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'));
  console.log('  Current stage:', stage);

  // Try filling character fields
  try {
    // Look for character name input
    const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="名"], input[type="text"]').first();
    await nameInput.fill('Alex', { timeout: 5000 });
    await sleep(400);
    await shot(page, '09-character-filling', 400);

    // Find and click Next/Create button
    const btn = page.locator('button:has-text("Next"), button:has-text("Create"), button:has-text("Continue"), button:has-text("下一步")').first();
    await btn.click({ timeout: 5000 });
    await sleep(4000);
    await shot(page, '10-story-collab', 600);
  } catch (e) {
    console.log('  Character creation:', e.message);
    await shot(page, '09-current-state', 500);
  }

  // ── Story Collab: screenshot the writing area ────────────────────
  await sleep(2000);
  await shot(page, '11-story-collab-detail', 500);
  await page.evaluate(() => window.scrollBy(0, 300));
  await sleep(600);
  await shot(page, '12-story-collab-scroll', 500);

  await browser.close();
  console.log('\nDone! Screenshots in tutorial-screenshots/');
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
