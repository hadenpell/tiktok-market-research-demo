// Shared types for the Churn Profile Builder

export interface NicheVideo {
  rank?: number;
  title: string;
  name?: string;
  datePosted?: string;
  views?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  saves?: string;
  description?: string;
  url?: string;
  hookSource?: "screenshot" | "caption";
}

export interface TopicBankItem {
  topic: string;
  hook?: string;
  hookFamily?: string; // Hook pattern family (e.g., "Curiosity-Gap", "Loss Aversion/FOMO")
}

export interface TopicBank {
  id: string;
  emoji?: string;
  label: string;
  hashtags?: string[];
  tips?: string;
  guidance?: string[];
  topics?: TopicBankItem[];
}

export interface CalendarDay {
  day: number;
  week: number;
  typeRef: string;
  suggestedHook?: string; // AI-generated suggestion, shown in hook bank modal (not auto-selected)
  topicDescription?: string;
  recreate?: boolean;
  recreateFrom?: string;
}

export interface HookPattern {
  type: string;
  example: string;
  whyItWorks: string;
}

export interface NicheAlert {
  message: string;
  keywordsSearched: string[];
}

// Niche-level research result — cached for 1 year, shared across all clients in the same niche
export interface NicheResearch {
  nicheVideos: NicheVideo[];
  hookPatterns: HookPattern[];
  nicheAlert?: NicheAlert | null;
}

export interface PlanResult {
  nicheVideos: NicheVideo[];
  hookPatterns: HookPattern[];
  nicheAlert?: NicheAlert | null;
  topicBanks: TopicBank[];
  calendar: CalendarDay[];
}

export interface IntakePayload {
  niche: string;
  videoTypes: string[];
  pillars: string[];
}

// Static content that is identical for every client
export const STATIC_CONTENT = {
  generalPrinciples: [
    `<b>Put numbers and names in your hooks whenever they're true.</b> "How I won $500K in scholarships to Wharton" beats "how I got a scholarship." Specifics are more clickable and more credible.`,
    `<b>Lead with your credential.</b> Your background is proof. Drop your school, title, or result into the first 3 seconds.`,
    `<b>Keep hooks tight: about 8 to 12 words.</b> The hook is the first 1 to 3 seconds. Make every word earn its place. Don't clickbait.`,
    `<b>Authenticity beats production in this niche.</b> Low-fi talk-to-camera videos consistently outperform polished ones here.`,
    `<b>Model what's already worked before.</b> Take a proven hook structure and rebuild it around your real story and numbers.`,
  ],
  dailyEngagement: [
    `Respond to comments (especially ones that spark conversation) and genuine DMs`,
    `Follow 3 to 5 creators in your niche`,
    `Like and comment on other niche creators' posts`,
    `Save anything you like or could recreate to an "Inspiration" collection on TikTok`,
    `Note any video 2+ people request in your comments, that's a signal of demand`,
  ],
};

// Maps video types the client can make to allowed topic bank IDs
export const VIDEO_TYPE_TO_BANKS: Record<string, string[]> = {
  Vlogs: ["diml"],
  "Day in the life": ["diml"],
  "How-to / Tutorial": ["howto"],
  Testimonials: ["testimonial"],
  "Talking heads": ["th-listicle", "th-hottake", "th-insider", "th-story", "th-reaction", "th-qa"],
  "Text + clip + music": ["text-clip"],
  Trends: ["text-clip"],
  Carousels: ["carousel"],
};
