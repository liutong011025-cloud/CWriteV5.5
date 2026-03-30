import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const OUT = './tutorial-screenshots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shot = async (page, name, delay = 800) => {
  await sleep(delay);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`✓ ${name}`);
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // ─── Fast-track to StoryCollab ───────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'Stark');
  await page.fill('input[type="password"]', '123321123');
  await page.click('button:has-text("Login")');
  await sleep(3000);
  await page.click('button:has-text("Start New Writing Project")');
  await sleep(1500);
  await page.click('text=New Writing');
  await sleep(1200);
  await page.click('text=Story Writing');
  await sleep(1800);

  // Character creation
  await page.click('button:has-text("Boy")');
  await sleep(300);
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    for (const [sx,sy,ex,ey] of [[0.15,0.15,0.45,0.40],[0.45,0.40,0.60,0.70]]) {
      await page.mouse.move(box.x+box.width*sx, box.y+box.height*sy);
      await page.mouse.down();
      await page.mouse.move(box.x+box.width*ex, box.y+box.height*ey, { steps: 15 });
      await page.mouse.up();
      await sleep(60);
    }
  }
  await page.click('button:has-text("Generate from Sketch")');
  await sleep(2200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  await page.fill('input[placeholder="e.g., Lumi"]', 'Alex');
  await page.fill('input[placeholder="e.g., 8"]', '10');
  await page.locator('button:has-text("Kind")').click();
  await sleep(500);
  await page.locator('button:has-text("Select this trait")').click();
  await sleep(300);
  await page.locator('button:has-text("Brave")').click();
  await sleep(500);
  await page.locator('button:has-text("Select this trait")').click();
  await sleep(500);
  await sleep(6500); // wait for API
  await page.locator('button:has-text("Continue")').click({ force: true, timeout: 10000 });
  await sleep(3500);

  // ─── Stage 2: Plot Brainstorm via chat ───────────────────────────
  // Wait for AI welcome, click Adventure
  await sleep(5000);
  try {
    await page.locator('button:has-text("Adventure")').first().click({ timeout: 5000 });
    await sleep(8000);
  } catch { console.log('  No Adventure pill yet'); }

  // Click "Magical forest" setting
  try {
    await page.locator('button:has-text("Magical forest"), button:has-text("The dark forest"), button:has-text("Deep jungle")').first().click({ timeout: 8000 });
    await sleep(1000);
    await shot(page, 'stage2-setting-selected', 400);
    await sleep(10000);
    await shot(page, 'stage2-setting-response', 500);
  } catch (e) { console.log('  Setting pill:', e.message); }

  // Send plot message to complete the plot
  const chatBox = page.locator('input[placeholder="Type your message..."]');
  try {
    await chatBox.fill('A dragon stole the sun. Alex must go to the mountain to bring back the light.', { timeout: 5000 });
    await page.keyboard.press('Enter');
    await sleep(12000);
    await shot(page, 'stage2-plot-complete', 500);
  } catch (e) { console.log('  Plot msg:', e.message); }

  // Keep chatting until structure cards appear (try up to 3 more rounds)
  for (let i = 0; i < 3; i++) {
    // Check if structure cards are visible
    const struct = page.locator('button:has-text("Three-Act"), button:has-text("Three Act"), button:has-text("Hero"), button:has-text("Story Mountain"), button:has-text("Circular"), button:has-text("Beginning")');
    const count = await struct.count();
    if (count > 0) break;

    // Click any suggestion pill or send a short message
    const pills = page.locator('.rounded-full').filter({ hasText: /jungle|forest|castle|river|village|path|mountain|dark|adventure|magic/i });
    const pillCount = await pills.count();
    if (pillCount > 0) {
      await pills.first().click();
      await sleep(10000);
    } else {
      try {
        await chatBox.fill('Tell me more and suggest a structure.', { timeout: 3000 });
        await page.keyboard.press('Enter');
        await sleep(12000);
      } catch {}
    }
    await shot(page, `stage2-round-${i+1}`, 400);
  }

  // ─── Stage 3: Structure Cards ────────────────────────────────────
  try {
    const struct = page.locator('button:has-text("Three-Act"), button:has-text("Three Act"), button:has-text("Hero"), button:has-text("Story Mountain"), button:has-text("Circular"), button:has-text("Beginning")').first();
    await struct.waitFor({ timeout: 5000, state: 'visible' });
    // Scroll to structure cards
    const handle = await struct.elementHandle();
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), handle);
    await sleep(800);
    await shot(page, 'stage3-structure-cards', 500);
    await struct.click();
    await sleep(2000);
    await shot(page, 'stage3-structure-chosen', 500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
    await shot(page, 'stage3-story-editor-ready', 500);
  } catch (e) {
    console.log('  Structure cards:', e.message);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(500);
    await shot(page, 'stage3-bottom', 400);
  }

  // ─── Stage 4: Write the Story ────────────────────────────────────
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'stage4-editor-panel', 500);

  // Click "Help me write!" or write directly in the story editor
  try {
    await page.locator('button:has-text("Help me write"), button:has-text("Help Me Write")').click({ timeout: 5000 });
    await sleep(10000);
    await shot(page, 'stage4-ai-writing-help', 500);
  } catch {
    // Try to type in story area
    const storyArea = page.locator('textarea').first();
    try {
      await storyArea.fill('Once upon a time, Alex the brave boy lived in the magical Moonleaf Forest. One day, a dragon stole the sun and the forest went dark.\n\nAlex set off to find the dragon\'s cave. After a long journey through the dark forest, he discovered the cave on top of a mountain.\n\nAlex was kind to the dragon, and the dragon returned the sun. The forest lit up again, and everyone celebrated!', { timeout: 5000 });
      await sleep(400);
      await shot(page, 'stage4-story-content', 500);
    } catch (e2) { console.log('  Write area:', e2.message); }
  }

  // Screenshot the full editor with content
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await shot(page, 'stage4-full-view', 400);

  // ─── Stage 5: Finish Story → Review ──────────────────────────────
  try {
    const finishBtn = page.locator('button:has-text("Finish Story")');
    // Force click even if disabled (to trigger the review page)
    const isDisabled = await finishBtn.getAttribute('disabled');
    if (!isDisabled) {
      await finishBtn.click({ timeout: 5000 });
    } else {
      // Try "Add to Story" from chat or write minimum content
      console.log('  Finish Story button is disabled – trying Add to Story');
      await page.locator('button:has-text("Add to Story")').first().click({ timeout: 5000 });
      await sleep(2000);
      await finishBtn.click({ force: true, timeout: 5000 });
    }
    await sleep(6000);
    await shot(page, 'stage5-review-page', 600);
    await page.evaluate(() => window.scrollTo(0, 400));
    await sleep(400);
    await shot(page, 'stage5-review-bottom', 400);
  } catch (e) {
    console.log('  Finish story:', e.message);
    await shot(page, 'stage5-current', 400);
  }

  await browser.close();
  console.log('\nDone!');
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
