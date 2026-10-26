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

  // Support custom executable path or standard system browser channel without hardcoded paths
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

  // Wait for 3D stage Canvas
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, '02_awake_stage.png') });
  console.log('Saved 02_awake_stage.png');

  // Click Bath button
  const bathButton = page.getByRole('button', { name: /Bath/i });
  if (await bathButton.isVisible()) {
    await bathButton.click();
    console.log('Clicked Bath button');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '03_bath_stage.png') });
    console.log('Saved 03_bath_stage.png');
  }

  // Click Theme button
  const themeButton = page.getByRole('button', { name: /Theme/i }).first();
  if (await themeButton.isVisible()) {
    await themeButton.click();
    console.log('Opened Theme Modal');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '04_theme_modal.png') });
    console.log('Saved 04_theme_modal.png');
  }

  await browser.close();
  console.log(`Visual audit screenshots saved successfully to: ${outDir}`);
}

run().catch((err) => {
  console.error('Playwright audit error:', err);
  process.exit(1);
});
