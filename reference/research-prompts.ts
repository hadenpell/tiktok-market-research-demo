/**
 * Reference only — NOT imported or called anywhere in this demo build.
 *
 * These are the two prompts the production app sends to the Manus agent to do
 * real TikTok research (Phase 1: scrape + rank niche videos via Apify, extract
 * hook patterns) and to personalize a 30-day plan from that research (Phase 2:
 * topic banks + calendar). They're included here so this repo documents the
 * real research logic without the demo actually making any network calls,
 * needing an Apify/Manus API key, or costing anything to run.
 *
 * In the demo, `DEMO_PLAN_RESULT` in src/pages/Home.tsx stands in for what
 * these prompts would eventually produce.
 */

// Phase 1 prompt: niche-level research only (nicheVideos + hookPatterns).
// In production this result is cached for 1 year per niche.
export function buildNicheResearchPrompt(payload: object, apifyKey: string): string {
  const p = payload as { niche: string; videoTypes: string[]; pillars: string[] };
  // Derive 3 hashtag variations from the niche description
  const words = p.niche.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().split(/\s+/);
  const base = words.slice(0, 3).join("");
  const variation2 = words.slice(0, 2).join("") + (words[3] || words[2] || "");
  const variation3 = words.filter(w => w.length > 3).slice(0, 3).join("");
  const hashtag1 = base;
  const hashtag2 = variation2 !== base ? variation2 : words.slice(0, 2).join("");
  const hashtag3 = variation3 !== base && variation3 !== hashtag2 ? variation3 : words[0] + (words[2] || words[1] || "");

  return `You are performing TikTok niche research for the Churn Method.

CLIENT NICHE: "${p.niche}"

YOUR TASK: Research this niche and return a JSON object with this exact schema:
{
  "nicheVideos": [{ "rank": 1, "title": "Exact on-screen hook text from screenshot, or caption summary", "name": "@handle", "datePosted": "Mon DD, YYYY or Not shown", "views": "2,800,000", "likes": "47,100", "comments": "56 or Not shown", "shares": "78 or Not shown", "description": "1-2 sentence description of the video content and why it performed well", "url": "https://www.tiktok.com/@handle/video/123456", "hookSource": "screenshot" }],
  "nicheAlert": null,
  "hookPatterns": [{ "type": "Pattern Name", "example": "Short punchy example under 10 words", "whyItWorks": "Explanation" }]
}

== STEP 1 — APIFY DATA FETCH (1 API call) ==

== LANGUAGE FILTER ==
ONLY research and output videos with hooks and captions in ENGLISH.
If you encounter a high-performing video (high playCount/diggCount) with a hook or caption in another language, SKIP it and find an English-language video instead.
Do NOT include non-English videos in the final nicheVideos list under any circumstances.

Make a single HTTP POST request to the Apify TikTok Hashtag Scraper API to get real video data:

URL: https://api.apify.com/v2/acts/f1ZeP0K58iwlqG2pY/run-sync-get-dataset-items?token=${apifyKey}&timeout=120&memory=512
Method: POST
Content-Type: application/json
Body:
{
  "hashtags": ["${hashtag1}", "${hashtag2}", "${hashtag3}"],
  "resultsPerPage": 20,
  "shouldDownloadCovers": false,
  "shouldDownloadVideos": false,
  "shouldDownloadSubtitles": false
}

The response is a JSON array. Each item contains:
- webVideoUrl: direct TikTok video URL (accurate)
- authorMeta.name: creator handle
- authorMeta.profileUrl: profile URL
- text: caption/description
- playCount: view count (integer)
- diggCount: likes (integer)
- shareCount: shares (integer)
- commentCount: comments (integer)
- createTimeISO: post date

After receiving the response:
1. Filter: keep only videos where diggCount >= 1000 (at least 1,000 likes)
2. Sort the filtered list by playCount descending
3. If the filtered list has 10 or more videos: take the top 15 as candidates, proceed to Step 2
4. If the filtered list has fewer than 10 videos: make a SECOND Apify call with resultsPerPage set to 40 (same hashtags, same body, just increase resultsPerPage to 40), re-filter by diggCount >= 1000, re-sort by playCount descending
5. After the second call: if 5 or more videos pass the filter, take up to 15 as candidates and proceed to Step 2
6. If still fewer than 5 videos pass the filter after both calls: set nicheVideos to [] and populate nicheAlert with the hashtags searched

From the final filtered and sorted list, split into:
- Group A (top 10): will receive browser screenshot for on-screen hook extraction
- Group B (next 5, or however many remain): use caption as hook, no screenshots

== STEP 2 — SCREENSHOT HOOK EXTRACTION (Group A — top 10 videos, 2 calls each) ==

For each of the top 10 videos from Group A:
1. Navigate to the webVideoUrl in the browser (1 call)
2. Take exactly 1 screenshot (1 call)
3. Read the on-screen text hook visible in the first frame — this is text overlaid on the video
4. If the hook text is clearly visible and complete (not cut off mid-word): record it as "title" with hookSource "screenshot"
5. If the hook is incomplete, cut off, or not visible: use a shortened summary of the caption as "title" with hookSource "caption"
6. Confirm the URL from the browser address bar matches webVideoUrl
Do NOT take more than 1 screenshot per video.

== STEP 3 — FINALIZE NICHE VIDEOS ==

Combine Group A + Group B candidates (all with diggCount >= 1000).
Return EXACTLY 10 in nicheVideos, ranked by playCount descending.
- Use the accurate playCount and diggCount integers from the Apify response for views and likes fields (format with commas: "2,800,000")
- ALL 10 videos must have diggCount >= 1000. Do NOT include videos with fewer than 1,000 likes.
- If fewer than 10 videos pass the filter but 5 or more do: return only those N videos (do not pad with low-quality videos).
- If fewer than 5 pass the filter: set nicheVideos to [] and populate nicheAlert.

TITLE QUALITY RULES — CRITICAL:
- Every title must be COMPLETE and GRAMMATICALLY CORRECT.
- No incomplete sentences like "if you ever", "the worst", or cut-off text.
- If a screenshot hook is incomplete: use a shortened/summarized version of the caption instead.
- Every title must make sense as a standalone hook — create curiosity or urgency.

== STEP 4 — HOOK PATTERNS ==

Using hook text from all 10 nicheVideos, identify 5-7 hook patterns that work in this niche.

HOOK RULES — CRITICAL:
- Hooks must be SHORT and PUNCHY — ideally under 10 words.
- Must create immediate curiosity, urgency, or a bold claim.
- Good: "I fixed my sciatica in 3 days", "Stop doing this stretch", "The exercise your physio won't show you"
- Bad (too long): "In this video I'm going to show you three exercises that helped my patients"
- Pattern examples must be under 10 words and use placeholders: "[Number] things [audience] never knew about [topic]"
- Do NOT copy captions verbatim as hooks.

HARD LIMITS:
- Maximum 25 tool calls total (1 API call + up to 20 browser calls + 4 spare).
- Exactly 1 screenshot per video — never more.
- Do NOT navigate to creator profile pages.
- Do NOT retry a page that returns no usable data — move on immediately.
- Record missing metrics as "Not shown".

CRITICAL OUTPUT RULES — MUST FOLLOW EXACTLY:
1. Write the complete JSON object to a file called output.json using a file write tool.
2. Validate it: python3 -c "import json; json.load(open('output.json')); print('VALID')"
3. Your FINAL message must contain ONLY the raw JSON string — copy output.json verbatim.
4. Do NOT include any preamble, explanation, or markdown before or after the JSON.
5. Do NOT wrap in code fences.
6. First character must be { and last character must be }.
7. If validation fails, fix and re-validate before sending.`;
}

