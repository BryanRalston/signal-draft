#!/usr/bin/env node
/**
 * Verify SignalDraft infra after Supabase + Vercel setup.
 * Usage: node scripts/verify-activate.mjs [vercel-url]
 * Reads .env.local or env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnvFile() {
  const path = join(ROOT, '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPw = process.env.ADMIN_PASSWORD;
const vercelBase = (process.argv[2] || process.env.VERCEL_URL || '').replace(/\/$/, '');

const fails = [];

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

for (const table of ['projects', 'growth_state']) {
  const { error } = await sb.from(table).select('*').limit(1);
  if (error) fails.push(`Table ${table}: ${error.message}`);
  else console.log(`OK  Supabase table: ${table}`);
}

if (vercelBase) {
  const login = await fetch(`${vercelBase}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminPw || '' }),
  });
  const loginData = await login.json().catch(() => ({}));
  if (!login.ok || !loginData.token) {
    fails.push(`Vercel login: ${loginData.message || login.status}`);
  } else {
    console.log('OK  Vercel /api/admin/login');
    const dash = await fetch(`${vercelBase}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    if (!dash.ok) fails.push(`Dashboard API: HTTP ${dash.status}`);
    else console.log('OK  Vercel /api/admin/dashboard');
  }

  const pages = ['/command/', '/create/', '/portal/'];
  for (const p of pages) {
    const r = await fetch(`${vercelBase}${p}`);
    console.log(`${r.ok ? 'OK' : 'FAIL'}  ${vercelBase}${p} (${r.status})`);
    if (!r.ok) fails.push(`Page ${p}: ${r.status}`);
  }
} else {
  console.log('Skip Vercel checks — pass URL: node scripts/verify-activate.mjs https://your-app.vercel.app');
}

if (fails.length) {
  console.error('\nFailed:');
  fails.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('\nAll checks passed.');