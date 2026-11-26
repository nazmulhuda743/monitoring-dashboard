"use client";

/**
 * Live Curaçao business clock for React. See `business-time.ts` for the rules:
 * every time shown in the UI is Willemstad time (UTC−4, no DST), never the
 * viewer's device time zone.
 */
import { useEffect, useState } from "react";
import { toBusinessTime, type BusinessTime } from "./business-time";

export * from "./business-time";

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
