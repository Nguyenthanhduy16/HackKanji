import { Prisma, type JlptLevel } from "@prisma/client";
import { getDb } from "@/lib/server/db";
import { api, ApiError, json } from "@/lib/server/http";
import { demoLessons, lessonInclude } from "@/lib/server/lesson-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return api(async () => {
    const params = new URL(request.url).searchParams;
    const level = params.get("level");
    if (level && !["N1", "N2", "N3", "N4", "N5"].includes(level)) throw new ApiError(400, "invalid_level", "Choose N1, N2, N3, N4 or N5.");
    const category = params.get("category");
    const query = (params.get("q") ?? "").trim().slice(0, 100);
    const offset = Number(params.get("offset") ?? 0);
    const limit = Number(params.get("limit") ?? 30);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10_000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new ApiError(400, "invalid_pagination", "Use offset 0–10000 and limit 1–100.");
    }
    if (!process.env.DATABASE_URL) {
      const found = demoLessons().filter((lesson) => (!level || lesson.jlptLevel === level) &&
        (!category || lesson.category?.slug === category || lesson.categoryId === category) &&
        (!query || `${lesson.title} ${lesson.titleJa}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
      return json({ mode: "demo", lessons: found.slice(offset, offset + limit), total: found.length, offset, limit });
    }
    const where: Prisma.LessonWhereInput = {
      published: true, ...(level ? { jlptLevel: level as JlptLevel } : {}),
      ...(category ? { category: { OR: [{ slug: category }, { id: category }] } } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { titleJa: { contains: query, mode: "insensitive" } }] } : {}),
    };
    const [lessons, total] = await getDb().$transaction([
      getDb().lesson.findMany({ where, include: lessonInclude, orderBy: { id: "asc" }, take: limit, skip: offset }),
      getDb().lesson.count({ where }),
    ]);
    return json({ mode: "database", lessons, total, offset, limit });
  });
}
