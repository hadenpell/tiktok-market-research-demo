/**
 * Active prompt reference for the TikTok Market Research calendar pipeline.
 *
 * These are documentation-friendly prompt templates. The production app injects
 * runtime values, selects format-specific hook blocks, clips long user/research
 * fields, and enforces a 12,000-character Phase 2 budget before sending the task.
 * The demo repository can keep using its local sample plan; these prompts do not
 * make network calls by themselves.
 */

// ─── Phase 1: Niche Research ────────────────────────────────────────────────
//
// Production runtime values:
//   [CLIENT_NICHE]       customer niche text
//   [SEARCH_HASHTAGS]    JSON array containing up to 3 LLM-generated hashtags
//   [APIFY_TOKEN]        server-side Apify token
//   [MIN_YEAR]           current year used by the recency filter

export const PHASE_1_PROMPT = String.raw`
You are performing TikTok niche research for the Churn Method.

CLIENT NICHE: "[CLIENT_NICHE]"

YOUR TASK: Research this niche and return one JSON object matching this shape:
{
  "nicheVideos": [{
    "rank": 1,
    "title": "Complete on-screen hook from screenshot, or a concise caption summary",
    "name": "@handle",
    "datePosted": "Mon DD, YYYY",
    "createTimeISO": "2025-03-14T10:22:31.000Z",
    "views": "2,800,000",
    "likes": "47,100",
    "comments": "56 or Not shown",
    "shares": "78 or Not shown",
    "description": "1-2 sentences describing the video and why it performed well",
    "url": "https://www.tiktok.com/@handle/video/123456",
    "hookSource": "screenshot or caption"
  }],
  "nicheAlert": null,
  "hookPatterns": [{
    "type": "Pattern Name",
    "example": "Short punchy example under 10 words",
    "whyItWorks": "Explanation"
  }]
}

LANGUAGE FILTER — HARD CONSTRAINT
Research and return English-language videos only. Skip any high-performing video whose
hook or caption is not in English. Never include a non-English video in nicheVideos.

STEP 1 — APIFY DATA FETCH
Make one HTTP POST request to the Apify TikTok Hashtag Scraper:
URL: https://api.apify.com/v2/acts/f1ZeP0K58iwlqG2pY/run-sync-get-dataset-items?token=[APIFY_TOKEN]&timeout=300&memory=512
Method: POST
Content-Type: application/json
Body:
{
  "hashtags": [SEARCH_HASHTAGS],
  "resultsPerPage": 50,
  "shouldDownloadCovers": false,
  "shouldDownloadVideos": false,
  "shouldDownloadSubtitles": false
}

Use only the direct webVideoUrl, authorMeta.name, text, playCount, diggCount,
shareCount, commentCount, and createTimeISO fields from the response. The actor
charges per video, so do not increase resultsPerPage and do not make an optional
second call unless the first call genuinely leaves too few qualifying results.

STEP 2 — FILTER IN THIS EXACT ORDER
1. Recency: discard every item posted before [MIN_YEAR] and every item without a
   usable createTimeISO. Never guess a missing date.
2. Engagement: from the remaining items, keep only videos with diggCount >= 1000.
3. Sort the remaining items by playCount descending.
4. If fewer than 10 qualifying videos remain, make one additional call using the
   same hashtags and resultsPerPage 100, then combine and de-duplicate by URL and
   repeat the recency, engagement, and sorting filters.
5. If fewer than 5 videos pass both filters, return nicheVideos as [] and explain
   the shortage in nicheAlert. Do not pad with older or lower-engagement videos.

All returned videos must be from [MIN_YEAR] or later and have at least 1,000 likes.
Return at most 10, ranked by playCount. Include the raw createTimeISO value exactly
as received, accurate integer metrics formatted with commas, and a complete title.
Do not copy an incomplete caption; summarize it when necessary.

STEP 3 — ON-SCREEN HOOK EXTRACTION
For the top qualifying videos, navigate to each direct webVideoUrl and take exactly
one screenshot. Read the on-screen hook visible in the first frame. If it is
complete and readable, use it as title and set hookSource to "screenshot". If it is
missing, cut off, or unreadable, use a concise caption summary and set hookSource to
"caption". Confirm the browser address matches the direct URL.

The next qualifying videos, if any, may use their captions as hooks without a
screenshot. Never navigate to creator profile pages. Never take more than one
screenshot per video. Do not retry a page that returns no usable data.

STEP 4 — HOOK PATTERNS
Derive 5-7 short, punchy hook patterns only from videos that remain in nicheVideos.
Do not derive a pattern from a video discarded for age, language, or engagement.
If nicheVideos is empty, return hookPatterns as []. Use placeholders in pattern
examples and keep them ideally under 10 words. Do not copy captions verbatim.

HARD LIMITS
Use no more than 27 total tool calls: up to 2 Apify calls, up to 20 browser calls,
and up to 5 spare calls. Record unavailable metrics as "Not shown".

FINAL RESPONSE — MACHINE-READABLE ONLY
Your final reply is read by a program, not a person. Return exactly one raw JSON object
containing nicheVideos, nicheAlert, and hookPatterns. Do not attach or reference a
file. Do not include a preamble, explanation, summary, Markdown, or code fence. The
first character must be { and the last character must be }.
`;

