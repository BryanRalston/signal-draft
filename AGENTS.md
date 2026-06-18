# SignalDraft — Project Rules for Grok Build

## What this is
AI-researched survey design service. V1 is static GitHub Pages (marketing + intake wizard + template previews). V2 adds Vercel serverless + xAI Grok API.

## Architecture
- **V1:** Static HTML/CSS/JS only. No build step. GitHub Pages from `main`.
- **V2:** `/api` Vercel functions. **NEVER call xAI/Grok API from browser** — keys stay server-side only.
- **V3:** Supabase persistence, Stripe, optional native survey hosting.

## Design system
- Tokens in `assets/css/main.css` (`:root` variables)
- Display: Libre Baskerville | Body: Source Sans 3 | Data: IBM Plex Mono
- Signature UI: methodology rail (`.method-rail`) on question cards

## Key files
- `assets/js/templates.js` — use-case survey + dossier data (CSAT, employee engagement, competitive)
- `assets/js/intake.js` — wizard logic, localStorage key `sd_intake_v1`
- `assets/js/config.js` — contact email, FormSubmit endpoint (update before launch)

## Intake flow
`create/index.html` → `create/generating.html` → `create/preview.html`

## V2 API plan
```
POST /api/research
  body: intake JSON
  server: grok-4.3 + web_search tool
  returns: { dossier, survey, compliance }
```

## Do not
- Expose API keys in client JS
- Add frameworks/build tooling to V1 without explicit request
- Expand scope into survey hosting, panel recruitment, or full analytics in V1

## Deploy
Push to `main` → GitHub Actions deploys to Pages. Repo: `BryanRalston/signal-draft`