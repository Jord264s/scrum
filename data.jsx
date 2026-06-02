// Sample data for the scrum board.
// Projects = swimlanes. Tasks = cards inside (column × project) cells.

const COLUMNS = [
  { id: "todo",     name: "To Do",       hint: "Backlog ready to pick up" },
  { id: "doing",    name: "In Progress", hint: "Actively working" },
  { id: "review",   name: "Review",      hint: "Waiting on feedback" },
  { id: "done",     name: "Done",        hint: "Shipped this sprint" },
];

// "Today" in the seed data is May 23 2026.
const PROJECTS = [
  {
    id: "portfolio",
    name: "Portfolio site",
    code: "PORT",
    accent: "#C2693F",
    tint:   "#FBF1EA",
    note: "Sprint 14 — relaunch",
    endDate: "2026-06-12",
  },
  {
    id: "marathon",
    name: "Marathon training",
    code: "RUN",
    accent: "#4F7A4A",
    tint:   "#EEF3EC",
    note: "12-week block, week 5",
    endDate: "2026-07-13",
  },
  {
    id: "move",
    name: "Apartment move",
    code: "MOVE",
    accent: "#3D6480",
    tint:   "#ECF1F4",
    note: "Closing date: Jun 14",
    endDate: "2026-06-14",
  },
  {
    id: "recipes",
    name: "Recipe app (side project)",
    code: "REC",
    accent: "#8B6A2A",
    tint:   "#F5EEDB",
    note: "MVP scoped",
    endDate: "2026-07-01",
  },
];

// Tasks:
//   col        = column id
//   project    = project id
//   estimate   = { value, unit: "h"|"d"|"w" }
//   dependsOn  = ids that must finish first
//   startDate  = ISO yyyy-mm-dd (must be >= the project's startDate)
const SEED_TASKS = [
  // Portfolio site
  { id: "t01", project: "portfolio", col: "todo",   title: "Write About page copy",                estimate: { value: 2, unit: "h" }, tags: ["copy"],    startDate: "2026-05-25" },
  { id: "t02", project: "portfolio", col: "todo",   title: "Pick 6 case studies to feature",       estimate: { value: 1, unit: "h" }, tags: ["content"], startDate: "2026-05-26" },
  { id: "t03", project: "portfolio", col: "todo",   title: "Write case-study detail pages",        estimate: { value: 2, unit: "d" }, tags: ["copy"],    startDate: "2026-06-01", dependsOn: ["t02", "t04"] },
  { id: "t04", project: "portfolio", col: "doing",  title: "Build project detail template",        estimate: { value: 1, unit: "d" }, tags: ["dev"],     startDate: "2026-05-27", assignee: "me" },
  { id: "t05", project: "portfolio", col: "review", title: "Hero illustration v3",                 estimate: { value: 4, unit: "h" }, tags: ["design"],  startDate: "2026-05-20", blocked: true, blocker: "Waiting on Ana" },
  { id: "t06", project: "portfolio", col: "done",   title: "Migrate hosting to new provider",      estimate: { value: 1, unit: "d" }, tags: ["ops"],     startDate: "2026-05-19" },
  { id: "t07", project: "portfolio", col: "done",   title: "Set up analytics + plausible",         estimate: { value: 1, unit: "h" }, tags: ["ops"],     startDate: "2026-05-22" },

  // Marathon
  { id: "t10", project: "marathon",  col: "todo",   title: "Plan week-6 long-run route",           estimate: { value: 1, unit: "h" }, tags: ["plan"],    startDate: "2026-05-25" },
  { id: "t11", project: "marathon",  col: "todo",   title: "Order new running shoes",              estimate: { value: 1, unit: "h" }, tags: ["gear"],    startDate: "2026-05-26" },
  { id: "t12", project: "marathon",  col: "doing",  title: "Sleep ≥7h, 5 nights this week",        estimate: { value: 1, unit: "w" }, tags: ["habit"],   startDate: "2026-05-23", assignee: "me" },
  { id: "t13", project: "marathon",  col: "doing",  title: "Strength session — Tue / Thu",         estimate: { value: 2, unit: "h" }, tags: ["habit"],   startDate: "2026-05-26" },
  { id: "t14", project: "marathon",  col: "review", title: "Review week-4 pace data",              estimate: { value: 1, unit: "h" }, tags: ["review"],  startDate: "2026-05-21" },
  { id: "t15", project: "marathon",  col: "done",   title: "Sign up for the race",                 estimate: { value: 1, unit: "h" }, tags: ["admin"],   startDate: "2026-04-22" },

  // Move
  { id: "t20", project: "move",      col: "todo",   title: "Hire movers — get 3 quotes",           estimate: { value: 2, unit: "h" }, tags: ["admin"],   startDate: "2026-05-25" },
  { id: "t21", project: "move",      col: "todo",   title: "Book moving company",                  estimate: { value: 1, unit: "h" }, tags: ["admin"],   startDate: "2026-05-28", dependsOn: ["t20"] },
  { id: "t22", project: "move",      col: "todo",   title: "Schedule utility transfer date",       estimate: { value: 1, unit: "h" }, tags: ["admin"],   startDate: "2026-06-01", dependsOn: ["t21"] },
  { id: "t23", project: "move",      col: "doing",  title: "Pack the bookshelves",                 estimate: { value: 4, unit: "h" }, tags: ["packing"], startDate: "2026-05-24", assignee: "me" },
  { id: "t24", project: "move",      col: "review", title: "Lease agreement — final read",         estimate: { value: 1, unit: "h" }, tags: ["legal"],   startDate: "2026-05-22", blocked: true, blocker: "Waiting on landlord" },
  { id: "t25", project: "move",      col: "done",   title: "Notify employer of new address",       estimate: { value: 1, unit: "h" }, tags: ["admin"],   startDate: "2026-05-15" },

  // Recipes (side project)
  { id: "t30", project: "recipes",   col: "todo",   title: "Decide: SwiftData vs SQLite",          estimate: { value: 2, unit: "h" }, tags: ["spike"],   startDate: "2026-05-24" },
  { id: "t31", project: "recipes",   col: "todo",   title: "Sketch onboarding (3 screens)",        estimate: { value: 4, unit: "h" }, tags: ["design"],  startDate: "2026-05-26", dependsOn: ["t30"] },
  { id: "t32", project: "recipes",   col: "doing",  title: "Import 20 starter recipes",            estimate: { value: 2, unit: "d" }, tags: ["content"], startDate: "2026-05-22", assignee: "me" },
  { id: "t33", project: "recipes",   col: "done",   title: "Buy Apple Developer membership",       estimate: { value: 1, unit: "h" }, tags: ["admin"],   startDate: "2026-05-20" },
];

