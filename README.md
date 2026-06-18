# SignalDraft

AI-researched survey design for companies. Marketing site + intake wizard + template previews (V1). GitHub Pages hosted.

**Live:** https://bryanralston.github.io/signal-draft/

> Deploys are automated via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`. See `DEPLOY.md`.

## V1 includes

- Landing page with workflow, use cases, pricing, scope
- 6-step research brief wizard (auto-saves to localStorage)
- Generating animation → preview with methodology rails
- 3 use-case templates: CSAT, employee engagement, competitive positioning
- Privacy + Terms + About pages
- Web3Forms email on brief completion (with mailto fallback if a send fails)

## Before launch checklist

1. ✅ Lead capture live via Web3Forms (`web3formsKey` in `assets/js/config.js`)
2. Optional: set `calendlyUrl` to make "Book a call" open Calendly (falls back to email)
3. Optional: custom domain in repo Settings → Pages

## Local preview

Open `index.html` in a browser, or:

```powershell
cd C:\Users\bryan\signal-draft
python -m http.server 8080
```

Then visit http://localhost:8080

## V2 roadmap

- Vercel `/api/research` serverless function
- xAI Grok API (`grok-4.3` + `web_search`) — **never client-side**
- Supabase project storage

See `AGENTS.md` for Grok Build session rules.