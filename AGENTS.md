# SignalDraft — Project Rules for Grok Build

## What this is
AI-researched survey design service. Static GitHub Pages site: marketing + intake wizard + sample deliverables. **Human-in-the-loop** — client briefs come to Bryan; research and survey design run through Grok Heavy (grok.com / Grok Build), not a customer-facing API pipeline.

## Architecture
- **Public:** Static HTML/CSS/JS. GitHub Pages from `main`. No build step.
- **Intake:** Web3Forms email to `bryan.ralston@rocketmail.com` on submit.
- **Private (operator):** Grok Heavy + Grok Build for research, dossier, and survey drafting.
- **Future (optional):** Vercel `/api/research` + xAI API only if volume justifies metered billing. Never client-side keys.

## Design system
- Tokens in `assets/css/main.css` (`:root` variables)
- Display: Libre Baskerville | Body: Source Sans 3 | Data: IBM Plex Mono
- Signature UI: methodology rail (`.method-rail`) on question cards

## Key files
- `assets/js/config.js` — contact email, Web3Forms key, turnaround hours
- `assets/js/templates.js` — sample surveys + dossiers (CSAT, employee, competitive)
- `assets/js/intake.js` — wizard logic, localStorage key `sd_intake_v1`
- `assets/js/received.js` — post-submit confirmation page

## Customer flow
```
create/index.html  →  submit brief (Web3Forms)
                  →  create/received.html  (confirmation, 48h promise)
create/preview.html?case=csat&sample=1  →  sample deliverables only (not live output)
```

`create/generating.html` is a **demo animation** — not in the submit path.

## Operator workflow (Bryan)
When Web3Forms email arrives:

1. **Read the brief** — company, objectives, audience, decision rules, deliverables requested.
2. **Open Grok Heavy** (grok.com or Grok Build) with a research prompt:
   - Company + URL + industry from intake
   - Competitors to benchmark (from brief)
   - Research objectives and decision rules
   - Enable web search / DeepSearch for cited sources
3. **Draft dossier** — company, competitors, market, objectives mapped.
4. **Draft survey** — questions with methodology rails (type, objective, bias note per Q).
5. **Self-review** — compliance checklist (objectives mapped, scales, length, GDPR, anonymity for EX).
6. **Deliver** — PDF and/or export file; email client at reply-to address from intake.
7. **Revisions** — per tier (1 or 2 rounds).

Sample structure reference: `assets/js/templates.js` and `create/preview.html?case=<usecase>&sample=1`.

## Config
- `web3formsKey` in `config.js` — must be real key from https://web3forms.com
- Web3Forms “where is form?” → `https://bryanralston.github.io/signal-draft/create/`
- Optional: `calendlyUrl` for “Book a call”

## Do not
- Expose API keys in client JS
- Auto-redirect submit → fake generating → personalized preview (removed)
- Expand into survey hosting, panel recruitment, or full analytics in V1

## Deploy
Push to `main` → GitHub Actions deploys to Pages. Repo: `BryanRalston/signal-draft`