/**
 * Reference only — NOT imported or called anywhere in this demo build.
 *
 * These are simplified versions of the two prompts the production app sends to
 * the Manus agent to do real TikTok research (Phase 1: scrape + rank niche
 * videos via Apify, extract hook patterns) and to personalize a 30-day plan
 * from that research (Phase 2: topic banks + calendar).
 *
 * Some internal implementation details have been removed. They're included here
 * so this repo documents the general research logic without the demo actually
 * making any network calls, needing an Apify/Manus API key, or costing anything
 * to run.
 *
 * In the demo, `DEMO_PLAN_RESULT` in src/data/samplePlan.ts stands in for what
 * these prompts would eventually produce.
 */

// ─── Phase 1: Niche Research ────────────────────────────────────────────────
//
// Searches TikTok via Apify for real videos in the client's niche, screenshots
// on-screen hooks, and extracts hook patterns. Result is cached per niche.
//
// Key steps:
//   1. APIFY DATA FETCH — POST to the TikTok Hashtag Scraper with up to 3
//      AI-generated hashtags (not string concatenation).
//   2. RECENCY + ENGAGEMENT FILTERS — Only videos from the current/prior year
//      with >= 1,000 likes are kept.
//   3. SCREENSHOT HOOK EXTRACTION — Top 10 videos get a browser screenshot to
//      read the on-screen hook text.
//   4. FINALIZE — Up to 10 ranked videos returned.
//   5. HOOK PATTERNS — 5-7 patterns derived only from returned videos.
//
// The full prompt text (with placeholders for runtime values) is documented in
// CURRENT_PRODUCTION_PROMPTS_EDITABLE.md in this repository.

export const PHASE_1_SUMMARY = `
You are performing TikTok niche research for the Churn Method.

CLIENT NICHE: "[CLIENT_NICHE]"

YOUR TASK: Research this niche and return a JSON object with nicheVideos,
nicheAlert, and hookPatterns.

Steps:
1. Fetch videos from Apify TikTok Hashtag Scraper using AI-generated hashtags
2. Apply recency filter (current year or later) and engagement filter (>= 1000 likes)
3. Screenshot top 10 videos to extract on-screen hook text
4. Return up to 10 ranked videos with metadata
5. Identify 5-7 hook patterns from the returned videos
`;

// ─── Phase 2: Personalization & Calendar ────────────────────────────────────
//
// Uses Phase 1 niche research to build personalized topic banks and a 30-day
// content calendar. Never cached — regenerated per client.
//
// Key steps:
//   1. TOPIC BANKS — One bank per selected video type, sized so every calendar
//      day has a unique hook. Uses a hook pattern library to enrich beyond what
//      the research found.
//   2. 30-DAY CALENDAR — Days 1-14 experimental, days 15-28 mix of experimental
//      and recreate, days 29-30 recreate + experimental. No repeated hooks.
//   3. HASHTAGS — 5 per topic bank, niche-specific.
//
// The full prompt text (with the hook pattern library, format guide, and visual
// hook tips) is documented in CURRENT_PRODUCTION_PROMPTS_EDITABLE.md.

export const PHASE_2_SUMMARY = `
You are building a personalized TikTok content plan for the Churn Method.

CLIENT INTAKE:
- Niche: "[CLIENT_NICHE]"
- Video types they can make: [CLIENT_VIDEO_TYPES]
- Content pillars: [CLIENT_CONTENT_PILLARS]

Steps:
1. Build topic banks for each selected video type with enough hooks for 30 unique days
2. Use the hook pattern library to enrich banks beyond what research validated
3. Generate a 30-day calendar with no repeated suggestedHooks
4. Add 5 niche-specific hashtags per topic bank
`;
