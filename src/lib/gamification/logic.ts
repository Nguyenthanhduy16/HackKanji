import { gamification, levelForXP, levelThreshold } from "./config";

export function levelProgress(xp: number) {
  if (!Number.isSafeInteger(xp) || xp < 0 || xp > 2_147_483_647) {
    throw new RangeError("XP must be a non-negative database integer");
  }
  const level = levelForXP(xp);
  const nextLevelXP = levelThreshold(level + 1);
  return { level, xp, nextLevelXP, remainingXP: nextLevelXP - xp };
}

export function localDateKey(now: Date, timezone: string): string {
  if (!Number.isFinite(now.getTime())) throw new RangeError("Invalid date");
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const part = (name: string) => parts.find((value) => value.type === name)!.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    throw new RangeError("Invalid timezone");
  }
}

function ordinal(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value.getTime()) || value.toISOString().slice(0, 10) !== date) {
    throw new RangeError("Invalid calendar date");
  }
  return value.getTime() / 86_400_000;
}

export function addCalendarDays(date: string, days: number) {
  return new Date((ordinal(date) + days) * 86_400_000).toISOString().slice(0, 10);
}

export type StreakState = {
  currentStreak: number; longestStreak: number; freezeCards: number; lastStudyDate: string | null;
};

export function advanceStreak(state: StreakState, today: string) {
  const currentDay = ordinal(today);
  const gap = state.lastStudyDate ? currentDay - ordinal(state.lastStudyDate) : null;
  if (gap !== null && gap < 0) throw new RangeError("Study date cannot be earlier than the last activity");
  if (gap === 0) return { ...state, frozenDates: [] as string[], changed: false };
  const missed = gap === null ? 0 : Math.max(0, gap - 1);
  const used = state.currentStreak > 0 ? Math.min(missed, state.freezeCards) : 0;
  const frozenDates = Array.from({ length: used }, (_, i) => addCalendarDays(state.lastStudyDate!, i + 1));
  const currentStreak = gap === null || used < missed || state.currentStreak === 0
    ? 1 : state.currentStreak + missed + 1;
  return {
    currentStreak, longestStreak: Math.max(state.longestStreak, currentStreak),
    freezeCards: state.freezeCards - used, lastStudyDate: today, frozenDates, changed: true,
  };
}

export function claimEligibility(input: {
  progress: number; target: number; claimedAt: Date | string | null; date?: string; today?: string;
}) {
  if (input.claimedAt) return "claimed";
  if (input.date && input.today && input.date !== input.today) return "expired";
  return input.progress >= input.target ? "ready" : "locked";
}

export function purchaseEligibility(input: {
  balance: number; price: number; type: "FRAME" | "WALLPAPER" | "FREEZE"; owned: boolean; freezeCards: number;
}) {
  if (!Number.isSafeInteger(input.price) || input.price < 0) return "invalid_price";
  if (input.type !== "FREEZE" && input.owned) return "owned";
  if (input.type === "FREEZE" && input.freezeCards >= gamification.maxFreeze) return "freeze_limit";
  if (input.balance < input.price) return "insufficient_funds";
  return "ready";
}
