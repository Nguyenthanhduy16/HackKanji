'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_FILTER, nextProgress, type CustomFilter, type ProgressEntry } from './past-papers';

export interface PastSession {
  id: string; level: string; title: string; sub: string;
  mode: 'exam' | 'instant'; ids: string[]; answers: Record<string, number>;
  graded: boolean; minutes?: number; timerEnd: number | null; resultKey?: string; tab?: string; startedAt: number;
}

interface PastState {
  /** per question id, see ProgressEntry */
  progress: Record<string, ProgressEntry>;
  /** "<level>|<tag>|<part>" -> [correct, total, timestamp] */
  results: Record<string, [number, number, number]>;
  session: PastSession | null;
  filter: CustomFilter;
  start: (s: Omit<PastSession, 'id' | 'answers' | 'graded' | 'timerEnd' | 'startedAt'>) => void;
  answer: (id: string, choice: number, correct: number) => void;
  setTab: (tab: string) => void;
  setTimer: (end: number | null) => void;
  grade: (byId: Record<string, { a: number }>) => void;
  quit: () => void;
  setFilter: (patch: Partial<CustomFilter>) => void;
}

export const usePastStore = create<PastState>()(persist((set, get) => ({
  progress: {}, results: {}, session: null, filter: DEFAULT_FILTER,
  start: s => set({ session: { ...s, id: globalThis.crypto.randomUUID(), answers: {}, graded: false, timerEnd: null, startedAt: Date.now() } }),
  answer: (id, choice, correct) => {
    const s = get().session; if (!s || s.graded) return;
    if (s.mode === 'instant') {
      if (s.answers[id] !== undefined) return;   // instant mode locks the first answer
      set(st => ({ progress: { ...st.progress, [id]: nextProgress(st.progress[id], choice === correct) } }));
    }
    set({ session: { ...s, answers: { ...s.answers, [id]: choice } } });
  },
  setTab: tab => { const s = get().session; if (s) set({ session: { ...s, tab } }); },
  setTimer: end => { const s = get().session; if (s) set({ session: { ...s, timerEnd: end } }); },
  grade: byId => {
    const s = get().session; if (!s || s.graded) return;
    const progress = { ...get().progress }; const now = Date.now();
    // exam mode records answered questions on submit (instant mode already recorded them)
    if (s.mode === 'exam') for (const id of s.ids) if (s.answers[id] !== undefined && byId[id]) progress[id] = nextProgress(progress[id], s.answers[id] === byId[id].a, now);
    const results = { ...get().results };
    if (s.resultKey) results[s.resultKey] = [s.ids.filter(id => byId[id] && s.answers[id] === byId[id].a).length, s.ids.length, now];
    set({ progress, results, session: { ...s, graded: true, timerEnd: null } });
  },
  quit: () => set({ session: null }),
  setFilter: patch => set(st => ({ filter: { ...st.filter, ...patch } })),
}), { name: 'nhaikanji-jlpt-past-v1', storage: createJSONStorage(() => localStorage), version: 1 }));
