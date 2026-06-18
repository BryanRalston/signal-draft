# SignalDraft

AI-researched survey design for companies. Marketing site + intake wizard + sample deliverables. GitHub Pages hosted.

**Live:** https://bryanralston.github.io/signal-draft/

> Deploys are automated via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`. See `DEPLOY.md`.

## How it works

1. **Customer** completes the research brief (~8 min) at `/create/`
2. **Web3Forms** emails the brief to Bryan
3. **Customer** sees a confirmation page (48-hour delivery promise)
4. **Bryan** runs research + survey design in Grok Heavy, reviews, and delivers

Sample outputs (not live generation): `/create/preview.html?case=csat&sample=1`

## V1 includes

- Landing page with workflow, use cases, pricing, scope
- 6-step research brief wizard (auto-saves to localStorage)
- Web3Forms email on submit (mailto fallback if send fails)
- Confirmation page after successful submit
- 3 sample deliverables: CSAT, employee engagement, competitive positioning
- Privacy + Terms + About pages

## Before launch checklist

1. ✅ Web3Forms key in `assets/js/config.js`
2. Test intake submit on live site — confirm email delivery
3. Optional: set `calendlyUrl` for “Book a call”
4. Optional: custom domain in repo Settings → Pages

## Local preview

```powershell
cd C:\Users\bryan\signal-draft
python -m http.server 8080
```

Then visit http://localhost:8080

## Operator docs

See `AGENTS.md` for the full Bryan workflow (Grok Heavy research → deliver).

## Future (optional)

- Vercel `/api/research` if automated customer-facing generation is needed
- Supabase persistence, Stripe