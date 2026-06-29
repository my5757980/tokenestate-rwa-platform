const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-cshz0kf8f-muhammad-yaseens-projects-731a882a.vercel.app';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrollPage(page, from, to, steps = 10) {
  const step = (to - from) / steps;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'auto' }), from + step * i);
    await sleep(80);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1440,900', '--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: path.join(__dirname, 'demo-video'),
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  console.log('🎬 Recording started...');

  // ─── 1. Homepage ────────────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Scroll through homepage slowly
  await scrollPage(page, 0, 400, 15);
  await sleep(1000);
  await scrollPage(page, 400, 900, 15);
  await sleep(1000);
  await scrollPage(page, 900, 1400, 15);
  await sleep(1000);
  await scrollPage(page, 1400, 1900, 15);
  await sleep(1500);

  // Scroll back to top
  await scrollPage(page, 1900, 0, 20);
  await sleep(1000);

  // ─── 2. Connect Wallet Modal ─────────────────────────────────────────────────
  const connectBtn = page.locator('text=Connect Wallet').first();
  await connectBtn.click();
  await sleep(2500);

  // Close modal with Escape
  await page.keyboard.press('Escape');
  await sleep(1000);

  // ─── 3. Properties Page ─────────────────────────────────────────────────────
  await page.click('text=Properties');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  await scrollPage(page, 0, 300, 10);
  await sleep(1500);
  await scrollPage(page, 300, 0, 10);
  await sleep(500);

  // ─── 4. Marketplace Page ────────────────────────────────────────────────────
  await page.click('text=Marketplace');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  await scrollPage(page, 0, 300, 10);
  await sleep(1500);

  // ─── 5. List Property Page ──────────────────────────────────────────────────
  await page.goto(BASE_URL + '/list-property', { waitUntil: 'networkidle' });
  await sleep(2000);
  await scrollPage(page, 0, 300, 10);
  await sleep(1500);

  // ─── 6. Dashboard Page ──────────────────────────────────────────────────────
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });
  await sleep(2000);

  // ─── 7. Back to Homepage - Final shot ───────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(1000);

  // Show Connect Wallet modal one more time - show all wallets
  await connectBtn.click().catch(() => page.locator('text=Connect Wallet').first().click());
  await sleep(3000);
  await page.keyboard.press('Escape');
  await sleep(1000);

  // Final scroll through homepage
  await scrollPage(page, 0, 800, 20);
  await sleep(2000);
  await scrollPage(page, 800, 0, 20);
  await sleep(2000);

  console.log('🎬 Stopping recording...');
  await context.close();
  await browser.close();

  console.log('✅ Video saved in: E:\\New folder\\tokenestate\\demo-video\\');
  console.log('   Convert to MP4: ffmpeg -i *.webm -c:v libx264 tokenestate-demo.mp4');
})();
