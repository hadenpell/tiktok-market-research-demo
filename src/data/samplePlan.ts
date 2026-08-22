/**
 * samplePlan.ts — Canned demo data for the Churn Profile Builder demo.
 *
 * This is a FICTIONAL sample plan. It does not represent real TikTok research
 * results. The niche, videos, hooks, and calendar are all invented to
 * demonstrate the product experience.
 *
 * The real app runs two AI research passes against Apify/TikTok data and a
 * Manus agent; this demo build never makes that call — it always returns this
 * same fixed plan regardless of what's entered in the intake form.
 */
import type { TopicBank, NicheVideo, HookPattern, PlanResult, CalendarDay } from "../../shared/churnTypes";

// ─── Sample niche videos ────────────────────────────────────────────────────

const DEMO_NICHE_VIDEOS: NicheVideo[] = [
  { rank: 1, title: "I opened a coffee shop with $5,000", name: "@thecoffeeguy", datePosted: "Mar 15, 2026", views: "3,200,000", likes: "142,000", comments: "4,200", shares: "12,100", description: "How I bootstrapped my first coffee shop on a tiny budget and hit profitability in 3 months", url: "https://www.tiktok.com/@thecoffeeguy/video/1", hookSource: "screenshot" },
  { rank: 2, title: "Stop buying coffee equipment you don't need", name: "@brewboss", datePosted: "Apr 2, 2026", views: "1,800,000", likes: "89,000", comments: "2,800", shares: "6,400", description: "The 3 pieces of equipment that actually matter when starting a coffee business", url: "https://www.tiktok.com/@brewboss/video/2", hookSource: "screenshot" },
  { rank: 3, title: "Day in the life of a small coffee shop owner", name: "@morninggrind", datePosted: "Feb 28, 2026", views: "1,400,000", likes: "72,000", comments: "1,900", shares: "5,100", description: "4am wake up, roasting beans, serving regulars, closing at 6pm — the real daily grind", url: "https://www.tiktok.com/@morninggrind/video/3", hookSource: "screenshot" },
  { rank: 4, title: "The latte art trick that took me 2 years to learn", name: "@lattequeen", datePosted: "Mar 22, 2026", views: "980,000", likes: "54,000", comments: "1,200", shares: "3,800", description: "A simple wrist technique that makes tulip art consistent every time", url: "https://www.tiktok.com/@lattequeen/video/4", hookSource: "screenshot" },
  { rank: 5, title: "Why your coffee shop menu is too long", name: "@cafeconsultant", datePosted: "Apr 10, 2026", views: "760,000", likes: "41,000", comments: "980", shares: "2,900", description: "Cutting my menu from 40 to 12 items doubled my revenue", url: "https://www.tiktok.com/@cafeconsultant/video/5", hookSource: "screenshot" },
  { rank: 6, title: "POV: a customer orders an oat milk latte with 7 modifications", name: "@baristabites", datePosted: "Mar 5, 2026", views: "620,000", likes: "38,000", comments: "2,400", shares: "4,200", description: "The most complex order I've ever made — and yes, I smiled through it", url: "https://www.tiktok.com/@baristabites/video/6", hookSource: "caption" },
  { rank: 7, title: "3 things I wish I knew before opening a cafe", name: "@thecoffeeguy", datePosted: "Jan 18, 2026", views: "540,000", likes: "29,000", comments: "870", shares: "2,100", description: "Permits, foot traffic analysis, and the one hire that changed everything", url: "https://www.tiktok.com/@thecoffeeguy/video/7", hookSource: "screenshot" },
  { rank: 8, title: "This $2 ingredient makes your coffee taste like a $7 latte", name: "@homebarista", datePosted: "Feb 14, 2026", views: "480,000", likes: "26,000", comments: "1,100", shares: "3,400", description: "Vanilla bean paste — not extract, not syrup — changes everything", url: "https://www.tiktok.com/@homebarista/video/8", hookSource: "screenshot" },
  { rank: 9, title: "My coffee shop almost failed because of this mistake", name: "@morninggrind", datePosted: "Apr 1, 2026", views: "410,000", likes: "22,000", comments: "640", shares: "1,800", description: "I ignored my neighborhood demographics and paid for it — here's what I changed", url: "https://www.tiktok.com/@morninggrind/video/9", hookSource: "screenshot" },
  { rank: 10, title: "Unpopular opinion: drip coffee is better than espresso", name: "@cafeconsultant", datePosted: "Mar 30, 2026", views: "350,000", likes: "19,000", comments: "3,100", shares: "1,500", description: "Why the simplest brew method produces the most nuanced cup", url: "https://www.tiktok.com/@cafeconsultant/video/10", hookSource: "screenshot" },
];

