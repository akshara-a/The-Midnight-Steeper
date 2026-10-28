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

  // 2. Awake stage (Classic Theme)
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(outDir, '02_awake_stage_classic.png') });
  console.log('Saved 02_awake_stage_classic.png');

  // Helper to open wardrobe modal
  const openWardrobeModal = async () => {
    const closetBtn = page.getByRole('button', { name: /Closet/i }).first();
    if (await closetBtn.isVisible()) {
      await closetBtn.click();
    } else {
      const hdrClosetBtn = page.locator('button[aria-label*="Wardrobe"]').first();
      await hdrClosetBtn.click();
    }
    await page.waitForTimeout(600);
  };

  // Helper to close modals
  const closeModal = async () => {
    const closeBtn = page.locator('button[aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    }
  };

  // 3. Open Wardrobe Modal
  await openWardrobeModal();
  console.log('Opened Wardrobe Modal');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '08_wardrobe_modal_hats.png') });
  console.log('Saved 08_wardrobe_modal_hats.png');

  // 4. Equip Star Wizard Hat
  const wizardBtn = page.getByRole('button', { name: /Star Wizard Hat/i });
  if (await wizardBtn.isVisible()) {
    await wizardBtn.click();
    console.log('Equipped Star Wizard Hat');
  }

  // 5. Switch to Glasses tab & equip Star Rocker Shades
  const glassesTab = page.getByRole('button', { name: /Glasses/i });
  if (await glassesTab.isVisible()) {
    await glassesTab.click();
    await page.waitForTimeout(400);
    const shadesBtn = page.getByRole('button', { name: /Star Rocker Shades/i });
    if (await shadesBtn.isVisible()) {
      await shadesBtn.click();
      console.log('Equipped Star Rocker Shades');
    }
  }

  // 6. Switch to Neckwear tab & equip Dapper Bow Tie
  const neckTab = page.getByRole('button', { name: /Neckwear/i });
  if (await neckTab.isVisible()) {
    await neckTab.click();
    await page.waitForTimeout(400);
    const bowBtn = page.getByRole('button', { name: /Dapper Bow Tie/i });
    if (await bowBtn.isVisible()) {
      await bowBtn.click();
      console.log('Equipped Dapper Bow Tie');
    }
  }

  // 7. Close Wardrobe Modal & Screenshot 3D Dressed-Up Sunny
  await closeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '09_sunny_dressed_up_wizard.png') });
  console.log('Saved 09_sunny_dressed_up_wizard.png');

  // 8. Re-open Wardrobe & Equip Royal Crown + Glasses + Scarf
  await openWardrobeModal();
  const hatsTab = page.getByRole('button', { name: /Hats/i });
  if (await hatsTab.isVisible()) {
    await hatsTab.click();
    await page.waitForTimeout(300);
    const crownBtn = page.getByRole('button', { name: /Tea Monarch Crown/i });
    if (await crownBtn.isVisible()) await crownBtn.click();
  }

  if (await glassesTab.isVisible()) {
    await glassesTab.click();
    await page.waitForTimeout(300);
    const specBtn = page.getByRole('button', { name: /Tea Scholar Spectacles/i });
    if (await specBtn.isVisible()) await specBtn.click();
  }

  if (await neckTab.isVisible()) {
    await neckTab.click();
    await page.waitForTimeout(300);
    const scarfBtn = page.getByRole('button', { name: /Chunky Wool Scarf/i });
    if (await scarfBtn.isVisible()) await scarfBtn.click();
  }

  await closeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '10_sunny_dressed_up_royal.png') });
  console.log('Saved 10_sunny_dressed_up_royal.png');

  await browser.close();
  console.log(`Visual audit screenshots saved successfully to: ${outDir}`);
}

run().catch((err) => {
  console.error('Playwright audit error:', err);
  process.exit(1);
});
