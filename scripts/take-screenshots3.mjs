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

  // ─── Login + navigate to character creation ──────────────────────
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

  // ─── Stage 1: Character Creation → complete ──────────────────────
  await page.click('button:has-text("Boy")');
  await sleep(400);
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box) {
    for (const [sx,sy,ex,ey] of [[0.15,0.15,0.45,0.40],[0.45,0.40,0.60,0.70],[0.20,0.70,0.55,0.55]]) {
      await page.mouse.move(box.x+box.width*sx, box.y+box.height*sy);
      await page.mouse.down();
      await page.mouse.move(box.x+box.width*ex, box.y+box.height*ey, { steps: 20 });
      await page.mouse.up();
      await sleep(80);
    }
  }
  await page.click('button:has-text("Generate from Sketch")');
  await sleep(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);

  // Fill character details
  await page.fill('input[placeholder="e.g., Lumi"]', 'Alex');
  await page.fill('input[placeholder="e.g., 8"]', '10');
  // Select trait via dialog
  await page.locator('button:has-text("Kind")').click();
  await sleep(500);
  await page.locator('button:has-text("Select this trait")').click();
  await sleep(300);
  await page.locator('button:has-text("Brave")').click();
  await sleep(500);
  await page.locator('button:has-text("Select this trait")').click();
  await sleep(500);

  // Wait for API + click Continue
  await sleep(7000);
  await page.locator('button:has-text("Continue")').click({ force: true, timeout: 10000 });
  await sleep(3500);

  // ─── Stage 2: StoryCollab – initial state ────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'stage2-collab-initial', 500);

  // Wait for AI welcome message to appear
  await sleep(5000);
  await shot(page, 'stage2-ai-welcome', 400);

  // Click "Adventure" suggestion pill to send first message
  try {
    await page.locator('button:has-text("Adventure")').first().click({ timeout: 5000 });
    await sleep(1000);
    await shot(page, 'stage2-adventure-sent', 400);
    // Wait for AI to respond with more plot questions
    await sleep(10000);
    await shot(page, 'stage2-ai-plot-response', 500);
  } catch (e) {
    console.log('  Adventure pill:', e.message);
  }

  // Type in the chat input and press Enter
  const chatBox = page.locator('input[placeholder="Type your message..."]');
  try {
    await chatBox.fill('A dragon stole the sun and the forest went dark. Alex must find the dragon\'s cave to bring back the light.', { timeout: 5000 });
    await sleep(400);
    await shot(page, 'stage2-typing-plot', 400);
    await page.keyboard.press('Enter');
    await sleep(1000);
    await shot(page, 'stage2-plot-sent', 400);
    await sleep(12000);
    await shot(page, 'stage2-plot-response', 500);
  } catch (e) {
    console.log('  Chat box:', e.message);
  }

  // ─── Stage 3: Structure Selection ───────────────────────────────
  // Structure cards appear inline in chat when AI is ready
  await sleep(3000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await shot(page, 'stage3-overview', 400);

  // Scroll down to find structure cards in chat
  try {
    const structCard = page.locator('button:has-text("Three-Act"), button:has-text("Three Act"), button:has-text("Hero"), button:has-text("Story Mountain"), button:has-text("Circular")').first();
    await structCard.waitFor({ timeout: 20000, state: 'visible' });
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), await structCard.elementHandle());
    await sleep(800);
    await shot(page, 'stage3-structure-cards', 500);
    await structCard.click();
    await sleep(2500);
    await shot(page, 'stage3-structure-selected', 500);
  } catch (e) {
    console.log('  Structure cards:', e.message);
    // Try scrolling down to find them
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(600);
    await shot(page, 'stage3-scrolled', 400);
  }

  // ─── Stage 4: Writing in Story Editor ───────────────────────────
  await sleep(2000);
  // Scroll to see the right-side Story Editor panel
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'stage4-editor-view', 500);

  // The Story Editor textarea should now be active
  const storyEditor = page.locator('#story-editor, textarea[placeholder*="story"], textarea[placeholder*="write"], textarea[placeholder*="Write"]').first();
  try {
    await storyEditor.fill('Once upon a time, Alex the brave boy lived in the magical Moonleaf Forest, where animals could talk and the trees glowed with silver light. One day, the sky suddenly went dark — a dragon had stolen the sun!\n\nAlex grabbed his lantern and set off on a journey to find the dragon\'s cave.', { timeout: 5000 });
    await sleep(500);
    await shot(page, 'stage4-story-written', 500);
  } catch (e) {
    console.log('  Story editor:', e.message);
    // Try clicking "Help me write!" button if it exists
    try {
      await page.locator('button:has-text("Help me write")').click({ timeout: 3000 });
      await sleep(8000);
      await shot(page, 'stage4-ai-helped', 500);
    } catch {}
  }

  // ─── Stage 5: Finish Story / Review ──────────────────────────────
  try {
    await page.locator('button:has-text("Finish Story")').click({ timeout: 8000 });
    await sleep(6000);
    await shot(page, 'stage5-review-page', 600);
    await page.evaluate(() => window.scrollTo(0, 300));
    await sleep(400);
    await shot(page, 'stage5-review-scroll', 400);
    // Try to go to complete
    await page.locator('button:has-text("Complete"), button:has-text("Save"), button:has-text("Done"), button:has-text("Finish")').first().click({ timeout: 5000 });
    await sleep(3000);
    await shot(page, 'stage5-complete', 500);
  } catch (e) {
    console.log('  Finish/Review:', e.message);
    await shot(page, 'stage5-current', 400);
  }

  await browser.close();
  console.log('\nAll stage screenshots done!');
})().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
