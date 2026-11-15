import { getDb } from "@/lib/server/db";
import { demoLearners } from "@/lib/server/demo";
import { api, ApiError, json } from "@/lib/server/http";
import { addCalendarDays, localDateKey } from "@/lib/gamification/logic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return api(async () => {
    const params = new URL(request.url).searchParams;
    const period = params.get("period") ?? "week";
    const metric = params.get("metric") ?? "xp";
    if (!["week", "month", "allTime"].includes(period) || !["xp", "minutes", "lessons"].includes(metric)) {
      throw new ApiError(400, "invalid_filter", "Use week/month/allTime and xp/minutes/lessons.");
    }
    const field = metric as "xp" | "minutes" | "lessons";
    if (!process.env.DATABASE_URL) {
      const entries = demoLearners.map((learner) => ({ ...learner, value: learner[field] }))
        .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id)).map((entry, index) => ({ ...entry, rank: index + 1 }));
      return json({ mode: "demo", period, metric, timezone: "UTC", entries });
    }
    const today = localDateKey(new Date(), "UTC");
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    const from = period === "week" ? addCalendarDays(today, -((weekday + 6) % 7)) : period === "month" ? `${today.slice(0, 7)}-01` : undefined;
    const groups = await getDb().studyDay.groupBy({
      by: ["userId"], where: { user: { isPublic: true }, ...(from ? { date: { gte: from, lte: today } } : {}) },
      _sum: { xp: true, minutes: true, lessons: true }, orderBy: [{ _sum: { [field]: "desc" } }, { userId: "asc" }], take: 20,
    });
    const users = await getDb().user.findMany({ where: { id: { in: groups.map((row) => row.userId) }, isPublic: true }, select: { id: true, name: true, image: true, avatarUrl: true, level: true, currentStreak: true } });
    const entries = groups.flatMap((row, index) => {
      const user = users.find((entry) => entry.id === row.userId);
      return user ? [{ ...user, rank: index + 1, value: row._sum[field] ?? 0 }] : [];
    });
    return json({ mode: "database", period, metric, timezone: "UTC", from: from ?? null, to: today, entries });
  });
}
