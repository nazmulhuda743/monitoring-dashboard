/**
 * Business clock. The client lives in Willemstad, Curaçao, so EVERY time or
 * date shown in the UI must be Curaçao local time — never the viewer's device
 * time zone. Curaçao is AST (UTC−4) all year; it has no daylight saving.
 *
 * Pure helpers (safe on server and client). The live React hook lives in
 * `src/lib/time.ts`. Use `formatBusinessTime()` etc. for API timestamps.
 */

export const BUSINESS_TZ = "America/Curacao";
export const BUSINESS_CITY = "Willemstad";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface BusinessTime {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Monday … 6 = Sunday */
  weekdayIdx: number;
  /** Decimal hours, e.g. 9.5 = 09:30. */
  hours: number;
}

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

/** Wall-clock time in Curaçao for a given instant. */
export function toBusinessTime(d: Date): BusinessTime {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  const year = +p.year;
  const month = +p.month;
  const day = +p.day;
  const hour = +p.hour % 24;
  const minute = +p.minute;
  const second = +p.second;
  const weekdayIdx = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return { year, month, day, hour, minute, second, weekdayIdx, hours: hour + minute / 60 + second / 3600 };
}

/** ISO-8601 week number of a calendar date. */
export function isoWeek(t: Pick<BusinessTime, "year" | "month" | "day">) {
  const d = new Date(Date.UTC(t.year, t.month - 1, t.day));
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3); // Thursday of this week decides the year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
}

export const weekdayName = (idx: number) => WEEKDAYS[((idx % 7) + 7) % 7];

/** "Monday · 23 November 2026 · Week 48" */
export const dateLine = (t: BusinessTime) =>
  `${weekdayName(t.weekdayIdx)} · ${t.day} ${MONTHS[t.month - 1]} ${t.year} · Week ${isoWeek(t)}`;

/** Format an API timestamp (ISO/UTC) as Curaçao "HH:MM". */
export function formatBusinessTime(iso: string | Date) {
  const t = toBusinessTime(typeof iso === "string" ? new Date(iso) : iso);
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "Dec 15" in Curaçao. */
export const shortDate = (d: Date | number) => {
  const t = toBusinessTime(new Date(d));
  return `${SHORT_MONTHS[t.month - 1]} ${t.day}`;
};
/** "Fri 27" in Curaçao. */
export const dayAndDate = (d: Date | number) => {
  const t = toBusinessTime(new Date(d));
  return `${SHORT_DAYS[t.weekdayIdx]} ${t.day}`;
};
/** "FRI 20" in Curaçao. */
export const dayTag = (d: Date | number) => dayAndDate(d).toUpperCase();

/** UTC epoch ms of a Curaçao wall-clock time (Curaçao is a fixed UTC−4). */
export const businessEpoch = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  Date.UTC(year, month - 1, day, hour + 4, minute);

/** Start (00:00) and end (24:00) of the Curaçao day containing `now`, as epoch ms. */
export function businessDayBounds(now: Date | number) {
  const t = toBusinessTime(new Date(now));
  const start = businessEpoch(t.year, t.month, t.day);
  return { start, end: start + 86400000 };
}

/** Monday 00:00 (Curaçao) of the week containing `now`, as epoch ms. */
export function businessWeekStart(now: Date | number) {
  const { start } = businessDayBounds(now);
  return start - toBusinessTime(new Date(now)).weekdayIdx * 86400000;
}

/** Whole Curaçao calendar days from `a` to `b` (b later → positive). */
export function businessDaysBetween(a: Date | number, b: Date | number) {
  return Math.round((businessDayBounds(b).start - businessDayBounds(a).start) / 86400000);
}

/** Greeting for a Curaçao hour: morning 05–11, afternoon 12–16, evening 17–04. */
export function greetingFor(hour: number): "morning" | "afternoon" | "evening" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}
