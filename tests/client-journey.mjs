/**
 * End-to-end CLIENT journey on the LIVE site.
 * Uses REAL Web3Forms (sends email). Run with --dry-run to skip submit.
 *
 *   node tests/client-journey.mjs
 *   node tests/client-journey.mjs --dry-run
 */
import { chromium } from 'playwright';

const BASE = 'https://bryanralston.github.io/signal-draft';
const DRY = process.argv.includes('--dry-run');

const CLIENT = {
  useCase: 'csat',
  companyName: 'CLIENT TEST — Please Ignore',
  companyUrl: 'https://example.com',
  industry: 'B2B SaaS',
  description: 'Test submission from client-journey.mjs. Safe to delete.',
  businessObjective: 'Understand why trial users do not convert to paid.',
  researchObjectives: 'What blocks adoption? Which features drive NPS? Who do customers compare us to?',
  hypotheses: 'Competitor A, Competitor B',
  audience: 'Trial users in the US, signed up in last 90 days.',
  sampleSize: '200',
  incidence: 'Moderate — B2B SaaS buyers',
  decisionRules: 'If NPS below 25, redesign onboarding before Q3.',
  deliverables: ['blueprint', 'dossier'],
  contactName: 'Test Client',
  contactEmail: 'test.client@example.com',
};

function log(step, detail) {
  console.log(`\n[Step ${step}] ${detail}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    // 1 — Landing
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    log(1, `Landing: "${(await page.locator('h1').textContent())?.trim()}"`);
    console.log('   Client sees: hero, process, pricing, "Start your research brief"');

    // 2 — Start brief
    await page.click('a[href="create/"]');
    await page.waitForURL(/\/create\/?/);
    log(2, 'Opened research brief wizard');

    await page.evaluate(() => localStorage.removeItem('sd_intake_v1'));
    await page.reload({ waitUntil: 'networkidle' });

    // 3 — Wizard steps
    await page.locator('.chip[data-value="csat"]').click();
    await page.click('#btn-next');
    log(3, 'Step 1: Selected Customer satisfaction');

    await page.fill('#companyName', CLIENT.companyName);
    await page.fill('#companyUrl', CLIENT.companyUrl);
    await page.fill('#industry', CLIENT.industry);
    await page.fill('#description', CLIENT.description);
    await page.click('#btn-next');
    log(4, `Step 2: Company — ${CLIENT.companyName}`);

    await page.fill('#businessObjective', CLIENT.businessObjective);
    await page.fill('#researchObjectives', CLIENT.researchObjectives);
    await page.fill('#hypotheses', CLIENT.hypotheses);
    await page.click('#btn-next');
    log(5, 'Step 3: Objectives filled');

    await page.fill('#audience', CLIENT.audience);
    await page.fill('#sampleSize', CLIENT.sampleSize);
    await page.fill('#incidence', CLIENT.incidence);
    await page.click('#btn-next');
    log(6, 'Step 4: Audience filled');

    await page.fill('#decisionRules', CLIENT.decisionRules);
    await page.locator('.chip[data-value="blueprint"]').click();
    await page.locator('.chip[data-value="dossier"]').click();
    await page.click('#btn-next');
    log(7, 'Step 5: Decision rules + deliverables');

    await page.fill('#contactName', CLIENT.contactName);
    await page.fill('#contactEmail', CLIENT.contactEmail);
    await page.fill('#contactCompany', CLIENT.companyName);
    await page.fill('#notes', 'Automated client journey test — please ignore.');
    const submitLabel = (await page.locator('#btn-next').textContent())?.trim();
    log(8, `Step 6: Contact info — button says "${submitLabel}"`);

    if (DRY) {
      console.log('\n=== DRY RUN — skipped real submit. Run without --dry-run to send email. ===');
      await browser.close();
      return;
    }

    // 4 — Submit (real Web3Forms)
    await page.click('#btn-next');
    await page.waitForURL(/received\.html/, { timeout: 20000 });

    const summary = await page.locator('#received-summary').textContent();
    const steps = await page.locator('.received-step h3').allTextContents();
    log(9, 'Confirmation page after submit');
    console.log(`   Summary: ${summary?.trim()}`);
    console.log(`   Next steps: ${steps.join(' → ')}`);

    const sampleHref = await page.getAttribute('#received-sample', 'href');
    log(10, `Sample link: ${sampleHref}`);

    // 5 — Client clicks sample deliverable
    await page.click('#received-sample');
    await page.waitForURL(/preview\.html/);
    const meta = await page.locator('#preview-meta').textContent();
    const qCount = await page.locator('.question-card').count();
    const banner = await page.locator('#sample-banner').isVisible();
    log(11, 'Sample deliverable page');
    console.log(`   Banner visible: ${banner}`);
    console.log(`   Meta: ${meta?.replace(/\s+/g, ' ').trim()}`);
    console.log(`   Questions shown: ${qCount}`);

    console.log('\n=== CLIENT JOURNEY COMPLETE ===');
    console.log('Check bryan.ralston@rocketmail.com for Web3Forms email with this brief.');
    console.log(`Company field in email should include: ${CLIENT.companyName}`);
  } catch (e) {
    console.error('\nJOURNEY FAILED:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();