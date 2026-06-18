const GH_PAGES_URL = 'https://bryanralston.github.io/signal-draft/';
const TIMEOUT_MS = 8000;

async function fetchCheck(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return { ok: res.ok, status: res.status, error: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err.name === 'AbortError' ? 'timeout' : String(err.message),
    };
  } finally {
    clearTimeout(timer);
  }
}

function apiBaseFromEnv() {
  return (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.API_BASE || '').replace(/\/$/, '');
}

async function runPulse() {
  const at = new Date().toISOString();
  const selfBase = apiBaseFromEnv();
  const marketing = await fetchCheck(GH_PAGES_URL);

  let vercel = { configured: false, live: false, base: '', checks: [] };
  if (selfBase) {
    const checks = [];
    const root = await fetchCheck(selfBase + '/');
    checks.push({ path: '/', live: root.ok, status: root.status });
    const cmd = await fetchCheck(selfBase + '/command/');
    checks.push({ path: '/command/', live: cmd.ok, status: cmd.status });
    const intake = await fetchCheck(selfBase + '/api/intake', { method: 'OPTIONS' });
    checks.push({
      path: '/api/intake',
      live: intake.ok || intake.status === 405 || intake.status === 204,
      status: intake.status,
    });
    vercel = {
      configured: true,
      live: checks.some((c) => c.live),
      base: selfBase,
      checks,
    };
  }

  const supabaseOk = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    at,
    marketing: { url: GH_PAGES_URL, live: marketing.ok, status: marketing.status, error: marketing.error },
    vercel,
    supabase: { configured: supabaseOk },
    summary: {
      marketing_live: marketing.ok,
      vercel_live: vercel.live,
      supabase_configured: supabaseOk,
      intake_path_ready: vercel.checks?.find((c) => c.path === '/api/intake')?.live ?? false,
      activation_blocker: !(supabaseOk && vercel.live),
    },
  };
}

module.exports = { runPulse, apiBaseFromEnv };