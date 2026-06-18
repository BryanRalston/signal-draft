# SignalDraft — Growth Playbook

Proactive ops guide for Cortex **Growth Operator**. Bryan should not have to ask what's next — every SignalDraft session auto-runs a growth pulse and ends with **Status** + **one Recommendation**.

**State file:** `C:\Cortex\state\signal-draft-growth.json`  
**Skill:** `C:\Users\bryan\.grok\skills\signal-draft-growth\SKILL.md`  
**Pulse script:** `node scripts/growth-pulse.mjs`  
**CRM UI:** https://YOUR-VERCEL-URL/command/ (or `/command/` on Vercel)

## North star

**First paying founding client delivered within 48h SLA.**

Config: `foundingSlots: 10`, `turnaroundHours: 48` in `assets/js/config.js`.

## Phases

| Phase | ID | Meaning | Exit criteria |
|-------|-----|---------|---------------|
| **1 — Activation** | `1-activation` | Code shipped; infra not live | Supabase + Vercel live; test intake; admin kanban works |
| **1 — Ops** | `1-ops` | Taking founding clients | First client delivered within SLA; portal link sent |
| **2 — Productize** | `2` | Scale delivery + payments | Portal deliverables, Resend, Stripe (see SCALE.md) |

**Current phase:** `1-activation` (as of initial Growth Operator setup).

## Weekly rhythm

| Day | Focus |
|-----|-------|
| Mon | Pipeline — new briefs, SLA clocks |
| Tue | Infra — run `growth-pulse.mjs`, verify apiBase + Vercel |
| Wed | Delivery — active projects vs 48h promise |
| Thu | Growth — founding slots, marketing CTA |
| Fri | Phase gates — update state, one next-week action |

## Trigger → action

| Trigger | What Cortex does proactively | What needs Bryan |
|---------|------------------------------|------------------|
| Supabase not activated | Surfaces blocker; step-by-step from SCALE.md §1 | Create Supabase project, run schema |
| Vercel not deployed | Surfaces blocker; env checklist from `.env.example` | Vercel import, env vars, deploy |
| `apiBase` empty on GH Pages | Notes intake falls back to Web3Forms only | Set Vercel URL in config.js after deploy |
| New brief in Received | Starts SLA clock; reminds Copy Grok prompt workflow | Run Grok Heavy, update kanban |
| SLA overdue (>48h) | Names project, hours over, recommends client comms | Approve delay message or prioritize delivery |
| ≤3 founding slots left | Recommends urgency on site + outreach | Approve copy/pricing |
| 0 founding slots | Recommends waitlist / Phase 2 Stripe | Approve positioning |
| Phase 1 activation done | Moves to `1-ops`; targets first revenue | Approve go-live announcement |
| 3+ stable deliveries | Recommends Phase 2 backlog order | Approve build priority |

## Cortex proactive vs Bryan approval

### Cortex does automatically

- Read state + project files every SignalDraft session
- Run pulse checks (GH Pages, apiBase, Vercel if configured)
- Update `signal-draft-growth.json` after each assessment
- Lead with **Status** + **one Recommendation**
- Delegate code/deploy to project-engineer when Bryan approves
- Track phase gates and blocker severity

### Bryan must approve or execute

- Supabase account + project creation
- Vercel deploy + secrets (`SUPABASE_*`, `ADMIN_PASSWORD`)
- Custom domain and `apiBase` strategy
- Pricing, founding slot count, external outreach
- Stripe, Resend, and Phase 2 feature priority
- Client-facing delay or pricing messages

## Activation checklist (biggest blocker today)

Follow `SCALE.md`:

1. **Supabase** — create project → SQL Editor → `supabase/schema.sql`
2. **Vercel** — import `BryanRalston/signal-draft` → Framework: Other → env vars from `.env.example`
3. **Deploy** — note `https://signal-draft-xxx.vercel.app`
4. **Config** — if marketing stays on GH Pages, set `apiBase` to Vercel URL in `assets/js/config.js`
5. **Verify** — test intake, log in at `/admin/`, confirm kanban loads

## Live URLs

| Resource | URL |
|----------|-----|
| Marketing (GH Pages) | https://bryanralston.github.io/signal-draft/ |
| Repo | https://github.com/BryanRalston/signal-draft |
| Vercel (pending) | Set after deploy |
| Operator admin | `{vercel_url}/admin/` |
| Client portal | `{vercel_url}/portal/?token=…` |

## Operator daily flow (post-activation)

1. New brief → **Received** on kanban  
2. Open project → **Copy Grok prompt** → Grok Heavy  
3. Drag: Researching → Drafting → Review → Delivered  
4. Email deliverable; client uses portal link  

See `SCALE.md` §4 and `AGENTS.md` for technical detail.