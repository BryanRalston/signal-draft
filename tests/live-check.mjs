import { chromium } from 'playwright';

const BASE = 'https://bryanralston.github.io/signal-draft';
const EMAIL = 'bryan.ralston@rocketmail.com';
const failures = [];
const passes = [];

function pass(msg) { passes.push(msg); console.log('PASS:', msg); }
function fail(msg, detail) { failures.push({ msg, detail }); console.error('FAIL:', msg, detail || ''); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const intakeJs = await (await page.goto(`${BASE}/assets/js/intake.js`)).text();
    if (intakeJs.includes('received.html') && intakeJs.includes('Submit brief')) pass('Live intake.js: received redirect + Submit brief');
    else fail('Live intake.js flow');

    const previewJs = await (await page.goto(`${BASE}/assets/js/preview.js`)).text();
    if (previewJs.includes('sample-banner') && previewJs.includes('sampleCompany')) pass('Live preview.js: sample mode');
    else fail('Live preview.js sample mode');

    await page.goto(`${BASE}/create/received.html`, { waitUntil: 'networkidle' });
    if (page.url().includes('/create/index.html')) pass('Live received.html: redirects without session');
    else fail('Live received redirect', page.url());

    await page.goto(`${BASE}/create/preview.html?case=employee&sample=1`, { waitUntil: 'networkidle' });
    const meta = await page.locator('#preview-meta').textContent();
    if (meta?.includes('Northline Health')) pass('Live sample preview: Northline Health');
    else fail('Live sample company', meta);
    if (await page.locator('#sample-banner').isVisible()) pass('Live sample banner visible');
    else fail('Live sample banner');

    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const body = await page.locator('body').textContent();
    if (body?.includes('deliver within 48 hours') && !body?.includes('Preview your instrument immediately')) {
      pass('Live landing: updated 48h copy');
    } else fail('Live landing copy');

    await page.goto(`${BASE}/create/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.removeItem('sd_intake_v1'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.chip[data-value="csat"]').click();
    await page.click('#btn-next');
    await page.fill('#companyName', 'Live Test Co');
    await page.click('#btn-next');
    await page.fill('#researchObjectives', 'Test objectives for live check.');
    await page.click('#btn-next');
    await page.fill('#audience', 'Test audience');
    await page.click('#btn-next');
    await page.fill('#decisionRules', 'Test rules');
    await page.click('#btn-next');
    const btnText = (await page.locator('#btn-next').textContent())?.trim();
    if (btnText === 'Submit brief') pass('Live wizard: Submit brief on contact step');
    else fail('Live wizard button', btnText);

    await page.evaluate((email) => {
      sessionStorage.setItem('sd_submitted_brief', JSON.stringify({
        companyName: 'Live Test Co',
        contactName: 'Tester',
        contactEmail: email,
        useCase: 'csat',
      }));
    }, EMAIL);
    await page.goto(`${BASE}/create/received.html`, { waitUntil: 'networkidle' });
    const h1 = await page.locator('h1').textContent();
    const summary = await page.locator('#received-summary').textContent();
    if (h1?.toLowerCase().includes('brief')) pass('Live received page renders with session');
    else fail('Live received h1', h1);
    if (summary?.includes('Live Test Co') && summary?.includes(EMAIL)) pass('Live received summary personalized');
    else fail('Live received summary', summary);

    const sampleHref = await page.getAttribute('#received-sample', 'href');
    if (sampleHref?.includes('preview.html') && sampleHref?.includes('sample=1')) pass('Live received: sample link');
    else fail('Live received sample link', sampleHref);
  } catch (e) {
    fail('Unexpected', e.message);
  } finally {
    await browser.close();
  }

  console.log(`\n=== LIVE CHECK: ${passes.length} passed, ${failures.length} failed ===`);
  failures.forEach((f) => console.log(`  FAIL: ${f.msg} — ${f.detail}`));
  process.exit(failures.length ? 1 : 0);
}

run();