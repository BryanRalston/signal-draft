import { chromium } from 'playwright';

const BASE = 'https://bryanralston.github.io/signal-draft';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('requestfailed', (req) => {
  if (req.url().includes('web3forms')) console.log('Web3Forms request FAILED:', req.failure()?.errorText);
});
page.on('response', async (res) => {
  if (res.url().includes('web3forms')) {
    const body = await res.text().catch(() => '');
    console.log('Web3Forms response:', res.status(), body);
  }
});

async function fillWizard() {
  await page.goto(`${BASE}/create/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('sd_intake_v1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.chip[data-value="csat"]').click();
  await page.click('#btn-next');
  await page.fill('#companyName', 'CLIENT TEST — Please Ignore');
  await page.click('#btn-next');
  await page.fill('#businessObjective', 'Test objective');
  await page.fill('#researchObjectives', 'What drives NPS?');
  await page.click('#btn-next');
  await page.fill('#audience', 'US trial users');
  await page.click('#btn-next');
  await page.fill('#decisionRules', 'If NPS < 25, fix onboarding');
  await page.click('#btn-next');
  await page.fill('#contactName', 'Test Client');
  await page.fill('#contactEmail', 'test.client@example.com');
}

await fillWizard();
await page.click('#btn-next');
await page.waitForTimeout(8000);

console.log('Final URL:', page.url());
const errVisible = await page.locator('.submit-error').isVisible().catch(() => false);
console.log('Submit error visible:', errVisible);
if (errVisible) {
  console.log('Error text:', await page.locator('.submit-error').textContent());
}
console.log('Button text:', await page.locator('#btn-next').textContent());
console.log('Button disabled:', await page.locator('#btn-next').isDisabled());

await browser.close();