import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEMO_DIR = path.resolve('demo');

if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Edge for 2x Retina demo screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--font-render-hinting=max'],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Terminal Masthead & Grid View
  console.log('Capturing 01-terminal-masthead-grid.png...');
  await page.screenshot({ path: path.join(DEMO_DIR, '01-terminal-masthead-grid.png') });

  // 2. Ledger Table View
  console.log('Switching to table view...');
  const tableBtn = await page.$('button[title="Ledger Table View"]');
  if (tableBtn) {
    await tableBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing 02-ledger-table-view.png...');
    await page.screenshot({ path: path.join(DEMO_DIR, '02-ledger-table-view.png') });
  }

  // 3. Search and Filters
  console.log('Testing search and filter...');
  const searchInput = await page.$('input[placeholder*="Search name"]');
  if (searchInput) {
    await searchInput.type('Sander');
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing 03-search-and-filters.png...');
    await page.screenshot({ path: path.join(DEMO_DIR, '03-search-and-filters.png') });

    // Clear search input
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search name"]');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 500));
  }

  // Switch back to Grid view for modals
  const gridBtn = await page.$('button[title="Grid View"]');
  if (gridBtn) {
    await gridBtn.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  // Ensure scroll is at top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 400));

  // 4. Regular Buy Modal ($SNDR)
  console.log('Opening Buy modal for regular token...');
  const buyBtns = await page.$$('button');
  for (const btn of buyBtns) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Buy $SNDR')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  console.log('Capturing 04-buy-modal-regular.png...');
  await page.screenshot({ path: path.join(DEMO_DIR, '04-buy-modal-regular.png') });

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // 5. Taxed Buy Modal ($TAXED)
  console.log('Opening Buy modal for TAXED token...');
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Buy $TAXED')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 800));
  console.log('Capturing 05-buy-modal-taxed.png...');
  await page.screenshot({ path: path.join(DEMO_DIR, '05-buy-modal-taxed.png') });

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // 6. Launch Token Modal (Centered with createPortal)
  console.log('Opening Launch Token modal...');
  const launchBtn = await page.$('header button[title*="Launch"]');
  if (launchBtn) {
    await launchBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing 06-launch-token-modal.png...');
    await page.screenshot({ path: path.join(DEMO_DIR, '06-launch-token-modal.png') });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));
  }

  // 7. Connect Wallet Modal (Centered with createPortal)
  console.log('Opening Connect Wallet modal...');
  const connectBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent?.includes('Connect Wallet'));
  });
  if (connectBtn && connectBtn.asElement()) {
    await connectBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing 07-wallet-connect-modal.png...');
    await page.screenshot({ path: path.join(DEMO_DIR, '07-wallet-connect-modal.png') });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));
  }

  // 8. Technical Audit Panels
  console.log('Expanding Technical Audit panels...');
  const auditBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find((b) => b.textContent?.includes('View Verification Panels'));
  });
  if (auditBtn && auditBtn.asElement()) {
    await auditBtn.asElement().click();
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll to the audit section
    await page.evaluate(() => {
      const el = document.querySelector('h3');
      const allH3 = Array.from(document.querySelectorAll('h3'));
      const target = allH3.find((h) => h.textContent?.includes('Technical Audit'));
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    console.log('Capturing 08-technical-audit-panels.png...');
    await page.screenshot({ path: path.join(DEMO_DIR, '08-technical-audit-panels.png') });
  }

  await browser.close();
  console.log('SUCCESS! All 8 high-resolution demo screenshots captured in 2x Retina clarity!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
