#!/usr/bin/env node
const BASE = process.env.SD_BASE || 'https://signal-draft-bryanralstons-projects.vercel.app';
const PW = process.env.ADMIN_PASSWORD || 'qs5Ufq1n4HNjeRMw4_0wwqc';

const stamp = Date.now();
const intake = {
  useCase: 'csat',
  companyName: `Cortex Live Test ${stamp}`,
  companyUrl: 'https://example.com',
  industry: 'B2B SaaS',
  description: 'Automated production test — safe to delete from Command.',
  businessObjective: 'Validate live intake → Supabase → Command pipeline.',
  researchObjectives: 'Does the full stack work end-to-end?',
  hypotheses: 'Competitor A',
  audience: 'US trial users',
  sampleSize: '100',
  incidence: 'Moderate',
  decisionRules: 'If broken, fix before first client.',
  deliverables: ['blueprint'],
  contactName: 'Cortex Test',
  contactEmail: `cortex.test+${stamp}@example.com`,
};

const results = [];
function pass(msg) { results.push({ ok: true, msg }); console.log(`PASS: ${msg}`); }
function fail(msg, err) { results.push({ ok: false, msg, err }); console.log(`FAIL: ${msg}${err ? ` — ${err}` : ''}`); }

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { res, text: await res.text() };
}

async function json(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

console.log(`\nSignalDraft live test → ${BASE}\n`);

for (const [path, needle] of [
  ['/', 'SignalDraft'],
  ['/command/', 'Command Center'],
  ['/create/', 'research brief'],
  ['/portal/', 'portal'],
]) {
  const { res, text } = await get(path);
  if (res.ok && text.toLowerCase().includes(needle.toLowerCase())) pass(`Page ${path}`);
  else fail(`Page ${path}`, `HTTP ${res.status}`);
}

let token;
{
  const { res, data } = await json('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: PW }) });
  if (res.ok && data.token) { token = data.token; pass('Admin login'); }
  else fail('Admin login', data.message || res.status);
}

if (token) {
  const { res, data } = await json('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  if (res.ok && data.db_connected) {
    pass(`Dashboard (db_connected, ${data.projects?.length ?? 0} projects before intake)`);
    if (data.pulse?.summary?.supabase_configured) pass('Infra: Supabase configured');
    else fail('Infra: Supabase');
    if (data.pulse?.summary?.vercel_live) pass('Infra: Vercel live');
    else fail('Infra: Vercel');
  } else fail('Dashboard', data.message || res.status);
}

let projectId, clientToken;
{
  const { res, data } = await json('/api/intake', { method: 'POST', body: JSON.stringify({ intake }) });
  if (res.ok && data.success && data.clientToken) {
    projectId = data.projectId;
    clientToken = data.clientToken;
    pass(`Intake API → project ${projectId.slice(0, 8)}… tier=${data.tier} payment=${data.paymentStatus || '—'}`);
    if (data.paymentStatus === 'waived' || data.paymentStatus === 'pending') pass(`Payment status: ${data.paymentStatus}`);
    else fail('Payment status', data.paymentStatus);
  } else fail('Intake API', data.message || res.status);
}

if (token && projectId) {
  const { res, data } = await json('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  const found = (data.projects || []).find((p) => p.id === projectId);
  if (res.ok && found?.status === 'received') pass(`CRM pipeline: "${found.company_name}" in Received`);
  else fail('CRM pipeline', found ? `status=${found.status}` : 'project not listed');
}

if (token && projectId) {
  const { res, data } = await json(`/api/admin/project?id=${projectId}&prompt=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok && data.grokPrompt?.includes(intake.companyName)) pass('Grok prompt includes company name');
  else fail('Grok prompt', data.message || 'missing company in prompt');
}

if (clientToken) {
  const { res, data } = await json(`/api/portal?token=${encodeURIComponent(clientToken)}`);
  if (res.ok && data.project?.status === 'received') pass(`Client portal: status=${data.project.status}`);
  else fail('Client portal', data.message || res.status);
  if (res.ok && data.project?.paymentStatus) pass(`Portal paymentStatus=${data.project.paymentStatus}`);
}

if (token && projectId) {
  const { res, data } = await json('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ clientToken }),
  });
  if (res.status === 503) pass('Stripe checkout endpoint (not configured — expected in waived mode)');
  else if (res.ok && data.checkoutUrl) pass('Stripe checkout session created');
  else if (data.message === 'Payment already completed') pass('Stripe checkout: already paid/waived');
  else if (!res.ok) fail('Stripe checkout', data.message || res.status);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n=== ${results.length - failed}/${results.length} passed ===\n`);
process.exit(failed ? 1 : 0);