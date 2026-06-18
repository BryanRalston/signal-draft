const { getSiteUrl } = require('./site');
const { getTierLabel, formatPrice } = require('./pricing');
const { USE_CASE_LABELS } = require('./prompt');

const RESEND_API = 'https://api.resend.com/emails';

const STATUS_LABELS = {
  received: 'Brief received',
  researching: 'Research in progress',
  drafting: 'Survey design in progress',
  review: 'Methodology review',
  delivered: 'Delivered',
  revision: 'Revision in progress',
  closed: 'Closed',
};

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function portalUrl(clientToken) {
  return `${getSiteUrl()}/portal/?token=${encodeURIComponent(clientToken)}`;
}

function receivedUrl(clientToken) {
  return `${getSiteUrl()}/create/received.html?token=${encodeURIComponent(clientToken)}`;
}

async function sendEmail({ to, subject, html, bcc }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { skipped: true, reason: 'Resend not configured' };
  }

  const body = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (bcc) body.bcc = Array.isArray(bcc) ? bcc : [bcc];

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Resend HTTP ${res.status}`);
  }
  return data;
}

async function safeSend(fn, ...args) {
  try {
    await fn(...args);
  } catch (e) {
    console.error(`Email ${fn.name} failed:`, e.message || e);
  }
}

function emailShell(title, bodyHtml) {
  return `<!DOCTYPE html><html><body style="font-family:Source Sans 3,Helvetica,Arial,sans-serif;background:#1a1814;color:#e8e0d4;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#242018;border:1px solid #3d3528;border-radius:8px;padding:28px">
      <p style="font-family:IBM Plex Mono,monospace;font-size:12px;color:#b8956b;margin:0 0 8px">SignalDraft</p>
      <h1 style="font-family:Libre Baskerville,Georgia,serif;font-size:22px;margin:0 0 16px;color:#f5efe6">${esc(title)}</h1>
      ${bodyHtml}
      <p style="font-size:12px;color:#8a7f6e;margin-top:24px">Questions? Reply to this email or contact us at ${esc(process.env.CONTACT_EMAIL || 'bryan.ralston@rocketmail.com')}.</p>
    </div>
  </body></html>`;
}

async function sendIntakeReceived(project) {
  const useCase = USE_CASE_LABELS[project.use_case] || project.use_case;
  const tier = getTierLabel(project.tier);
  const portal = portalUrl(project.client_token);
  const html = emailShell('We received your research brief', `
    <p>Hi ${esc(project.contact_name)},</p>
    <p>Thanks for submitting your brief for <strong>${esc(project.company_name)}</strong> (${esc(useCase)}, ${esc(tier)} tier).</p>
    <p>We will begin research and survey design within our ${process.env.TURNAROUND_HOURS || 48}-hour SLA.</p>
    <p><a href="${portal}" style="color:#b8956b">Track your project status</a></p>
  `);
  const bcc = process.env.CONTACT_EMAIL || undefined;
  await sendEmail({
    to: project.contact_email,
    subject: `SignalDraft — brief received for ${project.company_name}`,
    html,
    bcc,
  });
}

async function sendPaymentConfirmed(project) {
  const portal = portalUrl(project.client_token);
  const amount = project.amount_cents ? formatPrice(project.amount_cents) : '';
  const html = emailShell('Payment confirmed', `
    <p>Hi ${esc(project.contact_name)},</p>
    <p>Your payment${amount ? ` of <strong>${esc(amount)}</strong>` : ''} for <strong>${esc(project.company_name)}</strong> is confirmed.</p>
    <p>We are now in the queue for research and survey design.</p>
    <p><a href="${portal}" style="color:#b8956b">View your project portal</a></p>
  `);
  await sendEmail({
    to: project.contact_email,
    subject: `SignalDraft — payment confirmed for ${project.company_name}`,
    html,
  });
}

async function sendStatusChanged(project, oldStatus, newStatus) {
  if (oldStatus === newStatus) return;
  const portal = portalUrl(project.client_token);
  const label = STATUS_LABELS[newStatus] || newStatus;
  const html = emailShell('Project status update', `
    <p>Hi ${esc(project.contact_name)},</p>
    <p>Your SignalDraft project for <strong>${esc(project.company_name)}</strong> is now: <strong>${esc(label)}</strong>.</p>
    <p><a href="${portal}" style="color:#b8956b">View details in your portal</a></p>
  `);
  await sendEmail({
    to: project.contact_email,
    subject: `SignalDraft — ${project.company_name} is now ${label}`,
    html,
  });
}

async function sendDeliverableReady(project) {
  const portal = portalUrl(project.client_token);
  const html = emailShell('Your survey deliverable is ready', `
    <p>Hi ${esc(project.contact_name)},</p>
    <p>Your research dossier and survey instrument for <strong>${esc(project.company_name)}</strong> are now available in your client portal.</p>
    <p><a href="${portal}" style="color:#b8956b;font-weight:600">Open your deliverable</a></p>
    <p style="font-size:14px;color:#a89a88">Reply to this email for revision requests per your tier.</p>
  `);
  await sendEmail({
    to: project.contact_email,
    subject: `SignalDraft — deliverable ready for ${project.company_name}`,
    html,
  });
}

module.exports = {
  isEmailConfigured,
  sendEmail,
  safeSend,
  sendIntakeReceived,
  sendPaymentConfirmed,
  sendStatusChanged,
  sendDeliverableReady,
  portalUrl,
  receivedUrl,
};