#!/usr/bin/env node
/**
 * SignalDraft growth pulse — no dependencies.
 * Usage: node scripts/growth-pulse.mjs
 * Outputs JSON for C:\Cortex\state\signal-draft-growth.json updates.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'assets', 'js', 'config.js');
const GH_PAGES_URL = 'https://bryanralston.github.io/signal-draft/';
const TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return { ok: res.ok, status: res.status, url };
  } catch (err) {
    return { ok: false, status: 0, url, error: err.name === 'AbortError' ? 'timeout' : String(err.message) };
  } finally {
    clearTimeout(timer);
  }
}

function readApiBase() {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    const match = raw.match(/apiBase:\s*['"]([^'"]*)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function readConfigFlags() {
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    const founding = raw.match(/foundingSlots:\s*(\d+)/);
    const turnaround = raw.match(/turnaroundHours:\s*(\d+)/);
    const useApi = raw.match(/useApiIntake:\s*(true|false)/);
    return {
      foundingSlots: founding ? Number(founding[1]) : null,
      turnaroundHours: turnaround ? Number(turnaround[1]) : null,
      useApiIntake: useApi ? useApi[1] === 'true' : null,
    };
  } catch {
    return { foundingSlots: null, turnaroundHours: null, useApiIntake: null };
  }
}

function normalizeBase(url) {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

async function checkVercel(base) {
  const normalized = normalizeBase(base);
  if (!normalized) {
    return { configured: false, live: false, base: '', checks: [] };
  }

  const checks = [];
  const root = await fetchWithTimeout(normalized + '/');
  checks.push({ path: '/', ...root, live: root.ok });

  const admin = await fetchWithTimeout(normalized + '/admin/');
  checks.push({ path: '/admin/', ...admin, live: admin.ok });

  const intake = await fetchWithTimeout(normalized + '/api/intake', {
    method: 'OPTIONS',
  });
  checks.push({
    path: '/api/intake',
    ...intake,
    live: intake.ok || intake.status === 405 || intake.status === 204,
  });

  const live = checks.some((c) => c.live);
  return { configured: true, live, base: normalized, checks };
}

async function main() {
  const at = new Date().toISOString();
  const apiBase = readApiBase();
  const config = readConfigFlags();

  const ghPages = await fetchWithTimeout(GH_PAGES_URL);
  const vercel = await checkVercel(apiBase);

  const pulse = {
    at,
    marketing: {
      url: GH_PAGES_URL,
      live: ghPages.ok,
      status: ghPages.status,
      error: ghPages.error ?? null,
    },
    config: {
      path: CONFIG_PATH,
      apiBase: apiBase ?? '',
      apiBase_set: Boolean(apiBase && apiBase.trim()),
      ...config,
    },
    vercel,
    summary: {
      marketing_live: ghPages.ok,
      api_configured: Boolean(apiBase && apiBase.trim()),
      vercel_live: vercel.live,
      intake_path_ready: vercel.checks?.find((c) => c.path === '/api/intake')?.live ?? false,
      activation_blocker: !(vercel.live && (apiBase === '' ? vercel.live : vercel.configured && vercel.live)),
    },
  };

  console.log(JSON.stringify(pulse, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err.message), at: new Date().toISOString() }));
  process.exit(1);
});