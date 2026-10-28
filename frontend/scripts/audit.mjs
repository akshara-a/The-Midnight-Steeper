import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Output directory for visual audit screenshots (relative and configurable)
const outDir = process.env.AUDIT_OUT_DIR || path.join(process.cwd(), '.audit_screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

async function run() {
  console.log(`Starting Playwright visual audit targeting ${targetUrl} ...`);

  const launchOptions = {
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
  };

  if (process.env.CHROME_PATH) {
    launchOptions.executablePath = process.env.CHROME_PATH;
  } else {
    launchOptions.channel = process.env.BROWSER_CHANNEL || 'chrome';
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  // 1. Title screen
  await page.screenshot({ path: path.join(outDir, '01_title_screen.png') });
  console.log('Saved 01_title_screen.png');

  // Click "▶ Play!"
  const playButton = page.getByRole('button', { name: /Play!/i });
  if (await playButton.isVisible()) {
    await playButton.click();
    console.log('Clicked Play!');
  }

  // 2. Awake stage (Sunny in default look)
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, '02_awake_stage_classic.png') });
  console.log('Saved 02_awake_stage_classic.png');

  // 3. Open 2-Column Wardrobe Dressing Room
  const closetBtn = page.getByRole('button', { name: /Closet/i }).first();
  if (await closetBtn.isVisible()) {
    await closetBtn.click();
  } else {
    const hdrClosetBtn = page.locator('button[aria-label*="Wardrobe"]').first();
    await hdrClosetBtn.click();
  }
  console.log('Opened 2-Column Dressing Room');
  await page.waitForTimeout(1500);

  // Capture 2-column initial state (Left: live mirror, Right: catalog)
  await page.screenshot({ path: path.join(outDir, '08_wardrobe_twocolumn_initial.png') });
  console.log('Saved 08_wardrobe_twocolumn_initial.png');

  // 4. Try on Star Wizard Hat in the mirror (without saving yet)
  const wizardBtn = page.getByRole('button', { name: /Star Wizard Hat/i });
  if (await wizardBtn.isVisible()) {
    await wizardBtn.click();
    console.log('Tried on Star Wizard Hat');
  }

  // 5. Switch to Glasses tab & try on Star Rocker Shades
  const glassesTab = page.getByRole('button', { name: /Glasses/i });
  if (await glassesTab.isVisible()) {
    await glassesTab.click();
    await page.waitForTimeout(400);
    const shadesBtn = page.getByRole('button', { name: /Star Rocker Shades/i });
    if (await shadesBtn.isVisible()) {
      await shadesBtn.click();
      console.log('Tried on Star Rocker Shades');
    }
  }

  // 6. Switch to Neck tab & try on Dapper Bow Tie
  const neckTab = page.getByRole('button', { name: /Neck/i });
  if (await neckTab.isVisible()) {
    await neckTab.click();
    await page.waitForTimeout(400);
    const bowBtn = page.getByRole('button', { name: /Dapper Bow Tie/i });
    if (await bowBtn.isVisible()) {
      await bowBtn.click();
      console.log('Tried on Dapper Bow Tie');
    }
  }

  // Wait for 3D mirror render and capture live trial in the 2-column dressing room
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(outDir, '09_wardrobe_twocolumn_trying_on.png') });
  console.log('Saved 09_wardrobe_twocolumn_trying_on.png');

  // 7. Click "💾 Save Outfit" to commit changes!
  const saveBtn = page.getByRole('button', { name: /Save Outfit/i });
  if (await saveBtn.isVisible()) {
    await saveBtn.click();
    console.log('Clicked Save Outfit!');
    await page.waitForTimeout(2000);
  }

  // 8. Capture main stage showing the newly saved look on Sunny!
  await page.screenshot({ path: path.join(outDir, '10_main_stage_saved_outfit.png') });
  console.log('Saved 10_main_stage_saved_outfit.png');

  await browser.close();
  console.log(`Visual audit screenshots saved successfully to: ${outDir}`);
}

run().catch((err) => {
  console.error('Playwright audit error:', err);
  process.exit(1);
});
