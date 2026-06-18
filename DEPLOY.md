# Deploying SignalDraft to GitHub Pages

## Live URL

https://bryanralston.github.io/signal-draft/

## How deploys work

Deploys are automated via **GitHub Actions** (`.github/workflows/deploy.yml`).
Every push to `main` builds and publishes to GitHub Pages — no Jekyll, no manual
steps. Repo **Settings → Pages → Build and deployment** is set to **GitHub Actions**.

To ship a change:

```powershell
cd C:\Users\bryan\signal-draft
git add -A
git commit -m "your message"
git push origin main
```

Watch the deploy:

```powershell
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```

It goes live ~1 minute after the run completes.

## Local preview

```powershell
cd C:\Users\bryan\signal-draft
python -m http.server 8080
```

Open http://localhost:8080

## Lead capture (Web3Forms)

Brief submissions post to **Web3Forms** from the browser (`assets/js/intake.js`).
Config lives in `assets/js/config.js`:

- `contactEmail` — where the mailto fallback and "Book a call" point
- `web3formsKey` — Web3Forms access key (from web3forms.com signup email)
- `web3formsUrl` — `https://api.web3forms.com/submit`

On a failed send, the wizard keeps the draft in localStorage and shows a
`mailto:` fallback, so no lead is lost.

> **Testing note:** Web3Forms sits behind Cloudflare, which returns **403 to
> curl and headless browsers**. The live form will look broken to automated
> tests even when it works — verify with a real (headed) browser. The E2E
> suite mocks the endpoint instead of hitting it.

## Optional before scaling

- `calendlyUrl` in `config.js` — set it to make "Book a call" open Calendly
  instead of email (falls back to mailto when empty)
- Custom domain — repo **Settings → Pages → Custom domain**