// Phase 2 prompt: personalized plan (topicBanks + calendar). Uses cached niche
// research from Phase 1. In production this is never cached — it's regenerated
// per client.
export function buildPersonalizationPrompt(payload: object, nicheResearch: object): string {
  const p = payload as { niche: string; videoTypes: string[]; pillars: string[] };
  const nr = nicheResearch as { nicheVideos?: object[]; hookPatterns?: object[] };
  const nicheVideosSummary = (nr.nicheVideos || []).slice(0, 10).map((v: object) => {
    const vid = v as { title?: string; name?: string; likes?: string };
    return `- "${vid.title}" by ${vid.name} (${vid.likes} likes)`;
  }).join("\n");
  return `You are building a personalized TikTok content plan for the Churn Method.

CLIENT INTAKE:
- Niche: "${p.niche}"
- Video types they can make: ${p.videoTypes.join(", ")}
- Content pillars: ${p.pillars.join(", ")}

NICHE CONTEXT (already researched - do NOT re-research):
Top performing videos in this niche include:
${nicheVideosSummary}

YOUR TASK: Generate the personalized portion of the report as a single JSON object with this exact schema:
{
  "topicBanks": [{ "id": "diml", "emoji": "emoji", "label": "Day in the life / Vlog", "hashtags": ["#hashtag"], "tips": "filming tips", "topics": [{ "topic": "Topic description", "hook": "Example hook", "hookFamily": "Curiosity-Gap" }] }],
  "calendar": [{ "day": 1, "week": 1, "typeRef": "diml", "suggestedHook": "hook text", "topicDescription": "description" }]
}

STEP 1 - TOPIC BANKS:
Generate topic banks ONLY for the video types the client has selected. Use these IDs:
- "How-to / Tutorial" -> id: "howto"
- "Testimonials" -> id: "testimonial"
- "Day in the life" or "Vlogs" -> id: "diml"
- "Talking heads" -> ids: "th-listicle", "th-hottake", "th-insider", "th-story", "th-reaction", "th-qa"
- "Text + clip + music" or "Trends" -> id: "text-clip"
- "Carousels" -> id: "carousel"

Each bank needs 5-8 topic+hook pairs. These MUST be tailored specifically to:
- This client's niche: ${p.niche}
- Their content pillars: ${p.pillars.join(", ")}
- Their video types: ${p.videoTypes.join(", ")}
Do NOT use generic topics. Every topic and hook should feel written specifically for this person.
Ensure variety across hook families — do not use the same family for every hook in a bank.

HOOK RULES - CRITICAL:
- Every hook must be SHORT and PUNCHY - ideally under 10 words.
- A hook creates immediate curiosity, urgency, or a bold claim.
- Good examples: "I fixed my sciatica in 3 days", "Stop doing this stretch", "The exercise your physio won't show you"
- Bad examples (too long): "In this video I'm going to show you three exercises that helped my patients recover"
- Do NOT write hooks as full descriptive sentences - write attention-grabbers.
- Each hook in topics[] MUST include a hookFamily field (e.g., "Curiosity-Gap", "Loss Aversion/FOMO", "Authority/Proof", "Relatability/Identity", "Controversy/Engagement-Bait", "Aspiration/Desire", "Tactical/Value", "Pattern-Interrupt/Visual").

VIDEO TYPE GUIDANCE:
- "How-to / Tutorial" (howto): instructional content - exercises, technique walkthroughs, protocols. NOT vlogs.
- "Testimonials" (testimonial): patient/client result stories, case studies, before-and-after. Hook around the result.
- "Day in the life" / "Vlogs" (diml): lifestyle content only - NOT instructional or patient-result content.
- Only generate topic banks for video types the client has selected.

STEP 2 - 30-DAY CALENDAR:
Generate exactly 30 calendar days. Structure:
- Days 1-14: experimental only (typeRef from client's video types)
- Days 15-28: mix of experimental and recreate days
- Days 29-30: recreate + experimental
- CRITICAL: Only use typeRef IDs that you actually generated a topic bank for in STEP 1. If you did not generate a bank for a type (e.g., "th-listicle" was not warranted by the niche research), do NOT assign that typeRef to any calendar day. A day with no matching bank will show an empty hook modal to the user.
- For "Talking heads" sub-types: only generate banks (and use in calendar) for the sub-types that are genuinely supported by the niche research hooks. If the niche research shows no listicle-style hooks, skip "th-listicle" entirely.
- Distribute the types you DID generate banks for evenly across the 30 days
- When assigning suggestedHook to a day, choose a hook whose family aligns with the day's typeRef (see FORMAT-HOOK ALIGNMENT above)

For EACH calendar day, generate:
1. suggestedHook: A punchy hook for that day's video (under 10 words). This is a SUGGESTION — the user will choose their own hook from the bank.
2. topicDescription: A brief 1-sentence description of what the video is about (e.g., "3 mistakes people over 50 make with sciatica")

Example:
- suggestedHook: "Stop your sciatica pain in 30 seconds"
- topicDescription: "Quick relief technique for immediate sciatica pain reduction"

CALENDAR SCHEMA (each day must have ALL these fields):
{ "day": 1, "week": 1, "typeRef": "howto", "suggestedHook": "hook text", "topicDescription": "description" }

STEP 3 - HASHTAGS:
5 per topic bank, niche-specific. No #fyp, #viral, or #tiktok.

CRITICAL OUTPUT RULES - MUST FOLLOW EXACTLY:
1. Write the complete JSON object to a file called output.json using a file write tool.
2. Validate it is well-formed by running: python3 -c "import json; json.load(open('output.json')); print('VALID')"
3. Your FINAL message must contain ONLY the raw JSON string - copy the exact contents of output.json verbatim.
4. Do NOT include any preamble, explanation, sentence, or markdown before or after the JSON.
5. Do NOT wrap the JSON in code fences (no backticks, no triple-backtick code fences).
6. The very first character of your final message must be { and the very last character must be }.
7. If validation fails, fix the JSON and re-validate before sending.`;
}
