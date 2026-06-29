const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://frontend-cshz0kf8f-muhammad-yaseens-projects-731a882a.vercel.app';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrollPage(page, from, to, steps = 10) {
  const step = (to - from) / steps;
  for (let i = 0; i <= steps; i++) {
    try {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'auto' }), from + step * i);
    } catch (_) {}
    await sleep(100);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1440,900'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: path.join(__dirname, '..', 'demo-video'),
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  console.log('Recording started...');

  // 1. Homepage
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  await scrollPage(page, 0, 500, 20);
  await sleep(800);
  await scrollPage(page, 500, 1000, 20);
  await sleep(800);
  await scrollPage(page, 1000, 1600, 20);
  await sleep(800);
  await scrollPage(page, 1600, 2000, 20);
  await sleep(1500);
  await scrollPage(page, 2000, 0, 25);
  await sleep(1500);

  // 2. Connect Wallet Modal
  try {
    await page.locator('button:has-text("Connect Wallet")').first().click({ timeout: 5000 });
    await sleep(3000);
    await page.keyboard.press('Escape');
    await sleep(1000);
  } catch (_) {}

  // 3. Properties Page
  await page.goto(BASE_URL + '/properties', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2500);
  await scrollPage(page, 0, 400, 12);
  await sleep(1500);
  await scrollPage(page, 400, 0, 12);
  await sleep(800);

  // 4. Marketplace Page
  await page.goto(BASE_URL + '/marketplace', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2500);
  await scrollPage(page, 0, 400, 12);
  await sleep(1500);

  // 5. List Property Page
  await page.goto(BASE_URL + '/list-property', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2500);
  await scrollPage(page, 0, 400, 12);
  await sleep(1500);

  // 6. Dashboard Page
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2500);

  // 7. Final homepage hero shot + wallet modal
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  try {
    await page.locator('button:has-text("Connect Wallet")').first().click({ timeout: 5000 });
    await sleep(3500);
    await page.keyboard.press('Escape');
  } catch (_) {}
  await sleep(2000);

  console.log('Stopping recording...');
  await context.close();
  await browser.close();
  console.log('Video saved in: E:\\New folder\\tokenestate\\demo-video\\');
})();
