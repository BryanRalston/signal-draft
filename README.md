# SignalDraft

AI-researched survey design for companies. Marketing site + intake wizard + template previews (V1). GitHub Pages hosted.

**Live:** https://bryanralston.github.io/signal-draft/ (after deploy)

## V1 includes

- Landing page with workflow, use cases, pricing, scope
- 6-step research brief wizard (auto-saves to localStorage)
- Generating animation → preview with methodology rails
- 3 use-case templates: CSAT, employee engagement, competitive positioning
- Privacy + Terms + About pages
- FormSubmit.co email on brief completion

## Before launch checklist

1. Update `assets/js/config.js`:
   - `contactEmail` — your real email
   - `formSubmitUrl` — `https://formsubmit.co/YOUR@EMAIL.com` (activate via FormSubmit confirmation email)
2. Optional: add `calendlyUrl` for booking calls
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