// ─── Phase 2: Personalization & 30-Day Calendar ─────────────────────────────
//
// Production runtime values are inserted after clipping:
//   [CLIENT_NICHE]          max 500 characters
//   [CLIENT_VIDEO_TYPES]    at most 8 values, max 80 characters each
//   [CLIENT_PILLARS]        at most 6 values, max 180 characters each
//   [RESEARCH_CONTEXT]      at most 6 validated video examples
//   [TOPICS_NEEDED]         calculated from the number of distinct banks
//   [DAYS_PER_BANK]         calculated from 30 days and the bank count
//   [EXPECTED_BANK_COUNT]   calculated from distinct bank IDs
//
// The runtime also inserts only the selected-format blocks from
// CURATED_HOOK_GUIDANCE below. The full legacy library is not sent to Manus.

export const PHASE_2_PROMPT = String.raw`
You are creating the personalized portion of a TikTok content plan for the Churn Method.

CLIENT
- Niche: "[CLIENT_NICHE]"
- Selected video types: [CLIENT_VIDEO_TYPES]
- Content pillars: [CLIENT_PILLARS]

[RESEARCH_CONTEXT]

RULES
1. Create content only for the client's niche, selected formats, and pillars. Never
   use generic topics.
2. Research examples validate ideas and hook patterns; they do not justify narrowing
   the calendar to one sub-topic. Cover ALL distinct themes surfaced in research—such
   as food, shopping, culture, weather, or education—so one dominant theme does not
   fill the month.
3. Use the research as evidence, then extend its ideas intelligently. Rotate hook
   families and avoid repetitive formulas, topics, or suggested hooks.
4. A hook family is WHAT the first line says; a video format is HOW it is filmed.
   Keep hooks punchy, ideally under 10 words. Do not put filming directions in the
   hook text. Where useful, add a short first-frame direction to topic only.

[CURATED_HOOK_GUIDANCE]

STEP 1 — TOPIC BANKS
- Generate banks only for selected types. Use these IDs: How-to/Tutorial = howto;
  Testimonial = testimonial; Day in the life/Vlog = diml; Talking heads = appropriate
  selected th-* IDs; Text + clip + music/Trends = text-clip; Carousel = carousel.
- Selected video types always win. Do not generate an unselected format. For talking
  heads, create only genuinely appropriate sub-types, and use only IDs with a bank.
- Each bank needs [TOPICS_NEEDED] topic+hook pairs: enough for the approximately
  [DAYS_PER_BANK] days that bank covers, plus spares. Recompute if the actual bank
  count differs from [EXPECTED_BANK_COUNT] as ceil(30 / actual bank count) + 3.
  Never provide fewer than 6 topics and never more than 60 total across all banks.
- Do not pad with filler or near-duplicates. Every topic must be specific to the
  niche and useful for the selected format.
- Include five niche-specific hashtags per bank. Never use #fyp, #viral, or #tiktok.

STEP 2 — CALENDAR
- Generate exactly 30 numbered days. Use only typeRef IDs with a generated bank and
  distribute selected types as evenly as practical.
- Days 1-14 are experimental. Days 15-28 mix experiments and recreations. Days 29-30
  mix both. Use research-backed ideas for recreations without copying captions.
- NO REPEATS: all 30 suggestedHook values must be different. Each topicDescription
  must match its hook and be specific to the client's niche.

OUTPUT OBJECT
{
  "topicBanks": [{
    "id": "howto",
    "emoji": "emoji",
    "label": "label",
    "hashtags": ["#nicheTag"],
    "tips": "brief filming tip",
    "topics": [{
      "topic": "specific video idea",
      "hook": "punchy hook",
      "hookFamily": "Curiosity-Gap"
    }]
  }],
  "calendar": [{
    "day": 1,
    "week": 1,
    "typeRef": "howto",
    "suggestedHook": "punchy hook",
    "topicDescription": "one-sentence description"
  }]
}

FINAL RESPONSE — MACHINE-READABLE ONLY
Your reply is read by a program, not a person. It cannot open files or download
attachments. Length is never a reason to summarize, truncate, or attach. Reply with
exactly one object containing topicBanks and calendar, matching the object shape above.
Do not add Markdown, prose, a summary, or a file reference. The first character must
be { and the last character must be }.
`;