// ─── Sample hook patterns ───────────────────────────────────────────────────

const DEMO_HOOK_PATTERNS: HookPattern[] = [
  { type: "Transformation / result first", example: "I opened a coffee shop with $5,000", whyItWorks: "Leads with the outcome — viewer immediately knows the payoff and wants to learn how" },
  { type: "Contrarian / myth-bust", example: "Unpopular opinion: drip coffee is better than espresso", whyItWorks: "Challenges a common belief, making the viewer stop to reconsider" },
  { type: "Curiosity gap", example: "The latte art trick that took me 2 years to learn", whyItWorks: "Implies insider knowledge and creates urgency to watch" },
  { type: "Loss aversion / mistake warning", example: "Stop buying coffee equipment you don't need", whyItWorks: "Triggers fear of wasting money — viewers watch to avoid the mistake" },
  { type: "Day-in-the-life / relatability", example: "Day in the life of a small coffee shop owner", whyItWorks: "Builds parasocial connection by showing the authentic daily experience" },
];

// ─── Sample topic banks ─────────────────────────────────────────────────────

const DEMO_TOPIC_BANKS: TopicBank[] = [
  {
    id: "howto",
    emoji: "🎓",
    label: "How-to / Tutorial",
    hashtags: ["#coffeetips", "#barista", "#coffeeshop", "#latteart", "#brewguide"],
    tips: "Film in good light, show the process clearly. Keep it under 60 seconds.",
    topics: [
      { topic: "How to pull a perfect espresso shot every time", hook: "Your espresso shots are failing because of this", hookFamily: "Loss Aversion/FOMO" },
      { topic: "3 latte art patterns anyone can learn in a weekend", hook: "Latte art in 48 hours — here's how", hookFamily: "Tactical/Value" },
      { topic: "The correct way to steam milk for microfoam", hook: "You're steaming milk wrong", hookFamily: "Curiosity-Gap" },
      { topic: "How to dial in a new bag of beans in 3 shots", hook: "New beans? Do this first", hookFamily: "Tactical/Value" },
      { topic: "Pour-over technique that beats any coffee machine", hook: "This $15 method beats your $500 machine", hookFamily: "Curiosity-Gap" },
      { topic: "How to clean your espresso machine properly — open mid-backflush, no intro shot", hook: "Your machine is dirtier than you think", hookFamily: "Loss Aversion/FOMO" },
      { topic: "Cold brew ratio that took me 50 batches to perfect", hook: "50 batches later — the perfect cold brew", hookFamily: "Authority/Proof" },
    ],
  },
  {
    id: "diml",
    emoji: "🎬",
    label: "Day in the Life",
    hashtags: ["#coffeeshoplife", "#smallbusiness", "#cafeowner", "#entrepreneurlife", "#morningroutine"],
    tips: "Show the real, unfiltered day. Authenticity beats production value here.",
    topics: [
      { topic: "4am alarm, roasting beans, first customer at 6:30 — a Tuesday", hook: "4am. Every single day.", hookFamily: "Relatability/Identity" },
      { topic: "What happens when your espresso machine breaks mid-rush", hook: "The machine broke at 8am on a Monday", hookFamily: "Curiosity-Gap" },
      { topic: "Closing the shop alone on a slow Sunday — the quiet side of ownership", hook: "Nobody talks about the quiet days", hookFamily: "Relatability/Identity" },
      { topic: "Farmers market pop-up: setting up, selling out, breaking down", hook: "We sold out in 2 hours", hookFamily: "Authority/Proof" },
      { topic: "What I actually eat and drink as a coffee shop owner", hook: "I don't even drink coffee anymore", hookFamily: "Curiosity-Gap" },
      { topic: "Training a new barista on their first day — walk into frame mid-demo", hook: "Day 1 as my new barista", hookFamily: "Aspiration/Desire" },
      { topic: "Monthly inventory day — the least glamorous part of the business", hook: "The part nobody shows you", hookFamily: "Relatability/Identity" },
    ],
  },
  {
    id: "th-hottake",
    emoji: "🔥",
    label: "Talking Head: Hot Take",
    hashtags: ["#coffeeopinion", "#cafetips", "#smallbizowner", "#coffeeculture", "#hottake"],
    tips: "Be direct and confident. State your hot take in the first 3 seconds.",
    topics: [
      { topic: "Why most new coffee shops fail in year one", hook: "90% of coffee shops fail — here's why", hookFamily: "Loss Aversion/FOMO" },
      { topic: "Oat milk is overrated and here's the data", hook: "Unpopular opinion: oat milk is overrated", hookFamily: "Controversy/Engagement-Bait" },
      { topic: "Why I stopped offering free wifi", hook: "I removed the wifi and revenue went up", hookFamily: "Curiosity-Gap" },
      { topic: "The real reason chain coffee tastes different from indie", hook: "Starbucks doesn't want you to know this", hookFamily: "Curiosity-Gap" },
      { topic: "Stop trying to compete on price — compete on experience", hook: "Stop lowering your prices", hookFamily: "Controversy/Engagement-Bait" },
      { topic: "Why your favorite cafe charges $6 for a latte — and should", hook: "$6 lattes aren't expensive — here's why", hookFamily: "Controversy/Engagement-Bait" },
      { topic: "The one menu item every coffee shop should cut", hook: "Cut this from your menu today", hookFamily: "Loss Aversion/FOMO" },
    ],
  },
  {
    id: "text-clip",
    emoji: "🎵",
    label: "Text + Clip + Music",
    hashtags: ["#coffeetok", "#cafevibes", "#coffeeshopowner", "#smallbizlife", "#baristatok"],
    tips: "The text and visual carry the most weight. Pick a trending sound that matches the mood.",
    topics: [
      { topic: "POV: you're a cafe owner and someone asks if you have pumpkin spice in July", hook: "POV: pumpkin spice in July", hookFamily: "Relatability/Identity" },
      { topic: "Things customers say that make baristas internally scream", hook: "Can I get a medium? We don't have medium.", hookFamily: "Relatability/Identity" },
      { topic: "The satisfying moment when the morning rush finally ends", hook: "9:47am. Silence.", hookFamily: "Relatability/Identity" },
      { topic: "What $5,000 in coffee equipment actually looks like", hook: "What $5K buys you", hookFamily: "Curiosity-Gap" },
      { topic: "The glow-up of my cafe from day 1 to month 6", hook: "6 months of progress", hookFamily: "Aspiration/Desire" },
      { topic: "Every type of regular customer at a coffee shop", hook: "Which regular are you?", hookFamily: "Relatability/Identity" },
      { topic: "The moment you realize you forgot to order cups — sync to sound drop", hook: "When the cups don't arrive", hookFamily: "Relatability/Identity" },
    ],
  },
  {
    id: "carousel",
    emoji: "🖼️",
    label: "Carousel",
    hashtags: ["#coffeebusiness", "#cafetips", "#coffeeshoptips", "#entrepreneurtips", "#smallbizadvice"],
    tips: "High save rate format. Use numbered content and make each slide scannable.",
    topics: [
      { topic: "5 things to check before signing a cafe lease", hook: "5 lease red flags", hookFamily: "Tactical/Value" },
      { topic: "7 ways to make your coffee shop Instagram-worthy on a budget", hook: "7 budget design hacks", hookFamily: "Tactical/Value" },
      { topic: "4 mistakes first-time cafe owners make with suppliers", hook: "4 supplier mistakes to avoid", hookFamily: "Loss Aversion/FOMO" },
      { topic: "6 drinks that have the highest profit margin", hook: "6 highest-margin drinks", hookFamily: "Tactical/Value" },
      { topic: "3 signs your coffee shop needs a rebrand", hook: "3 signs you need a rebrand", hookFamily: "Loss Aversion/FOMO" },
      { topic: "5 free tools every cafe owner should be using", hook: "5 free tools I use daily", hookFamily: "Tactical/Value" },
      { topic: "8 questions to ask before hiring your first barista", hook: "8 interview questions that matter", hookFamily: "Tactical/Value" },
    ],
  },
];

