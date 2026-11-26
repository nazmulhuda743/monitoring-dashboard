"use client";

/**
 * Business clock. The client lives in Willemstad, Curaçao, so EVERY time or
 * date shown in the UI must be Curaçao local time — never the viewer's device
 * time zone. Curaçao is AST (UTC−4) all year; it has no daylight saving.
 *
 * Use `useBusinessNow()` for anything live, and `formatBusinessTime()` for
 * timestamps coming from APIs (Freshdesk/ClickUp/Calendar return UTC ISO strings).
 */
import { useEffect, useState } from "react";

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

/**
 * The design's reference moment (Mon 23 Nov 2026, 09:37 Curaçao). Rendered on
 * the server and on first client paint so SSR and hydration always agree; the
 * real clock takes over right after mount.
 */
export const REFERENCE_TIME: BusinessTime = toBusinessTime(new Date("2026-11-23T09:37:00-04:00"));

/**
 * Live Curaçao time, ticking every second. `?at=HH:MM` pins the time of day
 * (Curaçao) for screenshots/demos.
 */
export function useBusinessNow(): BusinessTime {
  const [now, setNow] = useState<BusinessTime>(REFERENCE_TIME);
  useEffect(() => {
    const pinned = new URLSearchParams(window.location.search).get("at");
    const fixed = pinned && /^\d{1,2}:\d{2}$/.test(pinned) ? pinned.split(":").map(Number) : null;
    const read = () => {
      const t = toBusinessTime(new Date());
      setNow(fixed ? { ...t, hour: fixed[0], minute: fixed[1], second: 0, hours: fixed[0] + fixed[1] / 60 } : t);
    };
    const first = setTimeout(read, 0);
    const id = setInterval(read, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}
