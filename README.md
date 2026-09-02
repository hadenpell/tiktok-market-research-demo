# 30 Day TikTok Content Calendar Generator

A demo-only, client-side build of the TikTok 30-day content
plan generator. This repo is for showing the product experience; it does not
perform any real research, take payments, or require any API keys.

To access the full, working product: https://tiktok30days.manus.space

## What's kept for reference

[reference/PROMPT_REFERENCE.md](reference/PROMPT_REFERENCE.md) contains a
simplified version of the two prompts the production app sends to a Manus agent
to do the real research (niche video scraping + hook pattern extraction, then
personalized topic banks and calendar). Some internal implementation details
have been removed.

[calendar_pipeline_flowchart.html](calendar_pipeline_flowchart.html) explains
the infrastructure of the full project.

## Running it

Requires **Node 20+** (this repo targets whatever `.nvmrc` pins, currently 24).
If `node --version` prints something older — commonly an old Homebrew/system
install shadowing [nvm](https://github.com/nvm-sh/nvm) in your `PATH` — run
`nvm install` first: it reads `.nvmrc`, installs that Node version if you
don't already have it, and switches to it for this repo:

```bash
nvm install
npm install
npm run dev
```

No nvm? You'll need Node 20+ some other way (Homebrew, the official
installer, fnm, volta, etc.) — `.nvmrc` only means something to nvm.

Then open the printed local URL. `npm run build` produces a static bundle in
`dist/` that can be hosted anywhere (Vercel, Netlify, S3, etc.) with zero
server-side configuration.
