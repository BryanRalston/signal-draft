import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, normalize } from 'path';

const BASE = 'https://bryanralston.github.io/signal-draft';
const EMAIL = 'bryan.ralston@rocketmail.com';
const failures = [];
const passes = [];

function pass(msg) { passes.push(msg); console.log('PASS:', msg); }
function fail(msg, err) { failures.push({ msg, err: err?.message || String(err) }); console.error('FAIL:', msg, err?.message || ''); }

// ---- Local static server: serves the working tree so submit-flow tests run
// against the CURRENT code (not the deployed build). Lets us mock Web3Forms. ----
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p.endsWith('/')) p += 'index.html';
        const filePath = normalize(join(ROOT, p));
        if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
        const buf = await readFile(filePath);
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(buf);
      } catch {
        res.writeHead(404); res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const server = await startServer();
  const LOCAL = `http://127.0.0.1:${server.address().port}`;

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    if ((await page.title()).includes('SignalDraft')) pass('Landing page title');
    else fail('Landing page title');

    if ((await page.locator('h1').first().textContent())?.includes('market')) pass('Landing hero');
    else fail('Landing hero');

    if ((await page.locator(`a[href^="mailto:${EMAIL}"]`).count()) >= 2) pass('Landing mailto links');
    else fail('Landing mailto links');

    const configText = await (await page.goto(`${LOCAL}/assets/js/config.js`)).text();
    if (configText.includes(EMAIL) && configText.includes('web3formsUrl') && configText.includes('api.web3forms.com')) pass('config.js has Web3Forms config');
    else fail('config.js Web3Forms config');
    if (!configText.includes('formsubmit.co') && !configText.includes('formSubmitUrl')) pass('config.js no longer references FormSubmit');
    else fail('config.js still references FormSubmit');

    for (const path of ['about.html', 'privacy.html', 'terms.html']) {
      await page.goto(`${BASE}/${path}`);
      const html = await page.content();
      if (html.includes(EMAIL)) pass(`${path} has email (href or text)`);
      else fail(`${path} email`);
    }

    for (const c of ['csat', 'employee', 'competitive']) {
      await page.goto(`${BASE}/create/preview.html?case=${c}`, { waitUntil: 'networkidle' });
      const q = await page.locator('.question-card').count();
      if (q >= 10) pass(`Preview ${c}: ${q} questions`);
      else fail(`Preview ${c} questions`);

      await page.click('button[data-pane="dossier"]');
      if ((await page.locator('.dossier-section').count()) >= 3) pass(`Preview ${c}: dossier`);
      else fail(`Preview ${c} dossier`);
    }

    // Validation: empty use case blocked
    await page.goto(`${BASE}/create/`);
    await page.evaluate(() => localStorage.removeItem('sd_intake_v1'));
    await page.reload({ waitUntil: 'networkidle' });
    page.once('dialog', async (d) => { await d.accept(); });
    await page.click('#btn-next');
    await page.waitForTimeout(300);
    if (page.url().includes('/create/') && !page.url().includes('generating')) pass('Validation blocks empty use case');
    else fail('Validation empty use case');

    // Full wizard + resume on contact step
    await page.locator('.chip[data-value="employee"]').click();
    await page.click('#btn-next');
    await page.fill('#companyName', 'Resume Test Inc');
    await page.fill('#industry', 'Healthcare');
    await page.click('#btn-next');
    await page.fill('#businessObjective', 'Reduce turnover.');
    await page.fill('#researchObjectives', 'Engagement baseline and retention drivers.');
    await page.click('#btn-next');
    await page.fill('#audience', 'All employees US');
    await page.click('#btn-next');
    await page.fill('#decisionRules', 'If engagement below 40%, launch manager training.');
    await page.click('#btn-next');
    await page.fill('#contactName', 'Resume User');
    await page.fill('#contactEmail', EMAIL);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sd_intake_v1') || '{}'));
    if (stored.data?.companyName === 'Resume Test Inc') pass('localStorage persists companyName');
    else fail('localStorage companyName');

    await page.goto(`${BASE}/about.html`);
    await page.goto(`${BASE}/create/`, { waitUntil: 'networkidle' });
    const contactName = await page.inputValue('#contactName');
    if (contactName === 'Resume User') pass('Resume restores contact step fields');
    else fail('Resume contact fields', new Error(`contactName=${contactName}, step fields visible`));

    await page.click('#btn-back');
    await page.click('#btn-back');
    await page.click('#btn-back');
    await page.click('#btn-back');
    const companyName = await page.inputValue('#companyName');
    if (companyName === 'Resume Test Inc') pass('Back navigation preserves companyName');
    else fail('Back nav companyName', new Error(companyName));

    // ---- Submit flow against LOCAL working tree, with mocked Web3Forms ----
    async function fillWizard(p) {
      await p.evaluate(() => localStorage.removeItem('sd_intake_v1'));
      await p.reload({ waitUntil: 'networkidle' });
      await p.locator('.chip[data-value="employee"]').click();
      await p.click('#btn-next');
      await p.fill('#companyName', 'Resume Test Inc');
      await p.fill('#industry', 'Healthcare');
      await p.click('#btn-next');
      await p.fill('#businessObjective', 'Reduce turnover.');
      await p.fill('#researchObjectives', 'Engagement baseline and retention drivers.');
      await p.click('#btn-next');
      await p.fill('#audience', 'All employees US');
      await p.click('#btn-next');
      await p.fill('#decisionRules', 'If engagement below 40%, launch manager training.');
      await p.click('#btn-next');
      await p.fill('#contactName', 'Resume User');
      await p.fill('#contactEmail', EMAIL);
    }

    // SUCCESS path: mock Web3Forms returning success:true → redirect to received confirmation.
    const okPage = await browser.newPage();
    await okPage.route('**/api.web3forms.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'ok' }) }));
    await okPage.goto(`${LOCAL}/create/`, { waitUntil: 'networkidle' });
    await fillWizard(okPage);
    await okPage.click('#btn-next'); // submit
    try {
      await okPage.waitForURL(/received\.html/, { timeout: 15000 });
      pass('Submit success (mocked): submit → received confirmation');
      const receivedText = await okPage.locator('h1').textContent();
      if (receivedText?.includes('brief')) pass('Received page headline');
      else fail('Received page headline');
      const draftCleared = await okPage.evaluate(() => !localStorage.getItem('sd_intake_v1'));
      if (draftCleared) pass('Submit success: localStorage draft cleared');
      else fail('Submit success: draft should clear');
    } catch (e) { fail('Submit success path', e); }
    await okPage.close();

    // FAILURE path: mock Web3Forms returning success:false → no redirect, error + mailto shown.
    const badPage = await browser.newPage();
    await badPage.route('**/api.web3forms.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'rejected' }) }));
    await badPage.goto(`${LOCAL}/create/`, { waitUntil: 'networkidle' });
    await fillWizard(badPage);
    await badPage.click('#btn-next'); // submit
    await badPage.waitForSelector('.submit-error', { timeout: 10000 }).catch(() => {});
    const errVisible = await badPage.locator('.submit-error').isVisible().catch(() => false);
    if (errVisible) pass('Submit failure: visible error message rendered');
    else fail('Submit failure: error message');

    const mailtoHref = await badPage.getAttribute('#submit-error-mailto', 'href').catch(() => null);
    if (mailtoHref && mailtoHref.startsWith(`mailto:${EMAIL}`) && mailtoHref.includes('Resume%20Test%20Inc')) pass('Submit failure: mailto fallback link with brief');
    else fail('Submit failure: mailto fallback', new Error(String(mailtoHref)));

    if (!badPage.url().includes('generating')) pass('Submit failure: no navigation to generating');
    else fail('Submit failure: should not navigate');

    const draftIntact = await badPage.evaluate(() => !!localStorage.getItem('sd_intake_v1'));
    if (draftIntact) pass('Submit failure: localStorage draft preserved');
    else fail('Submit failure: draft cleared');

    const nextEnabled = await badPage.isEnabled('#btn-next');
    if (nextEnabled) pass('Submit failure: Next button re-enabled for retry');
    else fail('Submit failure: Next still disabled');
    await badPage.close();

    // Restore live wizard state for downstream live-site checks.
    await page.goto(`${BASE}/create/`, { waitUntil: 'networkidle' });

    // Sample preview (local tree — may lag live until deploy).
    const samplePage = await browser.newPage();
    await samplePage.goto(`${LOCAL}/create/preview.html?case=employee&sample=1`, { waitUntil: 'networkidle' });
    const meta = await samplePage.locator('#preview-meta').textContent();
    if (meta?.includes('Northline Health')) pass('Sample preview shows template company');
    else fail('Sample preview company');
    const banner = await samplePage.locator('#sample-banner').isVisible();
    if (banner) pass('Sample banner visible');
    else fail('Sample banner');
    const href = await samplePage.getAttribute('#mailto-cta', 'href');
    if (href?.includes(EMAIL)) pass('Preview mailto CTA');
    else fail('Preview mailto');
    await samplePage.close();

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`);
    if (await page.locator('nav .logo').first().isVisible()) pass('Mobile landing');
    else fail('Mobile landing');

    await page.goto(`${BASE}/create/`);
    if (await page.locator('#wizard-panel').isVisible()) pass('Mobile wizard');
    else fail('Mobile wizard');

    // Link crawl from landing
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`);
    const links = await page.locator('a[href]').evaluateAll((els, base) =>
      els.map((a) => a.getAttribute('href')).filter((h) => h && !h.startsWith('mailto:') && !h.startsWith('#')),
      BASE
    );
    const checked = new Set();
    for (const href of links) {
      if (checked.has(href) || href.startsWith('http')) continue;
      checked.add(href);
      const url = href.startsWith('/') ? `${BASE}${href}` : `${BASE}/${href}`;
      try {
        const res = await page.request.get(url);
        if (res.status() === 200) pass(`Link OK: ${href}`);
        else fail(`Link ${href}`, new Error(`status ${res.status()}`));
      } catch (e) { fail(`Link ${href}`, e); }
    }

  } catch (e) {
    fail('Unexpected', e);
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n=== SUMMARY: ${passes.length} passed, ${failures.length} failed ===`);
  if (failures.length) {
    failures.forEach((f) => console.log(`  FAIL: ${f.msg} — ${f.err}`));
    process.exit(1);
  }
}

run();