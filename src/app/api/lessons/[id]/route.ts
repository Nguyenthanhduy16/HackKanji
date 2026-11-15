import { getDb } from "@/lib/server/db";
import { api, ApiError, json } from "@/lib/server/http";
import { demoLessons, lessonInclude } from "@/lib/server/lesson-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return api(async () => {
    const { id } = await context.params;
    const lesson = process.env.DATABASE_URL
      ? await getDb().lesson.findFirst({ where: { published: true, OR: [{ id }, { slug: id }] }, include: lessonInclude })
      : demoLessons().find((entry) => entry.id === id || entry.slug === id);
    if (!lesson) throw new ApiError(404, "not_found", "Lesson not found.");
    return json({ mode: process.env.DATABASE_URL ? "database" : "demo", lesson });
  });
}
