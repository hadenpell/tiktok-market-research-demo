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
import { DEMO_PLAN_RESULT } from "../data/samplePlan";

// ─── helpers ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function getDayName(dayNum: number): string {
  return WEEKDAYS[(dayNum - 1) % 7];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

interface CalendarDayState extends CalendarDay {
  selectedHook?: string;
  isEditing?: boolean;
  recreateFromDay?: number;
  recreateFormat?: string;
}

// ─── constants ──────────────────────────────────────────────────────────────

const VIDEO_TYPE_OPTIONS = [
  "Vlogs",
  "Day in the life",
  "How-to / Tutorial",
  "Testimonials",
  "Talking heads",
  "Text + clip + music",
  "Trends",
  "Carousels",
];

const VIDEO_TYPE_DESCRIPTIONS: Record<string, string> = {
  "Vlogs": "Any video documenting an event, day, or process. Usually done with text overlay and a voiceover and/or background music and descriptive text.",
  "Day in the life": "A specific type of vlog showcasing a daily routine. Example: Day in the life of a Harvard student.",
  "How-to / Tutorial": "Educational content showcasing how to do something (e.g. an exercise or stretch) or discussing a topic in depth (e.g. the civil war).",
  "Testimonials": "For small businesses with clients that have success stories. Testimonials can include transformations, before/after, or the client sharing their experience on camera.",
  "Talking heads": "A video where the individual sits and talks to the camera providing information or telling a story to the audience, as if they were on FaceTime.",
  "Text + clip + music": "One or more video clips with catchy music and a text overlay. No speaking.",
  "Trends": "Any video, typically more fun and lighthearted, that adds a personal spin to a current TikTok trend. Can be a skit or simply using a trending audio with a relatable text overlay.",
  "Carousels": "A series of still photos, usually with text overlaid.",
};

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued — waiting to start...",
  researching: "Researching your niche on TikTok...",
  analyzing: "Analyzing top-performing hooks...",
  building: "Building your 30-day calendar...",
  assembling: "Assembling your plan...",
  done: "Done!",
};

const DEMO_LOADING_STEPS: { status: keyof typeof STATUS_LABELS; progress: number; delayMs: number }[] = [
  { status: "queued", progress: 8, delayMs: 400 },
  { status: "researching", progress: 35, delayMs: 1200 },
  { status: "analyzing", progress: 60, delayMs: 1100 },
  { status: "building", progress: 82, delayMs: 1100 },
  { status: "assembling", progress: 96, delayMs: 900 },
  { status: "done", progress: 100, delayMs: 400 },
];

const STORAGE_KEY = "churn-demo-plan";

// ─── VideoTypeTooltip ───────────────────────────────────────────────────────

