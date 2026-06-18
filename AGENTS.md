# SignalDraft — Project Rules for Grok Build

## What this is
AI-researched survey design service. Marketing + intake + **operator dashboard** (Phase 1 scaling). Human-in-the-loop: Grok Heavy produces deliverables; Supabase tracks every client.

## Architecture
- **Public:** Static site + Vercel serverless API (`/api/*`)
- **Database:** Supabase `projects` table (see `supabase/schema.sql`)
- **Intake:** `POST /api/intake` → Supabase; Web3Forms fallback if API fails
- **Operator:** `/admin/` — kanban, status, copy Grok prompt, notes
- **Client:** `/portal/?token=` — status tracker (deliverable publish = Phase 2)
- **Research:** Grok Heavy / Grok Build (not customer-facing API)

## Key files
- `api/intake.js`, `api/portal.js`, `api/admin/*` — Vercel functions
- `lib/prompt.js` — Grok prompt builder (includes methodology rules)
- `admin/index.html` + `assets/js/admin.js` — operator UI
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
/admin/ → login → kanban by status
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