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

## Methodology rules (non-negotiable — learned from dry runs)
These prevent the traps that quietly ruin a deliverable. Apply every time:

1. **Pin pricing to a stated volume tier.** Many SaaS price on two axes (feature/seat tier *and* usage volume, often via a slider). A Van Westendorp or willingness-to-pay question on "monthly price" without fixing the volume produces garbage — respondents anchor to different volumes. Always state the exact tier + volume in the question stem (e.g. "$9/mo for ~10k pageviews, 1 site").
2. **Market-size figures are directional, never precise.** Analyst numbers (Mordor, Allied, Gartner, Data Bridge) live behind paywalls and conflict with each other. Cite the *range*, name the firms, and explicitly flag as directional. Never assert a single precise figure — false precision undermines the "real research" moat.
3. **Verify before you cite.** Every factual claim needs a real, fetched source. A vendor's own content marketing (e.g. their "is competitor X illegal?" blog) is a legitimate source for a regulatory/narrative angle, but must be corroborated by an independent source before it goes in the dossier. No fabricated stats or sources — ever.
4. **Benchmark perceptual comparisons against the single dominant incumbent, not the full set.** Semantic-differential / head-to-head questions ("vs. GA4 on ease of use") should target the one market leader. Let aided-awareness and consideration-set questions carry the multi-brand load, or the survey balloons past 20 questions.
5. **Watch length — survey fatigue is the #1 headwind.** Target ≤6 min. Multi-part validated instruments (e.g. the 4-part Van Westendorp) count as **one** question for the count but cost real respondent effort — budget accordingly and make the lowest-value open-ends optional if the estimate runs long.
6. **Flag thin public footprint early.** This model works best on companies/competitors with public pricing and positioning. If a brief's subject is stealth, pre-launch, or enterprise-only, the research will be materially harder — tell the client and scope expectations before drafting.

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