function VideoTypeTooltip() {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1.5px solid #999",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#666",
          cursor: "default",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        ?
      </div>
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            border: "1px solid #e5e0d8",
            borderRadius: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            padding: "14px 16px",
            width: 340,
            zIndex: 100,
            fontSize: 13,
            lineHeight: 1.55,
            color: "#333",
          }}
        >
          {Object.entries(VIDEO_TYPE_DESCRIPTIONS).map(([type, desc]) => (
            <div key={type} style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700 }}>{type}:</span>{" "}
              <span>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── export helpers ─────────────────────────────────────────────────────────
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

// ─── sub-components ─────────────────────────────────────────────────────────

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

// ─── Hook Selection Modal ───────────────────────────────────────────────────
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

// ─── Recreation Modal ───────────────────────────────────────────────────────
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
            <span style={{ color: "var(--muted-foreground)" }}>"I opened a coffee shop with $5,000"</span>
            <span style={{ margin: "0 8px", fontWeight: 700 }}>→</span>
            <span>"How I started my cafe for under $5K"</span>
          </div>
        </div>
        <div className="bank-row" style={{ marginBottom: 16, background: "var(--muted, #f5f5f5)", borderRadius: 8 }}>
          <div style={{ fontSize: "0.88rem", color: "var(--foreground)" }}>
            <span style={{ color: "var(--muted-foreground)" }}>"Stop buying coffee equipment you don't need"</span>
            <span style={{ margin: "0 8px", fontWeight: 700 }}>→</span>
            <span>"Coffee equipment? You only need these 3 things"</span>
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

// ─── Calendar Day Cell ──────────────────────────────────────────────────────
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

// ─── Results View ───────────────────────────────────────────────────────────
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
  const [confirmingReset, setConfirmingReset] = useState(false);

  const bankById: Record<string, TopicBank> = {};
  (data.topicBanks || []).forEach((b) => { bankById[b.id] = b; });
  const hasHookPatterns = (data.hookPatterns || []).length > 0;

  const weeks: Record<number, CalendarDayState[]> = {};
  calendarDays.forEach((day) => {
    const wk = Math.ceil(day.day / 7);
    if (!weeks[wk]) weeks[wk] = [];
    weeks[wk].push(day);
  });

  function updateDay(dayNum: number, updates: Partial<CalendarDayState>) {
    setCalendarDays((prev) => {
      const next = prev.map((d) => (d.day === dayNum ? { ...d, ...updates } : d));
      onCalendarChange(next);
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {confirmingReset ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
                Reset this demo plan? This clears your local demo data.
              </span>
              <button className="btn btn-primary btn-sm" onClick={onReset}>Yes, reset</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmingReset(false)}>Cancel</button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 16px", opacity: 0.8 }}
              onClick={() => setConfirmingReset(true)}
            >
              🔄 Reset & start over
            </button>
          )}
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
      {hasHookPatterns && (
        <>
          <div className="section-block" id="r-patterns">
            <div className="content-col">
              <span className="section-eyebrow">Hook Strategy</span>
              <h2 className="section-heading">🔑 Hook patterns that work here</h2>
            </div>
          </div>
          <div className="churn-card content-col">
            {(data.hookPatterns || []).map((hp, i) => (
              <div key={i} className="hprow">
                <div className="hp-type">{hp.type}</div>
                <div className="hp-ex">{hp.example}</div>
                <div className="hp-why">{hp.whyItWorks}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* General principles */}
      <div className="section-block" id="r-principles">
        <div className="content-col">
          <span className="section-eyebrow">Principles</span>
          <h2 className="section-heading">💡 Principles for stronger hooks</h2>
        </div>
      </div>
      <div className="churn-card content-col">
        <ol className="obs-list">
          {(data.generalPrinciples || []).map((p, i) => (
            <li key={i}><span dangerouslySetInnerHTML={{ __html: p }} /></li>
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
          {(data.dailyEngagement || []).map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>

      {/* Consult CTA */}
      <div className="section-block"><div className="content-col"><div className="consult">
        <h3>Want more in-depth, 1:1 support?</h3>
        <p>Schedule a consult call with Churn for personalized coaching and strategy tailored to your account.</p>
        <a href="https://agencychurn.com/#services" target="_blank" rel="noopener noreferrer">
          Schedule a consult call →
        </a>
      </div></div></div>

      {/* Disclaimer */}
      <div className="content-col"><div className="disclaimer">
        <b>Disclaimer.</b> Results are not guaranteed. Growth on TikTok depends on your content, consistency, and factors outside anyone's control, including changes to TikTok's algorithm. This tool provides strategy and research based on the Churn Method. It does not promise a specific number of views, followers, or income. Always follow TikTok's Community Guidelines and Terms of Service. Churn is not affiliated with, endorsed by, or sponsored by TikTok Inc. or ByteDance Ltd.
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

// ─── main page ──────────────────────────────────────────────────────────────
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
            <div className="field-help" style={{ marginBottom: 10 }}>
              What kinds of videos are you going to make? Be specific, but refer more to the general topic of your account rather than a description of who you are, and don't be so specific that the AI cannot find any existing examples of similar content. Think about what key words you would use to search for videos if you were researching your desired niche to find inspiration for the types of videos you'd want to make.
            </div>
            <div className="ps-example" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Good Examples:</div>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Recovering from sciatica without surgery or medication</li>
                <li>Physiotherapy for back pain</li>
                <li>MBA student lifestyle</li>
                <li>Fitness for men over 35</li>
              </ul>
              <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>Not-So-Great Examples</div>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Fitness coaching <span style={{ color: "#888", fontWeight: 400 }}>(too generic)</span></li>
                <li>Fitness coaching for 18 year old lego builders <span style={{ color: "#888", fontWeight: 400 }}>(too specific, likely to not have market data)</span></li>
              </ul>
            </div>
            <input
              type="text"
              className="churn-input"
              placeholder=""
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>
          {/* Video types */}
          <div className="field">
            <div className="field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              What kinds of videos are you able to make?
              <VideoTypeTooltip />
            </div>
            <div className="field-help">Select all that apply.</div>
            <div className="wizchips">
              {VIDEO_TYPE_OPTIONS.map((val) => (
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
            <div className="field-help">List 1–4 general themes you'd like to cover.</div>
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
          <p style={{ fontSize: "0.78rem", color: "#aaa", textAlign: "center", marginTop: 8 }}>
            This walkthrough uses a fixed fictional sample plan; your entries are not sent to TikTok, an AI service, or any third party.
          </p>
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
