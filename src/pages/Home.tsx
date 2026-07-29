import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type {
  IntakePayload,
  PlanResult,
  CalendarDay,
  TopicBank,
  NicheVideo,
} from "@shared/churnTypes";
import {
  STATIC_CONTENT,
} from "@shared/churnTypes";

// ─── demo plan data ─────────────────────────────────────────────────────────
// This is canned test data, not a live research result. The real app runs two
// AI research passes (see reference/research-prompts.ts) against Apify/TikTok
// data and a Manus agent; this demo build never makes that call — it always
// returns this same fixed plan a few seconds after "Create my 30-day content
// plan" is clicked, regardless of what's entered in the intake form.
const DEMO_PLAN_RESULT: PlanResult = {
  nicheVideos: [
    { rank: 1, title: "Stop your sciatica pain in 30 seconds", views: "245K", likes: "12.3K", comments: "892", datePosted: "2 weeks ago", description: "Simple 30-second stretch that stops sciatica pain immediately" },
    { rank: 2, title: "I fixed my sciatica in 3 days", views: "189K", likes: "9.8K", comments: "654", datePosted: "3 weeks ago", description: "This one weird trick doctors don't want you to know" },
    { rank: 3, title: "Surgery is NOT the only option", views: "156K", likes: "8.2K", comments: "521", datePosted: "1 month ago", description: "Here's what doctors won't tell you about sciatica" },
    { rank: 4, title: "What surgeons don't want you to know", views: "134K", likes: "7.1K", comments: "445", datePosted: "1 month ago", description: "The real reason they recommend surgery" },
    { rank: 5, title: "They said I'd never walk again", views: "128K", likes: "6.8K", comments: "412", datePosted: "6 weeks ago", description: "My sciatica recovery story" },
    { rank: 6, title: "This one stretch changed everything", views: "119K", likes: "6.3K", comments: "378", datePosted: "6 weeks ago", description: "The stretch physical therapists recommend" },
    { rank: 7, title: "Back pain? Stop doing these 3 stretches", views: "112K", likes: "5.9K", comments: "356", datePosted: "2 months ago", description: "These stretches make sciatica worse" },
    { rank: 8, title: "The truth about sciatica surgery", views: "105K", likes: "5.5K", comments: "334", datePosted: "2 months ago", description: "Why I didn't get surgery" },
    { rank: 9, title: "Doctors hate this one trick", views: "98K", likes: "5.2K", comments: "312", datePosted: "2 months ago", description: "Natural sciatica relief" },
    { rank: 10, title: "My sciatica disappeared in 2 weeks", views: "92K", likes: "4.8K", comments: "289", datePosted: "3 months ago", description: "Here's exactly what I did" },
  ],
  hookPatterns: [
    { type: "Curiosity gap", example: "What surgeons won't tell you about sciatica", whyItWorks: "Implies insider knowledge and creates urgency to watch" },
    { type: "Transformation / result first", example: "I fixed my sciatica in 3 days", whyItWorks: "Leads with the outcome — viewer immediately knows the payoff" },
    { type: "Contrarian / myth-bust", example: "Surgery is NOT the only option", whyItWorks: "Challenges a common belief, making the viewer stop to reconsider" },
    { type: "Speed / urgency", example: "Stop your sciatica pain in 30 seconds", whyItWorks: "Specific timeframe makes the promise feel achievable and real" },
    { type: "Personal story", example: "They said I'd never walk again", whyItWorks: "Emotional stakes draw viewers in and build credibility" },
  ],
  topicBanks: [
    {
      id: "howto",
      emoji: "🎓",
      label: "How-to / Tutorial",
      hashtags: ["#sciaticarelief", "#backpain", "#physiotherapy", "#painrelief", "#spinehealth"],
      tips: "Film in good light, show the exercise clearly. Keep it under 60 seconds.",
      topics: [
        { topic: "Quick 30-second sciatica relief stretch", hook: "Stop your sciatica pain in 30 seconds", hookFamily: "Tactical/Value" },
        { topic: "3 exercises that make sciatica worse", hook: "Stop doing these 3 stretches if you have back pain", hookFamily: "Loss Aversion/FOMO" },
        { topic: "The nerve floss technique for sciatica", hook: "The stretch your physio won't show you", hookFamily: "Curiosity-Gap" },
        { topic: "Morning routine to prevent sciatica flare-ups", hook: "5 minutes every morning eliminated my sciatica", hookFamily: "Authority/Proof" },
        { topic: "How to sit correctly with sciatica", hook: "You're sitting wrong — here's how to fix it", hookFamily: "Curiosity-Gap" },
      ],
    },
    {
      id: "testimonial",
      emoji: "⭐",
      label: "Testimonials",
      hashtags: ["#sciaticarecovery", "#backpainrelief", "#healingjourney", "#physiotherapy", "#painfree"],
      tips: "Lead with the result, then tell the story. Real patients are most compelling.",
      topics: [
        { topic: "Patient who avoided surgery after 3 sessions", hook: "I fixed my sciatica in 3 days", hookFamily: "Authority/Proof" },
        { topic: "Recovery story after being told surgery was the only option", hook: "Surgery is NOT the only option", hookFamily: "Controversy/Engagement-Bait" },
        { topic: "Patient who walked again after being told they wouldn't", hook: "They said I'd never walk again", hookFamily: "Aspiration/Desire" },
        { topic: "Client who went from bedbound to pain-free in 2 weeks", hook: "My sciatica disappeared in 2 weeks", hookFamily: "Authority/Proof" },
      ],
    },
    {
      id: "th-hottake",
      emoji: "🔥",
      label: "Talking Head: Hot Take",
      hashtags: ["#sciatica", "#backpain", "#physio", "#healthtips", "#spinehealth"],
      tips: "Be direct and confident. State your hot take in the first 3 seconds.",
      topics: [
        { topic: "Why most doctors get sciatica treatment wrong", hook: "What surgeons don't want you to know", hookFamily: "Curiosity-Gap" },
        { topic: "Why surgery is overused for sciatica", hook: "The truth about sciatica surgery", hookFamily: "Controversy/Engagement-Bait" },
        { topic: "Why rest makes sciatica worse", hook: "Unpopular opinion: rest is ruining your sciatica", hookFamily: "Controversy/Engagement-Bait" },
        { topic: "Why painkillers don't fix sciatica", hook: "Painkillers are making your sciatica worse", hookFamily: "Loss Aversion/FOMO" },
      ],
    },
  ],
  calendar: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    week: Math.ceil((i + 1) / 7),
    typeRef: ["howto", "th-hottake", "testimonial"][i % 3],
    suggestedHook: `Sample hook for day ${i + 1}`,
    topicDescription: `Topic for day ${i + 1}`,
  })),
};

