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

## Phase 2 (next)

- Publish deliverable JSON from admin → client portal shows real survey
- Resend branded emails on status change
- Stripe payment link on intake