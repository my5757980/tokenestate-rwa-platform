const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://frontend-cshz0kf8f-muhammad-yaseens-projects-731a882a.vercel.app';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scroll(page, from, to, steps = 18) {
  const step = (to - from) / steps;
  for (let i = 0; i <= steps; i++) {
    try { await page.evaluate(y => window.scrollTo({ top: y }), from + step * i); } catch (_) {}
    await sleep(90);
  }
}

async function dismissCookies(page) {
  try {
    const btn = await page.$('button:has-text("Got it"), button:has-text("Accept"), button:has-text("OK")');
    if (btn) await btn.click();
  } catch (_) {}
}

(async () => {
  // Clean old video
  const videoDir = path.join(__dirname, '..', 'demo-video');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);
  fs.readdirSync(videoDir).forEach(f => { try { fs.unlinkSync(path.join(videoDir, f)); } catch (_) {} });

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1440,900', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();
  console.log('🎬 Recording started...');

  // ═══════════════════════════════════════════════════════
  // PART 1 — TokenEstate Frontend
  // ═══════════════════════════════════════════════════════
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Scroll homepage slowly — show all sections
  await scroll(page, 0, 400, 15);   await sleep(700);
  await scroll(page, 400, 900, 15);  await sleep(700);
  await scroll(page, 900, 1400, 15); await sleep(700);
  await scroll(page, 1400, 1900, 15);await sleep(1000);
  await scroll(page, 1900, 0, 20);   await sleep(1500);

  // Open Connect Wallet modal — show RainbowKit
  try {
    await page.locator('button:has-text("Connect Wallet")').first().click({ timeout: 4000 });
    await sleep(3000); // stay on modal 3s
    await page.keyboard.press('Escape');
    await sleep(1200);
  } catch (_) {}

  // Browse Properties page
  await page.goto(BASE_URL + '/properties', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await scroll(page, 0, 300, 12); await sleep(1500);
  await scroll(page, 300, 0, 12); await sleep(600);

  // Marketplace page
  await page.goto(BASE_URL + '/marketplace', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await scroll(page, 0, 300, 12); await sleep(1500);

  // List Property page
  await page.goto(BASE_URL + '/list-property', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await scroll(page, 0, 300, 12); await sleep(1500);

  // Dashboard page
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);

  // ═══════════════════════════════════════════════════════
  // PART 2 — Etherscan: PropertyRegistry Contract (REAL)
  // ═══════════════════════════════════════════════════════
  await page.goto('https://sepolia.etherscan.io/address/0x0f5DaC9088E951241257863405F3323303f55252', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await dismissCookies(page);
  await sleep(1500);
  // Scroll to show contract info + transactions
  await scroll(page, 0, 400, 15); await sleep(1000);
  await scroll(page, 400, 600, 10); await sleep(2000);
  await scroll(page, 600, 0, 15); await sleep(1000);

  // Click "Contract" tab to show ABI/source
  try {
    const contractTab = await page.$('a:has-text("Contract"), li:has-text("Contract")');
    if (contractTab) {
      await contractTab.click();
      await sleep(2500);
      await scroll(page, 0, 300, 12);
      await sleep(1500);
    }
  } catch (_) {}

  // ═══════════════════════════════════════════════════════
  // PART 3 — Developer Wallet: real transactions
  // ═══════════════════════════════════════════════════════
  await page.goto('https://sepolia.etherscan.io/address/0x76CA6E5d13a65D6Aa6E56B95F7B3B065b9EB1b15', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await dismissCookies(page);
  await sleep(1000);
  await scroll(page, 0, 500, 18); await sleep(2000);
  await scroll(page, 500, 0, 15); await sleep(800);

  // ═══════════════════════════════════════════════════════
  // PART 4 — The Graph: Live Subgraph Query
  // ═══════════════════════════════════════════════════════
  const graphUrl = 'https://api.studio.thegraph.com/query/1755767/tokenestate/v0.0.1/graphql?query=%7B%0A++properties%28first%3A+5%29+%7B%0A++++id%0A++++owner%0A++++totalSupply%0A++++pricePerToken%0A++++tokensSold%0A++++active%0A++%7D%0A++kycbadges%28first%3A+5%29+%7B%0A++++id%0A++++holder%0A++++issuedAt%0A++%7D%0A++rentDistributions%28first%3A+5%29+%7B%0A++++id%0A++++depositor%0A++++amount%0A++%7D%0A%7D';
  await page.goto(graphUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Click run button
  try {
    const btn = await page.$('button.execute-button, [aria-label*="run" i], [aria-label*="execute" i]');
    if (btn) {
      await btn.click();
      await sleep(3000); // wait for response
    }
  } catch (_) {}

  // Show query result
  await sleep(2000);

  // ═══════════════════════════════════════════════════════
  // PART 5 — Final: back to Frontend hero
  // ═══════════════════════════════════════════════════════
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);

  // One last wallet modal show
  try {
    await page.locator('button:has-text("Connect Wallet")').first().click({ timeout: 4000 });
    await sleep(3000);
    await page.keyboard.press('Escape');
  } catch (_) {}
  await sleep(2000);

  // Final scroll through homepage
  await scroll(page, 0, 700, 20);
  await sleep(1500);
  await scroll(page, 700, 0, 20);
  await sleep(3000);

  console.log('🎬 Stopping...');
  await context.close();
  await browser.close();

  // Find and convert the video
  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    console.log('✅ Video saved:', path.join(videoDir, files[0]));
    console.log('   Now run: node convert.js');
  }
})();
