# Deploying SignalDraft to GitHub Pages

## Live URL (once build succeeds)

https://bryanralston.github.io/signal-draft/

## Current status

The repo is pushed to **BryanRalston/signal-draft** and Pages is enabled, but the legacy Jekyll build returned `Page build failed`. This usually means one of:

1. **GitHub Pages not enabled on your account** — GitHub → Settings → Pages → verify Pages is allowed
2. **First deploy still propagating** — wait 5–10 minutes and refresh
3. **Need GitHub Actions deploy instead** — preferred for static sites (no Jekyll)

## Fix: enable Actions-based deploy (recommended)

Run in PowerShell **interactively** (browser auth required):

```powershell
gh auth refresh -h github.com -s workflow
```

Then from the repo:

```powershell
cd C:\Users\bryan\signal-draft
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions Pages deploy"
git push origin main
```

In GitHub repo **Settings → Pages → Build and deployment**, set source to **GitHub Actions**.

## Fix: legacy deploy from main

Settings → Pages → Deploy from branch **main** / **/ (root)**.

Ensure `.nojekyll` exists at repo root (it does — disables Jekyll).

## Local preview (works now)

```powershell
cd C:\Users\bryan\signal-draft
python -m http.server 8080
```

Open http://localhost:8080

## Before taking client briefs

Edit `assets/js/config.js`:

- `contactEmail` — your real email
- `formSubmitUrl` — `https://formsubmit.co/YOUR@EMAIL.com` (confirm via FormSubmit activation email)