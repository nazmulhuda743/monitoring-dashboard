"use client";

import { profile } from "@/data/brief";
import { weekdayName, useBusinessNow } from "@/lib/time";
import { Eyebrow } from "@/components/ui/primitives";

/** "Next brief · Tuesday 06:40" — tomorrow, in Curaçao time. */
export function NextBrief() {
  const now = useBusinessNow();
  return <Eyebrow>{`Next brief · ${weekdayName(now.weekdayIdx + 1)} ${profile.nextBriefAt}`}</Eyebrow>;
}