// ─── Curated compact hook guidance ──────────────────────────────────────────
//
// The production function always includes the core families. It appends only the
// format blocks corresponding to the selected intake video types.

export const CORE_HOOK_GUIDANCE = String.raw`
HOOK TEMPLATES — adapt these to the niche; never invent credentials, outcomes,
client results, or statistics.
- Curiosity-Gap: "Everything you know about [topic] is wrong."; "Nobody talks about [X], but…"; "What if I told you [unexpected claim]?"
- Authority/Proof: "Most people who want [outcome] fail because they're missing [X]."; "If I had to [outcome] all over again, here's what I'd do differently."
- Loss Aversion/FOMO: "Stop [common action] if you want [outcome]."; "This [mistake] is costing you [specific loss]."
- Relatability/Identity: "If you're a [specific person] who [specific struggle], this is for you."; "POV: you're [X] and [situation]."
- Controversy/Engagement-Bait: "Hot take: [X]."; "This is controversial, but [X]."
- Aspiration/Desire: "Imagine waking up and [dream scenario]."; "How I got [X] in [timeframe]."
- Tactical/Value: "Here's exactly how to [result] in [timeframe]."; "If you only take one piece of advice about [topic], make it this."
- Pattern-Interrupt/Visual: "Stop scrolling if [outcome]."; "Don't buy [product] until you see this." Use sparingly.

FORMAT ALIGNMENT
- Talking head: Curiosity-Gap, Authority/Proof, Loss Aversion, Controversy, Relatability.
- Tutorial: Tactical/Value, Loss Aversion, Curiosity-Gap.
- Testimonial: Authority/Proof, Aspiration, Relatability; use real results only.
- Vlog: Aspiration, Relatability. Text clip: Relatability/POV, Curiosity.
- Carousel: Tactical lists and mistake lists.

VISUAL OPENING GUIDANCE
Where useful, add a short first-frame direction to topic only: begin mid-action,
show the result first, lead with a before/after, or use motion instead of a static
frame. Do not put filming directions in hook. For identifiable patients or clients,
note that consent is required.
`;

export const FORMAT_SPECIFIC_HOOK_GUIDANCE = String.raw`
Only insert blocks for selected video types:
- Talking heads [th-*]: "As a [profession] with [X] years…"; "Unpopular opinion: [bold statement]."; "I'm going to admit something I've never told anyone…"
- Tutorial [howto]: "Here's exactly how to [result] in [timeframe]."; "You're probably doing [X] wrong."; "Stop making this mistake with your [topic]."
- Testimonial [testimonial]: "This [thing] helped [audience] achieve [result]."; "I tested [X] for 30 days—the result surprised me." Use real results only.
- Vlog [diml]: "Imagine waking up and [dream scenario]."; "Come with me while I [specific real activity]."; open mid-action where possible.
- Text clip [text-clip]: "POV: you're [specific audience] and [situation]."; "[Specific statistic]. Here's what that means for you." Pair text with moving visual.
- Carousel [carousel]: "[Number] [things] you wish you knew before [milestone]."; "[Number] mistakes [audience] make with [topic]." Deliver clear numbered value.
- At-work demonstration [howto/diml]: "I bet you can't watch this without [reaction]." Show the real process, not a generic tutorial.
`;

export const ACTIVE_PHASE_2_GUIDANCE = `${CORE_HOOK_GUIDANCE}\n${FORMAT_SPECIFIC_HOOK_GUIDANCE}`;

// Runtime safety controls used with the prompt above.
export const PHASE_2_RUNTIME_LIMITS = {
  maxPromptCharacters: 12000,
  maxNicheCharacters: 500,
  maxVideoTypes: 8,
  maxVideoTypeCharacters: 80,
  maxPillars: 6,
  maxPillarCharacters: 180,
  maxResearchExamples: 6,
  maxResearchTitleCharacters: 220,
  maxResearchCreatorCharacters: 80,
} as const;

