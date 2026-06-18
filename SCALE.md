# SignalDraft — Phase 1 scaling setup

Operator dashboard + Supabase project tracking. Deploy on **Vercel** (static site + API).

## 1. Supabase

1. Create project at https://supabase.com
2. SQL Editor → paste and run `supabase/schema.sql`
3. Settings → API → copy **Project URL** and **service_role** key (never expose service_role in the browser)

## 2. Vercel

1. Import repo `BryanRalston/signal-draft` at https://vercel.com
2. Framework: **Other** (no build command)
3. Add environment variables from `.env.example`
4. Deploy

Your app URL: `https://signal-draft-xxx.vercel.app`

## 3. Config (if keeping GitHub Pages for marketing)

In `assets/js/config.js` on the Pages deploy branch:

```javascript
apiBase: 'https://YOUR-PROJECT.vercel.app',
```

Intake will POST to Vercel API; admin + portal live on Vercel.

**Recommended:** Point custom domain to Vercel and use one host for everything (`apiBase: ''`).

## 4. Operator workflow

| URL | Purpose |
|-----|---------|
| `/command/` | Sign in → CRM dashboard → pipeline / clients → **Copy Grok prompt** → update status |
| `/portal/?token=…` | Client status page (link from confirmation email / received page) |

### Daily flow

1. New brief → appears in **Received** column
2. Click card → **Copy Grok prompt** → paste in Grok Heavy
3. Drag status: Researching → Drafting → Review → Delivered
4. Email client deliverable; they can check `/portal/?token=…`

## 5. Intake paths

- **Primary:** `POST /api/intake` → Supabase `projects` table
- **Fallback:** Web3Forms (if API fails or `useApiIntake: false`)

## 6. Security

- `ADMIN_PASSWORD` protects operator APIs
- `client_token` is unguessable hex — treat portal links like magic links
- Service role key only in Vercel env vars

## Phase 2 — Payments, email, portal deliverables

### 1. Run SQL migration

On an **existing** Supabase project (already ran Phase 1 schema):

```sql
-- paste supabase/migration-phase2.sql
```

Fresh installs: `supabase/schema.sql` already includes Phase 2 columns.

### 2. Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys → copy **Secret key**
2. Vercel env: `STRIPE_SECRET_KEY=sk_live_...` (or `sk_test_...` for testing)
3. Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy **Signing secret** → Vercel env: `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Redeploy Vercel after adding env vars

**Flow:** Intake saves project → Stripe Checkout for tier price → client pays → webhook sets `payment_status=paid` → confirmation email.

**Tier prices (USD):** blueprint $399 · full $999 · research $1,999

**Founding / manual mode:** Omit `STRIPE_SECRET_KEY` — intake sets `payment_status=waived` and skips checkout.

### 3. Resend

1. [Resend](https://resend.com) → API Keys → create key
2. Vercel env:
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=SignalDraft <onboarding@resend.dev>` (or your verified domain)
   - `CONTACT_EMAIL=your@email.com` (BCC on intake emails)
   - `SITE_URL=https://YOUR-VERCEL-URL.vercel.app`

**Emails sent (failures logged, API continues):**

| Event | Template |
|-------|----------|
| Brief submitted | `intake_received` → client (+ BCC operator) |
| Stripe paid | `payment_confirmed` → client |
| Admin status change | `status_changed` → client |
| Publish deliverable | `deliverable_ready` → client |

### 4. Portal deliverables

1. Command → open client → **Copy Grok prompt** → paste output in Grok Heavy
2. Paste JSON into **Deliverable JSON** textarea (same shape as sample templates)
3. **Validate** → **Publish to portal**
4. Client sees dossier + survey tabs at `/portal/?token=…`

Deliverable schema: `{ version, companyName, useCase, label, questionCount, estMinutes, compliance[], dossier{}, questions[] }`

### 5. Operator workflow (updated)

| Step | Action |
|------|--------|
| Intake | Client pays via Stripe (or waived for founding) |
| Research | Copy Grok prompt → deliver |
| Publish | Paste JSON → Publish to portal |
| Status | Pipeline updates trigger client emails |

### 6. Env vars checklist (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `SUPABASE_URL` | Yes | Phase 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Phase 1 |
| `ADMIN_PASSWORD` | Yes | Phase 1 |
| `SITE_URL` | Recommended | Email + Stripe redirect links |
| `STRIPE_SECRET_KEY` | Optional | Enables checkout |
| `STRIPE_WEBHOOK_SECRET` | If Stripe | Webhook verification |
| `RESEND_API_KEY` | Optional | Enables auto emails |
| `EMAIL_FROM` | If Resend | Sender address |
| `CONTACT_EMAIL` | Optional | BCC + footer |