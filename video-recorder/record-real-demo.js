const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://frontend-cshz0kf8f-muhammad-yaseens-projects-731a882a.vercel.app';
const WALLET_ADDRESS = '0x76CA6E5d13a65D6Aa6E56B95F7B3B065b9EB1b15';
const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrollPage(page, from, to, steps = 15) {
  const step = (to - from) / steps;
  for (let i = 0; i <= steps; i++) {
    try {
      await page.evaluate(y => window.scrollTo({ top: y }), from + step * i);
    } catch (_) {}
    await sleep(80);
  }
}

// Inject mock ethereum provider that auto-connects
const MOCK_ETH_SCRIPT = `
(function() {
  const ADDR = '${WALLET_ADDRESS}';
  const CHAIN = '${SEPOLIA_CHAIN_ID}';

  const provider = {
    isMetaMask: true,
    selectedAddress: ADDR,
    chainId: CHAIN,
    networkVersion: '11155111',
    _events: {},
    on(event, handler) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(handler);
    },
    removeListener() {},
    emit(event, ...args) {
      (this._events[event] || []).forEach(h => h(...args));
    },
    request({ method, params }) {
      console.log('[MockETH]', method);
      if (method === 'eth_requestAccounts' || method === 'eth_accounts')
        return Promise.resolve([ADDR]);
      if (method === 'eth_chainId') return Promise.resolve(CHAIN);
      if (method === 'net_version') return Promise.resolve('11155111');
      if (method === 'eth_getBalance') return Promise.resolve('0x2386F26FC10000'); // 0.01 ETH
      if (method === 'wallet_switchEthereumChain') return Promise.resolve(null);
      if (method === 'personal_sign' || method === 'eth_sign')
        return Promise.resolve('0x' + 'a'.repeat(130));
      if (method === 'eth_sendTransaction')
        return Promise.resolve('0x' + 'b'.repeat(64));
      return Promise.resolve(null);
    },
    enable() { return this.request({ method: 'eth_requestAccounts' }); },
  };

  window.ethereum = provider;
  window.coinbaseWalletExtension = provider;

  // Trigger accountsChanged after short delay so app picks it up
  setTimeout(() => {
    provider.emit('accountsChanged', [ADDR]);
    provider.emit('chainChanged', CHAIN);
    provider.emit('connect', { chainId: CHAIN });
  }, 500);

  console.log('[MockETH] Wallet injected:', ADDR);
})();
`;

(async () => {
  // Delete old video files
  const videoDir = path.join(__dirname, '..', 'demo-video');
  fs.readdirSync(videoDir).forEach(f => {
    try { fs.unlinkSync(path.join(videoDir, f)); } catch (_) {}
  });

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1440,900', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  // Inject mock wallet on EVERY page load
  await context.addInitScript(MOCK_ETH_SCRIPT);

  const page = await context.newPage();
  console.log('Recording started...');

  // ── 1. Homepage ──────────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  // Scroll through homepage
  await scrollPage(page, 0, 600, 20);
  await sleep(600);
  await scrollPage(page, 600, 1200, 20);
  await sleep(600);
  await scrollPage(page, 1200, 1900, 20);
  await sleep(1000);
  await scrollPage(page, 1900, 0, 25);
  await sleep(1500);

  // ── 2. Click "Connect Wallet" → show RainbowKit modal ────────────────────
  try {
    await page.locator('button:has-text("Connect Wallet")').first().click({ timeout: 5000 });
    await sleep(2500);
    // Click MetaMask option in modal
    try {
      await page.locator('text=MetaMask').first().click({ timeout: 3000 });
      await sleep(2000);
    } catch (_) {}
    await page.keyboard.press('Escape');
    await sleep(1500);
  } catch (_) {}

  // ── 3. Reload with wallet auto-connected ─────────────────────────────────
  // The mock fires accountsChanged — navigate to properties to see connected state
  await page.goto(BASE_URL + '/properties', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await scrollPage(page, 0, 400, 15);
  await sleep(1500);
  await scrollPage(page, 400, 0, 15);
  await sleep(500);

  // ── 4. Marketplace ────────────────────────────────────────────────────────
  await page.goto(BASE_URL + '/marketplace', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  await scrollPage(page, 0, 400, 15);
  await sleep(1500);

  // ── 5. List Property — Fill the form ─────────────────────────────────────
  await page.goto(BASE_URL + '/list-property', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Try to fill the form fields
  try {
    const nameField = page.locator('input[placeholder*="name"], input[placeholder*="Name"], input[name*="name"]').first();
    await nameField.click({ timeout: 3000 });
    await sleep(300);
    await page.keyboard.type('Luxury Downtown Apartment - Dubai Marina', { delay: 40 });
    await sleep(500);

    const locField = page.locator('input[placeholder*="location"], input[placeholder*="Location"], input[placeholder*="address"]').first();
    await locField.click({ timeout: 3000 });
    await sleep(300);
    await page.keyboard.type('Dubai Marina, UAE', { delay: 40 });
    await sleep(500);

    const priceField = page.locator('input[placeholder*="price"], input[placeholder*="Price"], input[type="number"]').first();
    await priceField.click({ timeout: 3000 });
    await sleep(300);
    await page.keyboard.type('500', { delay: 40 });
    await sleep(500);

    const supplyField = page.locator('input[placeholder*="supply"], input[placeholder*="Supply"], input[placeholder*="token"]').first();
    await supplyField.click({ timeout: 3000 });
    await sleep(300);
    await page.keyboard.type('1000', { delay: 40 });
    await sleep(800);
  } catch (_) {
    console.log('Form fields not found (wallet guard still showing)');
  }

  await scrollPage(page, 0, 400, 15);
  await sleep(2000);

  // ── 6. Dashboard ──────────────────────────────────────────────────────────
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  await scrollPage(page, 0, 400, 15);
  await sleep(2000);

  // ── 7. Final homepage hero ────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);
  // Final smooth scroll through hero
  await scrollPage(page, 0, 500, 20);
  await sleep(1000);
  await scrollPage(page, 500, 0, 20);
  await sleep(2500);

  console.log('Stopping recording...');
  await context.close();
  await browser.close();
  console.log('Done! Video saved in demo-video/');
})();
