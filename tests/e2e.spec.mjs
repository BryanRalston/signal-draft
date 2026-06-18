import { chromium } from 'playwright';

const BASE = 'https://bryanralston.github.io/signal-draft';
const EMAIL = 'bryan.ralston@rocketmail.com';
const failures = [];
const passes = [];

function pass(msg) { passes.push(msg); console.log('PASS:', msg); }
function fail(msg, err) { failures.push({ msg, err: err?.message || String(err) }); console.error('FAIL:', msg, err?.message || ''); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    if ((await page.title()).includes('SignalDraft')) pass('Landing page title');
    else fail('Landing page title');

    if ((await page.locator('h1').first().textContent())?.includes('market')) pass('Landing hero');
    else fail('Landing hero');

    if ((await page.locator(`a[href^="mailto:${EMAIL}"]`).count()) >= 2) pass('Landing mailto links');
    else fail('Landing mailto links');

    const configText = await (await page.goto(`${BASE}/assets/js/config.js`)).text();
    if (configText.includes(EMAIL) && configText.includes('formsubmit.co')) pass('Live config.js');
    else fail('Live config.js');

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

    // Full submit flow
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.waitForURL(/preview\.html\?case=employee/, { timeout: 25000 });
    pass('Full flow: submit → generating → preview (employee)');

    const meta = await page.locator('#preview-meta').textContent();
    if (meta?.includes('Resume Test Inc')) pass('Preview meta shows company');
    else fail('Preview meta company');

    const href = await page.getAttribute('#mailto-cta', 'href');
    if (href?.includes(EMAIL)) pass('Preview mailto CTA');
    else fail('Preview mailto');

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
  }

  console.log(`\n=== SUMMARY: ${passes.length} passed, ${failures.length} failed ===`);
  if (failures.length) {
    failures.forEach((f) => console.log(`  FAIL: ${f.msg} — ${f.err}`));
    process.exit(1);
  }
}

run();