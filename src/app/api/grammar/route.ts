import { Prisma, type JlptLevel } from "@prisma/client";
import { getDb } from "@/lib/server/db";
import { demoGrammar } from "@/lib/server/demo";
import { api, ApiError, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return api(async () => {
    const params = new URL(request.url).searchParams;
    const level = params.get("level");
    if (level && !["N1", "N2", "N3", "N4", "N5"].includes(level)) throw new ApiError(400, "invalid_level", "Invalid JLPT level.");
    const query = (params.get("q") ?? "").trim().slice(0, 100);
    if (!process.env.DATABASE_URL) {
      return json({ mode: "demo", points: demoGrammar.filter((point) => (!level || point.jlptLevel === level) && (!query || `${point.pattern} ${point.reading} ${point.explanationVi}`.includes(query))) });
    }
    const where: Prisma.GrammarPointWhereInput = {
      ...(level ? { jlptLevel: level as JlptLevel } : {}),
      ...(query ? { OR: [{ pattern: { contains: query } }, { reading: { contains: query } }, { explanationVi: { contains: query, mode: "insensitive" } }] } : {}),
    };
    return json({ mode: "database", points: await getDb().grammarPoint.findMany({ where, orderBy: { id: "asc" }, take: 100 }) });
  });
}
