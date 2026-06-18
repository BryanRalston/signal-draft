# SignalDraft — Project Rules for Grok Build

## What this is
AI-researched survey design service. Marketing + intake + **operator dashboard** (Phase 1 scaling). Human-in-the-loop: Grok Heavy produces deliverables; Supabase tracks every client.

## Architecture
- **Public:** Static site + Vercel serverless API (`/api/*`)
- **Database:** Supabase `projects` table (see `supabase/schema.sql`)
- **Intake:** `POST /api/intake` → Supabase; Web3Forms fallback if API fails
- **Operator:** `/command/` — CRM command center (dashboard, pipeline, clients, growth)
- **Legacy:** `/admin/` redirects to `/command/`
- **Client:** `/portal/?token=` — status tracker (deliverable publish = Phase 2)
- **Research:** Grok Heavy / Grok Build (not customer-facing API)

## Key files
- `api/intake.js`, `api/portal.js`, `api/admin/*` — Vercel functions
- `lib/prompt.js` — Grok prompt builder (includes methodology rules)
- `command/index.html` + `assets/js/command.js` + `assets/css/command.css` — CRM command center
- `api/admin/dashboard.js`, `api/admin/growth.js` — aggregated ops feed
- `lib/growth.js`, `lib/pulse.js` — metrics + infra health
- `portal/index.html` + `assets/js/portal.js` — client status
- `assets/js/intake.js` — wizard; posts to API when `apiBase` set or on Vercel
- `assets/js/config.js` — `apiBase`, Web3Forms fallback
- `SCALE.md` — Supabase + Vercel setup

## Flows

### Customer
```
create/index.html → POST /api/intake → create/received.html
                 → optional /portal/?token= (track status)
create/preview.html?case=csat&sample=1 → samples only
```

### Operator
```
/command/ → login → dashboard + pipeline + clients + growth
       → open project → Copy Grok prompt → Grok Heavy
       → update status → email deliverable to client
```

## Project statuses
`received` → `researching` → `drafting` → `review` → `delivered` → `revision` → `closed`

## Methodology rules (in `lib/prompt.js`)
See prior AGENTS.md section — pin pricing to volume tier, directional market sizes, verify citations, incumbent benchmarks, ≤6 min surveys, flag thin footprint.

## Env vars (Vercel)
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` (optional), `TURNAROUND_HOURS`

## Do not
- Expose service role key or admin password in client JS
- Auto-generate customer deliverables on the public site without human review

## Deploy
- **Scaling:** Vercel (see `SCALE.md`)
- **Legacy:** GitHub Pages still works with `apiBase` pointing to Vercel URL

## Growth Operator (proactive ops)

Any SignalDraft session should **auto-run a growth pulse** — Bryan should not have to ask what's next.

- **Skill:** `C:\Users\bryan\.grok\skills\signal-draft-growth\SKILL.md` (role: `growth-operator`)
- **Playbook:** `GROWTH.md` — phases, weekly rhythm, trigger→action table
- **State:** `C:\Cortex\state\signal-draft-growth.json` — blockers, phase gates, metrics
- **Pulse:** `node scripts/growth-pulse.mjs` — GH Pages, `apiBase`, optional Vercel health

Cortex leads with **Status** + **one Recommendation** every run. Growth Operator owns business ops and phase gates; delegates code/deploy to project-engineer. Bryan approves infra activation, pricing, and outreach.