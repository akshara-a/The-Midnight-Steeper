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

  // Helper to open theme modal
  const openThemeModal = async () => {
    const themeBtn = page.locator('button[aria-label*="Theme"]').first();
    await themeBtn.click();
    await page.waitForTimeout(600);
  };

  // Helper to close theme modal
  const closeThemeModal = async () => {
    const closeBtn = page.locator('button[aria-label="Close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(800);
    }
  };

  // 3. Open Theme Modal
  await openThemeModal();
  await page.screenshot({ path: path.join(outDir, '03_theme_modal.png') });
  console.log('Saved 03_theme_modal.png');

  // 4. Select Sakura Theme
  await page.getByRole('button', { name: /Sakura Garden/i }).click();
  console.log('Selected Sakura Theme');
  await page.waitForTimeout(1000);
  await closeThemeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '04_theme_sakura_fullscreen.png') });
  console.log('Saved 04_theme_sakura_fullscreen.png');

  // 5. Select Celestial Starlight Theme
  await openThemeModal();
  await page.getByRole('button', { name: /Celestial Starlight/i }).click();
  console.log('Selected Celestial Theme');
  await page.waitForTimeout(1000);
  await closeThemeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '05_theme_celestial_fullscreen.png') });
  console.log('Saved 05_theme_celestial_fullscreen.png');

  // 6. Select Autumn Fireside Theme
  await openThemeModal();
  await page.getByRole('button', { name: /Autumn Fireside/i }).click();
  console.log('Selected Autumn Theme');
  await page.waitForTimeout(1000);
  await closeThemeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '06_theme_autumn_fullscreen.png') });
  console.log('Saved 06_theme_autumn_fullscreen.png');

  // 7. Select Zen Mineral Onsen Theme
  await openThemeModal();
  await page.getByRole('button', { name: /Zen Mineral Onsen/i }).click();
  console.log('Selected Onsen Theme');
  await page.waitForTimeout(1000);
  await closeThemeModal();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, '07_theme_onsen_fullscreen.png') });
  console.log('Saved 07_theme_onsen_fullscreen.png');

  await browser.close();
  console.log(`Visual audit screenshots saved successfully to: ${outDir}`);
}

run().catch((err) => {
  console.error('Playwright audit error:', err);
  process.exit(1);
});