// ── Estimate helpers ──────────────────────────────────────────────────────
const UNIT_LABEL    = { h: "hour",  d: "day",   w: "week"  };
const UNIT_LABEL_PL = { h: "hours", d: "days",  w: "weeks" };
const UNIT_SHORT    = { h: "h",     d: "d",     w: "w"     };
const UNIT_HOURS = { h: 1, d: 8, w: 40 };
// Calendar days per unit — used for timeline placement (different from
// working hours: 1 day on the timeline = 1 calendar day, not 8 hours).
const UNIT_DAYS  = { h: 1/24, d: 1, w: 7 };

function emptyEstimate() { return { value: 0, unit: "h" }; }

function normalizeEstimate(est) {
  if (!est) return emptyEstimate();
  if (typeof est === "object" && est.unit) {
    return { value: Number(est.value) || 0, unit: est.unit };
  }
  const m = String(est).match(/^(\d+(?:\.\d+)?)([mhdw])$/);
  if (!m) return emptyEstimate();
  let value = parseFloat(m[1]);
  let unit = m[2];
  if (unit === "m") { value = Math.max(0.25, value / 60); unit = "h"; }
  return { value, unit };
}

function estimateHours(est) {
  const e = normalizeEstimate(est);
  return (e.value || 0) * (UNIT_HOURS[e.unit] || 0);
}

// Total calendar days an estimate spans (min 1 if any time at all).
function estimateDays(est) {
  const e = normalizeEstimate(est);
  if (!e.value) return 0;
  const days = e.value * (UNIT_DAYS[e.unit] || 0);
  return Math.max(1, Math.ceil(days));
}

function formatEstimate(est) {
  const e = normalizeEstimate(est);
  if (!e.value) return "";
  const num = e.value % 1 === 0 ? String(e.value) : e.value.toFixed(1).replace(/\.0$/, "");
  return num + UNIT_SHORT[e.unit];
}

function formatHoursTotal(totalHours) {
  if (!totalHours) return "0h";
  if (totalHours >= 40)  return (totalHours / 40).toFixed(totalHours % 40 ? 1 : 0).replace(/\.0$/, "") + "w";
  if (totalHours >= 8)   return (totalHours / 8 ).toFixed(totalHours % 8  ? 1 : 0).replace(/\.0$/, "") + "d";
  return (totalHours % 1 === 0 ? String(totalHours) : totalHours.toFixed(1)) + "h";
}

// ── Date helpers ──────────────────────────────────────────────────────────
const ONE_DAY = 86400000;

// Parse "yyyy-mm-dd" → Date (UTC midnight). Returns null for empty/invalid.
function parseISO(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISO(date) {
  if (!date) return "";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  return new Date(date.getTime() + n * ONE_DAY);
}

function diffDays(a, b) {
  return Math.round((b - a) / ONE_DAY);
}

// End date = start + estimate (in calendar days, exclusive). A 1-day task
// starting Monday ends Monday end-of-day → next day for display.
function taskEnd(startISO, estimate) {
  const start = parseISO(startISO);
  if (!start) return null;
  const days = Math.max(1, estimateDays(estimate));
  return addDays(start, days);
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateShort(dateOrISO) {
  const d = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  if (!d) return "";
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatDateLong(dateOrISO) {
  const d = typeof dateOrISO === "string" ? parseISO(dateOrISO) : dateOrISO;
  if (!d) return "";
  return `${DAYS_SHORT[d.getUTCDay()]} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// Today as a UTC-midnight Date so it lines up with the ISO data.
function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

Object.assign(window, {
  COLUMNS, PROJECTS, SEED_TASKS,
  UNIT_LABEL, UNIT_LABEL_PL, UNIT_SHORT, UNIT_HOURS, UNIT_DAYS,
  emptyEstimate, normalizeEstimate, estimateHours, estimateDays,
  formatEstimate, formatHoursTotal,
  parseISO, toISO, addDays, diffDays, taskEnd,
  formatDateShort, formatDateLong, today,
  MONTHS_SHORT, DAYS_SHORT, ONE_DAY,
});
