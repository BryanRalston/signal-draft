import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'screenshots');
const BASE = 'http://localhost:8765/command/';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function enterDemo() {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    sessionStorage.setItem('sd_admin_token', 'demo-preview-token');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#north-star', { timeout: 10000 });
  await page.waitForTimeout(600);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.screenshot({ path: join(OUT, 'command-login.png') });

await enterDemo();
await page.screenshot({ path: join(OUT, 'command-dashboard.png') });

for (const [view, file] of [
  ['pipeline', 'command-pipeline.png'],
  ['clients', 'command-clients.png'],
  ['growth', 'command-growth.png'],
]) {
  await page.click(`[data-view="${view}"]`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, file) });
}

await browser.close();
console.log('Screenshots saved to', OUT);