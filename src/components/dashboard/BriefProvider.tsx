"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { needs, posts } from "@/data/brief";
import type { Need, NeedId, NeedStatus, Post, PostStatus } from "@/data/types";

type Dict<V> = Record<string, V | undefined>;
type Flags = Record<string, boolean>;

interface BriefState {
  needStatus: Partial<Record<NeedId, NeedStatus>>;
  postDecision: Dict<"approved" | "changes">;
  postOpen: Flags;
  projectOpen: Flags;
  meetingOpen: Flags;
  nudged: Flags;
  range: "week" | "month";
  /** Energy visual: true = "essential · one direction". */
  focus: boolean;
  /** Briefly highlights the first "needs you" card after the CTA. */
  flash: boolean;
}

interface BriefContext extends BriefState {
  active: Need[];
  setNeed: (id: NeedId, v: NeedStatus | undefined) => void;
  setPost: (id: string, v: "approved" | "changes" | undefined) => void;
  approveAll: (ids: string[]) => void;
  togglePost: (id: string) => void;
  toggleProject: (id: string) => void;
  toggleMeeting: (id: string) => void;
  nudge: (id: string) => void;
  setRange: (r: "week" | "month") => void;
  /** Hero / "Start here" CTA: lock focus mode and jump to the first task. */
  goStart: () => void;
  postStatus: (p: Post) => PostStatus;
}

const Ctx = createContext<BriefContext | null>(null);

export function useBrief() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBrief must be used inside <BriefProvider>");
  return v;
}

const toggle = (f: Flags, id: string): Flags => ({ ...f, [id]: !f[id] });

export function BriefProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<BriefState>({
    needStatus: {},
    postDecision: {},
    postOpen: { p1: true },
    projectOpen: { telecom: true },
    meetingOpen: { board: true },
    nudged: {},
    range: "week",
    focus: false,
    flash: false,
  });

  // Energy visual loop: scattered → (2.2s) essential 8s → scattered 5s → …
  const loopTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const loop = (f: boolean) => {
      setS((p) => ({ ...p, focus: f }));
      loopTimer.current = setTimeout(() => loop(!f), f ? 8000 : 5000);
    };
    loopTimer.current = setTimeout(() => loop(true), 2200);
    return () => {
      clearTimeout(loopTimer.current);
      clearTimeout(flashTimer.current);
    };
  }, []);

  const active = useMemo(() => needs.filter((n) => !s.needStatus[n.id]), [s.needStatus]);

  const goStart = useCallback(() => {
    clearTimeout(loopTimer.current);
    clearTimeout(flashTimer.current);
    setS((p) => ({ ...p, focus: true, flash: true }));
    const el = document.getElementById(active.length ? "a-needs" : "a-projects");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: "smooth" });
    flashTimer.current = setTimeout(() => setS((p) => ({ ...p, flash: false })), 2800);
  }, [active.length]);

  const value = useMemo<BriefContext>(
    () => ({
      ...s,
      active,
      setNeed: (id, v) => setS((p) => ({ ...p, needStatus: { ...p.needStatus, [id]: v } })),
      setPost: (id, v) => setS((p) => ({ ...p, postDecision: { ...p.postDecision, [id]: v } })),
      approveAll: (ids) =>
        setS((p) => {
          const d = { ...p.postDecision };
          ids.forEach((id) => (d[id] = "approved"));
          return { ...p, postDecision: d };
        }),
      togglePost: (id) => setS((p) => ({ ...p, postOpen: toggle(p.postOpen, id) })),
      toggleProject: (id) => setS((p) => ({ ...p, projectOpen: toggle(p.projectOpen, id) })),
      toggleMeeting: (id) => setS((p) => ({ ...p, meetingOpen: toggle(p.meetingOpen, id) })),
      nudge: (id) => setS((p) => ({ ...p, nudged: { ...p.nudged, [id]: true } })),
      setRange: (range) => setS((p) => ({ ...p, range })),
      goStart,
      postStatus: (p) => s.postDecision[p.id] ?? p.base,
    }),
    [s, active, goStart],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Posts in the "next week" window (Mon 30 Nov – Sun 6 Dec). */
export const weekPosts = posts.filter((p) => (p.m === 11 ? 0 : p.d) <= 6);
