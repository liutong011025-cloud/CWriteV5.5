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

  // Login
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Stark');
  await page.fill('input[type="password"]', '123321123');
  await page.click('button:has-text("Login")');
  await sleep(3000);

  // Skip welcome-back dialog
  await page.click('button:has-text("Start New Writing Project")');
  await sleep(1500);

  // Navigate to New Writing → Story
  await page.click('text=New Writing');
  await sleep(1500);
  await page.click('text=Story Writing');
  await sleep(1800);

  // ── Character Creation: select "Boy" ────────────────────────────
  await page.click('button:has-text("Boy")');
  await sleep(600);
  await shot(page, '09-character-species-selected', 600);

  // Draw a simple stroke on the canvas
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 80, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 120, { steps: 15 });
    await page.mouse.move(box.x + 200, box.y + 200, { steps: 15 });
    await page.mouse.up();
    await sleep(400);
    // Second stroke
    await page.mouse.move(box.x + 120, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + 160, { steps: 12 });
    await page.mouse.up();
  }
  await sleep(500);
  await shot(page, '10-character-drawn', 500);

  // Click Generate
  const generateBtn = page.locator('button:has-text("Generate")').first();
  try {
    await generateBtn.click({ timeout: 5000 });
    console.log('  Clicked Generate, waiting for AI response...');
    await sleep(8000); // wait for image generation
    await shot(page, '11-character-generated', 500);
  } catch {
    await shot(page, '11-character-ready', 500);
  }

  // Try clicking Next/Create/Continue to proceed
  try {
    const next = page.locator('button:has-text("Next"), button:has-text("Create Character"), button:has-text("Continue")').first();
    await next.click({ timeout: 5000 });
    await sleep(3000);
    await shot(page, '12-story-collab', 600);
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(500);
    await shot(page, '13-story-collab-scroll', 500);
  } catch (e) {
    console.log('  Could not advance from character creation:', e.message);
    await shot(page, '12-current-state', 500);
  }

  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error(e.message); process.exit(1); });