// ─── Build the 30-day calendar ──────────────────────────────────────────────

function buildDemoCalendar(banks: TopicBank[]): CalendarDay[] {
  const typeCycle = banks.map((b) => b.id);
  const usedCount: Record<string, number> = {};
  return Array.from({ length: 30 }, (_, i) => {
    const typeRef = typeCycle[i % typeCycle.length];
    const bank = banks.find((b) => b.id === typeRef);
    const topics = bank?.topics || [];
    const idx = topics.length > 0 ? (usedCount[typeRef] ?? 0) % topics.length : 0;
    usedCount[typeRef] = (usedCount[typeRef] ?? 0) + 1;
    const chosen = topics[idx];
    return {
      day: i + 1,
      week: Math.ceil((i + 1) / 7),
      typeRef,
      suggestedHook: chosen?.hook ?? chosen?.topic ?? "",
      topicDescription: chosen?.topic ?? "",
    };
  });
}

// ─── Assembled demo plan ────────────────────────────────────────────────────

export const DEMO_PLAN_RESULT: PlanResult = {
  nicheVideos: DEMO_NICHE_VIDEOS,
  hookPatterns: DEMO_HOOK_PATTERNS,
  topicBanks: DEMO_TOPIC_BANKS,
  calendar: buildDemoCalendar(DEMO_TOPIC_BANKS),
};