// ─── helpers ────────────────────────────────────────────────────────────────

// Map day number (1-30) to a weekday name, starting Monday for day 1
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function getDayName(dayNum: number): string {
  return WEEKDAYS[(dayNum - 1) % 7];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lookup table: typeRef ID → { emoji, label } for display when no matching topic bank exists
const TYPE_REF_LABELS: Record<string, { emoji: string; label: string }> = {
  "howto":        { emoji: "🎓", label: "How-to / Tutorial" },
  "testimonial":  { emoji: "⭐", label: "Testimonials" },
  "diml":         { emoji: "🎬", label: "Day in the Life" },
  "th-listicle":  { emoji: "🔢", label: "Talking Head: Listicle" },
  "th-hottake":   { emoji: "🔥", label: "Talking Head: Hot Take" },
  "th-insider":   { emoji: "🕵️", label: "Talking Head: Insider" },
  "th-story":     { emoji: "📖", label: "Talking Head: Story" },
  "th-reaction":  { emoji: "👀", label: "Talking Head: Reaction" },
  "th-qa":        { emoji: "❓", label: "Talking Head: Q&A" },
  "text-clip":    { emoji: "🎵", label: "Text + Clip + Music" },
  "carousel":     { emoji: "🖼️", label: "Carousel" },
};

// ─── types ───────────────────────────────────────────────────────────────────
type Screen = "input" | "loading" | "results";

// Extended calendar day with user-selected hook
interface CalendarDayState extends CalendarDay {
  selectedHook?: string; // user-chosen hook text
  isEditing?: boolean;
  recreateFromDay?: number;
  recreateFormat?: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued...",
  researching: "Researching your niche...",
  analyzing: "Analyzing top-performing videos...",
  building: "Building your hook and topic banks...",
  assembling: "Assembling your 30-day calendar...",
  done: "Done. Loading your plan...",
};

// Simulated progression through the same stages the real backend job reports,
// so the loading screen behaves like production — just compressed to seconds
// instead of minutes, since there's no real research happening.
const DEMO_LOADING_STEPS: { status: keyof typeof STATUS_LABELS; progress: number; delayMs: number }[] = [
  { status: "queued", progress: 8, delayMs: 400 },
  { status: "researching", progress: 35, delayMs: 1200 },
  { status: "analyzing", progress: 60, delayMs: 1100 },
  { status: "building", progress: 82, delayMs: 1100 },
  { status: "assembling", progress: 96, delayMs: 900 },
  { status: "done", progress: 100, delayMs: 400 },
];

const STORAGE_KEY = "churn-demo-plan";

// ─── export helpers ──────────────────────────────────────────────────────────
const EXPORT_HEADERS = ["Day", "Day of Week", "Week", "Video Type", "Selected Hook", "Topic Description", "Recreation?"];

function buildExportRows(
  calendarDays: CalendarDayState[],
  bankById: Record<string, TopicBank>
): (string | number)[][] {
  return calendarDays.map((d) => {
    const bank = bankById[d.typeRef];
    const typeLabel = bank
      ? `${bank.emoji ?? ""} ${bank.label}`.trim()
      : `${TYPE_REF_LABELS[d.typeRef]?.emoji ?? ""} ${TYPE_REF_LABELS[d.typeRef]?.label ?? d.typeRef}`.trim();
    return [
      d.day,
      getDayName(d.day),
      d.week,
      typeLabel,
      d.selectedHook ?? "",
      d.topicDescription ?? "",
      d.recreateFromDay != null ? "Yes" : "No",
    ];
  });
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [EXPORT_HEADERS, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows: (string | number)[][], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);
  ws["!cols"] = EXPORT_HEADERS.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length));
    return { wch: Math.min(maxLen + 2, 60) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "30-Day Calendar");
  XLSX.writeFile(wb, filename);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function VideoCard({ v, rank }: { v: NicheVideo; rank?: number }) {
  const metric = (val: string | undefined, lab: string) =>
    val && val !== "N/A" && val !== "Not shown" ? (
      <div className="metric">
        <div className="mv">{val}</div>
        <div className="ml">{lab}</div>
      </div>
    ) : null;

  return (
    <div className="vcard">
      {v.url ? (
        <a className="vtitle" href={v.url} target="_blank" rel="noopener noreferrer">
          {v.title || v.name || "View video"} ↗
        </a>
      ) : (
        <div className="vtitle notlink">{v.title || v.name || "Video"}</div>
      )}
      <div className="vcard-top">
        {rank != null && <span className="vrank">#{rank}</span>}
        {v.name && <span className="vname">{v.name}</span>}
        <span className="vdate">{v.datePosted || ""}</span>
      </div>
      <div className="metrics">
        {metric(v.likes, "Likes")}
        {metric(v.comments, "Comments")}
        {metric(v.shares, "Shares")}
        {metric(v.saves, "Saves")}
        {metric(v.views, "Views")}
      </div>
      {v.description && <div className="vdesc">{v.description}</div>}
    </div>
  );
}

function Collapsible({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`collapse-toggle${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ct-label">{open ? `Hide ${label}` : `Show ${label}`}</span>
        <span className={`ct-arrow${open ? " open" : ""}`}>▾</span>
      </div>
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </>
  );
}

// ─── Hook Selection Modal ─────────────────────────────────────────────────────
function HookSelectModal({
  day,
  bank,
  onSelect,
  onClose,
}: {
  day: CalendarDayState;
  bank: TopicBank | null;
  onSelect: (hook: string, topic?: string) => void;
  onClose: () => void;
}) {
  const [editingIndex, setEditingIndex] = useState<null | "suggested" | number>(null);
  const [editValue, setEditValue] = useState("");
  const [editTopic, setEditTopic] = useState<string | undefined>(undefined);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  function startEdit(hookText: string, index: "suggested" | number, topic?: string) {
    setEditValue(hookText);
    setEditTopic(topic);
    setEditingIndex(index);
  }

  function confirmEdit() {
    if (editValue.trim()) onSelect(editValue.trim(), editTopic);
  }

  if (!bank) return null;

  const suggestedHookNorm = day.suggestedHook?.trim().toLowerCase();
  const topics = (bank.topics || []).filter((t) => {
    const hookText = (t.hook || t.topic || "").trim().toLowerCase();
    return !suggestedHookNorm || hookText !== suggestedHookNorm;
  });

  return (
    <div className="bank-modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bank-panel" role="dialog" aria-modal="true">
        <div className="bank-head">
          <div className="bank-title">
            {bank.emoji || ""} {bank.label} — Day {day.day} ({getDayName(day.day)})
          </div>
          <button className="bank-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {bank.tips && <div className="bank-tips">{bank.tips}</div>}
        <div className="bank-subhead" style={{ marginBottom: 8 }}>Pick a hook for this day:</div>

        {day.suggestedHook && (
          <div style={{ marginBottom: 12 }}>
            <div className="bank-subhead" style={{ fontSize: "0.78rem", color: "var(--muted-foreground)", marginBottom: 4 }}>✨ Suggested for today:</div>
            {editingIndex === "suggested" ? (
              <div className="bank-row" style={{ background: "var(--accent-subtle, rgba(255,140,0,0.06))", borderLeft: "3px solid var(--accent)" }}>
                <input
                  ref={editInputRef}
                  type="text"
                  className="churn-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingIndex(null); }}
                  style={{ marginBottom: 8 }}
                />
                {day.topicDescription && <div className="bank-topic" style={{ marginBottom: 8 }}>{day.topicDescription}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={confirmEdit}>Use this hook</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingIndex(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div
                className="bank-row bank-row-selectable"
                style={{ cursor: "pointer", borderLeft: "3px solid var(--accent)", background: "var(--accent-subtle, rgba(255,140,0,0.06))" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="bank-hook" onClick={() => onSelect(day.suggestedHook!, day.topicDescription)}>"{day.suggestedHook}"</div>
                    {day.topicDescription && <div className="bank-topic" onClick={() => onSelect(day.suggestedHook!, day.topicDescription)}>{day.topicDescription}</div>}
                  </div>
                  <button
                    className="bank-edit-btn"
                    style={{ flexShrink: 0, marginTop: 2 }}
                    onClick={(e) => { e.stopPropagation(); startEdit(day.suggestedHook!, "suggested", day.topicDescription); }}
                    title="Edit before selecting"
                  >✏️ Edit</button>
                </div>
              </div>
            )}
            <div className="bank-subhead" style={{ marginTop: 12, marginBottom: 4 }}>Or pick from the topic bank:</div>
          </div>
        )}

        <div className="bank-rows">
          {topics.map((t, i) => {
            const hookText = t.hook || t.topic;
            return editingIndex === i ? (
              <div key={i} className="bank-row" style={{ marginBottom: 6 }}>
                <input
                  ref={editingIndex === i ? editInputRef : undefined}
                  type="text"
                  className="churn-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") setEditingIndex(null); }}
                  style={{ marginBottom: 8 }}
                />
                {t.topic && t.hook && <div className="bank-topic" style={{ marginBottom: 8 }}>{t.topic}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={confirmEdit}>Use this hook</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingIndex(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="bank-row bank-row-selectable"
                style={{ cursor: "pointer", marginBottom: 6 }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }} onClick={() => onSelect(hookText, t.topic)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {t.hook && <div className="bank-hook">"{t.hook}"</div>}
                      {t.hookFamily && (
                        <span className="hook-family-tag">{t.hookFamily}</span>
                      )}
                    </div>
                    <div className="bank-topic">{t.topic}</div>
                  </div>
                  <button
                    className="bank-edit-btn"
                    style={{ flexShrink: 0, marginTop: 2 }}
                    onClick={(e) => { e.stopPropagation(); startEdit(hookText, i, t.topic); }}
                    title="Edit before selecting"
                  >✏️ Edit</button>
                </div>
              </div>
            );
          })}
        </div>

        {bank.hashtags && bank.hashtags.length > 0 && (
          <div className="bank-tags">
            <div className="bank-subhead">Hashtags</div>
            <div className="kw-wrap">
              {bank.hashtags.map((h, i) => (
                <span key={i} className="kw">{h}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recreation Modal ─────────────────────────────────────────────────────────
function RecreationModal({
  day,
  onConfirm,
  onClose,
}: {
  day: CalendarDayState;
  onConfirm: (hook: string) => void;
  onClose: () => void;
}) {
  const [hookText, setHookText] = useState("");

  function handleConfirm() {
    if (hookText.trim()) onConfirm(hookText.trim());
  }

  return (
    <div className="bank-modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bank-panel" role="dialog" aria-modal="true">
        <div className="bank-head">
          <div className="bank-title">🔁 Recreate — Day {day.day} ({getDayName(day.day)})</div>
          <button className="bank-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="bank-tips" style={{ marginBottom: 12 }}>
          <ul className="checklist" style={{ margin: 0, paddingLeft: 0 }}>
            <li>If a video performs well (&gt;10K), wait 2 weeks before recreating it.</li>
            <li>If a video goes viral (&gt;50K), create a continuation within 1 week.</li>
            <li>A <b>continuation</b> is a different video about the same subject or topic, and builds upon the original video. The hook, footage, &amp; audio is different. (Example: a part 2 or an update video)</li>
            <li>A <b>recreation</b> is the same video concept with slight changes e.g. new footage, hook tweaked, format (Example: You repurpose a talking head video into a carousel and use the same hook, OR you remake a talking head video with a slightly reworded hook)</li>
          </ul>
        </div>

        <div className="bank-subhead" style={{ marginBottom: 6 }}>Examples of how to recreate a hook:</div>
        <div className="bank-row" style={{ marginBottom: 6, background: "var(--muted, #f5f5f5)", borderRadius: 8 }}>
          <div style={{ fontSize: "0.88rem", color: "var(--foreground)" }}>
            <span style={{ color: "var(--muted-foreground)" }}>"How I made $50K in 1 month"</span>
            <span style={{ margin: "0 8px", fontWeight: 700 }}>→</span>
            <span>"I made $50K in March - here's how I did it"</span>
          </div>
        </div>
        <div className="bank-row" style={{ marginBottom: 16, background: "var(--muted, #f5f5f5)", borderRadius: 8 }}>
          <div style={{ fontSize: "0.88rem", color: "var(--foreground)" }}>
            <span style={{ color: "var(--muted-foreground)" }}>"Stop doing these 3 stretches if you have back pain"</span>
            <span style={{ margin: "0 8px", fontWeight: 700 }}>→</span>
            <span>"Back pain? Stop doing these 3 stretches"</span>
          </div>
        </div>

        <div className="bank-subhead" style={{ marginBottom: 6 }}>Write your recreation hook:</div>
        <input
          type="text"
          className="churn-input"
          value={hookText}
          onChange={(e) => setHookText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onClose(); }}
          placeholder="Type your hook here..."
          autoFocus
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!hookText.trim()}
            style={{ flex: 1 }}
          >
            Set recreation hook →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Day Cell ────────────────────────────────────────────────────────
function CalendarDayCell({
  day,
  bank,
  onSelectHook,
  onSetRecreation,
  onClearHook,
}: {
  day: CalendarDayState;
  bank: TopicBank | null;
  onSelectHook: (dayNum: number) => void;
  onSetRecreation: (dayNum: number) => void;
  onClearHook: (dayNum: number) => void;
}) {
  const isRecreation = !!day.recreateFromDay;
  const hasHook = !!day.selectedHook;
  const dayName = getDayName(day.day);
  const canRecreate = day.day >= 15;

  return (
    <div className={`cal-day-cell${hasHook ? " has-hook" : ""}${isRecreation ? " is-recreation" : ""}`}>
      <div className="cal-day-header">
        <span className="cal-day-num">{dayName} {day.day}</span>
        {isRecreation && <span className="cal-recreation-badge">🔁 Recreate</span>}
      </div>

      <div className="cal-type-label">
        {bank?.emoji || TYPE_REF_LABELS[day.typeRef]?.emoji || ""} {bank?.label || TYPE_REF_LABELS[day.typeRef]?.label || day.typeRef}
      </div>

      {hasHook ? (
        <div className="cal-hook-area">
          <div className="cal-hook-display">
            <div
              className="cal-hook-text"
              style={{ cursor: "pointer" }}
              onClick={() => onSelectHook(day.day)}
              title="Click to change hook"
            >"{day.selectedHook}"</div>
            {isRecreation && day.recreateFromDay && (
              <div className="cal-recreate-note">🔁 Recreation</div>
            )}
            <div className="cal-hook-actions">
              <button className="cal-action-btn" onClick={() => onSelectHook(day.day)}>✏️ Change</button>
              <button className="cal-action-btn" onClick={() => onClearHook(day.day)}>✕ Clear</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cal-empty-area">
          <button className="cal-pick-btn" onClick={() => onSelectHook(day.day)}>
            + Pick hook
          </button>
          {canRecreate && (
            <button className="cal-recreate-btn" onClick={() => onSetRecreation(day.day)}>
              🔁 Recreate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────
function ResultsView({
  data,
  savedCalendarState,
  onCalendarChange,
  onReset,
}: {
  data: PlanResult & {
    generalPrinciples: string[];
    dailyEngagement: string[];
  };
  savedCalendarState?: CalendarDayState[] | null;
  onCalendarChange: (calendarState: CalendarDayState[]) => void;
  onReset: () => void;
}) {
  const [calendarDays, setCalendarDays] = useState<CalendarDayState[]>(() => {
    if (savedCalendarState && savedCalendarState.length > 0) {
      return savedCalendarState;
    }
    return (data.calendar || []).map((d) => {
      const { selectedHook: _ignored, ...rest } = d as CalendarDay & { selectedHook?: string };
      return rest as CalendarDayState;
    });
  });
  const [hookModal, setHookModal] = useState<{ dayNum: number } | null>(null);
  const [recreationModal, setRecreationModal] = useState<{ dayNum: number } | null>(null);

  const bankById: Record<string, TopicBank> = {};
  (data.topicBanks || []).forEach((b) => { bankById[b.id] = b; });

  const weeks: Record<number, CalendarDayState[]> = {};
  calendarDays.forEach((day) => {
    const wk = Math.ceil(day.day / 7);
    if (!weeks[wk]) weeks[wk] = [];
    weeks[wk].push(day);
  });

  function updateDay(dayNum: number, updates: Partial<CalendarDayState>) {
    setCalendarDays((prev) => {
      const next = prev.map((d) => (d.day === dayNum ? { ...d, ...updates } : d));
      onCalendarChange(next); // fire-and-forget local persistence
      return next;
    });
  }

  function handleSelectHook(dayNum: number, hook: string, topic?: string) {
    updateDay(dayNum, { selectedHook: hook, topicDescription: topic, recreateFromDay: undefined, recreateFormat: undefined });
    setHookModal(null);
  }

  function handleSetRecreation(dayNum: number, hook: string) {
    updateDay(dayNum, {
      selectedHook: hook,
      recreateFromDay: dayNum,
    });
    setRecreationModal(null);
  }

  function handleClearHook(dayNum: number) {
    updateDay(dayNum, { selectedHook: undefined, recreateFromDay: undefined, recreateFormat: undefined });
  }

  const activeHookDay = hookModal ? calendarDays.find((d) => d.day === hookModal.dayNum) : null;
  const activeRecreateDay = recreationModal ? calendarDays.find((d) => d.day === recreationModal.dayNum) : null;

  const tocItems = [
    { id: "r-nichevideos", l: "🎬 Niche Videos" },
    { id: "r-calendar", l: "🗓️ Calendar" },
    { id: "r-patterns", l: "🔑 Hook Patterns" },
    { id: "r-principles", l: "💡 Principles" },
  ];

  return (
    <div>
      <div className="content-col" style={{ paddingTop: 8, marginBottom: 8 }}>
        <h1 className="h1-big" style={{ textAlign: "center", marginBottom: 18 }}>Your 30-day plan</h1>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem", padding: "6px 16px", opacity: 0.8 }}
            onClick={() => {
              if (!confirm("Reset this demo plan? This clears your local demo data so you can generate a new one.")) return;
              onReset();
            }}
          >
            🔄 Reset & start over
          </button>
        </div>
        <div className="toc" style={{ justifyContent: "center" }}>
          {tocItems.map((item) => (
          <a
            key={item.id}
            className="tchip"
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {item.l}
          </a>
          ))}
        </div>
      </div>

      {/* Niche videos */}
      <div className="section-block" id="r-nichevideos" style={{ borderTop: "none", paddingTop: 0 }}>
        <div className="content-col">
          <span className="section-eyebrow">Your Niche</span>
          <h2 className="section-heading">🎬 What's working in your niche</h2>
          <div className="section-subtitle">10 proven, high-performing videos in your niche.</div>
        </div>
      </div>
      <div className="content-col">
        <ul className="checklist" style={{ marginBottom: 12 }}>
          <li>Watch these and note how creators structure their videos and hooks</li>
          <li>Note what visual, audio, and text hooks they use</li>
          <li>Think about which ones you could recreate</li>
          <li>Bookmark any viral videos in a TikTok collection called "Inspiration"</li>
        </ul>
        {data.nicheAlert ? (
          <div className="churn-card" style={{ background: "#fff8f0", border: "1.5px solid #f97316", borderRadius: 12, padding: "18px 22px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 6 }}>⚠️ No high-performing videos found</div>
            <div style={{ color: "#7c3a1a", marginBottom: 10 }}>{data.nicheAlert.message}</div>
            {data.nicheAlert.keywordsSearched?.length > 0 && (
              <div style={{ fontSize: 13, color: "#9a5c3a" }}>
                Keywords searched: {data.nicheAlert.keywordsSearched.join(", ")}
              </div>
            )}
          </div>
        ) : (
          <Collapsible id="nichevideos" label="niche videos">
            {(data.nicheVideos || []).map((v, i) => (
              <VideoCard key={i} v={v} rank={v.rank ?? i + 1} />
            ))}
          </Collapsible>
        )}
      </div>

      {/* 30-day calendar */}
      <div className="section-block" id="r-calendar">
        <div className="content-col">
          <span className="section-eyebrow">Content Plan</span>
          <h2 className="section-heading">🗓️ 30-day content calendar</h2>
        </div>
      </div>
      <div style={{ maxWidth: 740, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.95rem", padding: "7px 16px", border: "1.5px solid #e2d9cc", borderRadius: 8 }}
          onClick={() => downloadCSV(buildExportRows(calendarDays, bankById), "30-day-calendar.csv")}
          title="Download calendar as CSV"
        >
          ⬇ CSV
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.95rem", padding: "7px 16px", border: "1.5px solid #e2d9cc", borderRadius: 8 }}
          onClick={() => downloadExcel(buildExportRows(calendarDays, bankById), "30-day-calendar.xlsx")}
          title="Download calendar as Excel"
        >
          ⬇ Excel
        </button>
      </div>
      <div className="cal-instructions-box" style={{ maxWidth: 740, margin: "0 auto 28px" }}>
        <ul className="cal-instructions-list">
          <li className="no-bullet">Each day shows the video type suggested based on your niche. Click <b>+ Pick hook</b> to choose a hook from that day's topic bank, or <b>🔁 Recreate</b> to repurpose a past video.</li>
          <li><b>Weeks 1–2: Experimental.</b> We are trying out different content formats, topics, and hooks. Each day shows a suggested hook and video format. Pick the suggested hook OR one of the other hooks from the bank. After you select a hook, you can edit it to your liking. Suggested hashtags can be seen at the bottom after all the hook options. These will be exported when you download your calendar once it is fully populated.</li>
          <li><b>Weeks 3–5: Continued experimentation, data collection, &amp; recreations.</b> Starting in Week 3, you can recreate a high performing (&gt;10K views) video from Weeks 1 &amp; 2. Wait 2 weeks before recreating, unless you have a video that performs &gt;50K views. In that case, do a continuation within 1 week. See instructions once you click 'Recreate' for more details on how to recreate or continue a video.</li>
        </ul>
      </div>

      {Object.keys(weeks)
        .map(Number)
        .sort((a, b) => a - b)
        .map((wk) => {
          const days = weeks[wk];
          const startDay = (wk - 1) * 7 + 1;
          const endDay = Math.min(wk * 7, 30);
          return (
            <div key={wk} className="cal-week-block">
              <div className="weekhdr">
                <span className="wk">Week {wk}</span>
                <span className="wtag-days">Days {startDay}–{endDay}</span>
              </div>
              <div className="cal-week-grid">
                {days.map((day) => (
                  <CalendarDayCell
                    key={day.day}
                    day={day}
                    bank={bankById[day.typeRef] || null}
                    onSelectHook={(dayNum) => setHookModal({ dayNum })}
                    onSetRecreation={(dayNum) => setRecreationModal({ dayNum })}
                    onClearHook={handleClearHook}
                  />
                ))}
              </div>
            </div>
          );
        })}

      {/* Hook patterns */}
      <div className="section-block" id="r-patterns">
        <div className="content-col">
          <span className="section-eyebrow">Hook Strategy</span>
          <h2 className="section-heading">🔑 Hook patterns that work here</h2>
        </div>
      </div>
      <div className="churn-card content-col">
        {(data.hookPatterns || []).map((h, i) => (
          <div key={i} className="hprow">
            <div className="hp-type">{h.type}</div>
            <div className="hp-ex">{h.example}</div>
            <div className="hp-why">{h.whyItWorks}</div>
          </div>
        ))}
      </div>

      {/* General principles */}
      <div className="section-block" id="r-principles">
        <div className="content-col">
          <span className="section-eyebrow">Principles</span>
          <h2 className="section-heading">💡 Principles for stronger hooks</h2>
        </div>
      </div>
      <div className="churn-card content-col">
        <ol className="obs-list">
          {(data.generalPrinciples || []).map((o, i) => (
            <li key={i}><span dangerouslySetInnerHTML={{ __html: o }} /></li>
          ))}
        </ol>
      </div>

      {/* Daily engagement */}
      <div className="section-block">
        <div className="content-col">
          <span className="section-eyebrow">Daily Habits</span>
          <h2 className="section-heading">💬 Every day: engagement</h2>
        </div>
      </div>
      <div className="churn-card content-col">
        <ul className="checklist">
          {(data.dailyEngagement || []).map((en, i) => (
            <li key={i}>{en}</li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="content-col"><div className="disclaimer">
        <b>Disclaimer.</b> This is a demo build populated with sample data for illustration only — it does not reflect a real client's niche or performance data. Results are not guaranteed. Growth on TikTok depends on your content, consistency, and factors outside anyone's control, including changes to TikTok's algorithm. Churn is not affiliated with, endorsed by, or sponsored by TikTok Inc. or ByteDance Ltd.
      </div></div>

      {hookModal && activeHookDay && (
        <HookSelectModal
          day={activeHookDay}
          bank={bankById[activeHookDay.typeRef] || null}
          onSelect={(hook, topic) => handleSelectHook(activeHookDay.day, hook, topic)}
          onClose={() => setHookModal(null)}
        />
      )}

      {recreationModal && activeRecreateDay && (
        <RecreationModal
          day={activeRecreateDay}
          onConfirm={(hook) => handleSetRecreation(activeRecreateDay.day, hook)}
          onClose={() => setRecreationModal(null)}
        />
      )}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [planGenerated, setPlanGenerated] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<(PlanResult & { generalPrinciples: string[]; dailyEngagement: string[] }) | null>(null);
  const [savedCalendarState, setSavedCalendarState] = useState<CalendarDayState[] | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(STATUS_LABELS.queued);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [intakeErrors, setIntakeErrors] = useState<string[]>([]);

  const [niche, setNiche] = useState("");
  const [videoTypes, setVideoTypes] = useState<string[]>([]);
  const [pillar1, setPillar1] = useState("");
  const [pillar2, setPillar2] = useState("");
  const [pillar3, setPillar3] = useState("");
  const [pillar4, setPillar4] = useState("");
  const lastPayloadRef = useRef<IntakePayload | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => () => { cancelledRef.current = true; }, []);

  // On mount, load a previously-generated demo plan from localStorage (if any)
  // so a page refresh doesn't lose your place — mirrors the production app's
  // "one saved plan per user" behavior, just stored locally instead of in a DB.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { planData: PlanResult; calendarState?: CalendarDayState[] | null };
      setCurrentPlan({ ...STATIC_CONTENT, ...saved.planData });
      setSavedCalendarState(saved.calendarState ?? null);
      setPlanGenerated(true);
      setScreen("results");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function persistPlan(planData: PlanResult, calendarState: CalendarDayState[] | null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      intakeData: lastPayloadRef.current,
      planData,
      calendarState,
    }));
  }

  function finishGeneration(result: PlanResult) {
    const plan = { ...STATIC_CONTENT, ...result };
    persistPlan(result, null);
    setCurrentPlan(plan);
    setSavedCalendarState(null);
    setPlanGenerated(true);
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentPlan(null);
    setSavedCalendarState(null);
    setPlanGenerated(false);
    setScreen("input");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCalendarChange(calendarState: CalendarDayState[]) {
    if (!currentPlan) return;
    persistPlan(currentPlan, calendarState);
  }

  function gatherPayload(): IntakePayload {
    return {
      niche: niche.trim(),
      videoTypes: videoTypes.slice(),
      pillars: [pillar1, pillar2, pillar3, pillar4].map((p) => p.trim()).filter(Boolean),
    };
  }
  function validatePayload(payload: IntakePayload): string[] {
    const errors: string[] = [];
    if (!payload.niche) errors.push("Describe your niche — what you do, who you help, what makes you unique.");
    if (!payload.videoTypes.length) errors.push("Select at least one video type.");
    if (!payload.pillars.length) errors.push("Add at least 1 content pillar.");
    return errors;
  }

  // Simulates the same staged progress the real backend job reports
  // (queued → researching → analyzing → building → assembling → done),
  // compressed to a few seconds, then hands back the fixed demo plan.
  async function runDemoGeneration() {
    for (const step of DEMO_LOADING_STEPS) {
      await sleep(step.delayMs);
      if (cancelledRef.current) return;
      setLoadingStatus(STATUS_LABELS[step.status] ?? "Working on it...");
      setLoadingProgress(step.progress);
    }
    if (cancelledRef.current) return;
    finishGeneration(DEMO_PLAN_RESULT);
  }

  function handleGenerate() {
    const payload = gatherPayload();
    const errors = validatePayload(payload);
    if (errors.length) {
      setIntakeErrors(errors);
      document.getElementById("intakeErrors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIntakeErrors([]);
    lastPayloadRef.current = payload;
    setLoadingStatus(STATUS_LABELS.queued);
    setLoadingProgress(0);
    setScreen("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    runDemoGeneration();
  }

  function toggleVideoType(val: string) {
    setVideoTypes((prev) =>
      prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
    );
  }

  return (
    <div className="container" style={{ padding: "22px 20px 90px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-.01em" }}>
          Churn<b style={{ color: "var(--orange)" }}>.</b>
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted-foreground)", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 10px" }}>
          DEMO — sample data only
        </span>
      </div>
      {/* Tabs */}
      {screen !== "loading" && (
        <div className="content-col">
        <div className="churn-tabs" role="tablist">
          <button
            className={`churn-tab${screen === "input" ? " active" : ""}`}
            onClick={() => !planGenerated && setScreen("input")}
            disabled={planGenerated}
          >
            📝 Your Info
          </button>
          <button
            className={`churn-tab${screen === "results" ? " active" : ""}`}
            onClick={() => planGenerated && setScreen("results")}
            disabled={!planGenerated}
          >
            {planGenerated ? "📋 Your Plan" : "🔒 Your Plan"}
          </button>
        </div>
        </div>
      )}
      {/* ── INPUT SCREEN ────────────────────────────────────────────────────── */}
      {screen === "input" && !planGenerated && (
        <section>
          <div className="content-col">
          <h1 className="h1-big" style={{ textAlign: "center" }}>Build your 30-day content plan</h1>
          <div className="sec-sub" style={{ marginBottom: 24, textAlign: "center" }}>
            Tell us about your niche and content style. We'll research what's working, then build a personalised hook and topic bank for your 30-day calendar.
          </div>
          {/* Niche */}
          <div className="field">
            <div className="field-label">What's your niche?</div>
            <div className="field-help">
              Be as specific as possible — what you do, who you help, and what makes you unique. The AI uses this to research your niche and personalize your hooks.
            </div>
            <div className="ps-example">
              <b>Example:</b> <i>"Physiotherapist helping people over 50 recover from sciatica pain without surgery or medication"</i>
            </div>
            <input
              type="text"
              className="churn-input"
              placeholder="e.g. Physiotherapist helping people over 50 recover from sciatica pain"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>
          {/* Video types */}
          <div className="field">
            <div className="field-label">What kinds of videos are you able to make?</div>
            <div className="field-help">Select all that apply. This shapes what shows up on your calendar.</div>
            <div className="wizchips">
              {["Vlogs", "Day in the life", "How-to / Tutorial", "Testimonials", "Talking heads", "Text + clip + music", "Trends", "Carousels"].map((val) => (
                <div
                  key={val}
                  className={`selchip${videoTypes.includes(val) ? " sel" : ""}`}
                  onClick={() => toggleVideoType(val)}
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
          {/* Content pillars */}
          <div className="field">
            <div className="field-label">Draft content pillars</div>
            <div className="field-help">
              List 1–4 general themes you'd like to cover. These are not video formats — they're the topics and ideas you'll keep coming back to.
            </div>
            <div className="ps-example">
              <b>Example, a fitness coach:</b> Quick equipment-free workouts · Nutrition tips · Mindset content · Client transformations
            </div>
            <input type="text" className="churn-input" placeholder="Pillar 1" value={pillar1} onChange={(e) => setPillar1(e.target.value)} />
            <input type="text" className="churn-input" placeholder="Pillar 2 (optional)" style={{ marginTop: 8 }} value={pillar2} onChange={(e) => setPillar2(e.target.value)} />
            <input type="text" className="churn-input" placeholder="Pillar 3 (optional)" style={{ marginTop: 8 }} value={pillar3} onChange={(e) => setPillar3(e.target.value)} />
            <input type="text" className="churn-input" placeholder="Pillar 4 (optional)" style={{ marginTop: 8 }} value={pillar4} onChange={(e) => setPillar4(e.target.value)} />
          </div>
          {/* Validation errors */}
          {intakeErrors.length > 0 && (
            <div className="intake-errors" id="intakeErrors">
              <b>Before we generate your plan:</b>
              <ul>
                {intakeErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            className="btn btn-primary btn-block"
            onClick={handleGenerate}
          >
            Create my 30-day content plan →
          </button>
          </div>
        </section>
      )}
      {/* ── LOADING SCREEN ───────────────────────────────────────────── */}
      {screen === "loading" && (
        <section>
          <div className="loading-wrap">
            <div className="spinner" />
            <div className="loading-status">{loadingStatus}</div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${loadingProgress}%` }} />
            </div>
            <div className="loading-note">
              Demo mode: this is a simulated progress bar over pre-built sample data — no live TikTok research is being performed.
            </div>
          </div>
        </section>
      )}
      {/* ── RESULTS SCREEN ───────────────────────────────────────────── */}
      {screen === "results" && currentPlan && (
        <section>
          <ResultsView
            data={currentPlan}
            savedCalendarState={savedCalendarState}
            onCalendarChange={handleCalendarChange}
            onReset={handleReset}
          />
        </section>
      )}
    </div>
  );
}
