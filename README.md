# Churn Profile Builder — Demo

A demo-only, client-side build of the Churn Profile Builder (TikTok 30-day content
plan generator). This repo is for showing the product experience — it does not
perform any real research, take payments, or require any API keys.

## What's different from the production app

- **No landing page, checkout, or magic-link flow.** The app is a single page:
  the intake form → calendar builder.
- **No server.** There's no Express/tRPC backend, no database, and no Stripe
  integration — everything runs in the browser.
- **No live research.** Clicking "Create my 30-day content plan" simulates the
  same staged progress bar the real backend job reports (queued → researching →
  analyzing → building → assembling → done), then returns a fixed, hand-written
  sample plan (`DEMO_PLAN_RESULT` in [src/pages/Home.tsx](src/pages/Home.tsx)) —
  regardless of what niche/video types/pillars you enter.
- **No API keys needed.** There are no calls to Manus, Apify, Stripe, or Resend
  anywhere in this repo.
- **Local persistence only.** The generated plan and your hook selections are
  saved to `localStorage` (key `churn-demo-plan`) instead of a database, so a
  page refresh keeps your place. Use the "Reset & start over" button on the
  results page to clear it.

## What's kept for reference

[reference/research-prompts.ts](reference/research-prompts.ts) contains the two
prompts the production app sends to a Manus agent to do the real research
(niche video scraping + hook pattern extraction, then personalized topic banks
+ calendar). They're included so this repo documents how the real thing works,
but the file is never imported — nothing here calls out to Apify, TikTok, or
an LLM.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static bundle in
`dist/` that can be hosted anywhere (Vercel, Netlify, S3, etc.) with zero
server-side configuration.
