# Churn Profile Builder Demo

A demo-only, client-side build of the Churn Profile Builder (TikTok 30-day content
plan generator). This repo is for showing the product experience; it does not
perform any real research, take payments, or require any API keys.

To access the full, working product: https://tiktok30days.manus.space

## What's kept for reference

[reference/research-prompts.ts](reference/research-prompts.ts) contains the two
prompts the production app sends to a Manus agent to do the real research
(niche video scraping + hook pattern extraction, then personalized topic banks and calendar). 
They're included so this repo documents how the real thing works,
but the file is never imported — nothing here calls out to Apify, TikTok, or
an LLM.

## Running it

Requires **Node 20+** (this repo targets whatever `.nvmrc` pins, currently 24).
If `node --version` prints something older — commonly an old Homebrew/system
install shadowing [nvm](https://github.com/nvm-sh/nvm) in your `PATH` — run
`nvm use` first to switch to the pinned version for this repo:

```bash
nvm use
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static bundle in
`dist/` that can be hosted anywhere (Vercel, Netlify, S3, etc.) with zero
server-side configuration.
